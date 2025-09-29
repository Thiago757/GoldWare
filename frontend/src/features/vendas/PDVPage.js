import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import './PDVPage.css';
import { FaTrashAlt } from 'react-icons/fa';
import { VendaContext } from '../../context/VendaContext';
import { AuthContext } from '../../context/AuthContext';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import PagamentoModal from '../../components/common/PagamentoModal';

function PDVPage() {
    const { vendaAtiva, addItem, removeItem, removeMultipleItems, updateItemQuantidade, limparVenda, loading: vendaLoading } = useContext(VendaContext);
    const { token } = useContext(AuthContext);
    const navigate = useNavigate();

    const [codigoLido, setCodigoLido] = useState('');
    const [subtotal, setSubtotal] = useState(0);
    const [desconto, setDesconto] = useState(0);
    const [total, setTotal] = useState(0);
    const [error, setError] = useState('');
    const inputRef = useRef(null);
    const [itensSelecionados, setItensSelecionados] = useState([]);
    const [itemParaRemover, setItemParaRemover] = useState(null);
    const [modalAberto, setModalAberto] = useState(null);
    const [isPagamentoModalOpen, setPagamentoModalOpen] = useState(false);
    const [nomeCliente, setNomeCliente] = useState('...');

     useEffect(() => {
        if (vendaAtiva?.cliente?.nome) {
            setNomeCliente(vendaAtiva.cliente.nome);
        } else if (vendaAtiva?.nome_cliente) {
        setNomeCliente(vendaAtiva.nome_cliente);
    }
    }, [vendaAtiva]);

    useEffect(() => {
        if (!vendaLoading && (!vendaAtiva || !vendaAtiva.cliente)) {
            console.warn("Nenhuma venda ativa encontrada após o carregamento, redirecionando.");
            navigate('/vendas');
            return;
        }
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, [vendaAtiva, vendaLoading, navigate]);

    useEffect(() => {
        if (vendaAtiva && vendaAtiva.itens) {
            const itens = vendaAtiva.itens;
            const novoSubtotal = itens.reduce((acc, item) => acc + (item.preco_venda * item.quantidade), 0);
            setSubtotal(novoSubtotal);
            const valorDescontoNumerico = Number(desconto) || 0;
            const valorDoDesconto = novoSubtotal * (valorDescontoNumerico / 100);
            setTotal(novoSubtotal - valorDoDesconto);
        }
    }, [vendaAtiva, desconto]);

    const handleScan = async (e) => {
        e.preventDefault();
        if (!codigoLido) return;
        try {
            const response = await fetch(`http://localhost:3001/api/produtos/barcode/${codigoLido}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const produto = await response.json();
            if (!response.ok) throw new Error(produto.message || 'Produto não encontrado.');
            addItem(produto);
        } catch (err) {
            setError(err.message);
            setTimeout(() => setError(''), 3000);
        } finally {
            setCodigoLido('');
        }
    };
    
    const handleDescontoChange = (e) => {
        const valor = e.target.value;
        if (valor === '') {
            setDesconto('');
            return;
        }
        const numValor = Math.max(0, Math.min(100, Number(valor)));
        setDesconto(numValor);
    };

    const handleSelecaoItem = (id) => {
        setItensSelecionados(prev =>
            prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
        );
    };

    const handleSelecaoTodos = (e) => {
        if (e.target.checked && vendaAtiva) {
            setItensSelecionados(vendaAtiva.itens.map(item => item.id_item_venda));
        } else {
            setItensSelecionados([]);
        }
    };

    const handleConfirmaRemoverItem = () => {
        if (itemParaRemover) {
            removeItem(itemParaRemover.id_item_venda);
        }
        setModalAberto(null);
        setItemParaRemover(null);
    };
    
    const handleConfirmaRemoverSelecionados = () => {
        if (removeMultipleItems) { 
            removeMultipleItems(itensSelecionados);
        }
        setItensSelecionados([]);
        setModalAberto(null);
    };

   const handleConfirmaCancelarVenda = async () => {
    if (!vendaAtiva || !vendaAtiva.id_venda) return;

    try {
        const response = await fetch(`http://localhost:3001/api/vendas/${vendaAtiva.id_venda}/cancelar`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error('Falha ao cancelar a venda no backend');
        }

        alert('Venda cancelada com sucesso!');
        limparVenda();
        navigate('/vendas'); 

    } catch (error) {
        console.error("Erro ao cancelar venda:", error);
        alert(error.message);
    }
};
    
   const handleFinalizarVenda = async (dadosPagamento) => {
    if (!vendaAtiva) return;

    const vendaParaFinalizar = {
        id_venda: vendaAtiva.id_venda,
        desconto: Number(desconto) || 0,
        pagamentos: dadosPagamento.pagamentos.map(p => ({
            forma: p.forma,
            valor: p.valor,
            parcelas: p.parcelas || 1 
        }))
    };

    try {
        const response = await fetch('http://localhost:3001/api/vendas/finalizar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(vendaParaFinalizar)
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Falha ao registrar a venda.');
        }

        alert(`Venda #${data.id_venda} finalizada com sucesso!`);

        limparVenda();
        setPagamentoModalOpen(false);
        navigate('/vendas');

    } catch (error) {
        console.error("Erro ao finalizar venda:", error);
        alert(`Erro: ${error.message}`);
    }
};

    if (vendaLoading || !vendaAtiva) {
        return <p>Carregando dados da venda...</p>;
    }

    return (
        <>
            <div className="vendas-container">
                <div className="pdv-header">
                    <h2>Nova Venda para: {nomeCliente}</h2>
                </div>
                <div className="pdv-principal">
                    <form onSubmit={handleScan} className="scan-form">
                        <label htmlFor="barcode-input">Código de Barras</label>
                        <input
                            ref={inputRef} id="barcode-input" type="text"
                            value={codigoLido} onChange={(e) => setCodigoLido(e.target.value)}
                            placeholder="Leia o código de barras ou digite e pressione Enter"
                        />
                    </form>
                    {error && <p className="error-message">{error}</p>}
                    <div className="itens-lista">
                        <table>
                            <thead>
                                <tr>
                                    <th className="coluna-checkbox"><input type="checkbox" onChange={handleSelecaoTodos} checked={vendaAtiva.itens.length > 0 && itensSelecionados.length === vendaAtiva.itens.length} /></th>
                                    <th>Produto</th><th>Qtd.</th><th>Preço Unit.</th><th>Subtotal</th><th>Ação</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vendaAtiva.itens.map(item => (
                                    <tr key={item.id_item_venda}>
                                        <td className="coluna-checkbox"><input type="checkbox" checked={itensSelecionados.includes(item.id_item_venda)} onChange={() => handleSelecaoItem(item.id_item_venda)} /></td>
                                        <td>{item.nome}</td>
                                        <td>
                                        <div className="counter">
                                            <button
                                            type="button"
                                            onClick={() => updateItemQuantidade(item.id_item_venda, Math.max(1, item.quantidade - 1))}>
                                            -
                                            </button>
                                            <input
                                            type="number"
                                            className="qtd-input"
                                            value={item.quantidade}
                                            min="1"
                                            onChange={(e) => {
                                                const novaQtd = Math.max(1, parseInt(e.target.value) || 1);
                                                updateItemQuantidade(item.id_item_venda, novaQtd);
                                            }}
                                            />
                                            <button
                                            type="button"
                                            onClick={() => updateItemQuantidade(item.id_item_venda, item.quantidade + 1)}
                                            className="qtd-btn">
                                            +
                                            </button>
                                        </div>
                                        </td>
                                        <td>R$ {parseFloat(item.preco_venda).toFixed(2)}</td>
                                        <td>R$ {(item.quantidade * item.preco_venda).toFixed(2)}</td>
                                        <td><button onClick={() => { setItemParaRemover(item); setModalAberto('single'); }} className="remover-item-btn"><FaTrashAlt /></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {itensSelecionados.length > 0 && ( <button onClick={() => setModalAberto('multiple')} className="remover-selecionados-btn">Remover Selecionados ({itensSelecionados.length})</button> )}
                </div>
                <div className="pdv-resumo">
                    <h2>Resumo da Venda</h2>
                    <div className="total-display"><span>TOTAL</span><strong>R$ {total.toFixed(2)}</strong></div>
                    <div className="resumo-detalhes">
                        <div className="resumo-linha"><span>Subtotal</span><span>R$ {subtotal.toFixed(2)}</span></div>
                        <div className="resumo-linha desconto-linha"><label htmlFor="desconto-input">Desconto (%)</label><input id="desconto-input" type="number" value={desconto} onChange={handleDescontoChange} placeholder="0" min="0" max="100"/></div>
                    </div>
                    <button onClick={() => setPagamentoModalOpen(true)} className="finalizar-venda-btn" style={{ marginTop: 'auto' }} disabled={vendaAtiva.itens.length === 0}>Finalizar Venda</button>
                    <button onClick={() => setModalAberto('cancel')} className="cancelar-venda-btn">Cancelar Venda</button>
                </div>
            </div>
            <ConfirmationModal isOpen={modalAberto === 'single'} onClose={() => setModalAberto(null)} onConfirm={handleConfirmaRemoverItem} title="Remover Item" message={`Tem certeza que deseja remover o item "${itemParaRemover?.nome}" da venda?`} />
            <ConfirmationModal isOpen={modalAberto === 'multiple'} onClose={() => setModalAberto(null)} onConfirm={handleConfirmaRemoverSelecionados} title="Remover Itens Selecionados" message={`Tem certeza que deseja remover os ${itensSelecionados.length} itens selecionados?`} />
            <ConfirmationModal isOpen={modalAberto === 'cancel'} onClose={() => setModalAberto(null)} onConfirm={handleConfirmaCancelarVenda} title="Cancelar Venda" message="Tem certeza que deseja cancelar a venda?" />
            <PagamentoModal isOpen={isPagamentoModalOpen} onClose={() => setPagamentoModalOpen(false)} onFinalize={handleFinalizarVenda} totalVenda={total} />
        </>
    );
}

export default PDVPage;