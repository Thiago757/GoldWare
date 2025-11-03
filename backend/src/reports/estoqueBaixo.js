const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const pool = require('../config/database');

const gerarRelatorioEstoqueBaixo = async (req, res) => {
  try {
    const { formato, limite } = req.query;
    const limiteEstoque = parseInt(limite) || 5; // Padrão de 5 se não for enviado

    const queryText = `
        SELECT 
            p.id_produto,
            p.nome,
            c.nome AS categoria,
            p.quantidade_estoque
        FROM produtos p
        JOIN categorias c ON p.id_categoria = c.id_categoria
        WHERE p.quantidade_estoque <= $1 AND p.ativo = 'S'
        ORDER BY p.quantidade_estoque ASC;
    `;
    const { rows: produtos } = await pool.query(queryText, [limiteEstoque]);

    if (formato === 'pdf') {
      const doc = new PDFDocument({ size: 'A4', margins: { top: 40, bottom: 40, left: 50, right: 50 } });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename=relatorio_estoque_baixo.pdf`);
      doc.pipe(res);

      const generateTableRow = (doc, y, c1, c2, c3) => {
        doc.fontSize(10).font('Helvetica')
          .text(c1, 50, y, { width: 300, ellipsis: true })
          .text(c2, 360, y, { width: 150 })
          .text(c3, 520, y, { width: 50, align: 'center' });
      };

      doc.fontSize(18).font('Helvetica-Bold').text('Relatório de Estoque Baixo', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica').text(`Exibindo produtos com ${limiteEstoque} unidades ou menos em estoque.`, { align: 'center' });
      doc.moveDown(2);

      const tableTop = 130;
      doc.font('Helvetica-Bold');
      generateTableRow(doc, tableTop, 'Produto', 'Categoria', 'Qtd.');
      doc.moveTo(50, tableTop + 20).lineTo(580, tableTop + 20).stroke();

      let y = tableTop + 30;
      if (produtos.length === 0) {
        doc.font('Helvetica').text("Nenhum produto com estoque baixo encontrado.", 50, y);
      } else {
        produtos.forEach(item => {
          if (y > 700) { doc.addPage(); y = 50; }
          generateTableRow(
            doc, y, item.nome, item.categoria,
            String(item.quantidade_estoque || 0)
          );
          y += 25;
        });
      }
      doc.end();
      
    } else if (formato === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Estoque Baixo');
      worksheet.columns = [
          { header: 'ID Produto', key: 'id_produto', width: 10 },
          { header: 'Produto', key: 'nome', width: 40 },
          { header: 'Categoria', key: 'categoria', width: 25 },
          { header: 'Qtd. em Estoque', key: 'quantidade_estoque', width: 15, style: { numFmt: '#,##0' } }
      ];
      const excelRows = produtos.map(item => ({
        id_produto: item.id_produto,
        nome: item.nome,
        categoria: item.categoria,
        quantidade_estoque: parseInt(item.quantidade_estoque || 0)
      }));
      worksheet.addRows(excelRows);
      worksheet.autoFilter = 'A1:D1';
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=relatorio_estoque_baixo.xlsx`);
      await workbook.xlsx.write(res);
      res.end();
    }
  } catch (error) {
    console.error("ERRO DETALHADO DA BASE DE DADOS (Estoque Baixo):", error);
    res.status(500).send("Erro ao consultar os dados para o relatório.");
  }
};

module.exports = gerarRelatorioEstoqueBaixo;