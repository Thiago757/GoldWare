const pool = require('../config/database');

exports.listarMovimentacoes = async (req, res) => {
    try {
        const query = `
            SELECT 
                m.id_movimentacao,
                m.data_movimentacao,
                m.tipo_movimentacao,
                m.quantidade,
                m.observacao,

                p.nome AS produto,
                u.nome AS responsavel,

                COALESCE(m.id_item_venda, NULL) AS id_item_venda,
                COALESCE(m.id_item_compra, NULL) AS id_item_compra

            FROM movimentacoes_estoque m
            LEFT JOIN produtos p ON p.id_produto = m.id_produto
            LEFT JOIN usuarios u ON u.id_usuario = m.id_usuario_responsavel
            ORDER BY m.data_movimentacao DESC, m.id_movimentacao DESC;
        `;

        const result = await pool.query(query);
        return res.status(200).json(result.rows);

    } catch (error) {
        console.error("Erro ao listar movimentações:", error);
        return res.status(500).json({
            message: 'Erro ao listar movimentações.',
            error
        });
    }
};
