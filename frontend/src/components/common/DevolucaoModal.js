import React, { useState, useEffect } from 'react'; // Adicionado useEffect
import './ConfirmationModal.css'; // Usando o CSS do ConfirmationModal

function DevolucaoModal({ isOpen, onClose, onConfirm }) {
    const [observacao, setObservacao] = useState('');

    // Limpa a observação quando o modal é aberto ou fechado para novas devoluções
    useEffect(() => {
        if (!isOpen) {
            setObservacao(''); // Limpa o campo quando o modal fecha
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (observacao.trim() === '') {
            alert("Por favor, preencha o motivo da devolução.");
            return;
        }
        onConfirm(observacao);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{textAlign: 'left'}}>
                <h2>Registrar Devolução</h2>
                <p>Por favor, descreva o motivo da devolução. Esta ação irá estornar o estoque dos produtos e cancelar as contas a receber associadas.</p>
                <div className="modal-form-group">
                    <label htmlFor="observacao-devolucao" className="modal-label">Motivo da Devolução*</label>
                    <textarea 
                        id="observacao-devolucao" 
                        rows="5" // Aumentado para mais espaço
                        value={observacao} 
                        onChange={e => setObservacao(e.target.value)} 
                        required 
                        className="modal-textarea" // Nova classe para estilização
                        placeholder="Ex: Cliente insatisfeito, produto com defeito, etc."
                    ></textarea>
                </div>
                <div className="modal-actions">
                    <button onClick={onClose} className="modal-button cancel">Cancelar</button>
                    <button onClick={handleConfirm} className="modal-button confirm">Confirmar Devolução</button>
                </div>
            </div>
        </div>
    );
}

export default DevolucaoModal;