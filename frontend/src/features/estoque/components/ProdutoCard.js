import React from 'react';
import { FaEdit } from 'react-icons/fa';
import './ProdutoCard.css';

const placeholderImage = 'https://i.imgur.com/gJZT2n2.png';

function ProdutoCard({ produto, onEdit, onToggleStatus }) {
    const precoFormatado = `R$ ${parseFloat(produto.preco_venda).toFixed(2)}`;
    const statusClasse = produto.ativo === 'S' ? 'ativo' : 'inativo';

    const imageUrl = produto.imagem_url 
        ? `${process.env.REACT_APP_API_BASE_URL}${produto.imagem_url}` 
        : placeholderImage;
    
    return (
        <div className="produto-card">
            <div className="produto-imagem-container">
                <img src={imageUrl} alt={produto.nome} />
                <span className={`status-badge ${statusClasse}`}>
                    {produto.ativo === 'S' ? 'Ativo' : 'Inativo'}
                </span>
            </div>
            <div className="produto-info">
                <div className="info-header">
                    <span className="produto-categoria">{produto.categoria}</span>
                    <h3 className="produto-nome">{produto.nome}</h3>
                </div>
                <div className="info-body">
                    <div className="info-item">
                        <span>Estoque</span>
                        <strong>{produto.quantidade_estoque}</strong>
                    </div>
                    <div className="info-item">
                        <span>Preço</span>
                        <strong className="produto-preco">{precoFormatado}</strong>
                    </div>
                </div>
            </div>
            <div className="produto-acoes">
                <button onClick={onEdit} className="edit-btn" title="Editar Produto">
                    <FaEdit />
                </button>
                <div className="toggle-switch">
                    <input 
                        type="checkbox" 
                        id={`switch-${produto.id_produto}`}
                        checked={produto.ativo === 'S'}
                        onChange={onToggleStatus}
                    />
                    <label htmlFor={`switch-${produto.id_produto}`}></label>
                </div>
            </div>
        </div>
    );
}

export default ProdutoCard;