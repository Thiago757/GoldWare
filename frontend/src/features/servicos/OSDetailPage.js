import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import Select from 'react-select';
import { FaTrashAlt, FaPrint } from 'react-icons/fa';
import PagamentoModal from '../../components/common/PagamentoModal';
import { gerarPDFOS } from '../../utils/pdfGenerator';
import './OSDetailPage.css';

function OSDetailPage() {
    const { id_os } = useParams();
    const navigate = useNavigate();
    const { token } = useContext(AuthContext);

    const [os, setOs] = useState(null);
    const [catalogoServicos, setCatalogoServicos] = useState([]);
    const [servicoSelecionado, setServicoSelecionado] = useState(null);
    const [isPagamentoModalOpen, setPagamentoModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const debounceTimeout = useRef(null);

    const fetchData = async () => {
        if (!token || !id_os) return;
        setLoading(true);
        try {
            const [osRes, catalogoRes] = await Promise.all([
                fetch(`http://localhost:3001/api/ordens-servico/${id_os}`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('http://localhost:3001/api/servicos', { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (!osRes.ok) throw new Error('Ordem de Serviço não encontrada');

            const osData = await osRes.json();
            const catalogoData = await catalogoRes.json();

            setOs(osData);
            setCatalogoServicos(catalogoData.map(s => ({ value: s.id_servico, label: `${s.nome} - R$ ${parseFloat(s.preco_base).toFixed(2)}` })));
        } catch (error) {
            console.error("Erro ao buscar dados:", error);
            alert(error.message);
            navigate('/servicos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        return () => {
            if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        };
    }, [id_os, token]);

    const handleAdicionarServico = async () => {
        if (!servicoSelecionado) return alert('Por favor, selecione um serviço.');
        try {
            const response = await fetch(`http://localhost:3001/api/ordens-servico/${id_os}/itens`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ id_servico: servicoSelecionado.value, quantidade: 1 })
            });
            if (!response.ok) throw new Error('Falha ao adicionar serviço.');
            setServicoSelecionado(null);
            fetchData();
        } catch (error) {
            console.error("Erro ao adicionar serviço:", error);
            alert(error.message);
        }
    };

    const handleRemoverItem = async (id_item_os) => {
        if (!window.confirm("Remover este serviço da OS?")) return;
        try {
            const response = await fetch(`http://localhost:3001/api/ordens-servico/${id_os}/itens/${id_item_os}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Falha ao remover o item.');
            fetchData();
        } catch (error) {
            console.error("Erro ao remover item:", error);
            alert(error.message);
        }
    };

    const handleUpdateItem = (id_item_os, campo, valor) => {
        setOs(prevOs => ({ ...prevOs, itens: prevOs.itens.map(item => item.id_item_os === id_item_os ? { ...item, [campo]: valor } : item) }));
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        debounceTimeout.current = setTimeout(async () => {
            try {
                await fetch(`http://localhost:3001/api/ordens-servico/${id_os}/itens/${id_item_os}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ [campo]: valor })
                });
            } catch (error) { console.error(`Erro ao atualizar ${campo}:`, error); }
        }, 800);
    };

    const handleUpdateStatus = async (novoStatus) => {
        try {
            const response = await fetch(`http://localhost:3001/api/ordens-servico/${id_os}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ status: novoStatus })
            });
            if (!response.ok) throw new Error(`Falha ao atualizar status.`);
            fetchData();
        } catch (error) {
            console.error("Erro ao mudar status:", error);
            alert(error.message);
        }
    };

    const handleFinalizarOS = async (dadosPagamento) => {
        try {
            const response = await fetch(`http://localhost:3001/api/ordens-servico/${id_os}/finalizar`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ pagamentos: dadosPagamento.pagamentos })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Falha ao finalizar a OS.');
            alert('Ordem de Serviço finalizada com sucesso!');
            setPagamentoModalOpen(false);
            navigate('/servicos');
        } catch (error) {
            console.error("Erro ao finalizar OS:", error);
            alert(error.message);
        }
    };
    
    const handleObservacaoChange = (novoTexto) => {
        setOs(prevOs => ({ ...prevOs, observacao: novoTexto }));
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        debounceTimeout.current = setTimeout(async () => {
            try {
                await fetch(`http://localhost:3001/api/ordens-servico/${id_os}/observacao`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ observacao: novoTexto })
                });
            } catch (error) {
                console.error('Erro ao salvar observação:', error);
            }
        }, 800);
    };

    if (loading || !os) {
        return <p style={{ padding: '24px' }}>Carregando detalhes da Ordem de Serviço...</p>;
    }

    const isFinalizada = os.status === 'concluida' || os.status === 'cancelada';
    const subtotal = os.itens.reduce((acc, item) => acc + (item.quantidade * item.preco_unitario), 0);

    return (
        <>
            <div className="os-detail-container">
                <div className="os-main-content">
                    <div className="pdv-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <h2>Ordem de Serviço #{os.id_os}</h2>
                        </div>
                        <p><strong>Cliente:</strong> {os.nome_cliente}</p>
                    </div>

                    {!isFinalizada && (
                        <div className="card">
                            <h3>Adicionar Serviço do Catálogo</h3>
                            <div className="servico-selector">
                                <Select options={catalogoServicos} value={servicoSelecionado} onChange={setServicoSelecionado} placeholder="Digite para buscar um serviço..." isClearable isDisabled={isFinalizada} />
                                <button onClick={handleAdicionarServico} className="add-produto-btn" disabled={!servicoSelecionado || isFinalizada}>Adicionar</button>
                            </div>
                        </div>
                    )}

                    <div className="card itens-lista">
                        <h3>Itens da Ordem de Serviço</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Serviço</th
                                    ><th>Qtd.</th>
                                    <th>Preço Unit. (R$)</th>
                                    <th>Prazo (dias)</th>
                                    <th>Subtotal (R$)</th>
                                    {!isFinalizada && <th>Ação</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {os.itens.map(item => (
                                    <tr key={item.id_item_os}>
                                        <td>{item.nome_servico}</td>
                                        <td><input type="number" className="qtd-input" value={item.quantidade} min="1" onChange={(e) => handleUpdateItem(item.id_item_os, 'quantidade', parseInt(e.target.value) || 1)} disabled={isFinalizada} /></td>
                                        <td><input type="number" step="0.01" className="preco-input" value={parseFloat(item.preco_unitario)} onChange={(e) => handleUpdateItem(item.id_item_os, 'preco_unitario', e.target.value)} disabled={isFinalizada} /></td>
                                        <td>
                                            <input 
                                                type="number" 
                                                className="qtd-input"
                                                value={item.prazo_estimado || ''}
                                                onChange={(e) => handleUpdateItem(item.id_item_os, 'prazo_estimado', parseInt(e.target.value) || null)} 
                                                disabled={isFinalizada} 
                                            />
                                        </td>
                                        <td>{(item.quantidade * item.preco_unitario).toFixed(2)}</td>
                                        {!isFinalizada && (
                                            <td><button onClick={() => handleRemoverItem(item.id_item_os)} className="remover-item-btn" disabled={isFinalizada}><FaTrashAlt /></button></td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    <div className="card">
                        <h3>Observações</h3>
                        <textarea
                            className="observacao-textarea"
                            placeholder={isFinalizada ? "Nenhuma observação foi adicionada." : "Adicione detalhes importantes sobre o serviço, cliente ou peça..."}
                            value={os.observacao || ''}
                            onChange={(e) => handleObservacaoChange(e.target.value)}
                            disabled={isFinalizada}
                            rows="4"
                        ></textarea>
                    </div>
                </div>

                <aside className="os-summary">
                    <div className="summary-card">
                        <div className="status-display"><span>STATUS</span><strong>{os.status.toUpperCase()}</strong></div>
                        <div className="total-display"><span>TOTAL</span><strong>R$ {subtotal.toFixed(2)}</strong></div>
                       <button onClick={() => gerarPDFOS(os)} className="action-button print" style={{ marginBottom: '24px' }}>
                            <FaPrint />Imprimir OS
                        </button>
                        <div className="actions-section">
                            {os.status === 'aberta' && <button onClick={() => handleUpdateStatus('em_andamento')} className="action-button start">Iniciar Serviço</button>}
                            {os.status === 'em_andamento' && <button onClick={() => setPagamentoModalOpen(true)} className="action-button finalize">Concluir e Cobrar</button>}
                            {(os.status === 'aberta' || os.status === 'em_andamento') && <button onClick={() => handleUpdateStatus('cancelada')} className="action-button cancel">Cancelar OS</button>}
                            {isFinalizada && <p className="status-finalizado-text">Esta OS está finalizada e não pode ser alterada.</p>}
                        </div>
                    </div>
                </aside>
            </div>

            <PagamentoModal
                isOpen={isPagamentoModalOpen}
                onClose={() => setPagamentoModalOpen(false)}
                onFinalize={handleFinalizarOS}
                totalVenda={subtotal}
            />
        </>
    );
}

export default OSDetailPage;