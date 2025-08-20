const pool = require('../config/database');
const generateEAN13 = require('../utils/barcodeGenerator');

exports.listarProdutos = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM produtos ORDER BY nome ASC');
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor.', error });
    }
};

exports.findByBarcode = async (req, res) => {
    try {
        const { code } = req.params;
        const produtoQuery = await pool.query(
            "SELECT * FROM produtos WHERE codigo_barras = $1 AND ativo = 'S'",
            [code]
        );
        const produto = produtoQuery.rows[0];
        if (!produto) {
            return res.status(404).json({ message: 'Produto não encontrado ou inativo.' });
        }
        res.status(200).json(produto);
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor.', error });
    }
};

exports.createProduto = async (req, res) => {
    try {
        const { nome, descricao, preco_venda, custo, quantidade_estoque, categoria } = req.body;
        const codigo_barras = generateEAN13();

        const novoProduto = await pool.query(
            `INSERT INTO produtos (nome, descricao, preco_venda, custo, quantidade_estoque, categoria, codigo_barras) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [nome, descricao, preco_venda, custo, quantidade_estoque, categoria, codigo_barras]
        );
        res.status(201).json(novoProduto.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor.', error });
    }
};

exports.updateStatusProduto = async (req, res) => {
    try {
        const { id } = req.params;
        const { ativo } = req.body;

        if (ativo !== 'S' && ativo !== 'N') {
            return res.status(400).json({ message: "Status inválido. Use 'S' para ativo ou 'N' para inativo." });
        }

        const result = await pool.query(
            'UPDATE produtos SET ativo = $1 WHERE id_produto = $2 RETURNING *',
            [ativo, id]
        );

        if (result.rowCount === 0) return res.status(404).json({ message: 'Produto não encontrado.' });
        res.status(200).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor.', error });
    }
};

exports.uploadImage = async (req, res) => {
    try {
        const { id } = req.params; // Pega o ID do produto da URL

        if (!req.file) {
            return res.status(400).json({ message: 'Nenhum arquivo de imagem enviado.' });
        }

        const imageUrl = `${req.protocol}://${req.get('host')}/${req.file.path.replace(/\\/g, "/")}`;

        const updateQuery = await pool.query(
            'UPDATE produtos SET imagem_url = $1 WHERE id_produto = $2 RETURNING *',
            [imageUrl, id]
        );

        if (updateQuery.rowCount === 0) {
            return res.status(404).json({ message: 'Produto não encontrado para associar a imagem.' });
        }

        res.status(200).json({ 
            message: 'Imagem enviada com sucesso!', 
            produto: updateQuery.rows[0] 
        });

    } catch (error) {
        console.error('Erro no upload de imagem:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};