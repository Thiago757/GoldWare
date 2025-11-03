const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const pool = require('../config/database');

const gerarListaClientes = async (req, res) => {
  try {
    const { formato } = req.query;
    const { rows: clientes } = await pool.query("SELECT nome, email, telefone, status FROM clientes ORDER BY nome");

    if (formato === 'pdf') {
      const doc = new PDFDocument({ size: 'A4', margins: { top: 40, bottom: 40, left: 50, right: 50 } });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename=relatorio_clientes.pdf`);
      doc.pipe(res);

      const generateTableRow = (doc, y, c1, c2, c3, c4) => {
        doc.fontSize(9)
          .text(c1, 50, y, { width: 140, ellipsis: true, align: 'left' })
          .text(c2, 200, y, { width: 165, ellipsis: true, align: 'left' })
          .text(c3, 375, y, { width: 80, align: 'left' })
          .text(c4, 475, y, { width: 70, align: 'left' });
      };

      doc.fontSize(18).font('Helvetica-Bold').text('Lista de Clientes Cadastrados', { align: 'center' });
      doc.moveDown(2);

      const tableTop = 130;
      doc.font('Helvetica-Bold');
      generateTableRow(doc, tableTop, 'Nome', 'Email', 'Telefone', 'Status');
      doc.moveTo(50, tableTop + 20).lineTo(545, tableTop + 20).stroke();

      let y = tableTop + 30;
      doc.font('Helvetica');
      
      if (clientes.length === 0) {
        doc.text("Nenhum cliente cadastrado.", 50, y);
      } else {
        clientes.forEach(item => {
          if (y > 700) { doc.addPage(); y = 50; doc.font('Helvetica'); }
          generateTableRow(
            doc, y, item.nome, item.email, item.telefone, item.status
          );
          y += 25;
        });
      }
      doc.end();
      
    } else if (formato === 'excel') {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Clientes');

        worksheet.columns = [
          { header: 'Nome', key: 'nome', width: 30 },
          { header: 'Email', key: 'email', width: 35 },
          { header: 'Telefone', key: 'telefone', width: 20 },
          { header: 'Status', key: 'status', width: 15 }
        ];
        
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
          type: 'pattern',
          pattern:'solid',
          fgColor:{argb:'FFD3D3D3'}
        };
        
        worksheet.addRows(clientes);
        
        worksheet.columns.forEach(column => {
          column.alignment = { vertical: 'middle', horizontal: 'left' };
          if (column.key === 'status') {
            column.alignment.horizontal = 'center';
          }
        });

        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
          'Content-Disposition',
          `attachment; filename=relatorio_clientes.xlsx`
        );

        await workbook.xlsx.write(res);
        res.end();
    }
  } catch (error) {
    console.error("ERRO DETALHADO DA BASE DE DADOS (Lista Clientes):", error);
    res.status(500).send("Erro ao consultar os dados para o relatório.");
  }
};

module.exports = gerarListaClientes;
