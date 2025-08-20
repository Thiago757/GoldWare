import React, { useState, useEffect } from 'react';
import CurrencyInput from 'react-currency-input-field';
import './ConfirmationModal.css';

function PagamentoModal({ isOpen, onClose, onFinalize, totalVenda }) {
    const [pagamentos, setPagamentos] = useState([]);
    const [formaPagamento, setFormaPagamento] = useState('Dinheiro');
    const [valorAtual, setValorAtual] = useState('0');
    const [parcelas, setParcelas] = useState(1);
    
    const totalPago = pagamentos.reduce((acc, p) => acc + p.valor, 0);
    const valorFaltante = totalVenda - totalPago;

    useEffect(() => {
        if (isOpen) {
            setPagamentos([]);
            setFormaPagamento('Dinheiro');
            setParcelas(1);
            setValorAtual((totalVenda > 0 ? totalVenda.toFixed(2) : '0').replace('.', ','));
        }
    }, [isOpen, totalVenda]); 

    if (!isOpen) return null;

    const adicionarPagamento = () => {
        const valorNumerico = parseFloat((valorAtual || '0').replace(/\./g, '').replace(',', '.'));

        if (!valorNumerico || valorNumerico <= 0 || valorNumerico > valorFaltante + 0.001) {
            alert('Valor de pagamento inválido ou maior que o saldo devedor.');
            return;
        }

        const novoPagamento = {
            forma: formaPagamento,
            valor: valorNumerico,
            ...(formaPagamento === 'Cartão de Crédito' && { parcelas: parcelas }),
        };
        setPagamentos([...pagamentos, novoPagamento]);
        
        const novoValorFaltante = valorFaltante - valorNumerico;
        setValorAtual((novoValorFaltante > 0 ? novoValorFaltante.toFixed(2) : '0').replace('.', ','));
    };

    const handleFinalizeClick = () => {
        if (valorFaltante > 0.001) { 
            alert('Ainda há um saldo a pagar!');
            return;
        }
        onFinalize({ pagamentos, troco: -valorFaltante });
    };
    
   return (
    <div className="modal-overlay">
        <div className="modal-content" style={{textAlign: 'left', minWidth: '500px'}}>
            <h2>Finalizar Venda</h2>
            <div className="pagamento-total"><span>Valor Total:</span><strong>R$ {totalVenda.toFixed(2)}</strong></div>
            <div className="pagamento-total pago"><span>Total Pago:</span><strong>R$ {totalPago.toFixed(2)}</strong></div>
            <div className="pagamento-total faltando"><span>Faltando:</span><strong>R$ {valorFaltante > 0 ? valorFaltante.toFixed(2) : '0.00'}</strong></div>

            <div className="pagamentos-adicionados">
                {pagamentos.map((p, i) => (
                    <div key={i} className="pagamento-item">
                        <span>{p.forma} {p.parcelas ? `(${p.parcelas}x)` : ''}: R$ {p.valor.toFixed(2)}</span>
                    </div>
                ))}
            </div>

            {valorFaltante > 0.001 && (
                <div className="pagamento-form">
                    {/* Classes específicas adicionadas aos wrappers */}
                    <div className="form-field tipo-pagamento">
                        <label>Forma</label>
                        <select value={formaPagamento} onChange={e => setFormaPagamento(e.target.value)}>
                            <option value="Dinheiro">Dinheiro</option>
                            <option value="Cartão de Crédito">Cartão de Crédito</option>
                            <option value="Cartão de Débito">Cartão de Débito</option>
                            <option value="Pix">Pix</option>
                        </select>
                    </div>
                    <div className="form-field valor-pagamento">
                         <label>Valor a Pagar</label>
                         <CurrencyInput
                            name="valor-pagamento"
                            value={valorAtual}
                            onValueChange={(value) => setValorAtual(value || '0')}
                            placeholder="R$ 0,00"
                            prefix="R$ "
                            decimalsLimit={2}
                            decimalSeparator=","
                            groupSeparator="."
                        />
                    </div>
                    {formaPagamento === 'Cartão de Crédito' && (
                        <div className="form-field parcelas-pagamento">
                            <label>Parcelas</label>
                            <select value={parcelas} onChange={e => setParcelas(parseInt(e.target.value))}>
                                {[...Array(12).keys()].map(i => <option key={i+1} value={i+1}>{i+1}x</option>)}
                            </select>
                        </div>
                    )}
                    <div className="form-field add-pagamento">
                         <label>&nbsp;</label>
                         <button onClick={adicionarPagamento} className="add-pagamento-btn">+</button>
                    </div>
                </div>
            )}
            
            {valorFaltante < -0.001 && (
                <div className="pagamento-troco"><span>Troco:</span><strong>R$ {(-valorFaltante).toFixed(2)}</strong></div>
            )}

            <div className="modal-actions">
                <button onClick={onClose} className="modal-button cancel">Voltar</button>
                <button onClick={handleFinalizeClick} className="modal-button confirm" disabled={valorFaltante > 0.001}>Finalizar Venda</button>
            </div>
        </div>
    </div>
);
}

export default PagamentoModal;