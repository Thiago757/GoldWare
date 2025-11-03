const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const pool = require('../config/database');

const gerarContasReceber = async (req, res) => {
  try {
    const { formato, status, cliente } = req.query;

    let queryText = `
        SELECT 
            car.id_conta_receber,
            COALESCE(c.nome, 'Cliente Não Identificado') AS nome_cliente,
            COALESCE(car.id_venda::text, 'N/A') AS id_venda,
            car.valor_parcela AS valor,
            car.data_vencimento,
            car.status
        FROM contas_a_receber car
        LEFT JOIN clientes c ON car.id_cliente = c.id_cliente
    `;
    const queryParams = [];
    let whereAdded = false;

    const addClause = (clause) => {
        if (whereAdded) {
            queryText += ` AND ${clause}`;
        } else {
            queryText += ` WHERE ${clause}`;
            whereAdded = true;
        }
    };

    if (status && status !== 'Todas') {
        queryParams.push(status.toLowerCase());
        addClause(`car.status = $${queryParams.length}`);
    }

    if (cliente && cliente.trim() !== '') {
        queryParams.push(cliente);
        addClause(`car.id_cliente = $${queryParams.length}`);
    }
    
    queryText += ` ORDER BY car.data_vencimento ASC;`;
    
    const { rows: contas } = await pool.query(queryText, queryParams);
    
    let totalAReceber = 0;
    contas.forEach(item => {
      const valor = parseFloat(item.valor) || 0;
      if(item.status !== 'pago' && item.status !== 'cancelado') {
        totalAReceber += valor;
      }
      item.valor = valor;
      item.data_vencimento = new Date(item.data_vencimento);
    });

    if (formato === 'pdf') {
      const doc = new PDFDocument({ size: 'A4', margins: { top: 40, bottom: 40, left: 50, right: 50 } });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename=relatorio_contas_receber.pdf`);
      doc.pipe(res);

      // Nova estrutura de coluna para Contas a Receber
      const generateTableRow = (doc, y, c1, c2, c3, c4, c5) => {
        doc.fontSize(9)
          .text(c1, 50, y, { width: 145, ellipsis: true, align: 'left' })   // Cliente (50)
          .text(c2, 205, y, { width: 70, align: 'center' })                 // Venda ID (205)
          .text(c3, 295, y, { width: 80, align: 'right' })                 // Valor Parcela (295)
          .text(c4, 385, y, { width: 80, align: 'center' })                // Vencimento (385)
          .text(c5, 475, y, { width: 70, align: 'center' });               // Status (475)
      };

      doc.fontSize(18).font('Helvetica-Bold').text('Relatório de Contas a Receber', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica').text(`Filtro de Status: ${status || 'Todos'}`, { align: 'center' });
      doc.moveDown(2);

      const tableTop = 130;
      doc.font('Helvetica-Bold');
      generateTableRow(doc, tableTop, 'Cliente', 'Venda ID', 'Valor Parcela', 'Vencimento', 'Status');
      doc.moveTo(50, tableTop + 20).lineTo(545, tableTop + 20).stroke();

      let y = tableTop + 30;
      
      if (contas.length === 0) {
        doc.font('Helvetica').text("Nenhuma conta encontrada para os filtros selecionados.", 50, y);
      } else {
        doc.font('Helvetica');
        contas.forEach(item => {
          if (y > 700) { 
            doc.addPage(); 
            y = 50; 
            doc.font('Helvetica');
          }
          generateTableRow(
            doc, y, item.nome_cliente, item.id_venda,
            item.valor.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' }),
            item.data_vencimento.toLocaleDateString('pt-BR'),
            item.status
          );
          y += 25;
        });
      }

      doc.moveTo(50, y + 10).lineTo(545, y + 10).stroke();
      y += 20;
      doc.font('Helvetica-Bold');
      generateTableRow(
          doc, y, 'TOTAL EM ABERTO:', '',
          totalAReceber.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' }),
          '', ''
      );
      doc.end();
      
    } else if (formato === 'excel') {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Contas a Receber');

        worksheet.columns = [
          { header: 'Cliente', key: 'nome_cliente', width: 30 },
          { header: 'Venda ID', key: 'id_venda', width: 15, alignment: { horizontal: 'center' } },
          { header: 'Valor Parcela', key: 'valor', width: 20, style: { numFmt: 'R$ #,##0.00' } },
          { header: 'Vencimento', key: 'data_vencimento', width: 15, style: { numFmt: 'dd/mm/yyyy' } },
          { header: 'Status', key: 'status', width: 15 }
        ];
        
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
          type: 'pattern',
          pattern:'solid',
          fgColor:{argb:'FFD3D3D3'}
        };
        
        worksheet.addRows(contas);
        
        worksheet.columns.forEach(column => {
          column.alignment = { vertical: 'middle', horizontal: 'left' };
          if (column.key === 'valor') {
            column.alignment.horizontal = 'right';
          }
          if (column.key === 'data_vencimento' || column.key === 'status' || column.key === 'id_venda') {
            column.alignment.horizontal = 'center';
          }
        });
        
        const totalRow = worksheet.addRow([]);
        
        const labelCell = totalRow.getCell(1);
        labelCell.value = 'TOTAL EM ABERTO:';
        labelCell.font = { bold: true };
        
        const totalCell = totalRow.getCell(3);
        totalCell.value = totalAReceber;
        totalCell.numFmt = 'R$ #,##0.00';
        totalCell.font = { bold: true };
        totalCell.alignment = { horizontal: 'right' };

        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
          'Content-Disposition',
          `attachment; filename=relatorio_contas_receber.xlsx`
        );

        await workbook.xlsx.write(res);
        res.end();
    }
  } catch (error) {
    console.error("ERRO DETALHADO DA BASE DE DADOS (Contas a Receber):", error);
    res.status(500).send("Erro ao consultar os dados para o relatório.");
  }
};

module.exports = gerarContasReceber;
