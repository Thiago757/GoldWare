// src/features/servicos/OrdensServicoListPage.js

import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import ClienteSelectModal from '../../components/common/ClienteSelectModal';
// Importe seu StatusBadge de um local comum se você o moveu, senão precisará dele aqui.
// import StatusBadge from '../../components/common/StatusBadge'; 

function OrdensServicoListPage() {
    const [ordensServico, setOrdensServico] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isClienteModalOpen, setClienteModalOpen] = useState(false);
    const { token } = useContext(AuthContext);
    const navigate = useNavigate();

    const fetchOrdensServico = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const response = await fetch('http://localhost:3001/api/ordens-servico', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Falha ao buscar Ordens de Serviço');
            const data = await response.json();
            setOrdensServico(data);
        } catch (error) {
            console.error("Erro:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrdensServico();
    }, [token]);

    const handleClienteSelecionado = async (cliente) => {
        setClienteModalOpen(false);
        try {
            const response = await fetch('http://localhost:3001/api/ordens-servico', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ id_cliente: cliente.id_cliente })
            });
            if (!response.ok) throw new Error('Falha ao criar nova Ordem de Serviço');
            const novaOS = await response.json();
            
            // Redireciona para a página de detalhes da nova OS
            navigate(`/ordens-servico/${novaOS.id_os}`);

        } catch (error) {
            console.error("Erro ao iniciar OS:", error);
            alert('Não foi possível iniciar a Ordem de Serviço.');
        }
    };

    return (
        <>
            <div className="vendas-list-container">
                <div className="vendas-list-header">
                    <h1>Ordens de Serviço</h1>
                    <button onClick={() => setClienteModalOpen(true)} className="nova-venda-btn">+ Nova OS</button>
                </div>

                <div className="vendas-table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>N° OS</th>
                                <th>Cliente</th>
                                <th>Data de Abertura</th>
                                <th>Valor Total</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5">Carregando...</td></tr>
                            ) : ordensServico.map(os => (
                                <tr key={os.id_os} className="linha-clicavel" onClick={() => navigate(`/ordens-servico/${os.id_os}`)}>
                                    <td>#{os.id_os}</td>
                                    <td>{os.nome_cliente}</td>
                                    <td>{new Date(os.data_abertura).toLocaleDateString('pt-BR')}</td>
                                    <td>R$ {parseFloat(os.valor_total || 0).toFixed(2)}</td>
                                    <td>
                                        {/* Idealmente, usar o componente StatusBadge aqui */}
                                        <span className={`status-${(os.status || 'default').toLowerCase()}`}>{os.status}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <ClienteSelectModal 
                isOpen={isClienteModalOpen} 
                onClose={() => setClienteModalOpen(false)} 
                onConfirm={handleClienteSelecionado} 
            />
        </>
    );
}

export default OrdensServicoListPage;