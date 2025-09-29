import React from 'react';
import Barcode from 'react-barcode';
import './BarcodeModal.css';

function BarcodeModal({ isOpen, onClose, produto }) {
    if (!isOpen || !produto) return null;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content barcode-modal" onClick={e => e.stopPropagation()}>
                <div id="etiqueta-para-imprimir">
                    <h4>{produto.nome}</h4>
                    <Barcode value={produto.codigo_barras} width={2} height={50} fontSize={16} />
                </div>
                <div className="modal-actions no-print">
                    <button onClick={onClose} className="modal-button cancel">Fechar</button>
                    <button onClick={handlePrint} className="modal-button confirm">Imprimir</button>
                </div>
            </div>
        </div>
    );
}

export default BarcodeModal;