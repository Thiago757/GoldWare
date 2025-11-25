const pool = require('../config/database'); // Importando sua conexão

exports.listarContasReceber = async (req, res) => {
    try {
        // 1. Pega todos os parâmetros da URL (ex: /api/receber?status=pendente)
        const { 
            status, 
            clienteId, 
            emissaoStartDate, 
            emissaoEndDate, 
            vencimentoStartDate, 
            vencimentoEndDate 
        } = req.query;

        // 2. Monta a query SQL dinamicamente
        let params = []; // Array para guardar os valores (evita SQL Injection)
        let conditions = []; // Array para guardar as condições WHERE

        // Query base com o JOIN para buscar o nome do cliente
        let query = `
            SELECT 
                cr.id_conta_receber, 
                cr.id_venda, 
                cr.id_os, 
                cr.id_cliente,
                cr.valor_parcela, 
                cr.valor_recebido, 
                cr.data_vencimento,
                cr.data_emissao, -- Precisamos disso para o filtro de emissão
                cr.status,
                c.nome AS nome_cliente 
            FROM 
                contas_a_receber cr
            LEFT JOIN 
                clientes c ON cr.id_cliente = c.id_cliente
        `;
        
        // 3. Adiciona os filtros dinamicamente
        
        // --- Lógica de Status ---
        if (status) {
            // TRADUÇÃO IMPORTANTE: 
            // Seu frontend pode enviar "aberto", mas o banco entende "pendente" e "atrasado".
            if (status === 'aberto') {
                conditions.push(`cr.status IN ('pendente', 'atrasado')`);
            } else {
                // Para 'pago', 'cancelado', 'parcial', etc.
                params.push(status);
                conditions.push(`cr.status = $${params.length}`);
            }
        }

        // --- Lógica de Cliente ---
        if (clienteId) {
            params.push(clienteId);
            conditions.push(`cr.id_cliente = $${params.length}`);
        }

        // --- Lógica de Data de Emissão ---
        if (emissaoStartDate) {
            params.push(emissaoStartDate);
            conditions.push(`cr.data_emissao >= $${params.length}`);
        }
        if (emissaoEndDate) {
            params.push(emissaoEndDate);
            conditions.push(`cr.data_emissao <= $${params.length}`);
        }

        // --- Lógica de Data de Vencimento ---
        if (vencimentoStartDate) {
            params.push(vencimentoStartDate);
            conditions.push(`cr.data_vencimento >= $${params.length}`);
        }
        if (vencimentoEndDate) {
            params.push(vencimentoEndDate);
            conditions.push(`cr.data_vencimento <= $${params.length}`);
        }

        // 4. Constrói a cláusula WHERE final
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        // 5. Adiciona ordenação (ex: mais antigos primeiro)
        query += ' ORDER BY cr.data_vencimento ASC';

        // 6. Executa a query
        const { rows } = await pool.query(query, params);
        
        res.status(200).json(rows);

    } catch (err) {
        console.error("Erro ao listar contas a receber:", err.message);
        res.status(500).json({ message: 'Erro no servidor ao buscar contas a receber.' });
    }
};