const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const pool = require('../config/database');

const gerarRankingJoias = async (req, res) => {
  try {
    const { formato, dataInicial, dataFinal, id_categoria } = req.query;

    let queryText = `
        SELECT 
            p.id_produto,
            p.nome,
            SUM(iv.quantidade) AS quantidade_vendida,
            SUM(iv.quantidade * iv.preco_unitario) AS receita_total,
            COALESCE((p.custo * SUM(iv.quantidade)), 0) AS custo_total,
            COALESCE((SUM(iv.quantidade * iv.preco_unitario) - (p.custo * SUM(iv.quantidade))), 0) AS lucro_bruto
        FROM produtos p 
        
        INNER JOIN itens_venda iv ON p.id_produto = iv.id_produto
        INNER JOIN vendas v ON iv.id_venda = v.id_venda
        
        WHERE v.data_venda BETWEEN $1 AND $2
          AND v.status = 'concluida' 
    `;
    
    const queryParams = [dataInicial, dataFinal];

    if (id_categoria && id_categoria !== '') {
        queryParams.push(id_categoria);
        queryText += ` AND p.id_categoria = $${queryParams.length}`; 
    }

    queryText += `
        GROUP BY p.id_produto, p.nome, p.custo
        ORDER BY lucro_bruto DESC;
    `;
    
    const { rows: ranking } = await pool.query(queryText, queryParams);


    if (formato === 'pdf') {
      const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margins: { top: 40, bottom: 40, left: 40, right: 40 } });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename=ranking_produtos.pdf`);
      doc.pipe(res);
      const generateTableRow = (doc, y, c1, c2, c3, c4, c5) => { doc.fontSize(9).font('Helvetica').text(c1, 40, y, { width: 240, ellipsis: true }).text(c2, 290, y, { width: 80, align: 'center' }).text(c3, 380, y, { width: 100, align: 'right' }).text(c4, 490, y, { width: 100, align: 'right' }).text(c5, 600, y, { width: 80, align: 'center' }); };
      doc.fontSize(18).font('Helvetica-Bold').text('Ranking de Joias Mais Vendidas', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica').text(`Período de ${new Date(dataInicial).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} a ${new Date(dataFinal).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}`, { align: 'center' });
      doc.moveDown(2);
      const tableTop = 130;
      const columns = ['Produto', 'Qtd. Vendida', 'Receita Total', 'Lucro Bruto', 'Margem (%)'];
      doc.font('Helvetica-Bold');
      generateTableRow(doc, tableTop, columns[0], columns[1], columns[2], columns[3], columns[4]);
      doc.moveTo(40, tableTop + 20).lineTo(780, tableTop + 20).stroke();
      let y = tableTop + 30;
      if (ranking.length === 0) {
          doc.font('Helvetica').text("Nenhum produto vendido no período selecionado.", 40, y);
      } else {
          ranking.forEach(item => {
              if (y > 500) { doc.addPage(); y = 50; }
              const receita_total = parseFloat(item.receita_total) || 0;
              const lucro_bruto = parseFloat(item.lucro_bruto) || 0;
              const margem = receita_total > 0 ? `${(lucro_bruto / receita_total * 100).toFixed(2)}%` : '0.00%';
              generateTableRow( doc, y, item.nome, String(item.quantidade_vendida || 0), 
                  receita_total.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' }),
                  lucro_bruto.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' }),
                  margem );
              y += 25;
          });
      }
      doc.end();
      
    } else if (formato === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Ranking de Produtos');
      worksheet.columns = [
          { header: 'ID Produto', key: 'id_produto', width: 15 },
          { header: 'Produto', key: 'nome', width: 40 },
          { header: 'Qtd. Vendida', key: 'quantidade_vendida', width: 15, style: { numFmt: '#,##0' } }, 
          { header: 'Receita Total', key: 'receita_total', width: 20, style: { numFmt: '"R$"#,##0.00' } },
          { header: 'Custo Total', key: 'custo_total', width: 20, style: { numFmt: '"R$"#,##0.00' } },
          { header: 'Lucro Bruto', key: 'lucro_bruto', width: 20, style: { numFmt: '"R$"#,##0.00' } },
          { header: 'Margem (%)', key: 'margem', width: 15, style: { numFmt: '0.00%' } }
      ];
      const excelRows = ranking.map(item => {
           const receita = parseFloat(item.receita_total) || 0;
           const lucro = parseFloat(item.lucro_bruto) || 0;
           const margem = receita > 0 ? (lucro / receita) : 0;
           return {
               id_produto: item.id_produto,
               nome: item.nome,
               quantidade_vendida: parseInt(item.quantidade_vendida || 0), 
               receita_total: receita,
               custo_total: parseFloat(item.custo_total || 0),
               lucro_bruto: lucro,
               margem: margem 
           };
      });
      worksheet.addRows(excelRows);
      worksheet.autoFilter = 'A1:G1';
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=ranking_produtos.xlsx`);
      await workbook.xlsx.write(res);
      res.end();
    }

  } catch (error) {
    console.error("ERRO DETALHADO DA BASE DE DADOS (Ranking):", error);
    res.status(500).send("Erro ao consultar os dados para o relatório.");
  }
};

module.exports = gerarRankingJoias;