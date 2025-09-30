import React, { useState, useEffect } from 'react';
import './TipoServicoModal.css'; 

function TipoServicoModal({ isOpen, onClose, onSave, tipoEmEdicao }) {
    const [nome, setNome] = useState('');

    useEffect(() => {
        if (tipoEmEdicao) {
            setNome(tipoEmEdicao.nome);
        } else {
            setNome(''); 
        }
    }, [tipoEmEdicao, isOpen]); 

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!nome) {
            alert('Por favor, preencha o nome.');
            return;
        }
        onSave({ ...tipoEmEdicao, nome });
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h2>{tipoEmEdicao ? 'Editar Tipo de Serviço' : 'Novo Tipo de Serviço'}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="nome-tipo-servico">Nome da Categoria</label>
                        <input
                            id="nome-tipo-servico"
                            type="text"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            placeholder="Ex: Polimento, Ajuste, Limpeza"
                            autoFocus
                        />
                    </div>
                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="modal-button cancel">Cancelar</button>
                        <button type="submit" className="modal-button confirm">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default TipoServicoModal;