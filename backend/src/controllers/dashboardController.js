const pool = require('../config/database');

exports.getDashboardData = async (req, res) => {
  try {
    const [
      kpiData,
      vendasPorMesData,
      ultimasVendasData,
      tiposDeProdutosData,
      vendasMesAtualData,
      vendasMesPassadoData
    ] = await Promise.all([
      // 1. KPIs básicos
      pool.query(`
        SELECT
          (SELECT COUNT(*) FROM produtos) AS total_produtos,
          (SELECT COUNT(*) FROM vendas) AS numero_vendas,
          (SELECT COUNT(*) FROM contas_a_receber WHERE status = 'pendente') AS pagamentos_pendentes
      `),
      // 2. Vendas por mês (para o gráfico)
      pool.query(`
        SELECT 
          TO_CHAR(data_venda, 'Mon') AS mes,
          COUNT(*) AS quantidade,
          COALESCE(SUM(valor_total), 0) AS valor
        FROM vendas
        WHERE EXTRACT(YEAR FROM data_venda) = EXTRACT(YEAR FROM CURRENT_DATE)
        GROUP BY mes
        ORDER BY MIN(data_venda)
      `),
      // 3. Últimas vendas (para a tabela)
      pool.query(`
        SELECT c.nome AS cliente, v.data_venda AS data, v.valor_total AS valor, COALESCE(car.status, 'pago') AS status
        FROM vendas v
        JOIN clientes c ON v.id_cliente = c.id_cliente
        LEFT JOIN contas_a_receber car ON car.id_venda = v.id_venda
        ORDER BY v.data_venda DESC
        LIMIT 5
      `),
      // 4. Tipos de produtos
      pool.query(`
        SELECT cat.nome AS categoria, COUNT(*) AS contagem FROM produtos p
        JOIN categorias cat ON p.id_categoria = cat.id_categoria GROUP BY cat.nome
      `),
      // 5. Dados de vendas do mês atual (valor e quantidade)
      pool.query(`
        SELECT COALESCE(SUM(valor_total), 0) AS valor, COUNT(*) AS quantidade
        FROM vendas WHERE data_venda >= DATE_TRUNC('month', CURRENT_DATE)
      `),
      // 6. Dados de vendas do mês passado (valor e quantidade)
      pool.query(`
        SELECT COALESCE(SUM(valor_total), 0) AS valor, COUNT(*) AS quantidade
        FROM vendas WHERE data_venda >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'
        AND data_venda < DATE_TRUNC('month', CURRENT_DATE)
      `)
    ]);

    // --- Processamento dos Dados ---

    // KPI: Comparado ao mês passado
    const valorMesAtual = parseFloat(vendasMesAtualData.rows[0].valor);
    const valorMesPassado = parseFloat(vendasMesPassadoData.rows[0].valor);
    const qtdMesAtual = parseInt(vendasMesAtualData.rows[0].quantidade);
    const qtdMesPassado = parseInt(vendasMesPassadoData.rows[0].quantidade);

    let comparacaoPercentual = 0;
    if (valorMesPassado > 0) {
      comparacaoPercentual = ((valorMesAtual - valorMesPassado) / valorMesPassado) * 100;
    } else if (valorMesAtual > 0) {
      comparacaoPercentual = 100;
    }

    const diferencaVendas = qtdMesAtual - qtdMesPassado; // <-- NOVO CÁLCULO

    // Objeto de KPIs
    const kpis = {
      totalProdutos: parseInt(kpiData.rows[0].total_produtos) || 0,
      numeroVendas: parseInt(kpiData.rows[0].numero_vendas) || 0,
      comparadoMesPassado: `${comparacaoPercentual.toFixed(1)}%`,
      vendasAMais: diferencaVendas, // <-- NOVO DADO
      pagamentosPendentes: parseInt(kpiData.rows[0].pagamentos_pendentes) || 0,
    };

    // Vendas por mês
    const meses = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const vendasPorMes = meses.map(mes => {
      const vendaDoMes = vendasPorMesData.rows.find(row => row.mes.trim() === mes);
      return {
        mes,
        quantidade: vendaDoMes ? parseInt(vendaDoMes.quantidade) : 0,
        valor: vendaDoMes ? parseFloat(vendaDoMes.valor) : 0
      };
    });

    // Últimas vendas
    const ultimasVendas = ultimasVendasData.rows.map(venda => ({
      cliente: venda.cliente,
      data: new Date(venda.data).toLocaleDateString('pt-BR'),
      valor: parseFloat(venda.valor),
      status: venda.status
    }));

    // Tipos de produtos
    const totalProdutosContagem = tiposDeProdutosData.rows.reduce((acc, curr) => acc + parseInt(curr.contagem), 0);
    const tiposDeProdutos = tiposDeProdutosData.rows.map(produto => ({
      tipo: produto.categoria,
      percentual: totalProdutosContagem > 0 ? (parseInt(produto.contagem) / totalProdutosContagem) * 100 : 0
    }));

    res.status(200).json({ kpis, vendasPorMes, ultimasVendas, tiposDeProdutos });

  } catch (error) {
    console.error("Erro ao buscar dados do dashboard no banco:", error);
    res.status(500).json({ message: "Erro interno no servidor ao consultar o banco de dados." });
  }
}; 