import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { IMaskInput } from 'react-imask';
import { formatCPF } from '../../utils/formatters';
import DatePicker, { registerLocale } from 'react-datepicker';
import ptBR from 'date-fns/locale/pt-BR';
import "react-datepicker/dist/react-datepicker.css";
import '../vendas/VendasListPage.css';
import './PagamentosPage.css';

registerLocale('pt-BR', ptBR);

function PagamentosPage() {
    const [sumario, setSumario] = useState([]);
    const [detalhes, setDetalhes] = useState([]);
    const [extrato, setExtrato] = useState([]);
    const [clienteSelecionado, setClienteSelecionado] = useState(null);
    const [loading, setLoading] = useState(true);
    const { token } = useContext(AuthContext);

    const [view, setView] = useState("resumo"); // resumo | detalhes | extrato

    const [filtros, setFiltros] = useState({ nome: '', cpf: '', startDate: null, endDate: null });
    const [kpis, setKpis] = useState({ aReceber: 0, recebido: 0, atrasado: 0 });

    // Buscar resumo e KPIs
    const fetchData = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const paramsSumario = new URLSearchParams();
            if (filtros.nome) paramsSumario.append('nome', filtros.nome);
            if (filtros.cpf) paramsSumario.append('cpf', filtros.cpf.replace(/[^\d]/g, ""));
            
            const paramsKpis = new URLSearchParams();
            if (filtros.startDate) paramsKpis.append('startDate', filtros.startDate.toISOString().split('T')[0]);
            if (filtros.endDate) paramsKpis.append('endDate', filtros.endDate.toISOString().split('T')[0]);

            const [sumarioRes, kpisRes] = await Promise.all([
                fetch(`http://localhost:3001/api/pagamentos/contas-a-receber/sumario?${paramsSumario.toString()}`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`http://localhost:3001/api/pagamentos/contas-a-receber/kpis?${paramsKpis.toString()}`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (!sumarioRes.ok || !kpisRes.ok) throw new Error('Falha ao buscar dados financeiros');

            const sumarioData = await sumarioRes.json();
            const kpisData = await kpisRes.json();
            
            setSumario(sumarioData);
            setKpis({
                aReceber: parseFloat(kpisData.aReceber) || 0,
                recebido: parseFloat(kpisData.recebido) || 0,
                atrasado: parseFloat(kpisData.atrasado) || 0,
            });

        } catch (error) {
            console.error("Erro:", error);
        } finally {
            setLoading(false);
        }
    };
    
    // Buscar detalhes por cliente
    const fetchDetalhes = async (idCliente) => {
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:3001/api/pagamentos/contas-a-receber/cliente/${idCliente}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Falha ao buscar detalhes');
            const data = await response.json();
            setDetalhes(data);
        } catch (error) {
            console.error("Erro:", error);
        } finally {
            setLoading(false);
        }
    };

    // Buscar extrato completo
    const fetchExtrato = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filtros.startDate) params.append('startDate', filtros.startDate.toISOString().split('T')[0]);
            if (filtros.endDate) params.append('endDate', filtros.endDate.toISOString().split('T')[0]);
            if (filtros.nome) params.append('nome', filtros.nome);
            if (filtros.cpf) params.append('cpf', filtros.cpf.replace(/[^\d]/g, ""));

            const response = await fetch(`http://localhost:3001/api/pagamentos/extrato?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Falha ao buscar extrato');
            const data = await response.json();
            setExtrato(data);
        } catch (error) {
            console.error("Erro:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarcarComoPago = async (idConta) => {
        try {
            await fetch(`http://localhost:3001/api/pagamentos/contas-a-receber/${idConta}/pagar`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (view === "detalhes" && clienteSelecionado) {
                fetchDetalhes(clienteSelecionado.id_cliente);
            } else if (view === "extrato") {
                fetchExtrato();
            }
        } catch (error) {
            alert("Erro ao marcar como pago.");
        }
    };

    useEffect(() => {
        if (token && view === "resumo" && !clienteSelecionado) {
            fetchData();
        }
    }, [token, clienteSelecionado, view]);
    
    const handleFiltroSubmit = (e) => {
        e.preventDefault();
        if (view === "resumo") {
            fetchData();
        } else if (view === "extrato") {
            fetchExtrato();
        }
    };

    if (loading) return <p>Carregando...</p>;

    // ========== VISÃO DETALHES ==========
    if (view === "detalhes" && clienteSelecionado) {
        return (
            <div className="vendas-list-container">
                <div className="vendas-list-header">
                    <h1>Detalhes de: {clienteSelecionado.nome_cliente}</h1>
                    <button onClick={() => { setClienteSelecionado(null); setView("resumo"); }} className="voltar-btn">Voltar ao Resumo</button>
                </div>
                <div className="vendas-table-container">
                    <table>
                        <thead>
                            <tr><th>Venda ID</th><th>Parcela</th><th>Valor</th><th>Vencimento</th><th>Status</th><th>Ações</th></tr>
                        </thead>
                        <tbody>
                            {detalhes.map(conta => (
                                <tr key={conta.id_conta}>
                                    <td>#{conta.id_venda}</td>
                                    <td>{conta.numero_parcela}/{conta.total_parcelas}</td>
                                    <td>R$ {parseFloat(conta.valor_parcela).toFixed(2)}</td>
                                    <td>{new Date(conta.data_vencimento).toLocaleDateString('pt-BR')}</td>
                                    <td><span className={`status-${conta.status}`}>{conta.status}</span></td>
                                    <td>
                                        {(conta.status === 'pendente' || conta.status === 'atrasado') && (
                                            <button onClick={() => handleMarcarComoPago(conta.id_conta)} className="pagar-btn">Marcar como Pago</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    // ========== VISÃO EXTRATO ==========
    if (view === "extrato") {
        return (
            <div className="vendas-list-container">
                <div className="vendas-list-header">
                    <h1>Extrato Completo</h1>
                    <button onClick={() => setView("resumo")} className="voltar-btn">Voltar ao Resumo</button>
                </div>

                <form onSubmit={handleFiltroSubmit} className="filtros-container">
                    <div className="filtro-item" style={{flexGrow: 1}}>
                        <label>Pesquisar por Cliente</label>
                        <input type="text" placeholder="Digite o nome..." value={filtros.nome} onChange={e => setFiltros({...filtros, nome: e.target.value})} className="filtro-input" />
                    </div>
                    <div className="filtro-item">
                        <label>Pesquisar por CPF</label>
                        <IMaskInput mask="000.000.000-00" value={filtros.cpf} onAccept={(value) => setFiltros({...filtros, cpf: value})} placeholder="Digite o CPF..." className="filtro-input" />
                    </div>
                    <div className="filtro-item">
                        <label>Data Início</label>
                        <DatePicker selected={filtros.startDate} onChange={date => setFiltros({...filtros, startDate: date})} className="filtro-input" placeholderText="Data Início" locale="pt-BR" dateFormat="dd/MM/yyyy" isClearable />
                    </div>
                    <div className="filtro-item">
                        <label>Data Fim</label>
                        <DatePicker selected={filtros.endDate} onChange={date => setFiltros({...filtros, endDate: date})} className="filtro-input" placeholderText="Data Fim" locale="pt-BR" dateFormat="dd/MM/yyyy" isClearable />
                    </div>
                    <div className="filtro-item">
                        <label>&nbsp;</label>
                        <button type="submit" className="filtrar-btn">Filtrar</button>
                    </div>
                </form>

                <div className="vendas-table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Cliente</th>
                                <th>Descrição</th>
                                <th>Valor</th>
                                <th>Status</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {extrato.map(t => (
                                <tr key={`${t.tipo}-${t.transacao_id}`}>
                                    <td>{new Date(t.data_evento).toLocaleDateString('pt-BR')}</td>
                                    <td>{t.nome_cliente}</td>
                                    <td>{t.tipo === 'venda' ? `Venda à vista #${t.transacao_id}` : `Parcela da Venda #${t.transacao_id}`}</td>
                                    <td>R$ {parseFloat(t.valor_total).toFixed(2)}</td>
                                    <td><span className={`status-${t.status}`}>{t.status}</span></td>
                                    <td>
                                        {t.tipo === 'parcela' && t.status !== 'pago' && (
                                            <button onClick={() => handleMarcarComoPago(t.transacao_id)} className="pagar-btn">Pagar</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }
    
    // ========== VISÃO RESUMO ==========
    return (
        <div className="vendas-list-container">
            <div className="vendas-list-header">
                <h1>Painel Financeiro</h1>
                <button onClick={() => { setView("extrato"); fetchExtrato(); }} className="extrato-btn">Ver Extrato Completo</button>
            </div>
            
            <div className="kpi-financeiro-grid">
                <div className="kpi-card-financeiro a-receber"><span>Total a Receber</span><strong>R$ {kpis.aReceber.toFixed(2)}</strong></div>
                <div className="kpi-card-financeiro recebido"><span>Recebido (no período)</span><strong>R$ {kpis.recebido.toFixed(2)}</strong></div>
                <div className="kpi-card-financeiro atrasado"><span>Total Atrasado</span><strong>R$ {kpis.atrasado.toFixed(2)}</strong></div>
            </div>

            <form onSubmit={handleFiltroSubmit} className="filtros-container">
                <div className="filtro-item" style={{flexGrow: 1}}>
                    <label>Pesquisar por Cliente</label>
                    <input type="text" placeholder="Digite o nome..." value={filtros.nome} onChange={e => setFiltros({...filtros, nome: e.target.value})} className="filtro-input" />
                </div>
                <div className="filtro-item">
                    <label>Pesquisar por CPF</label>
                    <IMaskInput mask="000.000.000-00" value={filtros.cpf} onAccept={(value) => setFiltros({...filtros, cpf: value})} placeholder="Digite o CPF..." className="filtro-input" />
                </div>
                <div className="filtro-item">
                    <label>Período Recebido</label>
                    <DatePicker selected={filtros.startDate} onChange={date => setFiltros({...filtros, startDate: date})} className="filtro-input" placeholderText="Data Início" locale="pt-BR" dateFormat="dd/MM/yyyy" isClearable />
                </div>
                 <div className="filtro-item">
                    <label>&nbsp;</label>
                    <DatePicker selected={filtros.endDate} onChange={date => setFiltros({...filtros, endDate: date})} className="filtro-input" placeholderText="Data Fim" locale="pt-BR" dateFormat="dd/MM/yyyy" isClearable />
                </div>
                <div className="filtro-item">
                    <label>&nbsp;</label>
                    <button type="submit" className="filtrar-btn">Filtrar</button>
                </div>
            </form>

            {sumario.length === 0 && !loading ? <p style={{padding: '25px'}}>Nenhum cliente com pagamentos pendentes encontrado.</p> : (
                <div className="vendas-table-container">
                    <table>
                        <thead>
                            <tr><th>Cliente</th><th>CPF</th><th>Próximo Venc.</th><th>Valor Pendente</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                            {sumario.map(cli => (
                                <tr key={cli.id_cliente} className="linha-clicavel" onClick={() => { setClienteSelecionado(cli); setView("detalhes"); fetchDetalhes(cli.id_cliente); }}>
                                    <td>{cli.nome_cliente}</td>
                                    <td>{formatCPF(cli.cpf)}</td>
                                    <td>{new Date(cli.proximo_vencimento).toLocaleDateString('pt-BR')}</td>
                                    <td>R$ {parseFloat(cli.valor_pendente).toFixed(2)}</td>
                                    <td>
                                        <span className={`status-${cli.status_geral.toLowerCase()}`}>
                                            {cli.status_geral}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default PagamentosPage;
