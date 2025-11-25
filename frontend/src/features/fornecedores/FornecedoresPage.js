import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../../context/AuthContext';
import AddFornecedorModal from '../../components/common/AddFornecedorModal';
import FornecedorDetalhesModal from '../../components/common/FornecedorDetalhesModal';
import { formatCNPJ, formatTelefone } from '../../utils/formatters';
import { IMaskInput } from 'react-imask';
import '../estoque/components/ProdutoCard.css';
import '../vendas/VendasListPage.css';
import { BsThreeDotsVertical } from 'react-icons/bs';

function FornecedoresPage() {
    const [fornecedores, setFornecedores] = useState([]);
    const [loading, setLoading] = useState(true);
    const { token } = useContext(AuthContext);
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [filtroNome, setFiltroNome] = useState('');
    const [filtroStatus, setFiltroStatus] = useState('');
    const [filtroCnpj, setFiltroCnpj] = useState('');
    const [isDetalhesModalOpen, setDetalhesModalOpen] = useState(false);
    const [fornecedorSelecionado, setFornecedorSelecionado] = useState(null);
    const [loadingDetalhes, setLoadingDetalhes] = useState(false);
    const [menuAbertoId, setMenuAbertoId] = useState(null);
    const acoesMenuRef = useRef(null);
    const [fornecedorEmEdicao, setFornecedorEmEdicao] = useState(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (acoesMenuRef.current && !acoesMenuRef.current.contains(event.target)) {
                setMenuAbertoId(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchFornecedores = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filtroNome) params.append('nome', filtroNome);
            if (filtroCnpj) params.append('cnpj', filtroCnpj.replace(/[^\d]/g, ""));
            if (filtroStatus) params.append('status', filtroStatus);

            const response = await fetch(`http://localhost:3001/api/fornecedores?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Falha ao buscar fornecedores');
            const data = await response.json();
            setFornecedores(data);
        } catch (error) {
            console.error("Erro:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchFornecedores();
        }
    }, [token]);
    
    const handleFiltroSubmit = (e) => {
        e.preventDefault();
        fetchFornecedores();
    };

    const handleFornecedorSaved = () => {
        setAddModalOpen(false);
        setFornecedorEmEdicao(null);
        fetchFornecedores();
    };
    
    const handleUpdateStatus = async (fornecedor) => {
        const novoStatus = fornecedor.status === 'ativo' ? 'inativo' : 'ativo';
        try {
            await fetch(`http://localhost:3001/api/fornecedores/${fornecedor.id_fornecedor}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ status: novoStatus })
            });
            fetchFornecedores();
        } catch (error) {
            console.error("Erro ao atualizar status do fornecedor:", error);
        }
    };

    const handleVerDetalhes = async (idFornecedor) => {
        setFornecedorSelecionado(null);
        setLoadingDetalhes(true);
        setDetalhesModalOpen(true);
        try {
            const response = await fetch(`http://localhost:3001/api/fornecedores/${idFornecedor}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Falha ao buscar detalhes');
            const data = await response.json();
            setFornecedorSelecionado(data);
        } catch (error) {
            console.error("Erro:", error);
        } finally {
            setLoadingDetalhes(false);
        }
    };

    const handleAbreModalEdicao = (fornecedor) => {
        setFornecedorEmEdicao(fornecedor);
        setAddModalOpen(true);
        setMenuAbertoId(null);
    };

    const handleAbreModalCadastro = () => {
        setFornecedorEmEdicao(null);
        setAddModalOpen(true);
    };

    if (loading && fornecedores.length === 0) return <p>Carregando fornecedores...</p>;

    return (
        <>
            <div className="vendas-list-container">
                <div className="vendas-list-header">
                    <h1>Gerenciamento de Fornecedores</h1>
                    <button onClick={handleAbreModalCadastro} className="nova-venda-btn">+ Novo Fornecedor</button>
                </div>

                <form onSubmit={handleFiltroSubmit} className="filtros-container">
                    <div className="filtro-item" style={{flexGrow: 1}}>
                        <label>Pesquisar por Nome</label>
                        <input 
                            type="text"
                            placeholder="Digite o nome do fornecedor..."
                            className="filtro-input"
                            value={filtroNome}
                            onChange={e => setFiltroNome(e.target.value)}
                        />
                    </div>
                    <div className="filtro-item">
                        <label>Pesquisar por CNPJ</label>
                        <IMaskInput
                            mask="00.000.000/0000-00"
                            value={filtroCnpj}
                            onAccept={(value) => setFiltroCnpj(value)}
                            placeholder="Digite o CNPJ..."
                            className="filtro-input"
                        />
                    </div>
                    <div className="filtro-item">
                        <label>Status</label>
                        <select 
                            className="filtro-input"
                            value={filtroStatus}
                            onChange={e => setFiltroStatus(e.target.value)}
                        >
                            <option value="">Todos</option>
                            <option value="ativo">Ativo</option>
                            <option value="inativo">Inativo</option>
                        </select>
                    </div>
                    <button type="submit" className="filtrar-btn">Filtrar</button>
                </form>

                <div className="vendas-table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Nome</th><th>CNPJ</th><th>Telefone</th><th>Email</th><th>Resp.</th><th>Status</th>
                                <th style={{textAlign: 'right'}}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {fornecedores.map(fornecedor => (
                                <tr key={fornecedor.id_fornecedor}>
                                    <td>{fornecedor.nome}</td>
                                    <td>{formatCNPJ(fornecedor.cnpj)}</td>
                                    <td>{formatTelefone(fornecedor.telefone)}</td>
                                    <td>{fornecedor.email}</td>
                                    <td>{fornecedor.responsavel || '-'}</td>
                                    <td>
                                        <div className="toggle-switch">
                                            <input type="checkbox" id={`switch-forn-${fornecedor.id_fornecedor}`}
                                                checked={fornecedor.status === 'ativo'}
                                                onChange={() => handleUpdateStatus(fornecedor)}
                                            />
                                            <label htmlFor={`switch-forn-${fornecedor.id_fornecedor}`}></label>
                                        </div>
                                    </td>
                                    <td className="coluna-acoes" ref={menuAbertoId === fornecedor.id_fornecedor ? acoesMenuRef : null}>
                                        <button onClick={() => setMenuAbertoId(menuAbertoId === fornecedor.id_fornecedor ? null : fornecedor.id_fornecedor)} className="action-icon-btn">
                                            <BsThreeDotsVertical />
                                        </button>
                                        {menuAbertoId === fornecedor.id_fornecedor && (
                                            <div className="acoes-dropdown">
                                                <button onClick={() => { handleVerDetalhes(fornecedor.id_fornecedor); setMenuAbertoId(null); }}>Ver Detalhes</button>
                                                <button onClick={() => handleAbreModalEdicao(fornecedor)}>Editar Fornecedor</button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isAddModalOpen && (
                <AddFornecedorModal
                    isOpen={isAddModalOpen}
                    onClose={() => { setAddModalOpen(false); setFornecedorEmEdicao(null); }}
                    onSaved={handleFornecedorSaved}
                    fornecedor={fornecedorEmEdicao}
                />
            )}
            
            {isDetalhesModalOpen && (
                <FornecedorDetalhesModal 
                    isOpen={isDetalhesModalOpen} 
                    onClose={() => setDetalhesModalOpen(false)} 
                    fornecedorData={fornecedorSelecionado} 
                    loading={loadingDetalhes} 
                />
            )}
        </>
    );
}

export default FornecedoresPage;