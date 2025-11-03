const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const pool = require('../config/database');

const gerarRelatorioInventario = async (req, res) => {
  try {
    const { formato, id_categoria } = req.query;

    let queryText = `
        SELECT
            p.id_produto,
            p.nome,
            c.nome AS categoria,
            p.quantidade_estoque,
            p.custo,
            (p.quantidade_estoque * p.custo) AS valor_total_custo
        FROM produtos p
        JOIN categorias c ON p.id_categoria = c.id_categoria
        WHERE p.ativo = 'S'
    `;
    const queryParams = [];
    
    if (id_categoria && id_categoria !== '') {
        queryParams.push(id_categoria);
        queryText += ` AND p.id_categoria = $${queryParams.length}`;
    }
    queryText += ` ORDER BY p.nome;`;
    
    const { rows: inventario } = await pool.query(queryText, queryParams);

    if (formato === 'pdf') {
      const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margins: { top: 40, bottom: 40, left: 40, right: 40 } });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename=relatorio_inventario.pdf`);
      doc.pipe(res);

      const generateTableRow = (doc, y, c1, c2, c3, c4, c5) => {
        doc.fontSize(9).font('Helvetica')
          .text(c1, 40, y, { width: 240, ellipsis: true }) 
          .text(c2, 290, y, { width: 110 })              
          .text(c3, 410, y, { width: 80, align: 'center' })
          .text(c4, 500, y, { width: 110, align: 'right' })
          .text(c5, 620, y, { width: 120, align: 'right' });
      };

      doc.fontSize(18).font('Helvetica-Bold').text('Inventário Atual (Valorizado)', { align: 'center' });
      doc.moveDown(2);

      const tableTop = 130;
      doc.font('Helvetica-Bold');
      generateTableRow(doc, tableTop, 'Produto', 'Categoria', 'Qtd.', 'Custo Unit.', 'Total (Custo)');
      
      doc.moveTo(40, tableTop + 20).lineTo(760, tableTop + 20).stroke();

      let y = tableTop + 30;
      let totalInventario = 0;

      if (inventario.length === 0) {
        doc.font('Helvetica').text("Nenhum item de inventário encontrado.", 40, y);
      } else {
        inventario.forEach(item => {
          if (y > 500) { doc.addPage(); y = 50; } 
          const custo = parseFloat(item.custo) || 0;
          const totalCusto = parseFloat(item.valor_total_custo) || 0;
          totalInventario += totalCusto;
          generateTableRow(
            doc, y, item.nome, item.categoria,
            String(item.quantidade_estoque || 0),
            custo.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' }),
            totalCusto.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })
          );
          y += 25;
        });
      }

      doc.moveTo(40, y + 10).lineTo(760, y + 10).stroke();
      y += 20;
      doc.font('Helvetica-Bold');
      generateTableRow( doc, y, 
        'VALOR TOTAL DO INVENTÁRIO:', 
        '', 
        '', 
        '', 
        totalInventario.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' }) // c5
      );
      doc.end();
      
    } else if (formato === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Inventário');
      worksheet.columns = [
          { header: 'ID Produto', key: 'id_produto', width: 10 },
          { header: 'Produto', key: 'nome', width: 40 },
          { header: 'Categoria', key: 'categoria', width: 25 },
          { header: 'Qtd. em Estoque', key: 'quantidade_estoque', width: 15, style: { numFmt: '#,##0' } },
          { header: 'Custo Unitário', key: 'custo', width: 20, style: { numFmt: '"R$"#,##0.00' } },
          { header: 'Valor Total (Custo)', key: 'valor_total_custo', width: 20, style: { numFmt: '"R$"#,##0.00' } }
      ];
      const excelRows = inventario.map(item => ({
        id_produto: item.id_produto,
        nome: item.nome,
        categoria: item.categoria,
        quantidade_estoque: parseInt(item.quantidade_estoque || 0),
        custo: parseFloat(item.custo || 0),
        valor_total_custo: parseFloat(item.valor_total_custo || 0)
      }));
      worksheet.addRows(excelRows);
      const totalRow = worksheet.addRow([]);
      totalRow.getCell(5).value = 'Total:';
      totalRow.getCell(6).value = { formula: `SUM(F2:F${excelRows.length + 1})` };
      totalRow.getCell(6).numFmt = '"R$"#,##0.00';
      totalRow.font = { bold: true };
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=relatorio_inventario.xlsx`);
      await workbook.xlsx.write(res);
      res.end();
    }
  } catch (error) {
    console.error("ERRO DETALHADO DA BASE DE DADOS (Inventário):", error);
    res.status(500).send("Erro ao consultar os dados para o relatório.");
  }
};

module.exports = gerarRelatorioInventario;