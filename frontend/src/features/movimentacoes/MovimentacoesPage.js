import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { FaSyncAlt, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { startOfWeek, endOfWeek, subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear, subYears } from 'date-fns';
import '../vendas/VendasListPage.css'; 

function MovimentacoesPage() {
    const { token } = useContext(AuthContext);
    const [movimentacoes, setMovimentacoes] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [filtros, setFiltros] = useState({
        periodoRapido: 'todos',
        dataInicio: '',
        dataFim: '',
        tipo: 'todos'
    });

    const formatarData = (valor) => {
        if (!valor) return "-";
        return new Date(valor).toLocaleDateString('pt-BR') + ' ' + new Date(valor).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
    };

    const renderBadgeTipo = (tipo) => {
        const t = tipo?.toLowerCase();
        const styleBadge = {
            padding: '4px 10px',
            borderRadius: '15px',
            fontSize: '12px',
            fontWeight: '600',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            textTransform: 'capitalize'
        };

        if (t === 'entrada') {
            return (
                <span style={{...styleBadge, backgroundColor: '#dcfce7', color: '#166534'}}>
                    <FaArrowUp size={10} /> Entrada
                </span>
            );
        }
        return (
            <span style={{...styleBadge, backgroundColor: '#fee2e2', color: '#991b1b'}}>
                <FaArrowDown size={10} /> Saída
            </span>
        );
    };

    const fetchMovimentacoes = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filtros.dataInicio) params.append('startDate', new Date(filtros.dataInicio).toISOString());
            if (filtros.dataFim) {
                const fim = new Date(filtros.dataFim);
                fim.setHours(23, 59, 59, 999);
                params.append('endDate', fim.toISOString());
            }

            const response = await fetch(`http://localhost:3001/api/movimentacoes?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Falha ao buscar movimentações');
            
            let data = await response.json();
            
            if (filtros.tipo !== 'todos') {
                data = data.filter(m => m.tipo_movimentacao === filtros.tipo);
            }

            setMovimentacoes(data || []);
        } catch (error) {
            console.error("Erro:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMovimentacoes();
    }, [token]);

    useEffect(() => {
        const hoje = new Date();
        let inicio = null;
        let fim = null;

        switch (filtros.periodoRapido) {
            case 'hoje':
                inicio = hoje;
                fim = hoje;
                break;
            case 'semana_atual':
                inicio = startOfWeek(hoje, { weekStartsOn: 1 });
                fim = endOfWeek(hoje, { weekStartsOn: 1 });
                break;
            case 'mes_atual':
                inicio = startOfMonth(hoje);
                fim = endOfMonth(hoje);
                break;
            case 'mes_passado':
                const mesPassado = subMonths(hoje, 1);
                inicio = startOfMonth(mesPassado);
                fim = endOfMonth(mesPassado);
                break;
            case 'ano_atual':
                inicio = startOfYear(hoje);
                fim = endOfYear(hoje);
                break;
            case 'ano_passado':
                const anoPassado = subYears(hoje, 1);
                inicio = startOfYear(anoPassado);
                fim = endOfYear(anoPassado);
                break;
            default:
                break;
        }

        if (filtros.periodoRapido !== 'todos' && inicio && fim) {
            setFiltros(prev => ({
                ...prev,
                dataInicio: inicio.toISOString().split('T')[0],
                dataFim: fim.toISOString().split('T')[0]
            }));
        } else if (filtros.periodoRapido === 'todos') {
             setFiltros(prev => ({
                ...prev,
                dataInicio: '',
                dataFim: ''
            }));
        }
    }, [filtros.periodoRapido]);

    const handleFiltroChange = (e) => {
        const { name, value } = e.target;
        setFiltros(prev => ({ ...prev, [name]: value }));
    };

    const handleFiltroSubmit = (e) => {
        e.preventDefault();
        fetchMovimentacoes();
    };

    return (
        <div className="vendas-list-container">
            <div className="vendas-list-header">
                <h1>Movimentações de Estoque</h1>
                <button onClick={fetchMovimentacoes} className="nova-venda-btn" style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <FaSyncAlt /> Atualizar
                </button>
            </div>

            <form className="filtros-container" onSubmit={handleFiltroSubmit}>
                <div className="filtro-item">
                    <label>Período Rápido</label>
                    <select 
                        name="periodoRapido" 
                        value={filtros.periodoRapido} 
                        onChange={handleFiltroChange} 
                        className="filtro-input"
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
                    <input 
                        type="date" 
                        name="dataInicio" 
                        value={filtros.dataInicio} 
                        onChange={handleFiltroChange} 
                        className="filtro-input" 
                    />
                </div>
                
                <div className="filtro-item">
                    <label>Data Fim</label>
                    <input 
                        type="date" 
                        name="dataFim" 
                        value={filtros.dataFim} 
                        onChange={handleFiltroChange} 
                        className="filtro-input" 
                    />
                </div>

                <div className="filtro-item">
                    <label>Tipo</label>
                    <select 
                        name="tipo" 
                        value={filtros.tipo} 
                        onChange={handleFiltroChange} 
                        className="filtro-input"
                        style={{width: '150px'}}
                    >
                        <option value="todos">Todos</option>
                        <option value="entrada">Entrada</option>
                        <option value="saida">Saída</option>
                    </select>
                </div>

                <button type="submit" className="filtrar-btn">Filtrar</button>
            </form>

            <div className="vendas-table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Data / Hora</th>
                            <th>Produto</th>
                            <th style={{textAlign: 'center'}}>Tipo</th>
                            <th style={{textAlign: 'center'}}>Qtd.</th>
                            <th>Origem / Obs</th>
                            <th>Responsável</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" style={{textAlign: 'center', padding: '20px'}}>Carregando...</td></tr>
                        ) : movimentacoes.length === 0 ? (
                            <tr><td colSpan="6" style={{textAlign: 'center', padding: '20px'}}>Nenhuma movimentação encontrada.</td></tr>
                        ) : (
                            movimentacoes.map(mov => (
                                <tr key={mov.id_movimentacao}>
                                    <td>{formatarData(mov.data_movimentacao)}</td>
                                    <td style={{fontWeight: '500', color: '#333'}}>
                                        {mov.nome_produto || mov.produto || '-'}
                                    </td>
                                    <td style={{textAlign: 'center'}}>
                                        {renderBadgeTipo(mov.tipo_movimentacao)}
                                    </td>
                                    <td style={{textAlign: 'center', fontWeight: 'bold'}}>
                                        {mov.quantidade}
                                    </td>
                                    <td style={{color: '#666', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}} title={mov.observacao}>
                                        {mov.observacao || mov.origem || '-'}
                                    </td>
                                    <td>{mov.nome_usuario || mov.responsavel || 'Sistema'}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default MovimentacoesPage;