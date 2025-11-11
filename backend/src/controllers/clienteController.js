const pool = require('../config/database'); // Você usa '../config/database', está perfeito

// Função não modificada - já estava ótima
exports.searchClientes = async (req, res) => {
    try {
        const searchTerm = req.query.q || '';
        const searchTermNumerico = searchTerm.replace(/[^\d]/g, "");

        let result;
        if (searchTermNumerico.length > 2 && !isNaN(searchTermNumerico)) {
            result = await pool.query(
                "SELECT id_cliente, nome, cpf FROM clientes WHERE cpf LIKE $1 AND status = 'ativo' LIMIT 10",
                [`%${searchTermNumerico}%`]
            );
        } else {
            result = await pool.query(
                "SELECT id_cliente, nome, cpf FROM clientes WHERE nome ILIKE $1 AND status = 'ativo' LIMIT 10",
                [`%${searchTerm}%`]
            );
        }
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar clientes:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};

// --- FUNÇÃO MODIFICADA ---
exports.createCliente = async (req, res) => {
    try {
        // --- MUDANÇA AQUI ---
        // Pegamos todos os campos do novo formulário
        const { 
            nome, email, cpf, telefone, 
            cep, logradouro, numero, complemento, bairro, id_cidade 
        } = req.body;

        // --- MUDANÇA AQUI ---
        // Validamos os novos campos principais
        if (!nome || !email || !cpf || !id_cidade) {
            return res.status(400).json({ message: 'Campos obrigatórios (Nome, Email, CPF, Cidade) estão faltando.' });
        }

        // Suas limpezas de CPF e Telefone (mantidas)
        const cpfLimpo = cpf ? cpf.replace(/[^\d]/g, "") : null;
        const telefoneLimpo = telefone ? telefone.replace(/[^\d]/g, "") : null;

        // --- MUDANÇA AQUI ---
        // Query de INSERT atualizada com todas as colunas de endereço
        // Também adicionamos 'status' e 'data_cadastro' para ser 100% compatível
        // com o seu script de banco de dados (que espera 'status' e tem default).
        const novoClienteQuery = await pool.query(
            `INSERT INTO clientes (nome, email, cpf, telefone, cep, logradouro, numero, complemento, bairro, id_cidade, status, data_cadastro)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'ativo', CURRENT_TIMESTAMP)
             RETURNING *`, // Mudado para RETURNING * para enviar o cliente completo ao frontend
            [nome, email, cpfLimpo, telefoneLimpo, cep, logradouro, numero, complemento, bairro, id_cidade]
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

// Função não modificada - já estava ótima
exports.listarClientes = async (req, res) => {
    try {
        const { nome, cpf, status } = req.query;

        let query = 'SELECT * FROM clientes';
        const params = [];
        const conditions = [];

        if (nome) {
            params.push(`%${nome}%`);
            conditions.push(`nome ILIKE $${params.length}`);
        }
        if (cpf) {
            params.push(cpf.replace(/[^\d]/g, "") + '%');
            conditions.push(`cpf LIKE $${params.length}`);
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

// Função não modificada - já estava ótima
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

// Função não modificada - já estava ótima
exports.getClienteDetalhes = async (req, res) => {
    try {
        const { id } = req.params; 

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

// --- FUNÇÃO MODIFICADA ---
exports.updateCliente = async (req, res) => {
    try {
        const { id } = req.params;
        
        // --- MUDANÇA AQUI ---
        // Pegamos todos os campos do novo formulário
        const { 
            nome, email, cpf, telefone, 
            cep, logradouro, numero, complemento, bairro, id_cidade 
        } = req.body;

        // --- MUDANÇA AQUI ---
        // Validamos os novos campos principais
        if (!nome || !email || !cpf || !id_cidade) {
            return res.status(400).json({ message: 'Campos obrigatórios (Nome, Email, CPF, Cidade) estão faltando.' });
        }

        // Suas limpezas de CPF e Telefone (mantidas)
        const cpfLimpo = cpf ? cpf.replace(/[^\d]/g, "") : null;
        const telefoneLimpo = telefone ? telefone.replace(/[^\d]/g, "") : null;

        // --- MUDANÇA AQUI ---
        // Query de UPDATE atualizada com todas as colunas de endereço
        const result = await pool.query(
            `UPDATE clientes 
             SET nome = $1, email = $2, cpf = $3, telefone = $4, cep = $5, 
                 logradouro = $6, numero = $7, complemento = $8, bairro = $9, id_cidade = $10
             WHERE id_cliente = $11 RETURNING *`,
            [nome, email, cpfLimpo, telefoneLimpo, cep, logradouro, numero, complemento, bairro, id_cidade, id]
        );

        if (result.rowCount === 0) return res.status(404).json({ message: 'Cliente não encontrado.' });
        res.status(200).json(result.rows[0]);

    } catch (error) {
        console.error("Erro ao atualizar cliente:", error);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};