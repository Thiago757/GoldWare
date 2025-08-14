// frontend/src/components/common/PagamentoModal.js
import React, { useState, useEffect } from 'react';
import './ConfirmationModal.css'; // Reutilizaremos parte do CSS do outro modal

function PagamentoModal({ isOpen, onClose, onFinalize, totalVenda }) {
    const [formaPagamento, setFormaPagamento] = useState('Dinheiro');
    const [valorPago, setValorPago] = useState(0);
    const [troco, setTroco] = useState(0);

    useEffect(() => {
        if (isOpen) {
            setFormaPagamento('Dinheiro');
            setValorPago(totalVenda);
        }
    }, [isOpen, totalVenda]);

    useEffect(() => {
        if (formaPagamento === 'Dinheiro') {
            const trocoCalculado = valorPago - totalVenda;
            setTroco(trocoCalculado > 0 ? trocoCalculado : 0);
        } else {
            setTroco(0);
            setValorPago(totalVenda); 
        }
    }, [valorPago, totalVenda, formaPagamento]);


    if (!isOpen) return null;

    const handleFinalizeClick = () => {
        if (valorPago < totalVenda) {
            alert('O valor pago não pode ser menor que o total da venda.');
            return;
        }
        onFinalize({
            formaPagamento,
            valorPago,
            valorTotal: totalVenda,
            troco,
        });
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{textAlign: 'left'}}>
                <h2>Finalizar Venda</h2>
                <div className="pagamento-total">
                    <span>Valor Total a Pagar:</span>
                    <strong>R$ {totalVenda.toFixed(2)}</strong>
                </div>

                <div className="pagamento-form-group">
                    <label htmlFor="forma-pagamento">Forma de Pagamento</label>
                    <select id="forma-pagamento" value={formaPagamento} onChange={e => setFormaPagamento(e.target.value)}>
                        <option value="Dinheiro">Dinheiro</option>
                        <option value="Cartão de Crédito">Cartão de Crédito</option>
                        <option value="Cartão de Débito">Cartão de Débito</option>
                        <option value="Pix">Pix</option>
                    </select>
                </div>

                <div className="pagamento-form-group">
                    <label htmlFor="valor-pago">Valor Pago</label>
                    <input
                        id="valor-pago"
                        type="number"
                        value={valorPago.toFixed(2)}
                        onChange={e => setValorPago(parseFloat(e.target.value) || 0)}
                        disabled={formaPagamento !== 'Dinheiro'}
                    />
                </div>

                {formaPagamento === 'Dinheiro' && (
                    <div className="pagamento-troco">
                        <span>Troco:</span>
                        <strong>R$ {troco.toFixed(2)}</strong>
                    </div>
                )}

                <div className="modal-actions" style={{justifyContent: 'space-between'}}>
                    <button onClick={onClose} className="modal-button cancel">
                        Cancelar
                    </button>
                    <button onClick={handleFinalizeClick} className="modal-button confirm" style={{backgroundColor: '#16a34a'}}>
                        Finalizar Venda
                    </button>
                </div>
            </div>
        </div>
    );
}

export default PagamentoModal;