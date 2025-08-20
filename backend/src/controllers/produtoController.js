const pool = require('../config/database');
const generateEAN13 = require('../utils/barcodeGenerator');
const fs = require('fs').promises;
const path = require('path'); 

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
        
        if (!nome || !preco_venda || !custo || !quantidade_estoque || !categoria) {
            return res.status(400).json({ message: 'Todos os campos obrigatórios devem ser preenchidos (nome, preço de venda, custo, estoque, categoria).' });
        }
        
        let imageUrl = null;
        if (req.file) {
            imageUrl = `/uploads/${req.file.filename}`;
        }

        const codigo_barras = generateEAN13();

        const novoProduto = await pool.query(
            `INSERT INTO produtos (nome, descricao, preco_venda, custo, quantidade_estoque, categoria, codigo_barras, imagem_url) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [nome, descricao, preco_venda, custo, quantidade_estoque, categoria, codigo_barras, imageUrl]
        );

        res.status(201).json(novoProduto.rows[0]);
    } catch (error) {
        console.error("Erro ao criar produto:", error);
        res.status(500).json({ message: 'Erro no servidor.', error: error.message });
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
        const { id } = req.params;

        if (!req.file) {
            return res.status(400).json({ message: 'Nenhum arquivo de imagem enviado.' });
        }

        const oldImageQuery = await pool.query(
            'SELECT imagem_url FROM produtos WHERE id_produto = $1',
            [id]
        );

        if (oldImageQuery.rows.length > 0 && oldImageQuery.rows[0].imagem_url) {
            const oldImageUrl = oldImageQuery.rows[0].imagem_url;
            const oldFilename = path.basename(oldImageUrl);
            const oldFilePath = path.join(__dirname, '..', '..', 'uploads', oldFilename);

            try {
                await fs.unlink(oldFilePath);
                console.log(`Imagem antiga deletada: ${oldFilePath}`);
            } catch (unlinkError) {
                if (unlinkError.code === 'ENOENT') {
                    console.warn(`Arquivo de imagem antigo não encontrado para deletar: ${oldFilePath}`);
                } else {
                    throw unlinkError;
                }
            }
        }
        const newImageUrl = `/uploads/${req.file.filename}`;

        const updateQuery = await pool.query(
            'UPDATE produtos SET imagem_url = $1 WHERE id_produto = $2 RETURNING *',
            [newImageUrl, id]
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

exports.updateProduto = async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, descricao, preco_venda, custo, quantidade_estoque, categoria } = req.body;

        const produtoAtualizado = await pool.query(
            `UPDATE produtos SET 
                nome = $1, descricao = $2, preco_venda = $3, custo = $4, 
                quantidade_estoque = $5, categoria = $6 
             WHERE id_produto = $7 RETURNING *`,
            [nome, descricao, preco_venda, custo, quantidade_estoque, categoria, id]
        );

        if (produtoAtualizado.rowCount === 0) {
            return res.status(404).json({ message: 'Produto não encontrado.' });
        }

        res.status(200).json(produtoAtualizado.rows[0]);
    } catch (error) {
        console.error("Erro ao atualizar produto:", error);
        res.status(500).json({ message: 'Erro no servidor.', error: error.message });
    }
};