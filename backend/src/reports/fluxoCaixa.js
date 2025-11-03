const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const pool = require('../config/database');

const gerarFluxoCaixa = async (req, res) => {
  try {
    const { formato, dataInicial, dataFinal } = req.query;

    const queryText = `
        (
            SELECT 
                r.data_recebimento AS data_mov,
                'ENTRADA' AS tipo,
                f.nome AS forma_pagamento,
                r.valor_recebido AS valor
            FROM recebimento_venda r
            JOIN formas_pagamento f ON r.id_forma_pagamento = f.id_forma_pagamento
            WHERE r.data_recebimento BETWEEN $1 AND $2
        )
        UNION ALL
        (
            SELECT 
                p.data_pagamento AS data_mov,
                'SAÍDA' AS tipo,
                f.nome AS forma_pagamento,
                p.valor_pago * -1 AS valor
            FROM pagamento_compra p
            LEFT JOIN formas_pagamento f ON p.id_forma_pagamento = f.id_forma_pagamento
            WHERE p.data_pagamento BETWEEN $1 AND $2
        )
        ORDER BY data_mov ASC;
    `;
    const queryParams = [dataInicial, dataFinal];
    const { rows: movimentos } = await pool.query(queryText, queryParams);

    let saldoFinal = 0;
    movimentos.forEach(item => {
        const valor = parseFloat(item.valor) || 0;
        saldoFinal += valor;
        item.valor = valor;
        item.data_mov = new Date(item.data_mov);
    });

    if (formato === 'pdf') {
      const doc = new PDFDocument({ size: 'A4', margins: { top: 40, bottom: 40, left: 50, right: 50 } });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename=relatorio_fluxo_caixa.pdf`);
      doc.pipe(res);

      const generateTableRow = (doc, y, c1, c2, c3, c4) => {
        doc.fontSize(10)
          .text(c1, 50, y, { width: 90, align: 'left' }) 
          .text(c2, 160, y, { width: 90, align: 'left' }) 
          .text(c3, 270, y, { width: 140, ellipsis: true, align: 'left' })
          .text(c4, 420, y, { width: 125, align: 'right' });
      };

      doc.fontSize(18).font('Helvetica-Bold').text('Relatório de Fluxo de Caixa', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica').text(`Período de ${new Date(dataInicial).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} a ${new Date(dataFinal).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}`, { align: 'center' });
      doc.moveDown(2);

      const tableTop = 130;
      doc.font('Helvetica-Bold');
      generateTableRow(doc, tableTop, 'Data', 'Tipo', 'Forma de Pagamento', 'Valor');
      doc.moveTo(50, tableTop + 20).lineTo(545, tableTop + 20).stroke();

      let y = tableTop + 30;
      doc.font('Helvetica');

      if (movimentos.length === 0) {
        doc.text("Nenhuma movimentação encontrada para o período.", 50, y);
      } else {
        movimentos.forEach(item => {
          if (y > 700) { doc.addPage(); y = 50; doc.font('Helvetica'); }
          
          doc.fillColor(item.valor < 0 ? 'red' : 'black');
          
          generateTableRow(
            doc, y, 
            item.data_mov.toLocaleDateString('pt-BR'),
            item.tipo, 
            item.forma_pagamento,
            item.valor.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })
          );
          y += 25;
        });
      }

      doc.fillColor('black');
      doc.moveTo(50, y + 10).lineTo(545, y + 10).stroke();
      y += 20;
      doc.font('Helvetica-Bold');
      generateTableRow( doc, y, '', '', 'SALDO DO PERÍODO:',
          saldoFinal.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })
      );
      doc.end();
      
    } else if (formato === 'excel') {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Fluxo de Caixa');

        worksheet.columns = [
          { header: 'Data', key: 'data_mov', width: 15, style: { numFmt: 'dd/mm/yyyy' } },
          { header: 'Tipo', key: 'tipo', width: 15 },
          { header: 'Forma de Pagamento', key: 'forma_pagamento', width: 25 },
          { header: 'Valor', key: 'valor', width: 20, style: { numFmt: 'R$ #,##0.00;[Red]-R$ #,##0.00' } }
        ];
        
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
          type: 'pattern',
          pattern:'solid',
          fgColor:{argb:'FFD3D3D3'}
        };
        
        worksheet.addRows(movimentos);
        
        worksheet.columns.forEach(column => {
          column.alignment = { vertical: 'middle', horizontal: 'left' };
          if (column.key === 'valor' || column.key === 'data_mov') {
            column.alignment.horizontal = 'center';
          }
        });
        
        const totalRow = worksheet.addRow([]);
        
        const labelCell = totalRow.getCell(3);
        labelCell.value = 'SALDO DO PERÍODO:';
        labelCell.font = { bold: true };
        labelCell.alignment = { horizontal: 'right' };
        
        const totalCell = totalRow.getCell(4);
        totalCell.value = saldoFinal;
        totalCell.numFmt = 'R$ #,##0.00;[Red]-R$ #,##0.00';
        totalCell.font = { bold: true };
        totalCell.alignment = { horizontal: 'right' };

        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
          'Content-Disposition',
          `attachment; filename=relatorio_fluxo_caixa.xlsx`
        );

        await workbook.xlsx.write(res);
        res.end();
    }
  } catch (error) {
    console.error("ERRO DETALHADO DA BASE DE DADOS (Fluxo de Caixa):", error);
    res.status(500).send("Erro ao consultar os dados para o relatório.");
  }
};

module.exports = gerarFluxoCaixa;
