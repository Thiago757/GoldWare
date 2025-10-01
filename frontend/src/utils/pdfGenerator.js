import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// const logoBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...'; 

export const gerarPDFOS = (os) => {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();

    // if (logoBase64.startsWith('data:image')) {
    //     doc.addImage(logoBase64, 'PNG', 14, 12, 30, 15); // (logo, formato, x, y, largura, altura)
    // }
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text("Gold Ware Joias & Serviços", pageWidth - 14, 20, { align: 'right' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text("Rua das Pedras Preciosas, 123", pageWidth - 14, 26, { align: 'right' });
    doc.text("(11) 98888-7777 | contato@goldware.com", pageWidth - 14, 32, { align: 'right' });
    doc.setLineWidth(0.5);
    doc.line(14, 40, pageWidth - 14, 40); 
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(`Ordem de Serviço #${os.id_os}`, 14, 55);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Cliente: ${os.nome_cliente || 'N/A'}`, 14, 65);
    doc.text(`Data de Abertura: ${new Date(os.data_abertura).toLocaleDateString('pt-BR')}`, 14, 71);
    doc.text(`Status: ${os.status.toUpperCase()}`, 14, 77);

    const tableColumn = ["Serviço", "Prazo (dias)", "Qtd.", "Preço Unit. (R$)", "Subtotal (R$)"];
    const tableRows = [];

    os.itens.forEach(item => {
        const itemData = [
            item.nome_servico,
            item.prazo_estimado || 'N/A', // Coluna de prazo adicionada
            item.quantidade,
            parseFloat(item.preco_unitario).toFixed(2),
            (item.quantidade * item.preco_unitario).toFixed(2)
        ];
        tableRows.push(itemData);
    });

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 85,
        headStyles: { fillColor: [22, 163, 74] }, // Verde para o cabeçalho da tabela
        theme: 'striped'
    });

    const finalY = doc.lastAutoTable.finalY;
    const subtotal = os.itens.reduce((acc, item) => acc + (item.quantidade * item.preco_unitario), 0);
    
    // --- TOTAL ---
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total: R$ ${subtotal.toFixed(2)}`, pageWidth - 14, finalY + 15, { align: 'right' });
    
    // --- OBSERVAÇÕES ---
    if (os.observacao) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text("Observações:", 14, finalY + 25);
        doc.setFont('helvetica', 'normal');
        const obsLines = doc.splitTextToSize(os.observacao, pageWidth - 28);
        doc.text(obsLines, 14, finalY + 31);
    }
    
    // --- CAMPOS DE ASSINATURA ---
    const signatureY = pageHeight - 50; // Posição vertical perto do final da página
    doc.line(14, signatureY, pageWidth / 2 - 10, signatureY); // Linha da primeira assinatura
    doc.line(pageWidth / 2 + 10, signatureY, pageWidth - 14, signatureY); // Linha da segunda
    
    doc.setFontSize(10);
    doc.text("Assinatura do Cliente", 14 + (pageWidth/2 - 24)/2, signatureY + 5, { align: 'center' });
    doc.text("Assinatura da Empresa", pageWidth/2 + 10 + (pageWidth/2 - 24)/2, signatureY + 5, { align: 'center' });
    
    // --- RODAPÉ ---
    doc.setLineWidth(0.2);
    doc.line(14, pageHeight - 20, pageWidth - 14, pageHeight - 20); // Linha do rodapé
    doc.setFontSize(8);
    doc.text(`Documento gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, pageWidth / 2, pageHeight - 10, { align: 'center' });


    // --- ABRIR TELA DE IMPRESSÃO EM VEZ DE BAIXAR ---
    const pdfDataUri = doc.output('datauristring');
    const printWindow = window.open('', '_blank');
    printWindow.document.write('<html><head><title>Imprimir Ordem de Serviço</title></head><body>');
    printWindow.document.write('<iframe width="100%" height="100%" src="' + pdfDataUri + '"></iframe>');
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    // A impressão é acionada após o iframe carregar
    printWindow.onload = function() {
        printWindow.print();
    };
};