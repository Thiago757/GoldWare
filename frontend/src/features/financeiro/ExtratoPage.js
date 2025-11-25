import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { startOfMonth, endOfMonth, format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import './ExtratoPage.css'; 
import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa'; // Importar ícones

import AddContaModal from '../../components/common/AddContaModal';
import AddFormaPagamentoModal from '../../components/common/AddFormaPagamentoModal';
import GerenciarContasModal from '../../components/common/GerenciarContasModal';
import GerenciarFormasModal from '../../components/common/GerenciarFormasModal';

const formatarMoeda = (valor) => {
    return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

function ExtratoPage() {
    const { token } = useContext(AuthContext);
    const [movimentacoes, setMovimentacoes] = useState([]);
    const [contas, setContas] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Estados dos Modais
    const [isGerenciarContasOpen, setIsGerenciarContasOpen] = useState(false);
    const [isGerenciarFormasOpen, setIsGerenciarFormasOpen] = useState(false);

    // Filtros
    const [startDate, setStartDate] = useState(startOfMonth(new Date()));
    const [endDate, setEndDate] = useState(endOfMonth(new Date()));
    const [contaId, setContaId] = useState('');

    // Estado de Ordenação (NOVO)
    // Padrão: ordenar por data de forma decrescente (mais recente primeiro)
    const [sortConfig, setSortConfig] = useState({ key: 'data_movimentacao', direction: 'desc' });

    // Totais
    const [totais, setTotais] = useState({ entradas: 0, saidas: 0, saldo: 0 });

    // --- Lógica de Ordenação (NOVO) ---
    const requestSort = (key) => {
        let direction = 'asc';
        // Se já estiver ordenado nessa coluna e for 'asc', vira 'desc'
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Cria uma lista ordenada baseada na lista original 'movimentacoes'
    const sortedMovimentacoes = useMemo(() => {
        let sortableItems = [...movimentacoes];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                // Tratamento especial para números (valor)
                if (sortConfig.key === 'valor') {
                    aValue = Number(aValue);
                    bValue = Number(bValue);
                }
                
                // Tratamento para texto (case insensitive)
                if (typeof aValue === 'string') {
                    aValue = aValue.toLowerCase();
                    bValue = bValue.toLowerCase();
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [movimentacoes, sortConfig]);

    // Função auxiliar para mostrar o ícone correto
    const getSortIcon = (columnName) => {
        if (sortConfig.key !== columnName) return <FaSort style={{opacity: 0.3}} />;
        if (sortConfig.direction === 'asc') return <FaSortUp />;
        return <FaSortDown />;
    };
    // --- Fim da Lógica de Ordenação ---


    // 1. Busca Contas
    const fetchContas = async () => {
        try {
            const res = await fetch('http://localhost:3001/api/contas-bancarias', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setContas(data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        if (token) fetchContas();
    }, [token]);

    // 2. Busca Extrato
    const fetchExtrato = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate.toISOString());
            if (endDate) params.append('endDate', endDate.toISOString());
            if (contaId) params.append('contaId', contaId);

            const res = await fetch(`http://localhost:3001/api/financeiro/extrato?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setMovimentacoes(data);
            calcularTotais(data);
        } catch (err) {
            console.error("Erro ao buscar extrato", err);
        } finally {
            setLoading(false);
        }
    };

    const calcularTotais = (dados) => {
        let entradas = 0;
        let saidas = 0;
        dados.forEach(mov => {
            const valor = Number(mov.valor);
            if (mov.tipo_movimentacao === 'entrada') entradas += valor;
            else saidas += valor;
        });
        setTotais({ entradas, saidas, saldo: entradas - saidas });
    };

    useEffect(() => {
        if (token) fetchExtrato();
        // eslint-disable-next-line
    }, [token]); 

    const handleCloseGerenciarContas = () => {
        setIsGerenciarContasOpen(false);
        fetchContas(); 
    };

    return (
        <div className="extrato-container">
            <div className="extrato-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <h1 style={{margin: 0}}>Extrato Financeiro</h1>

                <div style={{display: 'flex', gap: '10px'}}>
                    <button 
                        onClick={() => setIsGerenciarFormasOpen(true)} 
                        className="btn-filtrar" 
                        style={{backgroundColor: '#64748b'}} 
                    >
                        Formas de Pagamento
                    </button>

                    <button 
                        onClick={() => setIsGerenciarContasOpen(true)} 
                        className="btn-filtrar" 
                        style={{backgroundColor: '#16a34a'}} 
                    >
                        Contas Bancárias
                    </button>
                </div>
            </div>      

            {/* Filtros */}
            <div className="filtros-bar">
                <div className="filtro-group">
                    <label>Conta Bancária</label>
                    <select value={contaId} onChange={e => setContaId(e.target.value)}>
                        <option value="">Todas as Contas</option>
                        {contas.map(c => (
                            <option key={c.id_conta_bancaria} value={c.id_conta_bancaria}>
                                {c.nome_conta}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="filtro-group">
                    <label>Data Início</label>
                    <DatePicker selected={startDate} onChange={date => setStartDate(date)} dateFormat="dd/MM/yyyy" locale={ptBR} />
                </div>
                <div className="filtro-group">
                    <label>Data Fim</label>
                    <DatePicker selected={endDate} onChange={date => setEndDate(date)} dateFormat="dd/MM/yyyy" locale={ptBR} />
                </div>
                <button onClick={fetchExtrato} className="btn-filtrar">Atualizar</button>
            </div>

            {/* Cards de Resumo */}
            <div className="cards-resumo">
                <div className="card entrada">
                    <span>Entradas</span>
                    <h3>{formatarMoeda(totais.entradas)}</h3>
                </div>
                <div className="card saida">
                    <span>Saídas</span>
                    <h3>{formatarMoeda(totais.saidas)}</h3>
                </div>
                <div className={`card saldo ${totais.saldo >= 0 ? 'positivo' : 'negativo'}`}>
                    <span>Saldo do Período</span>
                    <h3>{formatarMoeda(totais.saldo)}</h3>
                </div>
            </div>

            {/* Tabela com Ordenação */}
            <div className="tabela-wrapper">
                <table className="tabela-extrato">
                    <thead>
                        <tr>
                            <th onClick={() => requestSort('data_movimentacao')} className="th-sortable">
                                Data {getSortIcon('data_movimentacao')}
                            </th>
                            <th onClick={() => requestSort('descricao')} className="th-sortable">
                                Descrição {getSortIcon('descricao')}
                            </th>
                            <th onClick={() => requestSort('nome_conta')} className="th-sortable">
                                Conta {getSortIcon('nome_conta')}
                            </th>
                            <th onClick={() => requestSort('tipo_movimentacao')} className="th-sortable">
                                Tipo {getSortIcon('tipo_movimentacao')}
                            </th>
                            <th onClick={() => requestSort('valor')} className="th-sortable">
                                Valor {getSortIcon('valor')}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Usamos sortedMovimentacoes ao invés de movimentacoes */}
                        {sortedMovimentacoes.map(mov => (
                            <tr key={mov.id_movimentacao}>
                                <td>{format(parseISO(mov.data_movimentacao), 'dd/MM/yyyy HH:mm')}</td>
                                <td>{mov.descricao}</td>
                                <td>{mov.nome_conta}</td>
                                <td>
                                    <span className={`badge-tipo ${mov.tipo_movimentacao}`}>
                                        {mov.tipo_movimentacao}
                                    </span>
                                </td>
                                <td className={mov.tipo_movimentacao === 'entrada' ? 'text-green' : 'text-red'}>
                                    {mov.tipo_movimentacao === 'saida' ? '-' : '+'} {formatarMoeda(mov.valor)}
                                </td>
                            </tr>
                        ))}
                        {sortedMovimentacoes.length === 0 && !loading && (
                            <tr><td colSpan="5" style={{textAlign: 'center'}}>Nenhuma movimentação encontrada.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <GerenciarContasModal 
                isOpen={isGerenciarContasOpen}
                onClose={handleCloseGerenciarContas}
            />
            
            <GerenciarFormasModal
                isOpen={isGerenciarFormasOpen}
                onClose={() => setIsGerenciarFormasOpen(false)}
            />
        </div>
    );
}

export default ExtratoPage;