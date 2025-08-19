const pool = require('../config/database');

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
            conditions.push(`v.data_venda >= $${params.length}`);
        }
        if (endDate) {
            params.push(endDate);
            conditions.push(`v.data_venda <= $${params.length}`);
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

    console.log("--- DADOS RECEBIDOS ---");
    console.log(JSON.stringify(req.body, null, 2));
    console.log("-------------------------");

    const client = await pool.connect();

    try {
        const { id_cliente, desconto, valor_total, itens, pagamentos } = req.body;

        await client.query('BEGIN');

        const vendaQuery = await client.query(
            'INSERT INTO vendas (id_cliente, valor_total, desconto) VALUES ($1, $2, $3) RETURNING id_venda',
            [id_cliente, valor_total, desconto]
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

            const estoqueAtual = await client.query('SELECT quantidade_estoque FROM produtos WHERE id_produto = $1', [item.id_produto]);
            if (estoqueAtual.rows[0].quantidade_estoque < item.quantidade) {
                await client.query('ROLLBACK');
                return res.status(400).json({ message: `Estoque insuficiente para o produto: ${item.nome}`});
            }

            await client.query(
                'UPDATE produtos SET quantidade_estoque = quantidade_estoque - $1 WHERE id_produto = $2',
                [item.quantidade, item.id_produto]
            );

            await client.query(
                'INSERT INTO movimentacoes_estoque (id_produto, tipo_movimentacao, quantidade, origem) VALUES ($1, $2, $3, $4)',
                [item.id_produto, 'saida', item.quantidade, `Venda #${id_venda}`]
            );
        }

        for (const pagamento of pagamentos) {
            await client.query(
                'INSERT INTO pagamentos (id_venda, valor_pago, forma_pagamento) VALUES ($1, $2, $3)',
                [id_venda, pagamento.valor, pagamento.forma]
            );
        }

        await client.query('COMMIT');

        res.status(201).json({ message: 'Venda finalizada com sucesso!', id_venda });

    } catch (error) {
        await client.query('ROLLBACK').catch(rollbackError => {
            console.error('Erro no rollback:', rollbackError);
        });

        console.error('Erro ao finalizar venda:', error);
        res.status(500).json({ message: 'Erro ao finalizar venda.', error: error.message });
    } finally {
        client.release();
    }
};