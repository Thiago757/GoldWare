const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const bcrypt = require('bcryptjs');

// GET: Buscar dados do perfil pelo ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    
    // Validação básica
    if (!id || id === 'undefined' || id === 'null') {
        return res.status(400).json({ message: 'ID de utilizador inválido.' });
    }

    try {
        const result = await pool.query(
            'SELECT id_usuario, nome, email, tipo, data_criacao FROM usuarios WHERE id_usuario = $1',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Utilizador não encontrado.' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao buscar perfil:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
});

// PUT: Atualizar perfil (Apenas Nome, Email e Senha)
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { nome, email, senha } = req.body; // NÃO pegamos 'tipo' aqui por segurança

    try {
        // Começa a query apenas com nome e email
        let query = 'UPDATE usuarios SET nome = $1, email = $2';
        let values = [nome, email];
        let count = 3; // O próximo índice será $3 (pois já usámos 1 e 2)

        // Se a senha foi enviada, adiciona ao SQL
        if (senha && senha.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            const senhaHash = await bcrypt.hash(senha, salt);
            
            query += `, senha_hash = $${count}`; // Adiciona a senha na query
            values.push(senhaHash);
            count++;
        }

        // Adiciona o WHERE no final usando o contador correto
        query += ` WHERE id_usuario = $${count} RETURNING id_usuario, nome, email, tipo`;
        values.push(id);

        const updatedUser = await pool.query(query, values);

        if (updatedUser.rows.length === 0) {
            return res.status(404).json({ message: 'Utilizador não encontrado.' });
        }

        res.json(updatedUser.rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        res.status(500).json({ message: 'Erro interno.' });
    }
});

module.exports = router;