const pool = require('../config/database');

exports.getDashboardData = async (req, res) => {
    try {
        const [
            kpiData,
            vendasPorMesData,
            ultimasVendasData,
            tiposDeProdutosData
        ] = await Promise.all([
            pool.query(`
                SELECT
                    (SELECT COUNT(*) FROM produtos) AS total_produtos,
                    (SELECT COUNT(*) FROM vendas) AS numero_vendas,
                    (SELECT COUNT(*) FROM vendas WHERE status_pagamento = 'pendente') AS pagamentos_pendentes
            `),
            pool.query(`
                SELECT 
                    TO_CHAR(data_venda, 'Mon') AS mes,
                    COUNT(*) AS quantidade
                FROM vendas
                WHERE EXTRACT(YEAR FROM data_venda) = EXTRACT(YEAR FROM CURRENT_DATE)
                GROUP BY mes
                ORDER BY TO_DATE(mes, 'Mon')
            `),
            pool.query(`
                SELECT
                    c.nome AS cliente,
                    v.data_venda AS data,
                    v.valor_total AS valor,
                    v.status_pagamento AS status
                FROM vendas v
                JOIN clientes c ON v.id_cliente = c.id_cliente
                ORDER BY v.data_venda DESC
                LIMIT 5
            `),
            pool.query(`
                SELECT categoria, COUNT(*) AS contagem
                FROM produtos
                GROUP BY categoria
            `)
        ]);

        const kpis = {
            totalProdutos: kpiData.rows[0].total_produtos || 0,
            numeroVendas: kpiData.rows[0].numero_vendas || 0,
            comparadoMesPassado: 77, // Mock
            pagamentosPendentes: kpiData.rows[0].pagamentos_pendentes || 0,
        };

        const meses = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const vendasPorMes = meses.map(mes => {
            const vendaDoMes = vendasPorMesData.rows.find(row => row.mes.trim() === mes);
            return {
                mes: mes,
                quantidade: vendaDoMes ? parseInt(vendaDoMes.quantidade) : 0,
                valor: vendaDoMes ? parseInt(vendaDoMes.quantidade) * 150 : 0, 
            };
        });

        const ultimasVendas = ultimasVendasData.rows.map(venda => ({
            cliente: venda.cliente,
            data: new Date(venda.data).toLocaleDateDateString('pt-BR'),
            valor: parseFloat(venda.valor),
            status: venda.status
        }));

        const totalProdutosContagem = tiposDeProdutosData.rows.reduce((acc, curr) => acc + parseInt(curr.contagem), 0);
        const tiposDeProdutos = tiposDeProdutosData.rows.map(produto => ({
            tipo: produto.categoria,
            percentual: totalProdutosContagem > 0 ? (parseInt(produto.contagem) / totalProdutosContagem) * 100 : 0
        }));

        const dashboardData = { kpis, vendasPorMes, ultimasVendas, tiposDeProdutos };

        res.status(200).json(dashboardData);

    } catch (error) {
        console.error("Erro ao buscar dados do dashboard no banco:", error);
        res.status(500).json({ message: "Erro interno no servidor ao consultar o banco de dados." });
    }
};