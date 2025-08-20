const pool = require('../config/database');

exports.listarContasAReceber = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT car.*, c.nome AS nome_cliente 
            FROM contas_a_receber car
            JOIN clientes c ON car.id_cliente = c.id_cliente
            WHERE car.status = 'pendente' 
            ORDER BY car.data_vencimento ASC
        `);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Erro ao listar contas a receber:", error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};