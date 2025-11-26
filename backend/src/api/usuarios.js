const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const bcrypt = require('bcryptjs');

// GET: Listar todos os usuários
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id_usuario, nome, email, tipo, data_criacao FROM usuarios ORDER BY id_usuario ASC'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        res.status(500).json({ message: 'Erro interno.' });
    }
});

// POST: Criar novo usuário
router.post('/', async (req, res) => {
    const { nome, email, senha, tipo } = req.body;

    if (!nome || !email || !senha || !tipo) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
    }

    try {
        const userExists = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: 'Este email já está cadastrado.' });
        }

        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(senha, salt);

        const newUser = await pool.query(
            'INSERT INTO usuarios (nome, email, senha_hash, tipo) VALUES ($1, $2, $3, $4) RETURNING id_usuario, nome, email, tipo',
            [nome, email, senhaHash, tipo]
        );

        res.status(201).json(newUser.rows[0]);
    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        res.status(500).json({ message: 'Erro interno.' });
    }
});

// PUT: Editar usuário
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { nome, email, tipo, senha } = req.body;

    try {
        let query = 'UPDATE usuarios SET nome = $1, email = $2, tipo = $3';
        let values = [nome, email, tipo];
        let count = 4;

        if (senha && senha.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            const senhaHash = await bcrypt.hash(senha, salt);
            query += `, senha_hash = $${count}`;
            values.push(senhaHash);
            count++;
        }

        query += ` WHERE id_usuario = $${count} RETURNING id_usuario, nome, email, tipo`;
        values.push(id);

        const updatedUser = await pool.query(query, values);

        if (updatedUser.rows.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        res.json(updatedUser.rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        res.status(500).json({ message: 'Erro interno.' });
    }
});

// DELETE: Excluir usuário
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM usuarios WHERE id_usuario = $1', [id]);
        res.json({ message: 'Usuário excluído com sucesso.' });
    } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        res.status(500).json({ message: 'Erro interno.' });
    }
});

module.exports = router;