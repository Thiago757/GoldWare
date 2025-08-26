const pool = require('../config/database');

exports.getSumarioContasAReceber = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                c.id_cliente, c.nome AS nome_cliente,
                SUM(cr.valor_parcela) AS valor_pendente,
                COUNT(*) FILTER (WHERE cr.data_vencimento < CURRENT_DATE AND cr.status = 'pendente') AS parcelas_atrasadas
            FROM contas_a_receber cr
            JOIN clientes c ON cr.id_cliente = c.id_cliente
            WHERE cr.status = 'pendente'
            GROUP BY c.id_cliente, c.nome
            ORDER BY valor_pendente DESC
        `);
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};

exports.getDetalhesCliente = async (req, res) => {
    try {
        const { idCliente } = req.params;
        const result = await pool.query(`
            SELECT * FROM contas_a_receber 
            WHERE id_cliente = $1 
            ORDER BY data_vencimento ASC
        `, [idCliente]);
        res.status(200).json(result.rows);
    } catch (error) {
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
                car.id_conta, car.id_venda, car.numero_parcela, car.total_parcelas,
                car.valor_parcela, car.data_vencimento, car.data_pagamento,
                CASE 
                    WHEN car.status = 'pendente' AND car.data_vencimento < CURRENT_DATE THEN 'atrasado'
                    ELSE car.status
                END AS status,
                c.nome AS nome_cliente
            FROM contas_a_receber car
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
        
        if (startDate && status === 'pago') {
            params.push(startDate);
            conditions.push(`car.data_pagamento >= $${params.length}`);
        } else if (startDate) {
            params.push(startDate);
            conditions.push(`car.data_vencimento >= $${params.length}`);
        }

        if (endDate && status === 'pago') {
            params.push(endDate);
            conditions.push(`car.data_pagamento <= $${params.length}`);
        } else if (endDate) {
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