import React, { useState, useEffect, useMemo, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import DatePicker, { registerLocale } from 'react-datepicker';
import ptBR from 'date-fns/locale/pt-BR';
import "react-datepicker/dist/react-datepicker.css";
import '../vendas/VendasListPage.css';
import './PagamentosPage.css'; 

registerLocale('pt-BR', ptBR);

function PagamentosPage() {
    const [contas, setContas] = useState([]);
    const [loading, setLoading] = useState(true);
    const { token } = useContext(AuthContext);
    const [filtros, setFiltros] = useState({
        nomeCliente: '', status: '', startDate: null, endDate: null
    });

    const fetchContas = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filtros.nomeCliente) params.append('nomeCliente', filtros.nomeCliente);
            if (filtros.status) params.append('status', filtros.status);
            if (filtros.startDate) params.append('startDate', filtros.startDate.toISOString().split('T')[0]);
            if (filtros.endDate) params.append('endDate', filtros.endDate.toISOString().split('T')[0]);
            
            const response = await fetch(`http://localhost:3001/api/pagamentos/contas-a-receber?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Falha ao buscar contas');
            const data = await response.json();
            setContas(data);
        } catch (error) {
            console.error("Erro:", error);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchContas();
        }, 500);
        return () => clearTimeout(timer);
    }, [filtros, token]);

    const handleMarcarComoPago = async (idConta) => {
        try {
            const response = await fetch(`http://localhost:3001/api/pagamentos/contas-a-receber/${idConta}/pagar`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Falha ao atualizar parcela');
            fetchContas();
        } catch (error) {
            console.error("Erro:", error);
            alert("Erro ao marcar como pago.");
        }
    };

    const kpis = useMemo(() => {
        const aReceber = contas.filter(c => c.status === 'pendente' || c.status === 'atrasado').reduce((acc, c) => acc + parseFloat(c.valor_parcela), 0);
        const recebido = contas.filter(c => c.status === 'pago').reduce((acc, c) => acc + parseFloat(c.valor_parcela), 0);
        const atrasado = contas.filter(c => c.status === 'atrasado').reduce((acc, c) => acc + parseFloat(c.valor_parcela), 0);
        return { aReceber, recebido, atrasado };
    }, [contas]);

    return (
        <div className="vendas-list-container">
            <div className="vendas-list-header"><h1>Painel Financeiro</h1></div>
            
            <div className="kpi-financeiro-grid">
                <div className="kpi-card-financeiro a-receber"><span>A Receber</span><strong>R$ {kpis.aReceber.toFixed(2)}</strong></div>
                <div className="kpi-card-financeiro recebido"><span>Recebido (no período)</span><strong>R$ {kpis.recebido.toFixed(2)}</strong></div>
                <div className="kpi-card-financeiro atrasado"><span>Total Atrasado</span><strong>R$ {kpis.atrasado.toFixed(2)}</strong></div>
            </div>

            <div className="filtros-container">
                <input type="text" placeholder="Pesquisar por cliente..." className="filtro-input" value={filtros.nomeCliente} onChange={e => setFiltros({...filtros, nomeCliente: e.target.value})} style={{flexGrow: 1}} />
                <select className="filtro-input" value={filtros.status} onChange={e => setFiltros({...filtros, status: e.target.value})}>
                    <option value="">Todos os Status</option>
                    <option value="pendente">Pendentes</option>
                    <option value="pago">Pagos</option>
                    <option value="atrasado">Atrasados</option>
                </select>
                <DatePicker selected={filtros.startDate} onChange={date => setFiltros({...filtros, startDate: date})} className="filtro-input" placeholderText="Venc. Início" locale="pt-BR" dateFormat="dd/MM/yyyy" isClearable />
                <DatePicker selected={filtros.endDate} onChange={date => setFiltros({...filtros, endDate: date})} className="filtro-input" placeholderText="Venc. Fim" locale="pt-BR" dateFormat="dd/MM/yyyy" isClearable />
            </div>

            <div className="vendas-table-container">
                <table>
                    <thead><tr><th>Cliente</th><th>Venda</th><th>Parcela</th><th>Valor</th><th>Vencimento</th><th>Status</th><th>Ações</th></tr></thead>
                    <tbody>
                        {contas.map(conta => (
                            <tr key={conta.id_conta}>
                                <td>{conta.nome_cliente}</td>
                                <td>#{conta.id_venda}</td>
                                <td>{conta.numero_parcela}/{conta.total_parcelas}</td>
                                <td>R$ {parseFloat(conta.valor_parcela).toFixed(2)}</td>
                                <td>{new Date(conta.data_vencimento).toLocaleDateString('pt-BR')}</td>
                                <td><span className={`status-${conta.status}`}>{conta.status}</span></td>
                                <td>
                                    {conta.status !== 'pago' && (
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

export default PagamentosPage;