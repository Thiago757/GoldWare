import React from 'react';
import './VendaDetalhesModal.css';

function VendaDetalhesModal({ isOpen, onClose, vendaData, loading }) {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content details-modal" onClick={e => e.stopPropagation()}>
                {loading ? (
                    <p>Carregando detalhes...</p>
                ) : vendaData ? (
                    <>
                        <h2>Detalhes da Venda #{vendaData.detalhes.id_venda}</h2>

                        <div className="details-grid">
                            <div><strong>Cliente:</strong> {vendaData.detalhes.nome_cliente || 'N/A'}</div>
                            <div><strong>Data:</strong> {new Date(vendaData.detalhes.data_venda).toLocaleString('pt-BR')}</div>
                            <div><strong>Status:</strong> <span className={`status-${(vendaData.detalhes.status_pagamento || 'default').toLowerCase()}`}>{vendaData.detalhes.status_pagamento}</span></div>
                            <div><strong>Valor Total:</strong> R$ {parseFloat(vendaData.detalhes.valor_total).toFixed(2)}</div>
                        </div>

                        <h4>Produtos Comprados</h4>
                        <div className="itens-list-scroll">
                            {vendaData.itens.map(item => (
                                <div key={item.id_item} className="item-detail-row">
                                    <span>{item.quantidade}x {item.nome_produto_snapshot || item.id_produto}</span>
                                    <span>R$ {parseFloat(item.preco_unitario * item.quantidade).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>

                        <h4>Pagamentos Efetuados</h4>
                        <div className="pagamentos-list">
                            {vendaData.pagamentos.map(pag => (
                                <div key={pag.id_pagamento} className="pagamento-detail-row">
                                    <span>{pag.forma_pagamento}</span>
                                    <span>R$ {parseFloat(pag.valor_pago).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>

                        <div className="modal-actions">
                            <button onClick={onClose} className="modal-button cancel">Fechar</button>
                        </div>
                    </>
                ) : (
                    <p>Não foi possível carregar os detalhes da venda.</p>
                )}
            </div>
        </div>
    );
}

export default VendaDetalhesModal;