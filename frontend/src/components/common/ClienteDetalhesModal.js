import React from 'react';
import { formatCPF, formatTelefone } from '../../utils/formatters';
import './VendaDetalhesModal.css';

function ClienteDetalhesModal({ isOpen, onClose, clienteData, loading }) {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content details-modal" onClick={e => e.stopPropagation()}>
                {loading ? (
                    <p>Carregando detalhes do cliente...</p>
                ) : clienteData ? (
                    <>
                        <h2>Detalhes do Cliente</h2>

                        <div className="details-grid">
                            <div><strong>Nome:</strong> {clienteData.nome}</div>
                            <div><strong>CPF:</strong> {formatCPF(clienteData.cpf)}</div>
                            <div><strong>Telefone:</strong> {formatTelefone(clienteData.telefone)}</div>
                            <div><strong>Email:</strong> {clienteData.email}</div>
                            <div style={{gridColumn: 'span 2'}}><strong>Endereço:</strong> {clienteData.endereco}</div>
                            <div><strong>Status:</strong> <span className={`status-${clienteData.status.toLowerCase()}`}>{clienteData.status}</span></div>
                            <div><strong>Cliente Desde:</strong> {new Date(clienteData.data_cadastro).toLocaleDateString('pt-BR')}</div>
                        </div>

                        <div className="modal-actions">
                            <button onClick={onClose} className="modal-button cancel">Fechar</button>
                        </div>
                    </>
                ) : (
                    <p>Não foi possível carregar os detalhes do cliente.</p>
                )}
            </div>
        </div>
    );
}

export default ClienteDetalhesModal;