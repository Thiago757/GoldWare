const pool = require('../config/database');

exports.listarServicos = async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT s.*, ts.nome AS nome_tipo_servico
            FROM servicos s
            LEFT JOIN tipos_servico ts ON s.id_tipo_servico = ts.id_tipo_servico
            ORDER BY s.nome ASC
        `);
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor.', error: error.message });
    }
};

exports.criarServico = async (req, res) => {
    const { nome, descricao, preco_base, prazo_estimado, id_tipo_servico } = req.body;
    if (!nome || !preco_base) {
        return res.status(400).json({ message: 'Nome e Preço Base são obrigatórios.' });
    }
    try {
        const { rows } = await pool.query(
            `INSERT INTO servicos (nome, descricao, preco_base, prazo_estimado, id_tipo_servico) 
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [nome, descricao, preco_base, prazo_estimado, id_tipo_servico]
        );
        res.status(201).json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao criar serviço.', error: error.message });
    }
};

exports.atualizarServico = async (req, res) => {
    const { id } = req.params;
    const { nome, descricao, preco_base, prazo_estimado, id_tipo_servico, ativo } = req.body;
    try {
        const { rows } = await pool.query(
            `UPDATE servicos SET nome = $1, descricao = $2, preco_base = $3, prazo_estimado = $4, id_tipo_servico = $5, ativo = $6
             WHERE id_servico = $7 RETURNING *`,
            [nome, descricao, preco_base, prazo_estimado, id_tipo_servico, ativo, id]
        );
        if (rows.length === 0) return res.status(404).json({ message: 'Serviço não encontrado.' });
        res.status(200).json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar serviço.', error: error.message });
    }
};
