const express = require('express');
const router = express.Router();
const pool = require('../config/database');
router.get('/minha-loja', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM configuracoes_loja LIMIT 1');
        
        if (result.rows.length === 0) {
            return res.json({}); 
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao buscar dados da loja:', error);
        res.status(500).json({ message: 'Erro interno.' });
    }
});

router.put('/minha-loja', async (req, res) => {
    const { nome_loja, cnpj, endereco, telefone, email_contato } = req.body;

    try {
        const result = await pool.query(
            `UPDATE configuracoes_loja 
             SET nome_loja = $1, cnpj = $2, endereco = $3, telefone = $4, email_contato = $5
             WHERE id = (SELECT id FROM configuracoes_loja LIMIT 1)
             RETURNING *`,
            [nome_loja, cnpj, endereco, telefone, email_contato]
        );
        if (result.rows.length === 0) {
            const insert = await pool.query(
                `INSERT INTO configuracoes_loja (nome_loja, cnpj, endereco, telefone, email_contato)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING *`,
                [nome_loja, cnpj, endereco, telefone, email_contato]
            );
            return res.json(insert.rows[0]);
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar dados da loja:', error);
        res.status(500).json({ message: 'Erro interno.' });
    }
});

module.exports = router;