import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../../context/AuthContext';
import AddClienteModal from '../../components/common/AddClienteModal';
import ClienteDetalhesModal from '../../components/common/ClienteDetalhesModal';
import { formatCPF, formatTelefone } from '../../utils/formatters';
import '../estoque/components/ProdutoCard.css';
import '../vendas/VendasListPage.css';
import { BsThreeDotsVertical } from 'react-icons/bs';

function ClientesPage() {
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const { token } = useContext(AuthContext);
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [filtroNome, setFiltroNome] = useState('');
    const [filtroStatus, setFiltroStatus] = useState('');
    const [isDetalhesModalOpen, setDetalhesModalOpen] = useState(false);
    const [clienteSelecionado, setClienteSelecionado] = useState(null);
    const [loadingDetalhes, setLoadingDetalhes] = useState(false);
    const [menuAbertoId, setMenuAbertoId] = useState(null);
    const acoesMenuRef = useRef(null);
    const [clienteEmEdicao, setClienteEmEdicao] = useState(null); 

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (acoesMenuRef.current && !acoesMenuRef.current.contains(event.target)) {
                setMenuAbertoId(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchClientes = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filtroNome) params.append('nome', filtroNome);
            if (filtroStatus) params.append('status', filtroStatus);

            const response = await fetch(`http://localhost:3001/api/clientes?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Falha ao buscar clientes');
            const data = await response.json();
            setClientes(data);
        } catch (error) {
            console.error("Erro:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (token) fetchClientes();
        }, 300);
        return () => clearTimeout(timer);
    }, [filtroNome, filtroStatus, token]);

    const handleClientSaved = (novoCliente) => {
        setAddModalOpen(false);
        setClienteEmEdicao(null); 
        fetchClientes();
    };
    
    const handleUpdateStatus = async (cliente) => {
        const novoStatus = cliente.status === 'ativo' ? 'inativo' : 'ativo';
        try {
            const response = await fetch(`http://localhost:3001/api/clientes/${cliente.id_cliente}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ status: novoStatus })
            });
            if (!response.ok) throw new Error('Falha ao atualizar o status do cliente.');
            fetchClientes();
        } catch (error) {
            console.error("Erro ao atualizar status do cliente:", error);
            alert("Erro ao atualizar o status.");
        }
    };

    const handleVerDetalhes = async (idCliente) => {
        setClienteSelecionado(null);
        setLoadingDetalhes(true);
        setDetalhesModalOpen(true);
        try {
            const response = await fetch(`http://localhost:3001/api/clientes/${idCliente}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Falha ao buscar detalhes do cliente');
            const data = await response.json();
            setClienteSelecionado(data);
        } catch (error) {
            console.error("Erro:", error);
        } finally {
            setLoadingDetalhes(false);
        }
    };

    const handleAbreModalEdicao = (cliente) => {
        setClienteEmEdicao(cliente);
        setAddModalOpen(true);
        setMenuAbertoId(null);
    };

    const handleAbreModalCadastro = () => {
        setClienteEmEdicao(null);
        setAddModalOpen(true);
    };

    if (loading && clientes.length === 0) return <p>Carregando clientes...</p>;

    return (
        <>
            <div className="vendas-list-container">
                <div className="vendas-list-header">
                    <h1>Gerenciamento de Clientes</h1>
                    <button onClick={handleAbreModalCadastro} className="nova-venda-btn">+ Novo Cliente</button>
                </div>

                <div className="filtros-container">
                    <input 
                        type="text"
                        placeholder="Pesquisar por nome..."
                        className="filtro-input"
                        style={{flexGrow: 1}}
                        value={filtroNome}
                        onChange={e => setFiltroNome(e.target.value)}
                    />
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

                <div className="vendas-table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>CPF</th>
                                <th>Telefone</th>
                                <th>Email</th>
                                <th>Status</th>
                                <th style={{textAlign: 'right'}}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clientes.map(cliente => (
                                <tr key={cliente.id_cliente}>
                                    <td>{cliente.nome}</td>
                                    <td>{formatCPF(cliente.cpf)}</td>
                                    <td>{formatTelefone(cliente.telefone)}</td>
                                    <td>{cliente.email}</td>
                                    <td>
                                        <div className="toggle-switch">
                                            <input 
                                                type="checkbox" 
                                                id={`switch-cliente-${cliente.id_cliente}`}
                                                checked={cliente.status === 'ativo'}
                                                onChange={() => handleUpdateStatus(cliente)}
                                            />
                                            <label htmlFor={`switch-cliente-${cliente.id_cliente}`}></label>
                                        </div>
                                    </td>
                                    <td className="coluna-acoes" ref={menuAbertoId === cliente.id_cliente ? acoesMenuRef : null}>
                                        <button onClick={() => setMenuAbertoId(menuAbertoId === cliente.id_cliente ? null : cliente.id_cliente)} className="action-icon-btn">
                                            <BsThreeDotsVertical />
                                        </button>
                                        {menuAbertoId === cliente.id_cliente && (
                                            <div className="acoes-dropdown">
                                                <button onClick={() => { handleVerDetalhes(cliente.id_cliente); setMenuAbertoId(null); }}>
                                                    Ver Detalhes
                                                </button>
                                                <button onClick={() => handleAbreModalEdicao(cliente)}>
                                                    Editar Cliente
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <AddClienteModal
                isOpen={isAddModalOpen}
                onClose={() => { setAddModalOpen(false); setClienteEmEdicao(null); }}
                onClientSaved={handleClientSaved}
                cliente={clienteEmEdicao} 
            />
            <ClienteDetalhesModal 
                isOpen={isDetalhesModalOpen} 
                onClose={() => setDetalhesModalOpen(false)} 
                clienteData={clienteSelecionado} 
                loading={loadingDetalhes} 
            />
        </>
    );
}

export default ClientesPage;