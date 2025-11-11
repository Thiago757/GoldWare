const pool = require('../config/database');

exports.listarCidades = async (req, res) => {
    try {
        // SQL Otimizado: Busca cidades e já traz a sigla do estado (JOIN)
        const query = `
            SELECT c.id_cidade, c.nome, e.sigla 
            FROM cidades c
            JOIN estados e ON c.id_estado = e.id_estado
            ORDER BY c.nome ASC
        `;
        const { rows } = await pool.query(query);
        res.json(rows);
    } catch (err) {
        console.error("Erro ao buscar cidades:", err.message);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};