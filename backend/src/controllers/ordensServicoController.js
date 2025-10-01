const pool = require('../config/database');

// Em src/controllers/ordensServicoController.js

exports.listarOS = async (req, res) => {
    const { id_os, nome_cliente, cpf_cliente, status } = req.query;
    try {
        let query = `
            SELECT 
                os.id_os, os.data_abertura, os.status,
                c.nome AS nome_cliente,
                (SELECT SUM(subtotal) FROM itens_os WHERE id_os = os.id_os) AS valor_total
            FROM ordens_servico os
            JOIN clientes c ON os.id_cliente = c.id_cliente
        `;
        
        const params = [];
        const conditions = [];

        if (id_os) {
            params.push(id_os);
            conditions.push(`os.id_os = $${params.length}`);
        }
        if (nome_cliente) {
            params.push(`%${nome_cliente}%`);
            conditions.push(`c.nome ILIKE $${params.length}`);
        }
        if (cpf_cliente) {
            params.push(cpf_cliente.replace(/\D/g, ''));
            conditions.push(`c.cpf LIKE $${params.length}`);
        }
        if (status) {
            params.push(status);
            conditions.push(`os.status = $${params.length}`);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        
        query += ' ORDER BY os.data_abertura DESC';

        const { rows } = await pool.query(query, params);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Erro ao listar Ordens de Serviço:', error);
        res.status(500).json({ message: 'Erro no servidor.', error: error.message });
    }
};

exports.criarOS = async (req, res) => {
    const { id_cliente } = req.body;
    const id_usuario_responsavel = req.user.userId; // Supondo que você tenha o ID do usuário logado

    if (!id_cliente) {
        return res.status(400).json({ message: 'O cliente é obrigatório.' });
    }
    try {
        const { rows } = await pool.query(
            'INSERT INTO ordens_servico (id_cliente, id_usuario_responsavel, status) VALUES ($1, $2, $3) RETURNING *',
            [id_cliente, id_usuario_responsavel, 'aberta']
        );
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error('Erro ao criar Ordem de Serviço:', error);
        res.status(500).json({ message: 'Erro ao criar OS.', error: error.message });
    }
};

exports.getOSDetalhes = async (req, res) => {
    const { id } = req.params;
    try {
        const osQuery = `
            SELECT os.*, c.nome as nome_cliente, c.cpf
            FROM ordens_servico os
            JOIN clientes c ON os.id_cliente = c.id_cliente
            WHERE os.id_os = $1
        `;
        const itensQuery = `
            SELECT io.*, s.nome as nome_servico, s.descricao
            FROM itens_os io
            JOIN servicos s ON io.id_servico = s.id_servico
            WHERE io.id_os = $1
            ORDER BY io.id_item_os ASC
        `;

        const [osResult, itensResult] = await Promise.all([
            pool.query(osQuery, [id]),
            pool.query(itensQuery, [id])
        ]);

        if (osResult.rowCount === 0) {
            return res.status(404).json({ message: 'Ordem de Serviço não encontrada.' });
        }

        res.status(200).json({ ...osResult.rows[0], itens: itensResult.rows });

    } catch (error) {
        console.error('Erro ao buscar detalhes da OS:', error);
        res.status(500).json({ message: 'Erro no servidor.', error: error.message });
    }
};

exports.adicionarItemOS = async (req, res) => {
    const { id_os } = req.params;
    const { id_servico, quantidade } = req.body;

    if (!id_servico || !quantidade) {
        return res.status(400).json({ message: 'ID do serviço e quantidade são obrigatórios.' });
    }

    try {
        const servicoResult = await pool.query('SELECT preco_base, prazo_estimado FROM servicos WHERE id_servico = $1', [id_servico]);
        if (servicoResult.rowCount === 0) {
            return res.status(404).json({ message: 'Serviço não encontrado no catálogo.' });
        }
        const preco_unitario = servicoResult.rows[0].preco_base;
        const prazo_estimado = servicoResult.rows[0].prazo_estimado;

        const { rows } = await pool.query(
            'INSERT INTO itens_os (id_os, id_servico, quantidade, preco_unitario, prazo_estimado) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [id_os, id_servico, 1, preco_unitario, prazo_estimado]
        );
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error('Erro ao adicionar item na OS:', error);
        res.status(500).json({ message: 'Erro ao adicionar item.', error: error.message });
    }
};


exports.atualizarItemOS = async (req, res) => {
    const { id_item_os } = req.params;
    const { quantidade, preco_unitario, prazo_estimado } = req.body;
    const fields = [];
    const values = [];
    let queryPart = '';

    if (quantidade !== undefined) {
        fields.push('quantidade = $' + (fields.length + 1));
        values.push(quantidade);
    }
    if (preco_unitario !== undefined) {
        fields.push('preco_unitario = $' + (fields.length + 1));
        values.push(preco_unitario);
    }
    if (prazo_estimado !== undefined) {
        fields.push('prazo_estimado = $' + (fields.length + 1));
        values.push(prazo_estimado);
    }

    if (fields.length === 0) {
        return res.status(400).json({ message: 'Nenhum campo para atualizar foi fornecido.' });
    }

    values.push(id_item_os);
    queryPart = fields.join(', ');

    try {
        const query = `UPDATE itens_os SET ${queryPart} WHERE id_item_os = $${values.length} RETURNING *`;
        const { rows } = await pool.query(query, values);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Item da Ordem de Serviço não encontrado.' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar item da OS:', error);
        res.status(500).json({ message: 'Erro ao atualizar item.', error: error.message });
    }
};

exports.removerItemOS = async (req, res) => {
    const { id_item_os } = req.params;
    try {
        const result = await pool.query('DELETE FROM itens_os WHERE id_item_os = $1', [id_item_os]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Item da Ordem de Serviço não encontrado.' });
        }
        res.status(204).send();
    } catch (error) {
        console.error('Erro ao remover item da OS:', error);
        res.status(500).json({ message: 'Erro ao remover item.', error: error.message });
    }
};

exports.atualizarStatusOS = async (req, res) => {
    const { id_os } = req.params;
    const { status } = req.body;

    const statusValidos = ['em_andamento', 'concluida', 'cancelada'];
    if (!status || !statusValidos.includes(status)) {
        return res.status(400).json({ message: 'Status inválido.' });
    }

    try {
        let query = 'UPDATE ordens_servico SET status = $1';
        const values = [status, id_os];

        if (status === 'concluida') {
            query += ', data_conclusao = CURRENT_TIMESTAMP';
        }

        query += ' WHERE id_os = $2 RETURNING *';
        
        const { rows } = await pool.query(query, values);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Ordem de Serviço não encontrada.' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar status da OS:', error);
        res.status(500).json({ message: 'Erro ao atualizar status.', error: error.message });
    }
};


exports.finalizarOS = async (req, res) => {
    const { id_os } = req.params;
    const { pagamentos } = req.body; 
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const osResult = await client.query('SELECT * FROM ordens_servico WHERE id_os = $1', [id_os]);
        if (osResult.rows.length === 0) throw new Error('Ordem de Serviço não encontrada.');
        const id_cliente = osResult.rows[0].id_cliente;

        await client.query(
            "UPDATE ordens_servico SET status = 'concluida', data_conclusao = CURRENT_TIMESTAMP WHERE id_os = $1",
            [id_os]
        );

        for (const pag of pagamentos) {
            const totalParcelas = pag.parcelas || 1;
            const valorParcela = pag.valor / totalParcelas;
            
            for (let i = 1; i <= totalParcelas; i++) {
                const dataVencimento = new Date();
                if (totalParcelas > 1) {
                    dataVencimento.setMonth(dataVencimento.getMonth() + (i - 1));
                }
                const statusInicial = pag.forma === 'Cartão de Crédito' ? 'pendente' : 'pago';
                
                await client.query(
                    `INSERT INTO contas_a_receber (id_os, id_cliente, numero_parcela, total_parcelas, valor_parcela, data_vencimento, status)
                     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    [id_os, id_cliente, i, totalParcelas, valorParcela, dataVencimento, statusInicial]
                );
            }
        }

        await client.query('COMMIT');
        res.status(200).json({ message: 'Ordem de Serviço finalizada e pagamento registrado com sucesso!' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erro ao finalizar OS:', error);
        res.status(500).json({ message: 'Erro ao finalizar Ordem de Serviço.', error: error.message });
    } finally {
        client.release();
    }
};

exports.atualizarObservacaoOS = async (req, res) => {
    const { id_os } = req.params;
    const { observacao } = req.body;

    if (observacao === undefined) {
        return res.status(400).json({ message: 'O campo observação é necessário.' });
    }

    try {
        const { rows } = await pool.query(
            'UPDATE ordens_servico SET observacao = $1 WHERE id_os = $2 RETURNING *',
            [observacao, id_os]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Ordem de Serviço não encontrada.' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar observação da OS:', error);
        res.status(500).json({ message: 'Erro ao atualizar observação.', error: error.message });
    }
};