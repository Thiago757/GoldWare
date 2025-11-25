import React from 'react';
import { formatCNPJ, formatTelefone } from '../../utils/formatters';
import './VendaDetalhesModal.css';

function FornecedorDetalhesModal({ isOpen, onClose, fornecedorData, loading }) {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content details-modal" onClick={e => e.stopPropagation()}>
                {loading ? (
                    <p>Carregando detalhes do fornecedor...</p>
                ) : fornecedorData ? (
                    <>
                        <h2>Detalhes do Fornecedor</h2>

                        <div className="details-grid">
                            <div style={{gridColumn: 'span 2'}}><strong>Razão Social/Nome:</strong> {fornecedorData.nome}</div>
                            
                            <div><strong>CNPJ:</strong> {formatCNPJ(fornecedorData.cnpj)}</div>
                            <div><strong>Status:</strong> <span className={`status-${fornecedorData.status.toLowerCase()}`}>{fornecedorData.status}</span></div>
                            
                            <div><strong>Telefone:</strong> {formatTelefone(fornecedorData.telefone)}</div>
                            <div><strong>Responsável:</strong> {fornecedorData.responsavel || '-'}</div>
                            
                            <div style={{gridColumn: 'span 2'}}><strong>Email:</strong> {fornecedorData.email}</div>
                            
                            <div style={{gridColumn: 'span 2'}}><strong>Endereço:</strong> {fornecedorData.endereco}</div>
                            
                            <div><strong>Cadastrado em:</strong> {new Date(fornecedorData.data_cadastro).toLocaleDateString('pt-BR')}</div>
                        </div>

                        <div className="modal-actions">
                            <button onClick={onClose} className="modal-button cancel">Fechar</button>
                        </div>
                    </>
                ) : (
                    <p>Não foi possível carregar os detalhes do fornecedor.</p>
                )}
            </div>
        </div>
    );
}

export default FornecedorDetalhesModal;