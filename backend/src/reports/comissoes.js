const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const pool = require('../config/database');

const TAXA_COMISSAO = 0.05; // 5%

const gerarComissoes = async (req, res) => {
  try {
    const { formato, dataInicial, dataFinal } = req.query;

    const queryText = `
        SELECT
            c.nome AS nome_principal, -- Usamos um nome genérico
            COUNT(v.id_venda) AS total_de_vendas,
            SUM(v.valor_total) AS valor_total_vendido
        FROM clientes c -- Agrupando por cliente
        JOIN vendas v ON c.id_cliente = v.id_cliente -- Ligando cliente e venda
        WHERE 
            v.data_venda BETWEEN $1 AND $2
            AND v.status = 'concluida'
        GROUP BY c.id_cliente, c.nome
        ORDER BY valor_total_vendido DESC;
    `;
    
    const queryParams = [dataInicial, dataFinal];
    const { rows: comissoes } = await pool.query(queryText, queryParams);

    if (formato === 'pdf') {
      const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margins: { top: 40, bottom: 40, left: 50, right: 50 } });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename=relatorio_comissoes.pdf`);
      doc.pipe(res);

      const generateTableRow = (doc, y, c1, c2, c3, c4) => {
        doc.fontSize(10).font('Helvetica')
          .text(c1, 50, y, { width: 260, ellipsis: true })  
          .text(c2, 320, y, { width: 100, align: 'center' }) 
          .text(c3, 450, y, { width: 120, align: 'right' }) 
          .text(c4, 600, y, { width: 120, align: 'right' }); 
      };

      doc.fontSize(18).font('Helvetica-Bold').text('Relatório de Comissões', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica').text(`Período de ${new Date(dataInicial).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} a ${new Date(dataFinal).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}`, { align: 'center' });
      doc.moveDown(2);

      const tableTop = 130;
      doc.font('Helvetica-Bold');
      generateTableRow(doc, tableTop, 'Cliente', 'Nº de Vendas', 'Total Vendido', `Comissão (${(TAXA_COMISSAO * 100)}%)`);
      doc.moveTo(50, tableTop + 20).lineTo(740, tableTop + 20).stroke(); 

      let y = tableTop + 30;
      let totalGeralVendido = 0;
      let totalGeralComissao = 0;

      if (comissoes.length === 0) {
        doc.font('Helvetica').text("Nenhum dado de comissão encontrado para este período.", 50, y);
      } else {
        comissoes.forEach(item => {
          if (y > 500) { doc.addPage(); y = 50; } 
          const valorVendido = parseFloat(item.valor_total_vendido) || 0;
          const valorComissao = valorVendido * TAXA_COMISSAO;
          totalGeralVendido += valorVendido;
          totalGeralComissao += valorComissao;
          
          generateTableRow(
            doc, y, 
            item.nome_principal, 
            String(item.total_de_vendas),
            valorVendido.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' }),
            valorComissao.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })
          );
          y += 25;
        });
      }

      doc.moveTo(50, y + 10).lineTo(740, y + 10).stroke(); 
      y += 20;
      doc.font('Helvetica-Bold');
      generateTableRow(
          doc, y, 'TOTAIS', '',
          totalGeralVendido.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' }),
          totalGeralComissao.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })
      );
      
      doc.end();
      
    } else if (formato === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Comissões');
      worksheet.columns = [
          { header: 'Cliente', key: 'nome_principal', width: 40 }, // Corrigido
          { header: 'Nº de Vendas', key: 'total_de_vendas', width: 15, style: { numFmt: '#,##0' } },
          { header: 'Total Vendido', key: 'valor_total_vendido', width: 20, style: { numFmt: '"R$"#,##0.00' } },
          { header: `Comissão (${(TAXA_COMISSAO * 100)}%)`, key: 'valor_comissao', width: 20, style: { numFmt: '"R$"#,##0.00' } }
      ];
      const excelRows = comissoes.map(item => {
           const valorVendido = parseFloat(item.valor_total_vendido) || 0;
           const valorComissao = valorVendido * TAXA_COMISSAO;
           return {
               nome_principal: item.nome_principal, // Corrigido
               total_de_vendas: parseInt(item.total_de_vendas),
               valor_total_vendido: valorVendido,
               valor_comissao: valorComissao
           };
      });
      worksheet.addRows(excelRows);
      const totalRow = worksheet.addRow([]);
      totalRow.getCell(2).value = 'Total:';
      totalRow.getCell(3).value = { formula: `SUM(C2:C${excelRows.length + 1})` };
      totalRow.getCell(4).value = { formula: `SUM(D2:D${excelRows.length + 1})` };
      totalRow.getCell(3).numFmt = '"R$"#,##0.00';
      totalRow.getCell(4).numFmt = '"R$"#,##0.00';
      totalRow.font = { bold: true };
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=relatorio_comissoes.xlsx`);
      await workbook.xlsx.write(res);
      res.end();
    }
  } catch (error) {
    console.error("ERRO DETALHADO DA BASE DE DADOS (Comissões):", error);
    res.status(500).send("Erro ao consultar os dados para o relatório.");
  }
};

module.exports = gerarComissoes;