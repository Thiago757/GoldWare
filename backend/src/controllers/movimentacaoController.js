const pool = require('../config/database');

exports.listarMovimentacoes = async (req, res) => {
    try {
        const { startDate, endDate, tipo } = req.query;

        let query = `
            SELECT 
                m.id_movimentacao,
                m.data_movimentacao,
                m.tipo_movimentacao,
                m.quantidade,
                m.observacao,
                p.nome AS nome_produto,
                u.nome AS nome_usuario
            FROM movimentacoes_estoque m
            LEFT JOIN produtos p ON p.id_produto = m.id_produto
            LEFT JOIN usuarios u ON u.id_usuario = m.id_usuario_responsavel
            WHERE 1=1
        `;

        const params = [];

        // Filtro por data inicial (startDate em ISO, vindo do front)
        if (startDate) {
            params.push(startDate);
            query += ` AND m.data_movimentacao >= $${params.length}`;
        }

        // Filtro por data final (endDate em ISO, vindo do front)
        if (endDate) {
            params.push(endDate);
            query += ` AND m.data_movimentacao <= $${params.length}`;
        }

        if (tipo && (tipo === 'entrada' || tipo === 'saida')) {
            params.push(tipo);
            query += ` AND m.tipo_movimentacao = $${params.length}`;
        }

        query += ' ORDER BY m.data_movimentacao DESC';

        const result = await pool.query(query, params);

        console.log('🔎 Movimentações encontradas:', result.rows.length);

        return res.status(200).json(result.rows);
    } catch (error) {
        console.error('❌ Erro ao listar movimentações:', error);
        return res.status(500).json({
            message: 'Erro no servidor ao listar movimentações.',
            error: error.message,
        });
    }
};
