import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, subYears } from 'date-fns';
import { parseISO, format } from 'date-fns'; // Importar 'parseISO' e 'format'
import { ptBR } from 'date-fns/locale'; // Importar locale ptBR
import "react-datepicker/dist/react-datepicker.css";
import DatePicker from "react-datepicker";
import './ReceberPage.css'; // Você precisará adicionar os estilos da tabela (ver abaixo)

// --- NOVO: Funções para formatar os dados na tabela ---
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
// --- FIM DA ADIÇÃO ---


function ReceberPage() {
    const [receber, setReceber] = useState([]);
    const [loading, setLoading] = useState(true);
    const { token } = useContext(AuthContext);
    const [filtroPeriodoEmissao, setFiltroPeriodoEmissao] = useState('todos');
    const [filtrosEmissao, setFiltrosEmissao] = useState({ startDate: null, endDate: null });
    const [filtroPeriodoVencimento, setFiltroPeriodoVencimento] = useState('todos');
    const [filtrosVencimento, setFiltrosVencimento] = useState({ startDate: null, endDate: null });
    const [clientes, setClientes] = useState([]);
    

    // 2. Adicionado 'clienteId' ao estado de filtros
    const [filtros, setFiltros] = useState({
        status: '', // <-- Perfeito. '' significa "Todos"
        clienteId: ''
    });

    // ... (Seus useEffects de data permanecem iguais) ...
    // UseEffect para Emissão
    useEffect(() => {
        const hoje = new Date();
        let startDate = null;
        let endDate = null;
        switch (filtroPeriodoEmissao) {
            case 'hoje':
                startDate = hoje;
                endDate = hoje;
                break;
            case 'semana_atual':
                startDate = startOfWeek(hoje, { weekStartsOn: 0 });
                endDate = endOfWeek(hoje, { weekStartsOn: 0 });
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
        setFiltrosEmissao({ startDate, endDate });
    }, [filtroPeriodoEmissao]);

    // UseEffect para Vencimento
    useEffect(() => {
        const hoje = new Date();
        let startDate = null;
        let endDate = null;
        switch (filtroPeriodoVencimento) {
            case 'hoje':
                startDate = hoje;
                endDate = hoje;
                break;
            case 'semana_atual':
                startDate = startOfWeek(hoje, { weekStartsOn: 0 });
                endDate = endOfWeek(hoje, { weekStartsOn: 0 });
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
        setFiltrosVencimento({ startDate, endDate });
    }, [filtroPeriodoVencimento]);

    // 3. UseEffect para buscar a lista de clientes (sem mudanças)
    useEffect(() => {
        const fetchClientes = async () => {
            try {
                // Rota que você precisa criar no backend
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

        if (token) {
            fetchClientes();
        }
    }, [token]);


    // 4. Lógica de busca (quase igual, só adicionei um console.log para debug)
    const fetchReceber = async () => {
        console.log("Buscando dados com filtros:", filtros); // Ajuda a ver o que está sendo enviado
        setLoading(true);
        try {
            const params = new URLSearchParams();

            // Se 'filtros.status' for '', nada é adicionado (correto)
            if (filtros.status) params.append('status', filtros.status);
            if (filtros.clienteId) params.append('clienteId', filtros.clienteId);

            if (filtrosEmissao.startDate) {
                params.append('emissaoStartDate', filtrosEmissao.startDate.toISOString());
            }
            if (filtrosEmissao.endDate) {
                params.append('emissaoEndDate', filtrosEmissao.endDate.toISOString());
            }
            if (filtrosVencimento.startDate) {
                params.append('vencimentoStartDate', filtrosVencimento.startDate.toISOString());
            }
            if (filtrosVencimento.endDate) {
                params.append('vencimentoEndDate', filtrosVencimento.endDate.toISOString());
            }

            // --- NOTA IMPORTANTE ---
            // Certifique-se que sua API em 'http://localhost:3001/api/receber'
            // faz um JOIN com a tabela 'clientes' para pegar o 'nome' do cliente.
            // O código da tabela abaixo assume que o item retornado tem 'item.nome_cliente'.
            
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

    // --- NOVO (PASSO 1): CHAMA A BUSCA NA INICIALIZAÇÃO ---
    // Este hook chama o fetchReceber() assim que o token estiver disponível.
    // É importante que este hook venha DEPOIS da definição de fetchReceber
    useEffect(() => {
        if (token) {
            fetchReceber();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]); // Roda a busca inicial assim que o token for carregado


    return (
        <>
            <div className="receber-list-container">
                <div className="receber-list-header">
                    <h1>Contas a receber</h1>
                    <button onClick={() => (true)} className="novo-receber-btn">+ Novo Receber</button>
                </div>

                <div className="filtros-container"> 
                    <div className="filtro-status">
                        <label>Status: </label>
                        <select
                            value={filtros.status} // Valor inicial é '', que bate com "Todos"
                            onChange={e => setFiltros({ ...filtros, status: e.target.value })}
                            className="filtro-input"
                        >
                            <option value="">Todos</option>
                            {/* Ajuste os valores para baterem com seu backend
                                (Ex: 'pendente', 'pago', 'cancelado')
                                Vou manter os que você tinha:
                            */}
                            <option value="aberto">Aberto</option>
                            <option value="pago">Pago</option> 
                            <option value="cancelado">Cancelado</option>
                            <option value="parcial">Parcial</option>
                            <option value="atrasado">Atrasado</option>
                        </select>
                    </div>

                    {/* Restante dos filtros (sem mudança) */}
                    <div className="filtro-emissao">
                        <label>Período de Emissão: </label>
                        <select
                            className="filtro-input"
                            value={filtroPeriodoEmissao}
                            onChange={e => setFiltroPeriodoEmissao(e.target.value)}
                        >
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
                        <DatePicker
                            selected={filtrosEmissao.startDate}
                            onChange={date => setFiltrosEmissao({ ...filtrosEmissao, startDate: date })}
                            className="filtro-input"
                            placeholderText="DD/MM/AAAA"
                            locale="pt-BR"
                            dateFormat="dd/MM/yyyy"
                            isClearable
                        />
                    </div>
                    <div>
                        <label>Fim Emissão: </label>
                        <DatePicker
                            selected={filtrosEmissao.endDate}
                            onChange={date => setFiltrosEmissao({ ...filtrosEmissao, endDate: date })}
                            className="filtro-input"
                            placeholderText="DD/MM/AAAA"
                            locale="pt-BR"
                            dateFormat="dd/MM/yyyy"
                            isClearable
                        />
                    </div>
                    <div className="filtro-vencimento">
                        <label>Período de Vencimento: </label>
                        <select
                            className="filtro-input"
                            value={filtroPeriodoVencimento}
                            onChange={e => setFiltroPeriodoVencimento(e.target.value)}
                        >
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
                        <DatePicker
                            selected={filtrosVencimento.startDate}
                            onChange={date => setFiltrosVencimento({ ...filtrosVencimento, startDate: date })}
                            className="filtro-input"
                            placeholderText="DD/MM/AAAA"
                            locale="pt-BR"
                            dateFormat="dd/MM/yyyy"
                            isClearable
                        />
                    </div>
                    <div>
                        <label>Fim Vencimento: </label>
                        <DatePicker
                            selected={filtrosVencimento.endDate}
                            onChange={date => setFiltrosVencimento({ ...filtrosVencimento, endDate: date })}
                            className="filtro-input"
                            placeholderText="DD/MM/AAAA"
                            locale="pt-BR"
                            dateFormat="dd/MM/yyyy"
                             isClearable
                        />
                    </div>

                    <div className="filtro-cliente">
                        <label>Cliente: </label>
                        <select
                            value={filtros.clienteId}
                            onChange={e => setFiltros({ ...filtros, clienteId: e.target.value })}
                            className="filtro-map-clientes"
                        >
                            <option value="">Todos</option>
                            {/* --- CORREÇÃO AQUI --- 
                                Assumindo que seu /api/clientes retorna { id_cliente, nome }
                            */}
                            {clientes.map(cliente => (
                                <option key={cliente.id_cliente} value={cliente.id_cliente}>
                                    {cliente.nome} 
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    {/* Botão de Filtrar agora SÓ filtra, não carrega mais */}
                    <button onClick={fetchReceber} className="filtrar-btn">Filtrar</button>
                    <button onClick={() => (true)} className="baixar-receber-btn">Baixar título</button>
                </div>
            </div> 
            
            {/* --- NOVO (PASSO 2): ÁREA DE EXIBIÇÃO DOS DADOS --- */}
            <div className="receber-table-container">
                {loading ? (
                    <div className="loading-container">
                        <p>Carregando títulos...</p>
                        {/* Você pode adicionar um componente de spinner aqui */}
                    </div>
                ) : receber.length === 0 ? (
                    <div className="empty-container">
                        <p>Nenhum título encontrado para os filtros selecionados.</p>
                    </div>
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
                            {/* Assumindo que sua API /api/receber retorna uma lista de objetos assim:
                                { id_conta_receber: 1, nome_cliente: 'Elias Maciel', data_vencimento: '...', 
                                  valor_parcela: 150.00, valor_recebido: 0, status: 'pendente' }
                            */}
                            {receber.map(item => (
                                <tr key={item.id_conta_receber}>
                                    <td>{item.nome_cliente || 'Cliente não informado'}</td>
                                    <td>{formatarData(item.data_vencimento)}</td>
                                    <td>{formatarMoeda(item.valor_parcela)}</td>
                                    <td>{formatarMoeda(item.valor_recebido)}</td>
                                    <td>
                                        {/* Adiciona uma tag de status baseada no status do backend */}
                                        <span className={`status-tag status-${item.status}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="coluna-acoes">
                                        {/* Aqui você pode adicionar botões de ação */}
                                        <button className="acao-btn">Baixar</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </>
    );
}

export default ReceberPage;