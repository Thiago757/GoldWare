const pool = require('../config/database');

exports.listarTipos = async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM tipos_servico ORDER BY nome ASC');
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor.', error: error.message });
    }
};

exports.criarTipo = async (req, res) => {
    const { nome } = req.body;
    if (!nome) return res.status(400).json({ message: 'O nome é obrigatório.' });
    try {
        const { rows } = await pool.query(
            'INSERT INTO tipos_servico (nome, testes) VALUES ($1, $2) RETURNING *',
            [nome]
        );
        res.status(201).json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao criar tipo de serviço.', error: error.message });
    }
};

exports.atualizarTipo = async (req, res) => {
    const { id } = req.params;
    const { nome } = req.body;
    if (!nome) return res.status(400).json({ message: 'O nome é obrigatório.' });
    try {
        const { rows } = await pool.query(
            'UPDATE tipos_servico SET nome = $1 WHERE id_tipo_servico = $2 RETURNING *',
            [nome, id]
        );
        if (rows.length === 0) return res.status(404).json({ message: 'Tipo de serviço não encontrado.' });
        res.status(200).json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar tipo de serviço.', error: error.message });
    }
};

exports.deletarTipo = async (req, res) => {
    const { id } = req.params;
    try {
        const { rowCount } = await pool.query(
            'DELETE FROM tipos_servico WHERE id_tipo_servico = $1',
            [id]
        );
        if (rowCount === 0) return res.status(404).json({ message: 'Tipo de serviço não encontrado.' });
        res.status(204).send(); // 204 No Content
    } catch (error) {
        if (error.code === '23503') {
            return res.status(400).json({ message: 'Este tipo de serviço está em uso e não pode ser excluído.' });
        }
        res.status(500).json({ message: 'Erro ao deletar tipo de serviço.', error: error.message });
    }
};