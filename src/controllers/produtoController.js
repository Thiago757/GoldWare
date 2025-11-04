const pool = require('../config/database');
const generateEAN13 = require('../utils/barcodeGenerator');
const fs = require('fs').promises;
const path = require('path'); 
const PDFDocument = require('pdfkit');
const bwipjs = require('bwip-js');

exports.listarProdutos = async (req, res) => {
    try {
        const { searchTerm, ativo, codigo_barras } = req.query; 

        let query = 'SELECT * FROM produtos';
        const params = [];
        const conditions = [];

        if (searchTerm) {
            if (!isNaN(searchTerm.replace(/[^\d]/g, ""))) {
                params.push(`%${searchTerm}%`);
                params.push(`%${searchTerm}%`);
                conditions.push(`(nome ILIKE $1 OR codigo_barras LIKE $2)`);
            } else {
                params.push(`%${searchTerm}%`);
                conditions.push(`nome ILIKE $1`);
            }
        }

        if (ativo) {
            params.push(ativo);
            conditions.push(`ativo = $${params.length}`);
        }

        if (codigo_barras) {
            params.push(`${codigo_barras}%`);
            conditions.push(`codigo_barras LIKE $${params.length}`);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        
        query += ' ORDER BY nome ASC';

        const result = await pool.query(query, params);
        res.status(200).json(result.rows);

    } catch (error) {
        console.error("Erro ao listar produtos:", error);
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
        const { nome, descricao, preco_venda, custo, quantidade_estoque, id_categoria } = req.body;
        
        let imageUrl = null;
        if (req.file) {
            imageUrl = `/uploads/${req.file.filename}`;
        }

        const codigo_barras = generateEAN13();

        const novoProduto = await pool.query(
            `INSERT INTO produtos (nome, descricao, preco_venda, custo, quantidade_estoque, id_categoria, codigo_barras, imagem_url) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [nome, descricao, preco_venda, custo, quantidade_estoque, id_categoria, codigo_barras, imageUrl]
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
        const { nome, descricao, preco_venda, custo, quantidade_estoque, id_categoria } = req.body;

        const produtoAtualizado = await pool.query(
            `UPDATE produtos SET 
                nome = $1, descricao = $2, preco_venda = $3, custo = $4, 
                quantidade_estoque = $5, id_categoria = $6 
             WHERE id_produto = $7 RETURNING *`,
            [nome, descricao, preco_venda, custo, quantidade_estoque, id_categoria, id]
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

exports.exportarCodigosDeBarras = async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT nome, codigo_barras FROM produtos WHERE ativo = 'S' AND codigo_barras IS NOT NULL ORDER BY nome"
        );
        const produtos = result.rows;

        if (produtos.length === 0) {
            return res.status(404).send('Nenhum produto com código de barras encontrado para exportar.');
        }

        const doc = new PDFDocument({
            size: 'A4',
            margin: 50,
            layout: 'portrait'
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=codigos_de_barras.pdf');
        doc.pipe(res);
        doc.fontSize(16).text('Etiquetas de Código de Barras', { align: 'center' });
        doc.moveDown(2);

        for (const produto of produtos) {
            try {
                const png = await bwipjs.toBuffer({
                    bcid: 'ean13', 
                    text: produto.codigo_barras,
                    scale: 3,
                    height: 10,
                    includetext: true,
                    textxalign: 'center',
                });

                doc.fontSize(10).text(produto.nome, { width: 410, ellipsis: true });
                doc.image(png, { width: 150 });
                doc.moveDown(1.5);

            } catch (err) {
                console.error(`Erro ao gerar código de barras para ${produto.nome}:`, err);
                doc.fontSize(8).fillColor('red').text(`Erro ao gerar código para: ${produto.nome}`);
                doc.fillColor('black');
            }
        }

        doc.end();

    } catch (error) {
        console.error("Erro ao exportar códigos de barras:", error);
        res.status(500).send('Erro interno no servidor ao gerar o PDF.');
    }
};