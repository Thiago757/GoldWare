// frontend/src/features/estoque/components/ProdutoModal.js
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../../context/AuthContext';
import './ProdutoModal.css';

function ProdutoModal({ isOpen, onClose, produto, onSave }) {
    const [formData, setFormData] = useState({});
    const [imagemSelecionada, setImagemSelecionada] = useState(null);
    const [previewImagem, setPreviewImagem] = useState(null);
    const [error, setError] = useState('');
    const { token } = useContext(AuthContext);

    useEffect(() => {
        if (produto) {
            setFormData(produto);
            setPreviewImagem(produto.imagem_url);
        } else {
            setFormData({ nome: '', descricao: '', preco_venda: 0, custo: 0, quantidade_estoque: 0, categoria: '' });
            setPreviewImagem(null);
        }
    }, [produto, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImagemChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImagemSelecionada(file);
            setPreviewImagem(URL.createObjectURL(file));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData, imagemSelecionada);
    };

    return (
        <div className="modal-overlay">
            <form className="modal-content produto-modal" onSubmit={handleSubmit}>
                <h2>{produto ? 'Editar Produto' : 'Cadastrar Novo Produto'}</h2>

                <div className="form-grid">
                    <div className="form-group form-group-span-2">
                        <label htmlFor="nome">Nome do Produto*</label>
                        <input type="text" name="nome" value={formData.nome || ''} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="preco_venda">Preço de Venda*</label>
                        <input type="number" name="preco_venda" value={formData.preco_venda || ''} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="quantidade_estoque">Estoque Inicial</label>
                        <input type="number" name="quantidade_estoque" value={formData.quantidade_estoque || ''} onChange={handleChange} />
                    </div>
                    <div className="form-group form-group-span-2">
                        <label htmlFor="categoria">Categoria</label>
                        <input type="text" name="categoria" value={formData.categoria || ''} onChange={handleChange} />
                    </div>
                    <div className="form-group form-group-span-2">
                        <label>Imagem do Produto</label>
                        <input type="file" accept="image/*" onChange={handleImagemChange} />
                        {previewImagem && <img src={previewImagem} alt="Preview" className="imagem-preview" />}
                    </div>
                </div>

                {error && <p className="error-message">{error}</p>}

                <div className="modal-actions">
                    <button type="button" onClick={onClose} className="modal-button cancel">Cancelar</button>
                    <button type="submit" className="modal-button confirm">Salvar</button>
                </div>
            </form>
        </div>
    );
}

export default ProdutoModal;