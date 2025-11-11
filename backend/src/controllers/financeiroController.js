const pool = require('../config/database');

// GET /api/contas-bancarias
exports.listarContasBancarias = async (req, res) => {
    try {
        const { rows } = await pool.query("SELECT * FROM contas_bancarias WHERE ativo = 'S' ORDER BY nome_conta");
        res.status(200).json(rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};

// GET /api/formas-pagamento
exports.listarFormasPagamento = async (req, res) => {
    try {
        const { rows } = await pool.query("SELECT * FROM formas_pagamento WHERE ativo = 'S' ORDER BY nome");
        res.status(200).json(rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};

// POST /api/recebimentos
exports.criarRecebimento = async (req, res) => {
    const { id_conta_receber, valor_recebido, data_recebimento, id_conta_bancaria, id_forma_pagamento } = req.body;

    if (!id_conta_receber || !valor_recebido || !data_recebimento || !id_conta_bancaria || !id_forma_pagamento) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Insere no log de recebimentos (isso acionará seu trigger para atualizar o saldo da conta)
        const insertQuery = `
            INSERT INTO recebimento_venda 
            (id_conta_receber, id_conta_bancaria, id_forma_pagamento, valor_recebido, data_recebimento)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        await client.query(insertQuery, [id_conta_receber, id_conta_bancaria, id_forma_pagamento, valor_recebido, data_recebimento]);

        // 2. Atualiza o valor recebido na tabela principal de 'contas_a_receber'
        const updateQuery = `
            UPDATE contas_a_receber
            SET valor_recebido = valor_recebido + $1
            WHERE id_conta_receber = $2
            RETURNING valor_recebido, valor_parcela
        `;
        const { rows } = await client.query(updateQuery, [valor_recebido, id_conta_receber]);
        const { valor_recebido: novoValorRecebido, valor_parcela } = rows[0];

        // 3. Atualiza o STATUS do título (parcial, pago, etc.)
        let novoStatus = 'parcial';
        if (novoValorRecebido >= valor_parcela) {
            novoStatus = 'pago'; // Ou 'total', como preferir
        }

        await client.query(
            "UPDATE contas_a_receber SET status = $1 WHERE id_conta_receber = $2",
            [novoStatus, id_conta_receber]
        );

        await client.query('COMMIT');
        res.status(201).json({ message: 'Recebimento salvo com sucesso!' });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err.message);
        res.status(500).json({ message: 'Erro no servidor ao processar recebimento.' });
    } finally {
        client.release();
    }
};