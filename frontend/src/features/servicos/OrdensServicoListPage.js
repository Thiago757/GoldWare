import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import ClienteSelectModal from '../../components/common/ClienteSelectModal';
import StatusBadge from '../../components/common/StatusBadge';

function OrdensServicoListPage() {
    const [ordensServico, setOrdensServico] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isClienteModalOpen, setClienteModalOpen] = useState(false);
    const [filtros, setFiltros] = useState({ id_os: '', nome_cliente: '', cpf_cliente: '', status: '' });
    const { token } = useContext(AuthContext);
    const navigate = useNavigate();

    const fetchOrdensServico = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filtros.id_os) params.append('id_os', filtros.id_os);
            if (filtros.nome_cliente) params.append('nome_cliente', filtros.nome_cliente);
            if (filtros.cpf_cliente) params.append('cpf_cliente', filtros.cpf_cliente);
            if (filtros.status) params.append('status', filtros.status);

            const response = await fetch(`http://localhost:3001/api/ordens-servico?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Falha ao buscar Ordens de Serviço');
            const data = await response.json();
            setOrdensServico(data);
        } catch (error) {
            console.error("Erro:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrdensServico();
    }, [token]);

     const handleFiltroChange = (e) => {
        const { name, value } = e.target;
        setFiltros(prev => ({ ...prev, [name]: value }));
    };

    const handleFiltroSubmit = (e) => {
        e.preventDefault(); 
        fetchOrdensServico();
    };

    const handleClienteSelecionado = async (cliente) => {
        setClienteModalOpen(false);
        try {
            const response = await fetch('http://localhost:3001/api/ordens-servico', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ id_cliente: cliente.id_cliente })
            });
            if (!response.ok) throw new Error('Falha ao criar nova Ordem de Serviço');
            const novaOS = await response.json();
            
            navigate(`/ordens-servico/${novaOS.id_os}`);

        } catch (error) {
            console.error("Erro ao iniciar OS:", error);
            alert('Não foi possível iniciar a Ordem de Serviço.');
        }
    };

    return (
        <>
            <div className="vendas-list-container">
                <div className="vendas-list-header">
                    <h1>Ordens de Serviço</h1>
                    <button onClick={() => setClienteModalOpen(true)} className="nova-venda-btn">+ Nova OS</button>
                </div>
                <form className="filtros-container" onSubmit={handleFiltroSubmit}>
                    <div className="filtro-item"><label>N° OS</label><input type="text" name="id_os" value={filtros.id_os} onChange={handleFiltroChange} className="filtro-input" placeholder="Digite o número..." /></div>
                    <div className="filtro-item" style={{flexGrow: 1}}><label>Nome do Cliente</label><input type="text" name="nome_cliente" value={filtros.nome_cliente} onChange={handleFiltroChange} className="filtro-input" placeholder="Digite o nome..." /></div>
                    <div className="filtro-item"><label>CPF do Cliente</label><input type="text" name="cpf_cliente" value={filtros.cpf_cliente} onChange={handleFiltroChange} className="filtro-input" placeholder="Digite o CPF..." /></div>
                    <div className="filtro-item">
                        <label>Status</label>
                        <select name="status" value={filtros.status} onChange={handleFiltroChange} className="filtro-input">
                            <option value="">Todos</option>
                            <option value="aberta">Aberta</option>
                            <option value="em_andamento">Em Andamento</option>
                            <option value="concluida">Concluída</option>
                            <option value="cancelada">Cancelada</option>
                        </select>
                    </div>
                    <button type="submit" className="filtrar-btn">Filtrar</button>
                </form>

                <div className="vendas-table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>N° OS</th>
                                <th>Cliente</th>
                                <th>Data de Abertura</th>
                                <th>Valor Total</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5">Carregando...</td></tr>
                            ) : ordensServico.map(os => (
                                <tr key={os.id_os} className="linha-clicavel" onClick={() => navigate(`/ordens-servico/${os.id_os}`)}>
                                    <td>#{os.id_os}</td>
                                    <td>{os.nome_cliente}</td>
                                    <td>{new Date(os.data_abertura).toLocaleDateString('pt-BR')}</td>
                                    <td>R$ {parseFloat(os.valor_total || 0).toFixed(2)}</td>
                                    <td>
                                        <StatusBadge status={os.status} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <ClienteSelectModal 
                isOpen={isClienteModalOpen} 
                onClose={() => setClienteModalOpen(false)} 
                onConfirm={handleClienteSelecionado} 
            />
        </>
    );
}

export default OrdensServicoListPage;