import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../../context/AuthContext';
import './ProdutoModal.css';
import { FaUpload } from 'react-icons/fa';

function ProdutoModal({ isOpen, onClose, produto, onSave }) {
    const [formData, setFormData] = useState({});
    const [imagemSelecionada, setImagemSelecionada] = useState(null);
    const [previewImagem, setPreviewImagem] = useState(null);
    const [error, setError] = useState('');
    const { token } = useContext(AuthContext);

    useEffect(() => {
        if (isOpen) {
            if (produto) {
                setFormData(produto);
                setPreviewImagem(produto.imagem_url);
            } else {
                setFormData({ nome: '', descricao: '', preco_venda: '', custo: '', quantidade_estoque: '', categoria: '' });
                setPreviewImagem(null);
            }
            setError('');
            setImagemSelecionada(null);
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
        
        const camposObrigatorios = ['nome', 'preco_venda', 'custo', 'quantidade_estoque', 'categoria'];
        for (const campo of camposObrigatorios) {
            if (!formData[campo]) {
                setError('Por favor, preencha todos os campos obrigatórios (*).');
                return;
            }
        }
        
        onSave(formData, imagemSelecionada);
    };

    return (
        <div className="modal-overlay">
            <form className="modal-content produto-modal" onSubmit={handleSubmit}>
                <div className="modal-header">
                    <h2>{produto ? 'Editar Produto' : 'Cadastrar Novo Produto'}</h2>
                </div>

                <div className="modal-body">
                    {error && <p className="error-message" style={{marginBottom: '20px'}}>{error}</p>}
                    
                    <div className="form-grid">
                        <div className="form-group form-group-span-2">
                            <label htmlFor="nome">Nome do Produto*</label>
                            <input type="text" name="nome" value={formData.nome || ''} onChange={handleChange} />
                        </div>
                        <div className="form-group form-group-span-2">
                            <label htmlFor="descricao">Descrição / Observação</label>
                            <textarea name="descricao" value={formData.descricao || ''} onChange={handleChange} rows="3"></textarea>
                        </div>
                        <div className="form-group">
                            <label htmlFor="preco_venda">Preço de Venda*</label>
                            <input type="number" name="preco_venda" value={formData.preco_venda || ''} onChange={handleChange} step="0.01" />
                        </div>
                        <div className="form-group">
                            <label htmlFor="custo">Preço de Custo*</label>
                            <input type="number" name="custo" value={formData.custo || ''} onChange={handleChange} step="0.01" />
                        </div>
                        <div className="form-group">
                            <label htmlFor="quantidade_estoque">Estoque Inicial*</label>
                            <input type="number" name="quantidade_estoque" value={formData.quantidade_estoque || ''} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="categoria">Categoria*</label>
                            <input type="text" name="categoria" value={formData.categoria || ''} onChange={handleChange} />
                        </div>
                        {produto && (
                            <div className="form-group form-group-span-2">
                                <label htmlFor="codigo_barras">Código de Barras</label>
                                <input type="text" name="codigo_barras" value={formData.codigo_barras || ''} readOnly disabled />
                            </div>
                        )}
                        <div className="form-group form-group-span-2">
                            <label>Imagem do Produto</label>
                            <div className="file-input-wrapper">
                                <label htmlFor="imagem-upload" className="custom-file-upload">
                                    <FaUpload />
                                    <span>{imagemSelecionada ? imagemSelecionada.name : 'Selecionar imagem...'}</span>
                                </label>
                                <input type="file" id="imagem-upload" accept="image/*" onChange={handleImagemChange} />
                            </div>
                            <p className="input-hint">Formatos aceitos: JPG, PNG. Tamanho máximo: 5MB.</p>
                            {previewImagem && <img src={previewImagem} alt="Preview" className="imagem-preview" />}
                        </div>
                    </div>
                </div>
                
                <div className="modal-footer">
                    <button type="button" onClick={onClose} className="modal-button cancel">Cancelar</button>
                    <button type="submit" className="modal-button confirm">Salvar</button>
                </div>
            </form>
        </div>
    );
}

export default ProdutoModal;