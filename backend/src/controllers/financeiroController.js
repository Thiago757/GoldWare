const pool = require('../config/database');

// 1. LISTAR EXTRATO (O que estava faltando/dando erro)
exports.listarExtrato = async (req, res) => {
    try {
        const { startDate, endDate, contaId } = req.query;
        
        const params = [];
        const conditions = [];
        
        // Query base unindo movimentações com dados da conta
        let query = `
            SELECT 
                mf.*,
                cb.nome_conta,
                cb.banco
            FROM movimentacoes_financeiras mf
            JOIN contas_bancarias cb ON mf.id_conta_bancaria = cb.id_conta_bancaria
        `;

        // Filtros Dinâmicos
        if (contaId) {
            params.push(contaId);
            conditions.push(`mf.id_conta_bancaria = $${params.length}`);
        }
        if (startDate) {
            params.push(startDate);
            conditions.push(`mf.data_movimentacao >= $${params.length}`);
        }
        if (endDate) {
            params.push(endDate);
            conditions.push(`mf.data_movimentacao <= $${params.length}`);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY mf.data_movimentacao DESC'; // Mais recentes primeiro

        const { rows } = await pool.query(query, params);
        res.status(200).json(rows);

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Erro ao buscar extrato.' });
    }
};

// 2. LISTAR CONTAS BANCÁRIAS
exports.listarContasBancarias = async (req, res) => {
    try {
        const { rows } = await pool.query("SELECT * FROM contas_bancarias WHERE ativo = 'S' ORDER BY nome_conta");
        res.status(200).json(rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};

// 3. LISTAR FORMAS DE PAGAMENTO
exports.listarFormasPagamento = async (req, res) => {
    try {
        const { rows } = await pool.query("SELECT * FROM formas_pagamento WHERE ativo = 'S' ORDER BY nome");
        res.status(200).json(rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};

// 4. CRIAR CONTA BANCÁRIA
exports.criarContaBancaria = async (req, res) => {
    const { nome_conta, banco, agencia, numero_conta, saldo_inicial } = req.body;

    if (!nome_conta || !banco) {
        return res.status(400).json({ message: 'Nome da conta e Banco são obrigatórios.' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO contas_bancarias 
            (nome_conta, banco, agencia, numero_conta, saldo, ativo) 
            VALUES ($1, $2, $3, $4, $5, 'S') 
            RETURNING *`,
            [nome_conta, banco, agencia, numero_conta, saldo_inicial || 0]
        );

        res.status(201).json({ message: 'Conta cadastrada com sucesso!', conta: result.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Erro ao cadastrar conta bancária.' });
    }
};

// 5. CRIAR FORMA DE PAGAMENTO
exports.criarFormaPagamento = async (req, res) => {
    const { nome } = req.body;

    if (!nome) {
        return res.status(400).json({ message: 'O nome da forma de pagamento é obrigatório.' });
    }

    try {
        const result = await pool.query(
            "INSERT INTO formas_pagamento (nome, ativo) VALUES ($1, 'S') RETURNING *",
            [nome]
        );

        res.status(201).json({ message: 'Forma de pagamento cadastrada!', forma: result.rows[0] });
    } catch (err) {
        console.error(err.message);
        if (err.code === '23505') { 
            return res.status(400).json({ message: 'Esta forma de pagamento já existe.' });
        }
        res.status(500).json({ message: 'Erro ao cadastrar forma de pagamento.' });
    }
};

// 6. BAIXAR TÍTULO (CRIAR RECEBIMENTO)
exports.criarRecebimento = async (req, res) => {
    const { id_conta_receber, valor_recebido, data_recebimento, id_conta_bancaria, id_forma_pagamento } = req.body;

    if (!id_conta_receber || !valor_recebido || !data_recebimento || !id_conta_bancaria || !id_forma_pagamento) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Insere no log de recebimentos
        const insertQuery = `
            INSERT INTO recebimento_venda 
            (id_conta_receber, id_conta_bancaria, id_forma_pagamento, valor_recebido, data_recebimento)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        await client.query(insertQuery, [id_conta_receber, id_conta_bancaria, id_forma_pagamento, valor_recebido, data_recebimento]);

        // Atualiza o valor recebido na tabela principal
        const updateQuery = `
            UPDATE contas_a_receber
            SET valor_recebido = valor_recebido + $1
            WHERE id_conta_receber = $2
            RETURNING valor_recebido, valor_parcela
        `;
        const { rows } = await client.query(updateQuery, [valor_recebido, id_conta_receber]);
        const { valor_recebido: novoValorRecebido, valor_parcela } = rows[0];

        // Atualiza o STATUS
        let novoStatus = 'parcial';
        if (Number(novoValorRecebido) >= Number(valor_parcela)) {
            novoStatus = 'pago'; 
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

// 7. ESTORNAR RECEBIMENTO (REABRIR)
exports.estornarRecebimento = async (req, res) => {
    const { id } = req.params; // ID da conta a receber

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const pagamentosQuery = await client.query(
            "SELECT id_recebimento, id_conta_bancaria, valor_recebido FROM recebimento_venda WHERE id_conta_receber = $1",
            [id]
        );

        for (let pgto of pagamentosQuery.rows) {
            // Devolve o dinheiro da conta
            await client.query(
                "UPDATE contas_bancarias SET saldo = saldo - $1 WHERE id_conta_bancaria = $2",
                [pgto.valor_recebido, pgto.id_conta_bancaria]
            );
            // Remove do extrato primeiro
            await client.query(
                "DELETE FROM movimentacoes_financeiras WHERE id_recebimento_venda = $1",
                [pgto.id_recebimento]
            );
        }

        // Remove o log de recebimento
        await client.query("DELETE FROM recebimento_venda WHERE id_conta_receber = $1", [id]);

        // Reseta o título para 'pendente'
        await client.query(
            "UPDATE contas_a_receber SET status = 'pendente', valor_recebido = 0, data_pagamento = NULL WHERE id_conta_receber = $1",
            [id]
        );

        await client.query('COMMIT');
        res.status(200).json({ message: 'Título reaberto e valores estornados com sucesso.' });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err.message);
        res.status(500).json({ message: 'Erro ao reabrir título.' });
    } finally {
        client.release();
    }
};