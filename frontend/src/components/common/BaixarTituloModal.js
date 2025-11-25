import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import './ConfirmationModal.css'; // Reutilizando seu CSS de modal

// Função para formatar moeda
const formatarMoeda = (valor) => Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function BaixarTituloModal({ isOpen, onClose, onBaixaEfetuada, titulo }) {
    const { token } = useContext(AuthContext);

    // Estados do formulário
    const [valor, setValor] = useState(0);
    const [dataPagamento, setDataPagamento] = useState(new Date());
    const [contaId, setContaId] = useState('');
    const [formaPagamentoId, setFormaPagamentoId] = useState('');

    // Estados para os dropdowns
    const [contasBancarias, setContasBancarias] = useState([]);
    const [formasPagamento, setFormasPagamento] = useState([]);

    // Estados de UI
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Valor restante do título
    const valorRestante = titulo.valor_parcela - titulo.valor_recebido;

    // Efeito para buscar dados dos dropdowns (contas e formas de pagto)
    useEffect(() => {
        if (!isOpen || !token) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Buscar Contas Bancárias (você precisará criar esta rota)
                const resContas = await fetch('http://localhost:3001/api/contas-bancarias', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const dataContas = await resContas.json();
                if (!resContas.ok) throw new Error(dataContas.message || 'Erro ao buscar contas');
                setContasBancarias(dataContas);

                // 2. Buscar Formas de Pagamento (você precisará criar esta rota)
                const resFormas = await fetch('http://localhost:3001/api/formas-pagamento', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const dataFormas = await resFormas.json();
                if (!resFormas.ok) throw new Error(dataFormas.message || 'Erro ao buscar formas de pagamento');
                setFormasPagamento(dataFormas);

                // Define valores padrão
                if (dataContas.length > 0) setContaId(dataContas[0].id_conta_bancaria);
                if (dataFormas.length > 0) setFormaPagamentoId(dataFormas[0].id_forma_pagamento);

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [isOpen, token]);

    // Efeito para definir o valor padrão do pagamento
    useEffect(() => {
        if (titulo) {
            // Sugere o valor restante como padrão
            setValor(valorRestante);
        }
    }, [titulo, valorRestante]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        if (valor <= 0) {
            setError('O valor do recebimento deve ser maior que zero.');
            return;
        }
        if (valor > valorRestante) {
            setError(`O valor não pode ser maior que o saldo devedor (${formatarMoeda(valorRestante)}).`);
            return;
        }
        if (!contaId || !formaPagamentoId) {
            setError('Selecione a conta de destino e a forma de pagamento.');
            return;
        }

        setLoading(true);
        
        const body = {
            id_conta_receber: titulo.id_conta_receber,
            valor_recebido: valor,
            data_recebimento: dataPagamento.toISOString(),
            id_conta_bancaria: Number(contaId),
            id_forma_pagamento: Number(formaPagamentoId)
        };
        
        try {
            // 3. Enviar o recebimento (você precisará criar esta rota)
            const response = await fetch('http://localhost:3001/api/recebimentos', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(body)
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Erro ao salvar recebimento');

            onBaixaEfetuada(); // Sucesso! Chama o callback do pai

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <form onSubmit={handleSubmit} className="modal-content pagamento-modal-content">
                <h2>Baixar Título a Receber</h2>
                
                <div className="pagamento-total">
                    <span>Cliente: <strong>{titulo.nome_cliente}</strong></span>
                </div>
                <div className="pagamento-total">
                    <span>Saldo Devedor:</span>
                    <strong className={valorRestante > 0 ? "faltando" : ""}>
                        {formatarMoeda(valorRestante)}
                    </strong>
                </div>

                <div className="pagamento-form">
                    <div className="form-field valor-pagamento">
                        <label>Valor a Receber</label>
                        <input
                            type="number"
                            step="0.01"
                            value={valor}
                            onChange={(e) => setValor(Number(e.target.value))}
                            disabled={loading}
                        />
                    </div>
                    <div className="form-field">
                        <label>Data Recebimento</label>
                        <DatePicker
                            selected={dataPagamento}
                            onChange={(date) => setDataPagamento(date)}
                            dateFormat="dd/MM/yyyy"
                            className="filtro-input" // Reutiliza sua classe de filtro
                            disabled={loading}
                        />
                    </div>
                </div>

                <div className="pagamento-form">
                    <div className="form-field tipo-pagamento">
                        <label>Conta de Destino</label>
                        <select
                            value={contaId}
                            onChange={(e) => setContaId(e.target.value)}
                            disabled={loading}
                        >
                            <option value="">Selecione a conta...</option>
                            {contasBancarias.map(conta => (
                                <option key={conta.id_conta_bancaria} value={conta.id_conta_bancaria}>
                                    {conta.nome_conta} (Saldo: {formatarMoeda(conta.saldo)})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-field tipo-pagamento">
                        <label>Forma de Pagamento</label>
                        <select
                            value={formaPagamentoId}
                            onChange={(e) => setFormaPagamentoId(e.target.value)}
                            disabled={loading}
                        >
                            <option value="">Selecione a forma...</option>
                            {formasPagamento.map(forma => (
                                <option key={forma.id_forma_pagamento} value={forma.id_forma_pagamento}>
                                    {forma.nome}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {error && <p className="modal-error-message">{error}</p>}
                
                <div className="modal-actions">
                    <button type="button" onClick={onClose} className="modal-button cancel" disabled={loading}>
                        Cancelar
                    </button>
                    <button type="submit" className="modal-button confirm save" disabled={loading}>
                        {loading ? 'Salvando...' : 'Confirmar Recebimento'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default BaixarTituloModal;