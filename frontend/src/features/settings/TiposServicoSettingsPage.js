// src/pages/settings/TiposServicoSettingsPage.js
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import TipoServicoModal from './components/TipoServicoModal';

function TiposServicoSettingsPage() {
    const [tipos, setTipos] = useState([]);
    const [loading, setLoading] = useState(true);
    const { token } = useContext(AuthContext);

    // 👇 AS DUAS LINHAS QUE FALTAVAM ESTÃO AQUI:
    const [isModalOpen, setModalOpen] = useState(false);
    const [emEdicao, setEmEdicao] = useState(null);

    const fetchTipos = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:3001/api/tipos-servico', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Falha ao buscar dados');
            const data = await res.json();
            setTipos(data);
        } catch (error) {
            console.error("Erro ao buscar tipos de serviço", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchTipos();
    }, [token]);
    
    const handleAbrirModal = (tipo = null) => {
        setEmEdicao(tipo);
        setModalOpen(true);
    };

    const handleFecharModal = () => {
        setModalOpen(false);
        setEmEdicao(null);
    };

    const handleSalvar = async (tipoData) => {
        const isEditing = !!tipoData.id_tipo_servico;
        const url = isEditing
            ? `http://localhost:3001/api/tipos-servico/${tipoData.id_tipo_servico}`
            : 'http://localhost:3001/api/tipos-servico';
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ nome: tipoData.nome })
            });
            if (!response.ok) throw new Error('Falha ao salvar.');
            
            handleFecharModal();
            fetchTipos();
        } catch (error) {
            console.error("Erro ao salvar:", error);
            alert("Não foi possível salvar o tipo de serviço.");
        }
    };

    const handleDeletar = async (id) => {
        if (!window.confirm("Tem certeza que deseja excluir este tipo de serviço?")) return;

        try {
            const response = await fetch(`http://localhost:3001/api/tipos-servico/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json().catch(() => ({}));

            if (!response.ok) throw new Error(data.message || 'Falha ao excluir.');
            
            fetchTipos();
        } catch (error) {
            console.error("Erro ao deletar:", error);
            alert(`Não foi possível excluir: ${error.message}`);
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1>Gerenciar Tipos de Serviço</h1>
                <button onClick={() => handleAbrirModal()} className="add-produto-btn">+ Novo Tipo</button>
            </div>
            <p style={{ margin: '8px 0 24px', color: '#64748b' }}>
                Cadastre as categorias para organizar os serviços que sua loja oferece.
            </p>

            <div className="vendas-table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Nome da Categoria</th>
                            <th style={{ width: '100px', textAlign: 'right' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="2">Carregando...</td></tr>
                        ) : tipos.map(tipo => (
                            <tr key={tipo.id_tipo_servico}>
                                <td>{tipo.nome}</td>
                                <td style={{ textAlign: 'right' }}>
                                    <button onClick={() => handleAbrirModal(tipo)} title="Editar" className="action-icon-btn"><FaEdit /></button>
                                    <button onClick={() => handleDeletar(tipo.id_tipo_servico)} title="Excluir" className="action-icon-btn cancel-action"><FaTrashAlt /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <TipoServicoModal
                isOpen={isModalOpen}
                onClose={handleFecharModal}
                onSave={handleSalvar}
                tipoEmEdicao={emEdicao}
            />
        </div>
    );
}

export default TiposServicoSettingsPage;