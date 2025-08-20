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
        const { nome, email, cpf, telefone, endereco } = req.body;

        if (!nome || !email || !cpf || !telefone || !endereco) {
            return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
        }

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