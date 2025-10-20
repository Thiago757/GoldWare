const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const pool = require('../config/database');

// --- VENDAS (Função que já funciona, sem alterações) ---
exports.gerarRelatorioVendas = async (req, res) => {
  try {
    const { formato, dataInicial, dataFinal } = req.query;
    const queryText = `
        SELECT v.id_venda, c.nome AS nome_cliente, v.data_venda, v.valor_total
        FROM vendas v JOIN clientes c ON v.id_cliente = c.id_cliente
        WHERE v.data_venda BETWEEN $1 AND $2 ORDER BY v.data_venda ASC;
    `;
    const queryParams = [dataInicial, dataFinal];
    const { rows: vendas } = await pool.query(queryText, queryParams);
    if (formato === 'pdf') {
      const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margins: { top: 50, bottom: 50, left: 50, right: 50 } });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename=relatorio_vendas.pdf`);
      doc.pipe(res);
      doc.fontSize(18).font('Helvetica-Bold').text('Relatório de Vendas por Período', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica').text(`Período de ${new Date(dataInicial).toLocaleDateString('pt-BR')} a ${new Date(dataFinal).toLocaleDateString('pt-BR')}`, { align: 'center' });
      doc.moveDown(2);
      const tableTop = 150;
      const columns = ['ID Venda', 'Cliente', 'Data da Venda', 'Valor Total'];
      const columnSpacing = 180;
      doc.font('Helvetica-Bold');
      columns.forEach((header, i) => doc.text(header, 50 + (i * columnSpacing), tableTop));
      doc.moveTo(50, tableTop + 20).lineTo(770, tableTop + 20).stroke();
      doc.font('Helvetica');
      let y = tableTop + 35;
      let totalVendas = 0;
      if (vendas.length === 0) {
        doc.text("Nenhuma venda encontrada para o período selecionado.", 50, y);
      } else {
        vendas.forEach(venda => {
            if (y > 500) { doc.addPage(); y = 50; }
            doc.text(venda.id_venda.toString(), 50, y);
            doc.text(venda.nome_cliente, 50 + columnSpacing, y, { width: 170, ellipsis: true });
            doc.text(new Date(venda.data_venda).toLocaleDateString('pt-BR'), 50 + (2 * columnSpacing), y);
            doc.text(parseFloat(venda.valor_total).toLocaleString('pt-br',{style: 'currency', currency: 'BRL'}), 50 + (3 * columnSpacing), y);
            y += 25;
            totalVendas += parseFloat(venda.valor_total);
        });
      }
      doc.moveTo(50, y + 10).lineTo(770, y + 10).stroke();
      doc.font('Helvetica-Bold').text('Total das Vendas:', 50 + (2 * columnSpacing), y + 25);
      doc.text(totalVendas.toLocaleString('pt-br',{style: 'currency', currency: 'BRL'}), 50 + (3 * columnSpacing), y + 25);
      doc.end();
    } else if (formato === 'excel') { /* Lógica Excel */ }
  } catch (error) {
    console.error("ERRO DETALHADO DA BASE DE DADOS (Vendas):", error);
    res.status(500).send("Erro ao consultar os dados para o relatório.");
  }
};


// --- RANKING DE JOIAS (Função Corrigida) ---
exports.gerarRankingJoias = async (req, res) => {
  try {
    const { formato, dataInicial, dataFinal } = req.query;
    const queryText = `
        SELECT p.id_produto, p.nome, SUM(iv.quantidade) AS quantidade_vendida,
               SUM(iv.quantidade * iv.preco_unitario) AS receita_total,
               (p.custo * SUM(iv.quantidade)) AS custo_total,
               (SUM(iv.quantidade * iv.preco_unitario) - (p.custo * SUM(iv.quantidade))) AS lucro_bruto
        FROM produtos p 
        JOIN itens_venda iv ON p.id_produto = iv.id_produto
        JOIN vendas v ON iv.id_venda = v.id_venda
        WHERE v.data_venda BETWEEN $1 AND $2
        GROUP BY p.id_produto, p.nome, p.custo
        ORDER BY lucro_bruto DESC;
    `;
    const queryParams = [dataInicial, dataFinal];
    const { rows: ranking } = await pool.query(queryText, queryParams);

    if (formato === 'pdf') {
      const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margins: { top: 40, bottom: 40, left: 40, right: 40 } });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename=ranking_produtos.pdf`);
      doc.pipe(res);

      const generateTableRow = (doc, y, c1, c2, c3, c4, c5) => {
        doc.fontSize(9).font('Helvetica')
          .text(c1, 40, y, { width: 240, ellipsis: true })
          .text(c2, 290, y, { width: 80, align: 'center' })
          .text(c3, 380, y, { width: 100, align: 'right' })
          .text(c4, 490, y, { width: 100, align: 'right' })
          .text(c5, 600, y, { width: 80, align: 'center' });
      };

      doc.fontSize(18).font('Helvetica-Bold').text('Ranking de Joias Mais Vendidas', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica').text(`Período de ${new Date(dataInicial).toLocaleDateString('pt-BR')} a ${new Date(dataFinal).toLocaleDateString('pt-BR')}`, { align: 'center' });
      doc.moveDown(2);

      const tableTop = 130;
      doc.font('Helvetica-Bold');
      generateTableRow(doc, tableTop, 'Produto', 'Qtd. Vendida', 'Receita Total', 'Lucro Bruto', 'Margem (%)');
      doc.moveTo(40, tableTop + 20).lineTo(780, tableTop + 20).stroke();

      let y = tableTop + 30;
      if (ranking.length === 0) {
        doc.font('Helvetica').text("Nenhum produto vendido no período selecionado.", 40, y);
      } else {
        ranking.forEach(item => {
          if (y > 500) { doc.addPage(); y = 50; } // Quebra de página
          const receita = parseFloat(item.receita_total) || 0;
          const lucro = parseFloat(item.lucro_bruto) || 0;
          const margem = receita > 0 ? `${(lucro / receita * 100).toFixed(2)}%` : '0.00%';
          
          generateTableRow(
            doc, 
            y, 
            item.nome, 
            String(item.quantidade_vendida),
            receita.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' }),
            lucro.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' }),
            margem
          );
          y += 25;
        });
      }
      doc.end();
      
    } else if (formato === 'excel') {
      res.status(200).send("Ainda não tem formato excel para este relatório.");
    }
  } catch (error) {
    console.error("ERRO DETALHADO DA BASE DE DADOS (Ranking):", error);
    res.status(500).send("Erro ao consultar os dados para o relatório.");
  }
};

// --- PLACEHOLDERS ---
exports.gerarComissoes = async (req, res) => res.status(200).send(`(Backend) Placeholder para Comissões.`);
exports.gerarRelatorioInventario = async (req, res) => res.status(200).send(`(Backend) Placeholder para Inventário.`);
exports.gerarRelatorioEstoqueBaixo = async (req, res) => res.status(200).send(`(Backend) Placeholder para Estoque Baixo.`);
exports.gerarListaClientes = async (req, res) => res.status(200).send(`(Backend) Placeholder para Lista de Clientes.`);
exports.gerarContasReceber = async (req, res) => res.status(200).send(`(Backend) Placeholder para Contas a Receber.`);
exports.gerarContasPagar = async (req, res) => res.status(200).send(`(Backend) Placeholder para Contas a Pagar.`);
exports.gerarFluxoCaixa = async (req, res) => res.status(200).send(`(Backend) Placeholder para Fluxo de Caixa.`);