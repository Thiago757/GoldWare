import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { VendaContext } from '../../context/VendaContext';
import ClienteSelectModal from '../../components/common/ClienteSelectModal';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import VendaDetalhesModal from '../../components/common/VendaDetalhesModal';
import DatePicker, { registerLocale } from 'react-datepicker';
import ptBR from 'date-fns/locale/pt-BR';
import { startOfWeek, endOfWeek, subWeeks, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, subYears } from 'date-fns';
import "react-datepicker/dist/react-datepicker.css";
import './VendasListPage.css';
import { FaEye, FaTimesCircle } from 'react-icons/fa';
import { BsThreeDotsVertical } from 'react-icons/bs';

registerLocale('pt-BR', ptBR);

function VendasListPage() {
    const [vendas, setVendas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isClienteModalOpen, setClienteModalOpen] = useState(false);
    const [modalAberto, setModalAberto] = useState(false);
    const [vendaParaCancelar, setVendaParaCancelar] = useState(null);
    const [filtros, setFiltros] = useState({ startDate: null, endDate: null, status: '' });
    const [isDetalhesModalOpen, setDetalhesModalOpen] = useState(false);
    const [vendaSelecionada, setVendaSelecionada] = useState(null);
    const [loadingDetalhes, setLoadingDetalhes] = useState(false);
    const [menuAbertoId, setMenuAbertoId] = useState(null);
    const acoesMenuRef = useRef(null);
    const [filtroPeriodo, setFiltroPeriodo] = useState('todos');
    
    const { token } = useContext(AuthContext);
    const { iniciarNovaVenda } = useContext(VendaContext);
    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (acoesMenuRef.current && !acoesMenuRef.current.contains(event.target)) {
                setMenuAbertoId(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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
    
    useEffect(() => {
        const hoje = new Date();
        let startDate = null;
        let endDate = null;

        switch (filtroPeriodo) {
            case 'hoje':
                startDate = hoje;
                endDate = hoje;
                break;
            case 'semana_atual':
                startDate = startOfWeek(hoje, { weekStartsOn: 1 });
                endDate = endOfWeek(hoje, { weekStartsOn: 1 });
                break;
            case 'mes_atual':
                startDate = startOfMonth(hoje);
                endDate = endOfMonth(hoje);
                break;
            case 'mes_passado':
                const mesPassado = subMonths(hoje, 1);
                startDate = startOfMonth(mesPassado);
                endDate = endOfMonth(mesPassado);
                break;
            case 'ano_atual':
                startDate = startOfYear(hoje);
                endDate = endOfYear(hoje);
                break;
            case 'ano_passado':
                 const anoPassado = subYears(hoje, 1);
                 startDate = startOfYear(anoPassado);
                 endDate = endOfYear(anoPassado);
                break;
            default:
                break;
        }
        setFiltros(prevFiltros => ({ ...prevFiltros, startDate, endDate }));
    }, [filtroPeriodo]);

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

    const handleVerDetalhes = async (idVenda) => {
        setVendaSelecionada(null);
        setLoadingDetalhes(true);
        setDetalhesModalOpen(true);
        try {
            const response = await fetch(`http://localhost:3001/api/vendas/${idVenda}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Falha ao buscar detalhes');
            const data = await response.json();
            setVendaSelecionada(data);
        } catch (error) {
            console.error("Erro ao buscar detalhes da venda:", error);
        } finally {
            setLoadingDetalhes(false);
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
                    <div className="filtro-item">
                        <label>Período Rápido</label>
                        <select 
                            className="filtro-input"
                            value={filtroPeriodo}
                            onChange={e => setFiltroPeriodo(e.target.value)}
                        >
                            <option value="todos">Todos</option>
                            <option value="hoje">Hoje</option>
                            <option value="semana_atual">Esta Semana</option>
                            <option value="mes_atual">Este Mês</option>
                            <option value="mes_passado">Mês Passado</option>
                            <option value="ano_atual">Este Ano</option>
                            <option value="ano_passado">Ano Passado</option>
                        </select>
                    </div>
                    <div className="filtro-item">
                        <label>Data Início</label>
                        <DatePicker selected={filtros.startDate} onChange={date => setFiltros({...filtros, startDate: date})} className="filtro-input" placeholderText="DD/MM/AAAA" locale="pt-BR" dateFormat="dd/MM/yyyy" isClearable />
                    </div>
                    <div className="filtro-item">
                        <label>Data Fim</label>
                        <DatePicker selected={filtros.endDate} onChange={date => setFiltros({...filtros, endDate: date})} className="filtro-input" placeholderText="DD/MM/AAAA" locale="pt-BR" dateFormat="dd/MM/yyyy" isClearable />
                    </div>
                    <div className="filtro-item">
                        <label>Status</label>
                        <select value={filtros.status} onChange={e => setFiltros({...filtros, status: e.target.value})} className="filtro-input">
                            <option value="">Todos</option>
                            <option value="pago">Pago</option>
                            <option value="pendente">Pendente</option>
                            <option value="cancelado">Cancelado</option>
                        </select>
                    </div>
                    <button onClick={fetchVendas} className="filtrar-btn">Filtrar</button>
                </div>
                <div className="vendas-table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>N° Venda</th>
                                <th>Data</th>
                                <th>Cliente</th>
                                <th>Valor Total</th>
                                <th>Status</th>
                                <th style={{textAlign: 'right'}}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vendas.map(venda => (
                                <tr key={venda.id_venda}>
                                    <td>#{venda.id_venda}</td>
                                    <td>{new Date(venda.data_venda).toLocaleDateString('pt-BR')}</td>
                                    <td>{venda.nome_cliente || 'N/A'}</td>
                                    <td>R$ {parseFloat(venda.valor_total).toFixed(2)}</td>
                                    <td><span className={`status-${(venda.status_pagamento || 'default').toLowerCase()}`}>{venda.status_pagamento || 'N/A'}</span></td>
                                    <td className="coluna-acoes" ref={menuAbertoId === venda.id_venda ? acoesMenuRef : null}>
                                        <button onClick={() => setMenuAbertoId(menuAbertoId === venda.id_venda ? null : venda.id_venda)} className="action-icon-btn">
                                            <BsThreeDotsVertical />
                                        </button>
                                        {menuAbertoId === venda.id_venda && (
                                            <div className="acoes-dropdown">
                                                <button onClick={() => { handleVerDetalhes(venda.id_venda); setMenuAbertoId(null); }}>
                                                    <FaEye /> Ver Detalhes
                                                </button>
                                                <button 
                                                    onClick={() => { setVendaParaCancelar(venda); setModalAberto(true); setMenuAbertoId(null); }}
                                                    disabled={venda.status_pagamento === 'cancelado'}
                                                    className="cancel-action"
                                                >
                                                    <FaTimesCircle /> Cancelar Venda
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <ClienteSelectModal isOpen={isClienteModalOpen} onClose={() => setClienteModalOpen(false)} onConfirm={handleClienteSelecionado} />
            <ConfirmationModal isOpen={modalAberto} onClose={() => setModalAberto(false)} onConfirm={handleCancelarVenda} title="Confirmar Cancelamento" message={`Tem certeza que deseja cancelar a Venda #${vendaParaCancelar?.id_venda}? O estoque dos produtos será estornado.`} />
            <VendaDetalhesModal isOpen={isDetalhesModalOpen} onClose={() => setDetalhesModalOpen(false)} vendaData={vendaSelecionada} loading={loadingDetalhes} />
        </>
    );
}

export default VendasListPage;