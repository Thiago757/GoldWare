const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const pool = require('../config/database');

const gerarContasPagar = async (req, res) => {
  try {
    const { formato, status, fornecedor } = req.query;

    let queryText = `
        SELECT 
            cap.id_conta_pagar,
            COALESCE(f.nome, 'Despesa Diversa') AS nome_fornecedor,
            cap.descricao,
            cap.valor,
            cap.data_vencimento,
            cap.status
        FROM contas_a_pagar cap
        LEFT JOIN fornecedores f ON cap.id_fornecedor = f.id_fornecedor
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
        addClause(`cap.status = $${queryParams.length}`);
    }

    if (fornecedor && fornecedor.trim() !== '') {
        queryParams.push(fornecedor);
        addClause(`cap.id_fornecedor = $${queryParams.length}`);
    }
    
    queryText += ` ORDER BY cap.data_vencimento ASC;`;
    
    const { rows: contas } = await pool.query(queryText, queryParams);
    
    let totalAPagar = 0;
    contas.forEach(item => {
      const valor = parseFloat(item.valor) || 0;
      if(item.status !== 'pago' && item.status !== 'cancelado') {
        totalAPagar += valor;
      }
      item.valor = valor;
      item.data_vencimento = new Date(item.data_vencimento);
    });

    if (formato === 'pdf') {
      const doc = new PDFDocument({ size: 'A4', margins: { top: 40, bottom: 40, left: 50, right: 50 } });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename=relatorio_contas_pagar.pdf`);
      doc.pipe(res);

      // --- CORREÇÃO DE LARGURA/POSIÇÃO DA TABELA ---
      const generateTableRow = (doc, y, c1, c2, c3, c4, c5) => {
        doc.fontSize(9)
          .text(c1, 50, y, { width: 125, ellipsis: true, align: 'left' })   // x: 50, width: 125
          .text(c2, 185, y, { width: 130, ellipsis: true, align: 'left' })  // x: 185, width: 130
          .text(c3, 325, y, { width: 80, align: 'right' })                 // x: 325, width: 80
          .text(c4, 415, y, { width: 60, align: 'center' })                // x: 415, width: 60
          .text(c5, 485, y, { width: 60, align: 'center' });               // x: 485, width: 60
          // Total: Inicia em 50, termina em 545. (Largura 495)
      };

      doc.fontSize(18).font('Helvetica-Bold').text('Relatório de Contas a Pagar', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica').text(`Filtro de Status: ${status || 'Todos'}`, { align: 'center' });
      doc.moveDown(2);

      const tableTop = 130;
      doc.font('Helvetica-Bold');
      generateTableRow(doc, tableTop, 'Fornecedor', 'Descrição', 'Valor', 'Vencimento', 'Status');
      // --- LINHA CORRIGIDA ---
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
            doc, y, item.nome_fornecedor, item.descricao,
            item.valor.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' }),
            item.data_vencimento.toLocaleDateString('pt-BR'),
            item.status
          );
          y += 25;
        });
      }

      // --- LINHA CORRIGIDA ---
      doc.moveTo(50, y + 10).lineTo(545, y + 10).stroke();
      y += 20;
      doc.font('Helvetica-Bold');
      generateTableRow(
          doc, y, 'TOTAL EM ABERTO:', '',
          totalAPagar.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' }),
          '', ''
      );
      doc.end();
      
    } else if (formato === 'excel') {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Contas a Pagar');

        worksheet.columns = [
          { header: 'Fornecedor', key: 'nome_fornecedor', width: 35 },
          { header: 'Descrição', key: 'descricao', width: 35 },
          { header: 'Valor', key: 'valor', width: 20, style: { numFmt: 'R$ #,##0.00' } },
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
          if (column.key === 'data_vencimento' || column.key === 'status') {
            column.alignment.horizontal = 'center';
          }
        });
        
        const totalRowNumber = contas.length + 3;
        const totalRow = worksheet.addRow([]);
        
        const labelCell = totalRow.getCell(1);
        labelCell.value = 'TOTAL EM ABERTO:';
        labelCell.font = { bold: true };
        
        const totalCell = totalRow.getCell(3);
        totalCell.value = totalAPagar;
        totalCell.numFmt = 'R$ #,##0.00';
        totalCell.font = { bold: true };
        totalCell.alignment = { horizontal: 'right' };

        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
          'Content-Disposition',
          `attachment; filename=relatorio_contas_pagar.xlsx`
        );

        await workbook.xlsx.write(res);
        res.end();
    }
  } catch (error) {
    console.error("ERRO DETALHADO DA BASE DE DADOS (Contas a Pagar):", error);
    res.status(500).send("Erro ao consultar os dados para o relatório.");
  }
};

module.exports = gerarContasPagar;
