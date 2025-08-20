import React from 'react';
import './ProdutoCard.css';

const placeholderImage = 'https://i.imgur.com/gJZT2n2.png';

function ProdutoCard({ produto, onEdit, onToggleStatus }) {
    const precoFormatado = `R$ ${parseFloat(produto.preco_venda).toFixed(2)}`;
    const statusClasse = produto.ativo === 'S' ? 'ativo' : 'inativo';

    return (
        <div className="produto-card">
            <div className="produto-imagem-container">
                <img src={produto.imagem_url || placeholderImage} alt={produto.nome} />
                <span className={`status-badge ${statusClasse}`}>
                    {produto.ativo === 'S' ? 'Ativo' : 'Inativo'}
                </span>
            </div>
            <div className="produto-info">
                <span className="produto-categoria">{produto.categoria}</span>
                <h3 className="produto-nome">{produto.nome}</h3>
                <p className="produto-preco">{precoFormatado}</p>
                <div className="produto-estoque">
                    Estoque: <strong>{produto.quantidade_estoque}</strong>
                </div>
            </div>
            <div className="produto-acoes">
                <button onClick={onEdit} className="edit-btn">Editar</button>
                
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