const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

exports.listarVendas = async (req, res) => {
    try {
        const { startDate, endDate, status } = req.query;

        let query = `
            SELECT 
                v.id_venda,
                v.data_venda,
                c.nome AS nome_cliente,
                v.valor_total,
                v.status -- AQUI ESTÁ A CORREÇÃO
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
            conditions.push(`v.status = $${params.length}`); // E aqui também
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

exports.iniciarVenda = async (req, res) => {
    const { id_cliente } = req.body;
    if (!id_cliente) return res.status(400).json({ message: 'ID do cliente é obrigatório.' });

    try {
        const novaVenda = await pool.query(
            "INSERT INTO vendas (id_cliente, valor_total, status) VALUES ($1, 0.00, 'aberta') RETURNING *",
            [id_cliente]
        );
        res.status(201).json(novaVenda.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao iniciar venda.', error: error.message });
    }
};

exports.adicionarItemVenda = async (req, res) => {
    const { id_venda } = req.params;
    const { id_produto, quantidade, preco_unitario } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const itemExistente = await client.query(
            'SELECT * FROM itens_venda WHERE id_venda = $1 AND id_produto = $2',
            [id_venda, id_produto]
        );

        if (itemExistente.rows.length > 0) {
            await client.query(
                'UPDATE itens_venda SET quantidade = quantidade + $1 WHERE id_item_venda = $2',
                [quantidade, itemExistente.rows[0].id_item_venda]
            );
        } else {
            await client.query(
                'INSERT INTO itens_venda (id_venda, id_produto, quantidade, preco_unitario) VALUES ($1, $2, $3, $4)',
                [id_venda, id_produto, quantidade, preco_unitario]
            );
        }

        await client.query(`
            UPDATE vendas SET valor_total = (
                SELECT SUM(preco_unitario * quantidade) FROM itens_venda WHERE id_venda = $1
            ) WHERE id_venda = $1
        `, [id_venda]);

        await client.query('COMMIT');
        res.status(201).json({ message: 'Item adicionado/atualizado com sucesso.' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Erro ao adicionar item:", error);
        res.status(500).json({ message: 'Erro ao adicionar item.', error: error.message });
    } finally {
        client.release();
    }
};

exports.removerItemVenda = async (req, res) => {
    const { id_venda, id_item_venda } = req.params;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const result = await client.query(
            'DELETE FROM itens_venda WHERE id_item_venda = $1 AND id_venda = $2',
            [id_item_venda, id_venda]
        );

        if (result.rowCount === 0) {
            console.warn(`Item de venda #${id_item_venda} não encontrado para a venda #${id_venda}.`);
        }

        await client.query(`
            UPDATE vendas SET valor_total = (
                SELECT COALESCE(SUM(preco_unitario * quantidade), 0) FROM itens_venda WHERE id_venda = $1
            ) WHERE id_venda = $1
        `, [id_venda]);

        await client.query('COMMIT');
        res.status(200).json({ message: 'Item removido com sucesso.' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Erro ao remover item:", error);
        res.status(500).json({ message: 'Erro ao remover item.', error: error.message });
    } finally {
        client.release();
    }
};

exports.cancelarVenda = async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const venda = await client.query("SELECT * FROM vendas WHERE id_venda = $1 AND status = 'aberta'", [id]);
        if (venda.rowCount === 0) throw new Error('Venda não pode ser cancelada pois não está mais em aberto.');

        await client.query("UPDATE vendas SET status = 'cancelada' WHERE id_venda = $1", [id]);
        await client.query("DELETE FROM itens_venda WHERE id_venda = $1", [id]);

        await client.query('COMMIT');
        res.status(200).json({ message: 'Venda cancelada com sucesso.' });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: 'Erro ao cancelar venda.', error: error.message });
    } finally {
        client.release();
    }
};


exports.devolverVenda = async (req, res) => {
    const { id } = req.params;
    const { observacao } = req.body;
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        const updateVenda = await client.query(
            "UPDATE vendas SET status = 'devolvida', observacao = $1 WHERE id_venda = $2 AND status = 'concluida'",
            [observacao, id]
        );

        if (updateVenda.rowCount === 0) {
            throw new Error('Venda não encontrada ou não pode ser devolvida (status não era "concluida").');
        }

        const itensQuery = await client.query('SELECT id_produto, quantidade FROM itens_venda WHERE id_venda = $1', [id]);
        
        for (const item of itensQuery.rows) {
            await client.query(
                'UPDATE produtos SET quantidade_estoque = quantidade_estoque + $1 WHERE id_produto = $2',
                [item.quantidade, item.id_produto]
            );
            await client.query(
                "INSERT INTO movimentacoes_estoque (id_produto, tipo_movimentacao, quantidade, observacao) VALUES ($1, 'entrada', $2, $3)",
                [item.id_produto, item.quantidade, `Devolução da Venda #${id}`]
            );
        }

        await client.query(
            "UPDATE contas_a_receber SET status = 'cancelado' WHERE id_venda = $1 AND status = 'pendente'",
            [id]
        );

        await client.query('COMMIT');
        res.status(200).json({ message: 'Venda devolvida e estoque estornado com sucesso!' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erro ao devolver venda:', error);
        res.status(500).json({ message: 'Erro ao devolver venda.', error: error.message });
    } finally {
        client.release();
    }
};

exports.finalizarVenda = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id_venda, desconto, pagamentos } = req.body;
        const id_usuario = req.user.userId; 

        await client.query('BEGIN'); 

        const vendaAtual = await client.query('SELECT * FROM vendas WHERE id_venda = $1', [id_venda]);
        if (vendaAtual.rows.length === 0) throw new Error('Venda não encontrada.');
        const id_cliente = vendaAtual.rows[0].id_cliente;

        const itensVenda = await client.query('SELECT * FROM itens_venda WHERE id_venda = $1', [id_venda]);
        if (itensVenda.rows.length === 0) throw new Error('A venda não possui itens.');

        const valor_total_calculado = itensVenda.rows.reduce((acc, item) => acc + (item.preco_unitario * item.quantidade), 0);
        const valor_final = valor_total_calculado - (desconto || 0);

        for (const item of itensVenda.rows) {
            const estoqueResult = await client.query(
                'UPDATE produtos SET quantidade_estoque = quantidade_estoque - $1 WHERE id_produto = $2 RETURNING quantidade_estoque',
                [item.quantidade, item.id_produto]
            );

            if (estoqueResult.rows.length === 0 || estoqueResult.rows[0].quantidade_estoque < 0) {
                throw new Error(`Estoque insuficiente para o produto ID ${item.id_produto}`);
            }

            await client.query(
                'INSERT INTO movimentacoes_estoque (id_produto, tipo_movimentacao, quantidade, id_item_venda, id_usuario_responsavel) VALUES ($1, $2, $3, $4, $5)',
                [item.id_produto, 'saida', item.quantidade, item.id_item_venda, id_usuario]
            );
        }

        await client.query(
            "UPDATE vendas SET status = 'concluida', valor_total = $1, desconto = $2 WHERE id_venda = $3",
            [valor_final, desconto, id_venda]
        );

       for (const pag of pagamentos) {
            const totalParcelas = pag.parcelas || 1;
            const valorParcela = pag.valor / totalParcelas;
            
            for (let i = 1; i <= totalParcelas; i++) {
                const dataVencimento = new Date();

                if (totalParcelas > 1) {
                    dataVencimento.setMonth(dataVencimento.getMonth() + i);
                }
                
                const statusInicial = pag.forma === 'Cartão de Crédito' ? 'pendente' : 'pago';

                await client.query(
                    `INSERT INTO contas_a_receber 
                        (id_venda, id_cliente, numero_parcela, total_parcelas, valor_parcela, data_vencimento, status)
                     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    [id_venda, id_cliente, i, totalParcelas, valorParcela, dataVencimento, statusInicial]
                );
            }
        }

        await client.query('COMMIT');
        res.status(200).json({ message: 'Venda finalizada com sucesso!', id_venda: id_venda });

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

        const [vendaResult, itensResult, parcelasResult] = await Promise.all([
            pool.query(`SELECT v.*, 
                        c.nome || ' - CPF: ' || 
                            SUBSTRING(c.cpf, 1, 3) || '.' ||
                            SUBSTRING(c.cpf, 4, 3) || '.' || 
                            SUBSTRING(c.cpf, 7, 3) || '-' || 
                            SUBSTRING(c.cpf, 10, 2) AS nome_cliente
                        FROM vendas v 
                        LEFT JOIN clientes c ON v.id_cliente = c.id_cliente 
                        WHERE v.id_venda = $1`, [id]),
            pool.query('SELECT * FROM itens_venda i JOIN produtos p ON (p.id_produto = i.id_produto) WHERE id_venda = $1', [id]),
            pool.query('SELECT * FROM contas_a_receber WHERE id_venda = $1', [id])
        ]);

        if (vendaResult.rowCount === 0) {
            return res.status(404).json({ message: 'Venda não encontrada.' });
        }

        const detalhesCompletos = {
            detalhes: vendaResult.rows[0],
            itens: itensResult.rows,
            parcelas: parcelasResult.rows
        };

        res.status(200).json(detalhesCompletos);
    } catch (error) {
        console.error('Erro ao buscar detalhes da venda:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};

exports.getVendaAbertaDetalhes = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [vendaResult, itensResult] = await Promise.all([
            pool.query(`SELECT v.*, c.id_cliente, 
                        c.nome || ' - CPF: ' || 
                            SUBSTRING(c.cpf, 1, 3) || '.' ||
                            SUBSTRING(c.cpf, 4, 3) || '.' || 
                            SUBSTRING(c.cpf, 7, 3) || '-' || 
                            SUBSTRING(c.cpf, 10, 2) AS nome_cliente
                        FROM vendas v 
                        JOIN clientes c ON v.id_cliente = c.id_cliente 
                        WHERE v.id_venda = $1 AND v.status = 'aberta'`, [id]),
            
            pool.query(`
                SELECT p.*, iv.quantidade, iv.id_item_venda 
                FROM itens_venda iv 
                JOIN produtos p ON iv.id_produto = p.id_produto 
                WHERE iv.id_venda = $1`, 
            [id])
        ]);

        if (vendaResult.rowCount === 0) {
            return res.status(404).json({ message: 'Venda em aberto não encontrada.' });
        }

        const vendaAberta = {
            ...vendaResult.rows[0],
            itens: itensResult.rows
        };
        res.status(200).json(vendaAberta);

    } catch (error) {
        console.error("Erro ao buscar venda em aberto:", error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};

exports.updateItemQuantidade = async (req, res) => {
    const { id_venda, id_item_venda } = req.params;
    const { nova_quantidade } = req.body;
    
    if (!nova_quantidade || nova_quantidade <= 0) {
        return res.status(400).json({ message: 'Quantidade inválida.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        await client.query(
            'UPDATE itens_venda SET quantidade = $1 WHERE id_item_venda = $2 AND id_venda = $3',
            [nova_quantidade, id_item_venda, id_venda]
        );
        
        await client.query(`
            UPDATE vendas SET valor_total = (SELECT COALESCE(SUM(preco_unitario * quantidade), 0) FROM itens_venda WHERE id_venda = $1)
            WHERE id_venda = $1
        `, [id_venda]);
        
        await client.query('COMMIT');
        res.status(200).json({ message: 'Quantidade atualizada.' });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: 'Erro ao atualizar quantidade.', error: error.message });
    } finally {
        client.release();
    }
};


exports.removerMultiplosItens = async (req, res) => {
    const { id_venda } = req.params;
    const { ids_itens } = req.body; 

    if (!ids_itens || ids_itens.length === 0) {
        return res.status(400).json({ message: 'Nenhum item selecionado para remoção.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        await client.query(
            'DELETE FROM itens_venda WHERE id_item_venda = ANY($1) AND id_venda = $2',
            [ids_itens, id_venda]
        );

        await client.query(`
            UPDATE vendas SET valor_total = (SELECT COALESCE(SUM(preco_unitario * quantidade), 0) FROM itens_venda WHERE id_venda = $1)
            WHERE id_venda = $1
        `, [id_venda]);

        await client.query('COMMIT');
        res.status(200).json({ message: 'Itens removidos com sucesso.' });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: 'Erro ao remover itens.', error: error.message });
    } finally {
        client.release();
    }
};