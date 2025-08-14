const pool = require('../config/database');

exports.findByBarcode = async (req, res) => {
    try {
        const { code } = req.params;

        const produtoQuery = await pool.query(
            'SELECT * FROM produtos WHERE codigo_barras = $1 AND ativo = \'S\'',
            [code]
        );

        const produto = produtoQuery.rows[0];

        if (!produto) {
            return res.status(404).json({ message: 'Produto não encontrado ou inativo.' });
        }

        res.status(200).json(produto);

    } catch (error) {
        console.error('Erro ao buscar produto por código de barras:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};