import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { VendaContext } from '../../context/VendaContext';
import ClienteSelectModal from '../../components/common/ClienteSelectModal';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import DatePicker, { registerLocale } from 'react-datepicker';
import ptBR from 'date-fns/locale/pt-BR';
import "react-datepicker/dist/react-datepicker.css"; 
import './VendasListPage.css';
import { FaTimesCircle } from 'react-icons/fa'; 

registerLocale('pt-BR', ptBR);

function VendasListPage() {
    const [vendas, setVendas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isClienteModalOpen, setClienteModalOpen] = useState(false);
    const [modalAberto, setModalAberto] = useState(false);
    const [vendaParaCancelar, setVendaParaCancelar] = useState(null);
    const [filtros, setFiltros] = useState({ startDate: null, endDate: null, status: '' });
    
    const { token } = useContext(AuthContext);
    const { iniciarNovaVenda } = useContext(VendaContext);
    const navigate = useNavigate();

    const fetchVendas = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filtros.startDate) params.append('startDate', filtros.startDate.toISOString());
            if (filtros.endDate) params.append('endDate', filtros.endDate.toISOString());
            if (filtros.status) params.append('status', filtros.status);

            const response = await fetch(`http://localhost:3001/api/vendas?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Falha ao buscar vendas');
            const data = await response.json();
            setVendas(data);
        } catch (error) {
            console.error("Erro:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchVendas();
        }
    }, [token]);

    const handleClienteSelecionado = (cliente) => {
        iniciarNovaVenda(cliente);
        setClienteModalOpen(false);
        navigate('/vendas/nova');
    };

    const handleCancelarVenda = async () => {
        if (!vendaParaCancelar) return;
        try {
            const response = await fetch(`http://localhost:3001/api/vendas/${vendaParaCancelar.id_venda}/cancelar`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Falha ao cancelar a venda');
            
            setModalAberto(false);
            setVendaParaCancelar(null);
            fetchVendas(); 
        } catch (error) {
            console.error("Erro ao cancelar venda:", error);
            alert("Erro ao cancelar venda.");
        }
    };

    if (loading && vendas.length === 0) return <p>Carregando histórico de vendas...</p>;

    return (
        <>
            <div className="vendas-list-container">
                <div className="vendas-list-header">
                    <h1>Histórico de Vendas</h1>
                    <button onClick={() => setClienteModalOpen(true)} className="nova-venda-btn">+ Nova Venda</button>
                </div>

                <div className="filtros-container">
                    <DatePicker 
                        selected={filtros.startDate} 
                        onChange={date => setFiltros({...filtros, startDate: date})} 
                        className="filtro-input" 
                        placeholderText="Data Início"
                        locale="pt-BR"
                        dateFormat="dd/MM/yyyy"
                        isClearable 
                    />
                    <DatePicker 
                        selected={filtros.endDate} 
                        onChange={date => setFiltros({...filtros, endDate: date})} 
                        className="filtro-input" 
                        placeholderText="Data Fim" 
                        locale="pt-BR"
                        dateFormat="dd/MM/yyyy"
                        isClearable
                    />
                    <select value={filtros.status} onChange={e => setFiltros({...filtros, status: e.target.value})} className="filtro-input">
                        <option value="">Todos os Status</option>
                        <option value="pago">Pago</option>
                        <option value="pendente">Pendente</option>
                        <option value="cancelado">Cancelado</option>
                    </select>
                    <button onClick={fetchVendas} className="filtrar-btn">Filtrar</button>
                </div>

                <div className="vendas-table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>ID Venda</th>
                                <th>Data</th>
                                <th>Cliente</th>
                                <th>Valor Total</th>
                                <th>Status</th>
                                <th>Ações</th> {/* Nova coluna de ações */}
                            </tr>
                        </thead>
                        <tbody>
                            {vendas.map(venda => (
                                <tr key={venda.id_venda}>
                                    <td>#{venda.id_venda}</td>
                                    <td>{new Date(venda.data_venda).toLocaleDateString('pt-BR')}</td>
                                    <td>{venda.nome_cliente || 'N/A'}</td>
                                    <td>R$ {parseFloat(venda.valor_total).toFixed(2)}</td>
                                    <td>
                                        <span className={`status-${(venda.status_pagamento || 'default').toLowerCase()}`}>
                                            {venda.status_pagamento || 'N/A'}
                                        </span>
                                    </td>
                                    <td>
                                        {/* Botão para abrir o modal de cancelamento */}
                                        <button 
                                            onClick={() => {setVendaParaCancelar(venda); setModalAberto(true);}} 
                                            className="cancelar-venda-icon-btn"
                                            title="Cancelar Venda"
                                            disabled={venda.status_pagamento === 'cancelado'}
                                        >
                                            <FaTimesCircle />
                                        </button>
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
            <ConfirmationModal 
                isOpen={modalAberto}
                onClose={() => setModalAberto(false)}
                onConfirm={handleCancelarVenda}
                title="Confirmar Cancelamento"
                message={`Tem certeza que deseja cancelar a Venda #${vendaParaCancelar?.id_venda}? O estoque dos produtos será estornado.`}
            />
        </>
    );
}

export default VendasListPage;