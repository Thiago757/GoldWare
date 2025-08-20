const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

exports.listarVendas = async (req, res) => {
    try {
        const { startDate, endDate, status } = req.query;
        let query = `
            SELECT 
                v.id_venda, v.data_venda, c.nome AS nome_cliente,
                v.valor_total, v.status_pagamento
            FROM vendas v
            LEFT JOIN clientes c ON v.id_cliente = c.id_cliente
        `;
        const params = [];
        const conditions = [];

        if (startDate) {
            params.push(startDate);
            conditions.push(`v.data_venda::date >= $${params.length}`);
        }
        if (endDate) {
            params.push(endDate);
            conditions.push(`v.data_venda::date <= $${params.length}`);
        }
        if (status) {
            params.push(status);
            conditions.push(`v.status_pagamento = $${params.length}`);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        query += ' ORDER BY v.data_venda DESC';

        const vendasQuery = await pool.query(query, params);
        res.status(200).json(vendasQuery.rows);
    } catch (error) {
        console.error('Erro ao listar vendas:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};

exports.cancelarVenda = async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const updateVenda = await client.query(
            "UPDATE vendas SET status_pagamento = 'cancelado' WHERE id_venda = $1 RETURNING *",
            [id]
        );
        if (updateVenda.rowCount === 0) throw new Error('Venda não encontrada.');
        const itensQuery = await client.query('SELECT id_produto, quantidade FROM itens_venda WHERE id_venda = $1', [id]);
        for (const item of itensQuery.rows) {
            await client.query(
                'UPDATE produtos SET quantidade_estoque = quantidade_estoque + $1 WHERE id_produto = $2',
                [item.quantidade, item.id_produto]
            );
            await client.query(
                "INSERT INTO movimentacoes_estoque (id_produto, tipo_movimentacao, quantidade, origem) VALUES ($1, 'entrada', $2, $3)",
                [item.id_produto, item.quantidade, `Estorno Venda #${id}`]
            );
        }
        await client.query('COMMIT');
        res.status(200).json({ message: 'Venda cancelada e estoque estornado com sucesso!' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erro ao cancelar venda:', error);
        res.status(500).json({ message: 'Erro ao cancelar venda.', error: error.message });
    } finally {
        client.release();
    }
};

exports.finalizarVenda = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id_cliente, desconto, valor_total, itens, pagamentos } = req.body;
        const isCartaoCredito = pagamentos.some(p => p.forma === 'Cartão de Crédito');
        const statusVenda = isCartaoCredito ? 'pendente' : 'pago';

        await client.query('BEGIN');
        const vendaQuery = await client.query(
            'INSERT INTO vendas (id_cliente, valor_total, desconto, status_pagamento) VALUES ($1, $2, $3, $4) RETURNING id_venda',
            [id_cliente, valor_total, desconto, statusVenda]
        );
        const id_venda = vendaQuery.rows[0].id_venda;

        for (const item of itens) {
            if (item.preco_unitario === undefined || item.preco_unitario === null) {
                throw new Error(`O produto '${item.nome}' está sem preço unitário.`);
            }
            await client.query(
                'INSERT INTO itens_venda (id_venda, id_produto, quantidade, preco_unitario) VALUES ($1, $2, $3, $4)',
                [id_venda, item.id_produto, item.quantidade, item.preco_unitario]
            );
            const estoqueResult = await client.query(
                'UPDATE produtos SET quantidade_estoque = quantidade_estoque - $1 WHERE id_produto = $2 RETURNING quantidade_estoque',
                [item.quantidade, item.id_produto]
            );
            if (estoqueResult.rows.length === 0 || estoqueResult.rows[0].quantidade_estoque < 0) {
                throw new Error(`Estoque insuficiente para o produto: ${item.nome}`);
            }
            await client.query(
                'INSERT INTO movimentacoes_estoque (id_produto, tipo_movimentacao, quantidade, origem) VALUES ($1, $2, $3, $4)',
                [item.id_produto, 'saida', item.quantidade, `Venda #${id_venda}`]
            );
        }

        for (const pagamento of pagamentos) {
            await client.query(
                'INSERT INTO pagamentos (id_venda, valor_pago, forma_pagamento, parcelas) VALUES ($1, $2, $3, $4)',
                [id_venda, pagamento.valor, pagamento.forma, pagamento.parcelas || 1]
            );

            if (pagamento.forma === 'Cartão de Crédito' && pagamento.parcelas > 0) {
                const valorParcela = pagamento.valor / pagamento.parcelas;
                for (let i = 1; i <= pagamento.parcelas; i++) {
                    const dataVencimento = new Date();
                    dataVencimento.setMonth(dataVencimento.getMonth() + i);
                    await client.query(
                        `INSERT INTO contas_a_receber (id_venda, id_cliente, numero_parcela, total_parcelas, valor_parcela, data_vencimento) VALUES ($1, $2, $3, $4, $5, $6)`,
                        [id_venda, id_cliente, i, pagamento.parcelas, valorParcela, dataVencimento]
                    );
                }
            }
        }

        await client.query('COMMIT');
        res.status(201).json({ message: 'Venda finalizada com sucesso!', id_venda });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erro ao finalizar venda:', error);
        res.status(500).json({ message: 'Erro ao finalizar venda.', error: error.message });
    } finally {
        client.release();
    }
};

exports.getVendaDetalhes = async (req, res) => {
    try {
        const { id } = req.params;
        const [vendaResult, itensResult, pagamentosResult] = await Promise.all([
            pool.query(`SELECT v.*, c.nome AS nome_cliente FROM vendas v LEFT JOIN clientes c ON v.id_cliente = c.id_cliente WHERE v.id_venda = $1`, [id]),
            pool.query('SELECT * FROM itens_venda WHERE id_venda = $1', [id]),
            pool.query('SELECT * FROM pagamentos WHERE id_venda = $1', [id])
        ]);

        if (vendaResult.rowCount === 0) {
            return res.status(404).json({ message: 'Venda não encontrada.' });
        }
        const detalhesCompletos = {
            detalhes: vendaResult.rows[0],
            itens: itensResult.rows,
            pagamentos: pagamentosResult.rows
        };
        res.status(200).json(detalhesCompletos);
    } catch (error) {
        console.error('Erro ao buscar detalhes da venda:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};