const pool = require('../config/database');

exports.searchClientes = async (req, res) => {
    try {
        const searchTerm = req.query.q || ''; 
        
        const result = await pool.query(
            "SELECT id_cliente, nome FROM clientes WHERE nome ILIKE $1 AND status = 'ativo' LIMIT 10",
            [`%${searchTerm}%`]
        );

        res.status(200).json(result.rows);

    } catch (error) {
        console.error('Erro ao buscar clientes:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};


exports.createCliente = async (req, res) => {
    try {
        let { nome, email, cpf, telefone, endereco } = req.body;

        if (!nome || !email || !cpf || !telefone || !endereco) {
            return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
        }

        if (cpf) cpf = cpf.replace(/[^\d]/g, "");

        if (telefone) telefone = telefone.replace(/[^\d]/g, "");

        const novoClienteQuery = await pool.query(
            `INSERT INTO clientes (nome, email, cpf, telefone, endereco) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING id_cliente, nome`,
            [nome, email, cpf, telefone, endereco]
        );

        const clienteSalvo = novoClienteQuery.rows[0];

        res.status(201).json({ message: 'Cliente cadastrado com sucesso!', cliente: clienteSalvo });

    } catch (error) {
        console.error('Erro ao criar cliente:', error);
        if (error.code === '23505') {
            return res.status(409).json({ message: 'Já existe um cliente com este CPF ou Email.' });
        }
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};

exports.listarClientes = async (req, res) => {
    try {
        const { nome, status } = req.query;

        let query = 'SELECT * FROM clientes';
        const params = [];
        const conditions = [];

        if (nome) {
            params.push(`%${nome}%`);
            conditions.push(`nome ILIKE $${params.length}`);
        }
        if (status) {
            params.push(status);
            conditions.push(`status = $${params.length}`);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        
        query += ' ORDER BY nome ASC';

        const result = await pool.query(query, params);
        res.status(200).json(result.rows);

    } catch (error) {
        console.error('Erro ao listar clientes:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};

exports.updateStatusCliente = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; 

        if (status !== 'ativo' && status !== 'inativo') {
            return res.status(400).json({ message: "Status inválido. Use 'ativo' ou 'inativo'." });
        }

        const result = await pool.query(
            'UPDATE clientes SET status = $1 WHERE id_cliente = $2 RETURNING *',
            [status, id]
        );

        if (result.rowCount === 0) return res.status(404).json({ message: 'Cliente não encontrado.' });

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar status do cliente:', error);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};

exports.getClienteDetalhes = async (req, res) => {
    try {
        const { id } = req.params; // Pega o ID do cliente da URL

        const result = await pool.query('SELECT * FROM clientes WHERE id_cliente = $1', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Cliente não encontrado.' });
        }

        res.status(200).json(result.rows[0]);

    } catch (error) {
        console.error('Erro ao buscar detalhes do cliente:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};

exports.updateCliente = async (req, res) => {
    try {
        const { id } = req.params;
        let { nome, email, cpf, telefone, endereco } = req.body;

        if (!nome || !email || !cpf || !telefone || !endereco) {
            return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
        }

        if (cpf) cpf = cpf.replace(/[^\d]/g, "");
        if (telefone) telefone = telefone.replace(/[^\d]/g, "");

        const result = await pool.query(
            `UPDATE clientes SET nome = $1, email = $2, cpf = $3, telefone = $4, endereco = $5
             WHERE id_cliente = $6 RETURNING *`,
            [nome, email, cpf, telefone, endereco, id]
        );

        if (result.rowCount === 0) return res.status(404).json({ message: 'Cliente não encontrado.' });
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error("Erro ao atualizar cliente:", error);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};