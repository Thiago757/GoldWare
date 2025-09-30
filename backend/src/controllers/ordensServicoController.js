// src/controllers/ordensServicoController.js
const pool = require('../config/database');

exports.listarOS = async (req, res) => {
    try {
        const query = `
            SELECT 
                os.id_os,
                os.data_abertura,
                os.status,
                c.nome AS nome_cliente,
                -- Calcula o total somando os subtotais dos itens de cada OS
                (SELECT SUM(subtotal) FROM itens_os WHERE id_os = os.id_os) AS valor_total
            FROM ordens_servico os
            JOIN clientes c ON os.id_cliente = c.id_cliente
            ORDER BY os.data_abertura DESC
        `;
        const { rows } = await pool.query(query);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Erro ao listar Ordens de Serviço:', error);
        res.status(500).json({ message: 'Erro no servidor.', error: error.message });
    }
};

// Criar uma nova Ordem de Serviço (apenas o cabeçalho)
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
        // Pega o preço base do catálogo de serviços
        const servicoResult = await pool.query('SELECT preco_base FROM servicos WHERE id_servico = $1', [id_servico]);
        if (servicoResult.rowCount === 0) {
            return res.status(404).json({ message: 'Serviço não encontrado no catálogo.' });
        }
        const preco_unitario = servicoResult.rows[0].preco_base;

        const { rows } = await pool.query(
            'INSERT INTO itens_os (id_os, id_servico, quantidade, preco_unitario) VALUES ($1, $2, $3, $4) RETURNING *',
            [id_os, id_servico, quantidade, preco_unitario]
        );
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error('Erro ao adicionar item na OS:', error);
        res.status(500).json({ message: 'Erro ao adicionar item.', error: error.message });
    }
};


exports.atualizarItemOS = async (req, res) => {
    const { id_item_os } = req.params;
    const { quantidade, preco_unitario } = req.body;
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