import React, { useState, useEffect } from 'react';
import './TipoServicoModal.css'; 

function CategoriaProdutoModal({ isOpen, onClose, onSave, categoriaEmEdicao }) {
    const [nome, setNome] = useState('');

    useEffect(() => {
        if (categoriaEmEdicao) {
            setNome(categoriaEmEdicao.nome);
        } else {
            setNome('');
        }
    }, [categoriaEmEdicao, isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!nome.trim()) {
            alert('Por favor, insira o nome da categoria.');
            return;
        }
        onSave({
            id_categoria: categoriaEmEdicao ? categoriaEmEdicao.id_categoria : undefined,
            nome: nome,
        });
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>{categoriaEmEdicao ? 'Editar Categoria' : 'Nova Categoria de Produto'}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="nome">Nome da Categoria</label>
                        <input
                            id="nome"
                            type="text"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            placeholder="Ex: Eletrônicos, Roupas, Alimentos"
                            required
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

export default CategoriaProdutoModal;