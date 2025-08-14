import React, { useState, useEffect, useRef, useContext } from 'react';
import './VendasPage.css';
import { FaTrashAlt } from 'react-icons/fa';
import { VendaContext } from '../../context/VendaContext';
import ConfirmationModal from '../../components/common/ConfirmationModal';

function VendasPage() {
    const { itensVenda, addItem, removeItem, removeMultipleItems, clearVenda } = useContext(VendaContext);

    const [codigoLido, setCodigoLido] = useState('');
    const [subtotal, setSubtotal] = useState(0);
    const [desconto, setDesconto] = useState(0);
    const [total, setTotal] = useState(0);
    const [error, setError] = useState('');
    const inputRef = useRef(null);
    const [itensSelecionados, setItensSelecionados] = useState([]);
    const [itemParaRemover, setItemParaRemover] = useState(null);
    const [modalAberto, setModalAberto] = useState(null);

    useEffect(() => {
        inputRef.current.focus();
    }, []);

    useEffect(() => {
        const novoSubtotal = itensVenda.reduce((acc, item) => acc + (item.preco_venda * item.quantidade), 0);
        setSubtotal(novoSubtotal);

        const valorDesconto = novoSubtotal * (desconto / 100);
        setTotal(novoSubtotal - valorDesconto);
    }, [itensVenda, desconto]);

    const handleScan = async (e) => {
        e.preventDefault();
        if (!codigoLido) return;

        try {
            const response = await fetch(`http://localhost:3001/api/produtos/barcode/${codigoLido}`);
            const produto = await response.json();

            if (!response.ok) {
                throw new Error(produto.message || 'Produto não encontrado.');
            }

            addItem(produto);
            setError('');
            
        } catch (err) {
            setError(err.message);
            setTimeout(() => setError(''), 3000);
        } finally {
            setCodigoLido('');
        }
    };

    const handleDescontoChange = (e) => {
        let valor = parseFloat(e.target.value);
        if (isNaN(valor) || valor < 0) {
            valor = 0;
        } else if (valor > 100) {
            valor = 100;
        }
        setDesconto(valor);
    };

    const handleSelecaoItem = (id) => {
        setItensSelecionados(prev =>
            prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
        );
    };

    const handleSelecaoTodos = (e) => {
        if (e.target.checked) {
            setItensSelecionados(itensVenda.map(item => item.id_produto));
        } else {
            setItensSelecionados([]);
        }
    };

    // --- LÓGICA PARA AS CONFIRMAÇÕES ---
    const handleConfirmaRemoverItem = () => {
        if (itemParaRemover) {
            removeItem(itemParaRemover.id_produto);
        }
        setModalAberto(null);
        setItemParaRemover(null);
    };
    
    const handleConfirmaRemoverSelecionados = () => {
        removeMultipleItems(itensSelecionados);
        setItensSelecionados([]);
        setModalAberto(null);
    };

    const handleConfirmaCancelarVenda = () => {
        clearVenda();
        setDesconto(0);
        setItensSelecionados([]);
        setModalAberto(null);
    };

   return (
        <>
            <div className="vendas-container">
                <div className="pdv-principal">
                    <form onSubmit={handleScan} className="scan-form">
                        <label htmlFor="barcode-input">Código de Barras</label>
                        <input
                            ref={inputRef}
                            id="barcode-input"
                            type="text"
                            value={codigoLido}
                            onChange={(e) => setCodigoLido(e.target.value)}
                            placeholder="Leia o código de barras ou digite e pressione Enter"
                        />
                    </form>
                    {error && <p className="error-message">{error}</p>}

                    <div className="itens-lista">
                        <table>
                            <thead>
                                <tr>
                                    {itensVenda.length >= 2 && (
                                        <th className="coluna-checkbox">
                                            <input
                                                type="checkbox"
                                                onChange={handleSelecaoTodos}
                                                checked={itensSelecionados.length === itensVenda.length && itensVenda.length > 0}
                                            />
                                        </th>
                                    )}
                                    <th>Produto</th>
                                    <th>Qtd.</th>
                                    <th>Preço Unit.</th>
                                    <th>Subtotal</th>
                                    <th>Remover</th>
                                </tr>
                            </thead>
                            <tbody>
                                {itensVenda.map(item => (
                                    <tr key={item.id_produto}>
                                        {itensVenda.length >= 2 && (
                                            <td className="coluna-checkbox">
                                                <input
                                                    type="checkbox"
                                                    checked={itensSelecionados.includes(item.id_produto)}
                                                    onChange={() => handleSelecaoItem(item.id_produto)}
                                                />
                                            </td>
                                        )}
                                        <td>{item.nome}</td>
                                        <td>{item.quantidade}</td>
                                        <td>R$ {parseFloat(item.preco_venda).toFixed(2)}</td>
                                        <td>R$ {(item.quantidade * item.preco_venda).toFixed(2)}</td>
                                        <td>
                                            <button onClick={() => { setItemParaRemover(item); setModalAberto('single'); }} className="remover-item-btn">
                                                <FaTrashAlt />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {itensSelecionados.length > 0 && (
                        <button onClick={() => setModalAberto('multiple')} className="remover-selecionados-btn">
                            Remover Selecionados ({itensSelecionados.length})
                        </button>
                    )}
                </div>

                <div className="pdv-resumo">
                    <h2>Resumo da Venda</h2>
                    <div className="total-display">
                        <span>TOTAL</span>
                        <strong>R$ {total.toFixed(2)}</strong>
                    </div>
                    <div className="resumo-detalhes">
                        <div className="resumo-linha">
                            <span>Subtotal</span>
                            <span>R$ {subtotal.toFixed(2)}</span>
                        </div>
                        <div className="resumo-linha desconto-linha">
                            <label htmlFor="desconto-input">Desconto (%)</label>
                            <input
                                id="desconto-input"
                                type="number"
                                value={desconto}
                                onChange={handleDescontoChange}
                                min="0"
                                max="100"
                            />
                        </div>
                    </div>
                    <button className="finalizar-venda-btn" style={{marginTop: 'auto'}}>Finalizar Venda</button>
                    <button onClick={() => setModalAberto('cancel')} className="cancelar-venda-btn">Cancelar Venda</button>
                </div>
            </div>

            <ConfirmationModal
                isOpen={modalAberto === 'single'}
                onClose={() => setModalAberto(null)}
                onConfirm={handleConfirmaRemoverItem}
                title="Remover Item"
                message={`Tem certeza que deseja remover o item "${itemParaRemover?.nome}" da venda?`}
            />
            <ConfirmationModal
                isOpen={modalAberto === 'multiple'}
                onClose={() => setModalAberto(null)}
                onConfirm={handleConfirmaRemoverSelecionados}
                title="Remover Itens Selecionados"
                message={`Tem certeza que deseja remover os ${itensSelecionados.length} itens selecionados?`}
            />
            <ConfirmationModal
                isOpen={modalAberto === 'cancel'}
                onClose={() => setModalAberto(null)}
                onConfirm={handleConfirmaCancelarVenda}
                title="Cancelar Venda"
                message="Tem certeza que deseja cancelar a venda? Todos os itens serão removidos."
            />
        </>
    );
}

export default VendasPage;