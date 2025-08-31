const pool = require('../config/database');

exports.getSumarioContasAReceber = async (req, res) => {
    try {
        const { nome, cpf } = req.query;

        let query = `
            SELECT
                c.id_cliente,
                c.nome AS nome_cliente,
                c.cpf,
                SUM(cr.valor_parcela) AS valor_pendente,
                MIN(cr.data_vencimento) as proximo_vencimento,
                CASE
                    WHEN COUNT(*) FILTER (WHERE cr.data_vencimento < CURRENT_DATE AND cr.status = 'pendente') > 0 THEN 'Atrasado'
                    WHEN COUNT(*) FILTER (WHERE cr.status = 'pendente') > 0 THEN 'Pendente'
                    ELSE 'Pago' -- Se não houver pendentes nem atrasadas, está tudo pago
                END AS status_geral

            FROM contas_a_receber cr
            JOIN clientes c ON cr.id_cliente = c.id_cliente
        `;
        
        const params = [];
        const conditions = [];

        if (nome) {
            params.push(`%${nome}%`);
            conditions.push(`c.nome ILIKE $${params.length}`);
        }
        if (cpf) {
            params.push(`${cpf.replace(/[^\d]/g, "")}%`);
            conditions.push(`c.cpf LIKE $${params.length}`);
        }
        
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ` GROUP BY c.id_cliente, c.nome, c.cpf ORDER BY status_geral DESC, valor_pendente DESC`;

        const result = await pool.query(query, params);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Erro ao buscar sumário de contas:", error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};

exports.marcarParcelaComoPaga = async (req, res) => {
    try {
        const { idConta } = req.params;
        const result = await pool.query(
            "UPDATE contas_a_receber SET status = 'pago', data_pagamento = CURRENT_DATE WHERE id_conta = $1 RETURNING *",
            [idConta]
        );
        if (result.rowCount === 0) return res.status(404).json({ message: 'Parcela não encontrada.' });
        res.status(200).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};

exports.listarContas = async (req, res) => {
    try {
        const { nomeCliente, status, startDate, endDate } = req.query;

        let query = `
            SELECT 
                car.id_conta, v.id_venda, car.numero_parcela, car.total_parcelas,
                car.valor_parcela, car.data_vencimento, car.data_pagamento,
                CASE
                    WHEN COUNT(*) FILTER (WHERE cr.data_vencimento < CURRENT_DATE AND cr.status = 'pendente') > 0 THEN 'Atrasado'
                    WHEN COUNT(*) FILTER (WHERE cr.status = 'pendente') > 0 THEN 'Pendente'
                    ELSE 'Pago' -- Se não houver pendentes nem atrasadas, está tudo pago
                END AS status,
                c.nome AS nome_cliente
            FROM vendas v
            JOIN clientes c ON car.id_cliente = c.id_cliente
        `;
        
        const params = [];
        const conditions = [];

        if (nomeCliente) {
            params.push(`%${nomeCliente}%`);
            conditions.push(`c.nome ILIKE $${params.length}`);
        }
        if (status) {
            if (status === 'atrasado') {
                conditions.push(`car.status = 'pendente' AND car.data_vencimento < CURRENT_DATE`);
            } else {
                params.push(status);
                conditions.push(`car.status = $${params.length}`);
            }
        }
        if (startDate) {
            params.push(startDate);
            conditions.push(`car.data_vencimento >= $${params.length}`);
        }
        if (endDate) {
            params.push(endDate);
            conditions.push(`car.data_vencimento <= $${params.length}`);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        
        query += ' ORDER BY car.data_vencimento ASC';

        const result = await pool.query(query, params);
        res.status(200).json(result.rows);

    } catch (error) {
        console.error("Erro ao listar contas:", error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};

exports.getDetalhesCliente = async (req, res) => {
    try {
        const { idCliente } = req.params;
        const result = await pool.query(`
            SELECT *, CASE WHEN status = 'pendente' AND data_vencimento < CURRENT_DATE THEN 'atrasado' ELSE status END as status
            FROM contas_a_receber 
            WHERE id_cliente = $1 
            ORDER BY data_vencimento ASC
        `, [idCliente]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Erro ao buscar detalhes do cliente:", error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};

exports.getKpisFinanceiros = async (req, res) => {
    try {
        const { startDate, endDate, status } = req.query;
        
        let queryReceber = "SELECT SUM(valor_parcela) FROM contas_a_receber WHERE status = 'pendente'";
        let queryAtrasado = "SELECT SUM(valor_parcela) FROM contas_a_receber WHERE status = 'pendente' AND data_vencimento < CURRENT_DATE";
        let queryRecebido = "SELECT SUM(valor_parcela) FROM contas_a_receber WHERE status = 'pago'";
        
        const params = [];
        if (startDate) {
            params.push(startDate);
            queryRecebido += ` AND data_pagamento >= $${params.length}`;
        }
        if (endDate) {
            params.push(endDate);
            queryRecebido += ` AND data_pagamento <= $${params.length}`;
        }
        
        const [aReceberResult, recebidoResult, atrasadoResult] = await Promise.all([
            pool.query(queryReceber),
            pool.query(queryRecebido, params),
            pool.query(queryAtrasado)
        ]);

        const kpis = {
            aReceber: aReceberResult.rows[0].sum || 0,
            recebido: recebidoResult.rows[0].sum || 0,
            atrasado: atrasadoResult.rows[0].sum || 0,
        };

        res.status(200).json(kpis);
    } catch (error) {
        console.error("Erro ao buscar KPIs financeiros:", error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};

exports.getExtratoFinanceiro = async (req, res) => {
    try {
        const { nome, cpf, status } = req.query;

        const query = `
            -- Parte 1: Busca as VENDAS À VISTA (não-crédito)
            SELECT
                v.id_venda AS transacao_id,
                'venda' AS tipo,
                v.data_venda AS data_evento,
                c.nome AS nome_cliente,
                v.valor_total,
                v.status_pagamento AS status
            FROM vendas v
            JOIN clientes c ON v.id_cliente = c.id_cliente
            WHERE v.id_venda NOT IN (SELECT id_venda FROM contas_a_receber)

            UNION ALL

            -- Parte 2: Busca as PARCELAS individuais das vendas a crédito
            SELECT
                cr.id_conta AS transacao_id,
                'parcela' AS tipo,
                cr.data_vencimento AS data_evento,
                c.nome AS nome_cliente,
                cr.valor_parcela AS valor_total,
                CASE 
                    WHEN cr.status = 'pendente' AND cr.data_vencimento < CURRENT_DATE THEN 'atrasado'
                    ELSE cr.status
                END AS status
            FROM contas_a_receber cr
            JOIN clientes c ON cr.id_cliente = c.id_cliente
            
            ORDER BY data_evento DESC;
        `;
        
        const result = await pool.query(query);
        res.status(200).json(result.rows);

    } catch (error) {
        console.error("Erro ao buscar extrato financeiro:", error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};