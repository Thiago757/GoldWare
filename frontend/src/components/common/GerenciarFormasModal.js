import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { FaPlus } from 'react-icons/fa';
import AddFormaPagamentoModal from './AddFormaPagamentoModal';
import './ConfirmationModal.css';
import './GerenciarFinanceiro.css'; // <--- IMPORTE O NOVO CSS

function GerenciarFormasModal({ isOpen, onClose }) {
    const { token } = useContext(AuthContext);
    const [formas, setFormas] = useState([]);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchFormas = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:3001/api/formas-pagamento', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setFormas(data);
        } catch (err) { console.error(err); } 
        finally { setLoading(false); }
    };

    useEffect(() => {
        if (isOpen && token) fetchFormas();
    }, [isOpen, token]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="gerenciar-modal-container" style={{maxWidth: '500px'}}> {/* Um pouco menor */}
                
                <div className="gerenciar-header">
                    <h2>Formas de Pagamento</h2>
                    {/* Botão secundário (cor diferente) */}
                    <button onClick={() => setIsAddOpen(true)} className="btn-adicionar secundario">
                        <FaPlus /> Nova Forma
                    </button>
                </div>

                <div className="gerenciar-body">
                    {loading ? (
                        <div className="lista-vazia">Carregando...</div>
                    ) : (
                        <table className="gerenciar-table">
                            <thead>
                                <tr>
                                    <th style={{width: '50px'}}>ID</th>
                                    <th>Nome</th>
                                    <th style={{textAlign: 'center', width: '80px'}}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {formas.map(forma => (
                                    <tr key={forma.id_forma_pagamento}>
                                        <td style={{color: '#94a3b8'}}>#{forma.id_forma_pagamento}</td>
                                        <td style={{fontWeight: '500'}}>{forma.nome}</td>
                                        <td style={{textAlign: 'center'}}>
                                            <span className="badge-ativo">Ativo</span>
                                        </td>
                                    </tr>
                                ))}
                                {formas.length === 0 && (
                                    <tr><td colSpan="3" className="lista-vazia">Nenhuma forma cadastrada.</td></tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="gerenciar-footer">
                    <button onClick={onClose} className="btn-fechar">Fechar</button>
                </div>
            </div>

            <AddFormaPagamentoModal 
                isOpen={isAddOpen} 
                onClose={() => {
                    setIsAddOpen(false);
                    fetchFormas(); // Recarrega a lista ao fechar o cadastro
                }} 
            />
        </div>
    );
}

export default GerenciarFormasModal;