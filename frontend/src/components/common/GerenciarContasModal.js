import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { FaPlus } from 'react-icons/fa';
import AddContaModal from './AddContaModal';
import './ConfirmationModal.css'; 
import './GerenciarFinanceiro.css'; // <--- IMPORTE O NOVO CSS

function GerenciarContasModal({ isOpen, onClose }) {
    const { token } = useContext(AuthContext);
    const [contas, setContas] = useState([]);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchContas = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:3001/api/contas-bancarias', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setContas(data);
        } catch (err) { console.error(err); } 
        finally { setLoading(false); }
    };

    useEffect(() => {
        if (isOpen && token) fetchContas();
    }, [isOpen, token]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            {/* Container com a classe nova */}
            <div className="gerenciar-modal-container">
                
                {/* Header */}
                <div className="gerenciar-header">
                    <h2>Contas Bancárias</h2>
                    <button onClick={() => setIsAddOpen(true)} className="btn-adicionar">
                        <FaPlus /> Nova Conta
                    </button>
                </div>

                {/* Body (Tabela com Scroll) */}
                <div className="gerenciar-body">
                    {loading ? (
                        <div className="lista-vazia">Carregando...</div>
                    ) : (
                        <table className="gerenciar-table">
                            <thead>
                                <tr>
                                    <th>Conta / Banco</th>
                                    <th>Agência / Nº</th>
                                    <th style={{textAlign: 'right'}}>Saldo Atual</th>
                                </tr>
                            </thead>
                            <tbody>
                                {contas.map(conta => (
                                    <tr key={conta.id_conta_bancaria}>
                                        <td>
                                            <span className="conta-banco-nome">{conta.nome_conta}</span>
                                            <span className="conta-banco-desc">{conta.banco}</span>
                                        </td>
                                        <td>
                                            <span className="conta-banco-desc">
                                                Ag: {conta.agencia || '-'} / CC: {conta.numero_conta || '-'}
                                            </span>
                                        </td>
                                        <td style={{textAlign: 'right'}}>
                                            <span className="valor-positivo">
                                                R$ {Number(conta.saldo).toFixed(2)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {contas.length === 0 && (
                                    <tr><td colSpan="3" className="lista-vazia">Nenhuma conta cadastrada.</td></tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer */}
                <div className="gerenciar-footer">
                    <button onClick={onClose} className="btn-fechar">Fechar</button>
                </div>
            </div>

            <AddContaModal 
                isOpen={isAddOpen} 
                onClose={() => setIsAddOpen(false)} 
                onContaSaved={fetchContas} 
            />
        </div>
    );
}

export default GerenciarContasModal;