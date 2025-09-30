// src/features/servicos/OSDetailPage.js

import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import Select from 'react-select';
import { FaTrashAlt } from 'react-icons/fa';
import './OSDetailPage.css'; // Importando o novo CSS

function OSDetailPage() {
    const { id_os } = useParams();
    const navigate = useNavigate();
    const { token } = useContext(AuthContext);

    const [os, setOs] = useState(null);
    const [catalogoServicos, setCatalogoServicos] = useState([]);
    const [servicoSelecionado, setServicoSelecionado] = useState(null);
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
        return () => { // Limpa o timeout quando o componente é desmontado
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
        setOs(prevOs => ({
            ...prevOs,
            itens: prevOs.itens.map(item =>
                item.id_item_os === id_item_os ? { ...item, [campo]: valor } : item
            )
        }));
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        debounceTimeout.current = setTimeout(async () => {
            try {
                await fetch(`http://localhost:3001/api/ordens-servico/${id_os}/itens/${id_item_os}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ [campo]: valor })
                });
            } catch (error) {
                console.error(`Erro ao atualizar ${campo}:`, error);
            }
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

    if (loading || !os) {
        return <p style={{ padding: '24px' }}>Carregando detalhes da Ordem de Serviço...</p>;
    }

    const subtotal = os.itens.reduce((acc, item) => acc + (item.quantidade * item.preco_unitario), 0);

    return (
        <div className="os-detail-container">
            <div className="os-main-content">
                <div className="pdv-header">
                    <h2>Ordem de Serviço #{os.id_os}</h2>
                    <p><strong>Cliente:</strong> {os.nome_cliente}</p>
                </div>

                <div className="card">
                    <h3>Adicionar Serviço do Catálogo</h3>
                    <div className="servico-selector">
                        <Select
                            options={catalogoServicos}
                            value={servicoSelecionado}
                            onChange={setServicoSelecionado}
                            placeholder="Digite para buscar um serviço..."
                            isClearable
                        />
                        <button onClick={handleAdicionarServico} className="add-produto-btn" disabled={!servicoSelecionado}>
                            Adicionar
                        </button>
                    </div>
                </div>

                <div className="card itens-lista">
                    <h3>Itens da Ordem de Serviço</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Serviço</th>
                                <th>Qtd.</th>
                                <th>Preço Unit. (R$)</th>
                                <th>Subtotal (R$)</th>
                                <th>Ação</th>
                            </tr>
                        </thead>
                        <tbody>
                            {os.itens.map(item => (
                                <tr key={item.id_item_os}>
                                    <td>{item.nome_servico}</td>
                                    <td>
                                        <input
                                            type="number"
                                            className="qtd-input"
                                            value={item.quantidade}
                                            min="1"
                                            onChange={(e) => handleUpdateItem(item.id_item_os, 'quantidade', parseInt(e.target.value) || 1)}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="preco-input"
                                            value={parseFloat(item.preco_unitario)}
                                            onChange={(e) => handleUpdateItem(item.id_item_os, 'preco_unitario', e.target.value)}
                                        />
                                    </td>
                                    <td>{(item.quantidade * item.preco_unitario).toFixed(2)}</td>
                                    <td>
                                        <button onClick={() => handleRemoverItem(item.id_item_os)} className="remover-item-btn"><FaTrashAlt /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <aside className="os-summary">
                <div className="summary-card">
                    <div className="status-display">
                        <span>STATUS</span>
                        <strong>{os.status.toUpperCase()}</strong>
                    </div>

                    <div className="total-display">
                        <span>TOTAL</span>
                        <strong>R$ {subtotal.toFixed(2)}</strong>
                    </div>
                    
                    <div className="actions-section">
                        {os.status === 'aberta' && (
                            <button onClick={() => handleUpdateStatus('em_andamento')} className="action-button start">
                                Iniciar Serviço
                            </button>
                        )}
                        {os.status === 'em_andamento' && (
                            <button onClick={() => handleUpdateStatus('concluida')} className="action-button finalize">
                                Concluir Serviço
                            </button>
                        )}
                        {(os.status === 'aberta' || os.status === 'em_andamento') && (
                            <button onClick={() => handleUpdateStatus('cancelada')} className="action-button cancel">
                                Cancelar OS
                            </button>
                        )}
                        {(os.status === 'concluida' || os.status === 'cancelada') && (
                             <p className="status-finalizado-text">Esta OS está finalizada e não pode ser alterada.</p>
                        )}
                    </div>
                </div>
            </aside>
        </div>
    );
}

export default OSDetailPage;