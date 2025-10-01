import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { FaEdit } from 'react-icons/fa';
import ServicoModal from './components/ServicoModal'; 

function CatalogoServicosPage() {
    const [servicos, setServicos] = useState([]);
    const [tiposDeServico, setTiposDeServico] = useState([]); 
    const [loading, setLoading] = useState(true);
    const { token } = useContext(AuthContext);
    const [isModalOpen, setModalOpen] = useState(false);
    const [servicoEmEdicao, setServicoEmEdicao] = useState(null);

    const fetchData = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const [servicosRes, tiposRes] = await Promise.all([
                fetch('http://localhost:3001/api/servicos', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('http://localhost:3001/api/tipos-servico', { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            if (!servicosRes.ok || !tiposRes.ok) throw new Error('Falha ao buscar dados');
            
            const servicosData = await servicosRes.json();
            const tiposData = await tiposRes.json();
            
            setServicos(servicosData);
            setTiposDeServico(tiposData);
        } catch (error) {
            console.error("Erro:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [token]);

    const handleAbrirModal = (servico = null) => {
        setServicoEmEdicao(servico);
        setModalOpen(true);
    };

    const handleFecharModal = () => {
        setModalOpen(false);
        setServicoEmEdicao(null);
    };

    const handleSalvar = async (formData) => {
        const isEditing = !!formData.id_servico;
        const url = isEditing
            ? `http://localhost:3001/api/servicos/${formData.id_servico}`
            : 'http://localhost:3001/api/servicos';
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(formData)
            });
            if (!response.ok) throw new Error('Falha ao salvar o serviço.');
            
            handleFecharModal();
            fetchData(); // Recarrega todos os dados
        } catch (error) {
            console.error("Erro ao salvar serviço:", error);
            alert("Não foi possível salvar o serviço.");
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1>Catálogo de Serviços</h1>
                <button onClick={() => handleAbrirModal()} className="add-produto-btn">+ Novo Serviço</button>
            </div>
            <p style={{ margin: '8px 0 24px', color: '#64748b' }}>
                Gerencie os serviços específicos que sua loja oferece aos clientes.
            </p>

            <div className="vendas-table-container">
                <table>
                    {/* ... seu thead ... */}
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6">Carregando catálogo...</td></tr>
                        ) : servicos.map(servico => (
                            <tr key={servico.id_servico}>
                                <td>{servico.nome}</td>
                                <td><span className="tipo-badge">{servico.nome_tipo_servico || 'Não definido'}</span></td>
                                <td>R$ {parseFloat(servico.preco_base).toFixed(2)}</td>
                                <td>{servico.prazo_estimado ? `${servico.prazo_estimado} dias` : 'N/A'}</td>
                                <td>{servico.ativo === 'S' ? 'Ativo' : 'Inativo'}</td>
                                <td style={{ textAlign: 'right' }}>
                                    <button onClick={() => handleAbrirModal(servico)} title="Editar" className="action-icon-btn"><FaEdit /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <ServicoModal
                isOpen={isModalOpen}
                onClose={handleFecharModal}
                onSave={handleSalvar}
                servicoEmEdicao={servicoEmEdicao}
                tiposDeServico={tiposDeServico}
            /> 
        </div>
    );
}

export default CatalogoServicosPage;