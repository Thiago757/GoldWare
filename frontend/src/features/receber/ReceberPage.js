import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, subYears } from 'date-fns';
import "react-datepicker/dist/react-datepicker.css";
import DatePicker from "react-datepicker";
import './ReceberPage.css';

function ReceberPage() {
    const [receber, setReceber] = useState([]);
    const [loading, setLoading] = useState(true);
    const { token } = useContext(AuthContext);
    const [filtroPeriodoEmissao, setFiltroPeriodoEmissao] = useState('todos');
    const [filtrosEmissao, setFiltrosEmissao] = useState({ startDate: null, endDate: null });
    const [filtroPeriodoVencimento, setFiltroPeriodoVencimento] = useState('todos');
    const [filtrosVencimento, setFiltrosVencimento] = useState({ startDate: null, endDate: null });

    const [filtros, setFiltros] = useState({ status: '' });

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

    const fetchReceber = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filtros.startDate) params.append('startDate', filtros.startDate.toISOString());
            if (filtros.endDate) params.append('endDate', filtros.endDate.toISOString());
            if (filtros.status) params.append('status', filtros.status);

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
                            value={filtros.status}
                            onChange={e => setFiltros({ ...filtros, status: e.target.value })}
                            className="filtro-input"
                        >
                            <option value="">Todos</option>
                            <option value="aberto">Aberto</option>
                            <option value="cancelado">Cancelado</option>
                            <option value="parcial">Parcial</option>
                            <option value="total">Total</option>
                            <option value="substituido">Substituído</option>
                        </select>
                    </div>
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
                        <button onClick={fetchReceber} className="filtrar-btn">Filtrar</button>
                        <button onClick={() => (true)} className="baixar-receber-btn">Baixar título</button>
                </div>
            </div>
        </>
    );
}

export default ReceberPage;