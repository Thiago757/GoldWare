const pool = require('../config/database');

exports.listarFornecedores = async (req, res) => {
    try {
        const { nome, cnpj, status } = req.query;
        let query = 'SELECT * FROM fornecedores WHERE 1=1';
        const values = [];
        let count = 1;

        if (nome) {
            query += ` AND nome ILIKE $${count}`;
            values.push(`%${nome}%`);
            count++;
        }

        if (cnpj) {
            const cnpjLimpo = cnpj.replace(/[^\d]/g, "");
            // Atenção: no banco a coluna é cpf_cnpj
            query += ` AND cpf_cnpj LIKE $${count}`;
            values.push(`%${cnpjLimpo}%`);
            count++;
        }

        if (status) {
            query += ` AND status = $${count}`;
            values.push(status);
            count++;
        }

        query += ' ORDER BY nome ASC';

        const result = await pool.query(query, values);
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao listar fornecedores:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

exports.obterFornecedor = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM fornecedores WHERE id_fornecedor = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Fornecedor não encontrado' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao obter fornecedor:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

exports.criarFornecedor = async (req, res) => {
    // Pegamos os campos do body (FRONTEND)
    const { 
        nome, 
        cnpj, 
        telefone, 
        email, 
        cep, 
        logradouro, 
        numero, 
        complemento, 
        bairro, 
        id_cidade, 
        responsavel 
    } = req.body;

    try {
        const query = `
            INSERT INTO fornecedores (
                nome, 
                cpf_cnpj, 
                telefone, 
                email, 
                cep, 
                logradouro, 
                numero, 
                complemento, 
                bairro, 
                id_cidade, 
                responsavel
            ) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
            RETURNING *
        `;
        
        const values = [
            nome, 
            cnpj, // Vai para cpf_cnpj
            telefone, 
            email, 
            cep, 
            logradouro, 
            numero, 
            complemento, 
            bairro, 
            id_cidade, 
            responsavel
        ];

        const novoFornecedor = await pool.query(query, values);
        res.status(201).json(novoFornecedor.rows[0]);

    } catch (error) {
        if (error.code === '23505') { 
            return res.status(400).json({ error: 'CNPJ já cadastrado.' });
        }
        console.error('Erro ao criar fornecedor:', error);
        res.status(500).json({ error: 'Erro ao criar fornecedor: ' + error.message });
    }
};

exports.atualizarFornecedor = async (req, res) => {
     const { id } = req.params;
     const { 
        nome, 
        cnpj, 
        telefone, 
        email, 
        cep, 
        logradouro, 
        numero, 
        complemento, 
        bairro, 
        id_cidade, 
        responsavel 
    } = req.body;

     try {
        const query = `
            UPDATE fornecedores SET 
                nome = $1, 
                cpf_cnpj = $2, 
                telefone = $3, 
                email = $4, 
                cep = $5, 
                logradouro = $6, 
                numero = $7, 
                complemento = $8, 
                bairro = $9, 
                id_cidade = $10, 
                responsavel = $11
            WHERE id_fornecedor = $12 
            RETURNING *
        `;
        
        const values = [
            nome, cnpj, telefone, email, cep, logradouro, numero, complemento, bairro, id_cidade, responsavel, id
        ];

        const atualizado = await pool.query(query, values);
        res.json(atualizado.rows[0]);
     } catch (error) {
         console.error('Erro ao atualizar:', error);
         res.status(500).json({ error: 'Erro ao atualizar fornecedor' });
     }
};

exports.atualizarStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        await pool.query('UPDATE fornecedores SET status = $1 WHERE id_fornecedor = $2', [status, id]);
        res.sendStatus(204);
    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        res.status(500).json({ error: 'Erro ao atualizar status' });
    }
};