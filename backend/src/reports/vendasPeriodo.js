const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const pool = require('../config/database');

gerarRelatorioVendas = async (req, res) => {
  try {
    const { formato, dataInicial, dataFinal } = req.query;

    const queryText = `
        SELECT 
            v.id_venda,
            c.nome AS nome_cliente,
            v.data_venda,
            v.valor_total
        FROM vendas v
        JOIN clientes c ON v.id_cliente = c.id_cliente
        WHERE v.data_venda BETWEEN $1 AND $2
        ORDER BY v.data_venda ASC;
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
        doc.fontSize(12).font('Helvetica').text(`Período de ${new Date(dataInicial).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} a ${new Date(dataFinal).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}`, { align: 'center' });
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
        
    } else if (formato === 'excel') {
        
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'GoldWare Joalheria';
        workbook.lastModifiedBy = 'GoldWare Joalheria';
        workbook.created = new Date();
        workbook.modified = new Date();

        const worksheet = workbook.addWorksheet('Vendas por Período');

        worksheet.columns = [
            { header: 'ID Venda', key: 'id_venda', width: 10 },
            { header: 'Cliente', key: 'nome_cliente', width: 40 },
            { header: 'Data', key: 'data_venda', width: 15, style: { numFmt: 'dd/mm/yyyy' } },
            { header: 'Valor Total', key: 'valor_total', width: 20, style: { numFmt: '"R$"#,##0.00' } }
        ];

        const excelRows = vendas.map(v => ({
            id_venda: v.id_venda,
            nome_cliente: v.nome_cliente,
            data_venda: new Date(v.data_venda),
            valor_total: parseFloat(v.valor_total)
        }));
        
        worksheet.addRows(excelRows);

        const totalRow = worksheet.addRow([]);
        totalRow.getCell(3).value = 'Total:';
        totalRow.getCell(4).value = { formula: `SUM(D2:D${excelRows.length + 1})` };
        totalRow.getCell(4).numFmt = '"R$"#,##0.00';
        totalRow.font = { bold: true };

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=relatorio_vendas.xlsx`); // 'attachment' força o download

        await workbook.xlsx.write(res);
        res.end(); 
    }

  } catch (error) {
    console.error("ERRO DETALHADO DA BASE DE DADOS (Vendas):", error);
    res.status(500).send("Erro ao consultar os dados para o relatório.");
  }
};
module.exports = gerarRelatorioVendas;