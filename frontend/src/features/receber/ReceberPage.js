import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, subYears } from 'date-fns';
import { parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import "react-datepicker/dist/react-datepicker.css";
import DatePicker from "react-datepicker";
import './ReceberPage.css';

// Import do Modal
import BaixarTituloModal from '../../components/common/BaixarTituloModal'; 

// --- Funções Helper ---
function formatarData(dataISO) {
    if (!dataISO) return '--';
    try {
        const dataObj = parseISO(dataISO);
        return format(dataObj, 'dd/MM/yyyy', { locale: ptBR });
    } catch (error) {
        return 'Data inválida';
    }
}

function formatarMoeda(valor) {
    const valorNumerico = Number(valor);
    if (isNaN(valorNumerico)) {
        return 'R$ 0,00';
    }
    return valorNumerico.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

function ReceberPage() {
    const [receber, setReceber] = useState([]);
    const [loading, setLoading] = useState(true);
    const { token } = useContext(AuthContext);
    
    // Filtros de Data
    const [filtroPeriodoEmissao, setFiltroPeriodoEmissao] = useState('todos');
    const [filtrosEmissao, setFiltrosEmissao] = useState({ startDate: null, endDate: null });
    const [filtroPeriodoVencimento, setFiltroPeriodoVencimento] = useState('todos');
    const [filtrosVencimento, setFiltrosVencimento] = useState({ startDate: null, endDate: null });
    
    // Listas e Estados do Modal
    const [clientes, setClientes] = useState([]);
    const [isBaixaModalOpen, setIsBaixaModalOpen] = useState(false);
    const [tituloSelecionado, setTituloSelecionado] = useState(null);

    // Filtros Principais
    const [filtros, setFiltros] = useState({
        status: '', 
        clienteId: ''
    });

    // --- Funções do Modal e Ações ---
    const handleAbrirModalBaixa = (titulo) => {
        setTituloSelecionado(titulo);
        setIsBaixaModalOpen(true);
    };

    const handleFecharModalBaixa = () => {
        setTituloSelecionado(null);
        setIsBaixaModalOpen(false);
    };

    const handleTituloBaixado = () => {
        handleFecharModalBaixa();
        fetchReceber(); 
    };

    const handleReabrirTitulo = async (titulo) => {
        if (!window.confirm(`Deseja realmente reabrir o título de ${titulo.nome_cliente}? O valor recebido será estornado.`)) {
            return;
        }
        try {
            const response = await fetch(`http://localhost:3001/api/recebimentos/estornar/${titulo.id_conta_receber}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const erro = await response.json();
                alert(erro.message || 'Erro ao reabrir título');
                return;
            }
            alert('Título reaberto com sucesso!');
            fetchReceber();
        } catch (error) {
            console.error("Erro:", error);
            alert('Erro ao conectar com o servidor.');
        }
    };

    // --- UseEffects de Datas (Emissão) ---
    useEffect(() => {
        const hoje = new Date();
        let startDate = null;
        let endDate = null;
        switch (filtroPeriodoEmissao) {
            case 'hoje': startDate = hoje; endDate = hoje; break;
            case 'semana_atual': startDate = startOfWeek(hoje, { weekStartsOn: 0 }); endDate = endOfWeek(hoje, { weekStartsOn: 0 }); break;
            case 'mes_atual': startDate = startOfMonth(hoje); endDate = endOfMonth(hoje); break;
            case 'mes_passado': const mesPassado = subMonths(hoje, 1); startDate = startOfMonth(mesPassado); endDate = endOfMonth(mesPassado); break;
            case 'ano_atual': startDate = startOfYear(hoje); endDate = endOfYear(hoje); break;
            case 'ano_passado': const anoPassado = subYears(hoje, 1); startDate = startOfYear(anoPassado); endDate = endOfYear(anoPassado); break;
            default: break;
        }
        setFiltrosEmissao({ startDate, endDate });
    }, [filtroPeriodoEmissao]);

    // --- UseEffects de Datas (Vencimento) ---
    useEffect(() => {
        const hoje = new Date();
        let startDate = null;
        let endDate = null;
        switch (filtroPeriodoVencimento) {
            case 'hoje': startDate = hoje; endDate = hoje; break;
            case 'semana_atual': startDate = startOfWeek(hoje, { weekStartsOn: 0 }); endDate = endOfWeek(hoje, { weekStartsOn: 0 }); break;
            case 'mes_atual': startDate = startOfMonth(hoje); endDate = endOfMonth(hoje); break;
            case 'mes_passado': const mesPassado = subMonths(hoje, 1); startDate = startOfMonth(mesPassado); endDate = endOfMonth(mesPassado); break;
            case 'ano_atual': startDate = startOfYear(hoje); endDate = endOfYear(hoje); break;
            case 'ano_passado': const anoPassado = subYears(hoje, 1); startDate = startOfYear(anoPassado); endDate = endOfYear(anoPassado); break;
            default: break;
        }
        setFiltrosVencimento({ startDate, endDate });
    }, [filtroPeriodoVencimento]);

    // --- Buscar Clientes ---
    useEffect(() => {
        const fetchClientes = async () => {
            try {
                const response = await fetch(`http://localhost:3001/api/clientes`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Falha ao buscar clientes');
                const data = await response.json();
                setClientes(data);
            } catch (error) {
                console.error("Erro ao buscar clientes:", error);
            }
        };
        if (token) fetchClientes();
    }, [token]);

    // --- Função Principal de Busca ---
    const fetchReceber = async () => {
        console.log("Buscando dados...", filtros);
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filtros.status) params.append('status', filtros.status);
            if (filtros.clienteId) params.append('clienteId', filtros.clienteId);
            if (filtrosEmissao.startDate) params.append('emissaoStartDate', filtrosEmissao.startDate.toISOString());
            if (filtrosEmissao.endDate) params.append('emissaoEndDate', filtrosEmissao.endDate.toISOString());
            if (filtrosVencimento.startDate) params.append('vencimentoStartDate', filtrosVencimento.startDate.toISOString());
            if (filtrosVencimento.endDate) params.append('vencimentoEndDate', filtrosVencimento.endDate.toISOString());

            const response = await fetch(`http://localhost:3001/api/receber?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) throw new Error('Falha ao buscar contas a receber');
            const data = await response.json();
            setReceber(data);
        } catch (error) {
            console.error("Erro:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchReceber();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);


    // --- RENDERIZAÇÃO (ESTRUTURA CORRIGIDA) ---
    return (
        <>
            {/* AQUI ESTÁ A MUDANÇA: A div 'receber-list-container' agora envolve TUDO */}
            <div className="receber-list-container">
                
                {/* Cabeçalho */}
                <div className="receber-list-header">
                    <h1>Contas a receber</h1>
                    <button onClick={() => (true)} className="novo-receber-btn">+ Novo Receber</button>
                </div>

                {/* Filtros */}
                <div className="filtros-container"> 
                    <div className="filtro-status">
                        <label>Status: </label>
                        <select value={filtros.status} onChange={e => setFiltros({ ...filtros, status: e.target.value })} className="filtro-input">
                            <option value="">Todos</option>
                            <option value="aberto">Em Aberto</option>
                            <option value="pendente">Pendente</option>
                            <option value="pago">Pago</option> 
                            <option value="cancelado">Cancelado</option>
                            <option value="parcial">Parcial</option>
                            <option value="atrasado">Atrasado</option>
                        </select>
                    </div>

                    <div className="filtro-emissao">
                        <label>Período de Emissão: </label>
                        <select className="filtro-input" value={filtroPeriodoEmissao} onChange={e => setFiltroPeriodoEmissao(e.target.value)}>
                            <option value="todos">Todos</option>
                            <option value="hoje">Hoje</option>
                            <option value="semana_atual">Esta Semana</option>
                            <option value="mes_atual">Este Mês</option>
                            <option value="mes_passado">Mês Passado</option>
                            <option value="ano_atual">Este Ano</option>
                            <option value="ano_passado">Ano Passado</option>
                            <option value="personalizado">Personalizado</option>
                        </select>
                    </div>
                    <div>
                        <label>Início Emissão: </label>
                        <DatePicker selected={filtrosEmissao.startDate} onChange={date => setFiltrosEmissao({ ...filtrosEmissao, startDate: date })} className="filtro-input" placeholderText="DD/MM/AAAA" locale={ptBR} dateFormat="dd/MM/yyyy" isClearable />
                    </div>
                    <div>
                        <label>Fim Emissão: </label>
                        <DatePicker selected={filtrosEmissao.endDate} onChange={date => setFiltrosEmissao({ ...filtrosEmissao, endDate: date })} className="filtro-input" placeholderText="DD/MM/AAAA" locale={ptBR} dateFormat="dd/MM/yyyy" isClearable />
                    </div>

                    <div className="filtro-vencimento">
                        <label>Período de Vencimento: </label>
                        <select className="filtro-input" value={filtroPeriodoVencimento} onChange={e => setFiltroPeriodoVencimento(e.target.value)}>
                            <option value="todos">Todos</option>
                            <option value="hoje">Hoje</option>
                            <option value="semana_atual">Esta Semana</option>
                            <option value="mes_atual">Este Mês</option>
                            <option value="mes_passado">Mês Passado</option>
                            <option value="ano_atual">Este Ano</option>
                            <option value="ano_passado">Ano Passado</option>
                            <option value="personalizado">Personalizado</option>
                        </select>
                    </div>
                    <div>
                        <label>Início Vencimento: </label>
                        <DatePicker selected={filtrosVencimento.startDate} onChange={date => setFiltrosVencimento({ ...filtrosVencimento, startDate: date })} className="filtro-input" placeholderText="DD/MM/AAAA" locale={ptBR} dateFormat="dd/MM/yyyy" isClearable />
                    </div>
                    <div>
                        <label>Fim Vencimento: </label>
                        <DatePicker selected={filtrosVencimento.endDate} onChange={date => setFiltrosVencimento({ ...filtrosVencimento, endDate: date })} className="filtro-input" placeholderText="DD/MM/AAAA" locale={ptBR} dateFormat="dd/MM/yyyy" isClearable />
                    </div>

                    <div className="filtro-cliente">
                        <label>Cliente: </label>
                        <select value={filtros.clienteId} onChange={e => setFiltros({ ...filtros, clienteId: e.target.value })} className="filtro-map-clientes">
                            <option value="">Todos</option>
                            {clientes.map(cliente => (
                                <option key={cliente.id_cliente} value={cliente.id_cliente}>{cliente.nome}</option>
                            ))}
                        </select>
                    </div>
                    
                    <button onClick={fetchReceber} className="filtrar-btn">Filtrar</button>
                </div>

                {/* --- TABELA DE DADOS (AGORA DENTRO DO CONTAINER) --- */}
                <div className="receber-table-container">
                    {loading ? (
                        <div className="loading-container"><p>Carregando títulos...</p></div>
                    ) : receber.length === 0 ? (
                        <div className="empty-container"><p>Nenhum título encontrado.</p></div>
                    ) : (
                        <table className="receber-table">
                            <thead>
                                <tr>
                                    <th>Cliente</th>
                                    <th>Vencimento</th>
                                    <th>Valor da Parcela</th>
                                    <th>Valor Recebido</th>
                                    <th>Status</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {receber.map(item => (
                                    <tr key={item.id_conta_receber}>
                                        <td>{item.nome_cliente || 'Cliente não informado'}</td>
                                        <td>{formatarData(item.data_vencimento)}</td>
                                        <td>{formatarMoeda(item.valor_parcela)}</td>
                                        <td>{formatarMoeda(item.valor_recebido)}</td>
                                        <td>
                                            <span className={`status-tag status-${item.status}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="coluna-acoes">
                                            {item.status === 'pago' ? (
                                                <button 
                                                    onClick={() => handleReabrirTitulo(item)} 
                                                    className="reabrir-receber-btn"
                                                    title="Estornar recebimento"
                                                >
                                                    Reabrir
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={() => handleAbrirModalBaixa(item)} 
                                                    className="baixar-receber-btn"
                                                    disabled={item.status === 'cancelado'}
                                                >
                                                    Baixar
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            {/* O container principal fecha AQUI agora */}
            </div> 

            {/* Modais ficam fora do container */}
            {isBaixaModalOpen && (
                <BaixarTituloModal
                    isOpen={isBaixaModalOpen}
                    onClose={handleFecharModalBaixa}
                    onBaixaEfetuada={handleTituloBaixado}
                    titulo={tituloSelecionado}
                />
            )}
        </>
    );
}

export default ReceberPage;