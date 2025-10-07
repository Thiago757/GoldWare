import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext'; 
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import CategoriaProdutoModal from './components/CategoriaProdutoModal';
import './SettingsPage.css'; 

function CategoriaProdutosPage() {
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(true);
    const { token } = useContext(AuthContext);

    const [isModalOpen, setModalOpen] = useState(false);
    const [emEdicao, setEmEdicao] = useState(null);

    const fetchCategorias = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:3001/api/categorias', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Falha ao buscar dados das categorias');
            const data = await res.json();
            setCategorias(data);
        } catch (error) {
            console.error("Erro ao buscar categorias de produto", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchCategorias();
    }, [token]);
    
    const handleAbrirModal = (categoria = null) => {
        setEmEdicao(categoria);
        setModalOpen(true);
    };

    const handleFecharModal = () => {
        setModalOpen(false);
        setEmEdicao(null);
    };

    const handleSalvar = async (categoriaData) => {
        const isEditing = !!categoriaData.id_categoria;
        const url = isEditing
            ? `http://localhost:3001/api/categorias/${categoriaData.id_categoria}`
            : 'http://localhost:3001/api/categorias';
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ nome: categoriaData.nome })
            });
            if (!response.ok) throw new Error('Falha ao salvar a categoria.');
            
            handleFecharModal();
            fetchCategorias(); 
        } catch (error) {
            console.error("Erro ao salvar:", error);
            alert("Não foi possível salvar a categoria.");
        }
    };

    const handleDeletar = async (id) => {
        if (!window.confirm("Tem certeza que deseja excluir esta categoria?")) return;

        try {
            const response = await fetch(`http://localhost:3001/api/categorias/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
             
            if (response.status === 204) { 
                fetchCategorias(); 
                return;
            }
            
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Falha ao excluir.');
            }
            fetchCategorias();
        } catch (error) {
            console.error("Erro ao deletar:", error);
            alert(`Não foi possível excluir: ${error.message}`);
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1>Gerenciar Categorias de Produtos</h1>
                <button onClick={() => handleAbrirModal()} className="add-produto-btn">+ Nova Categoria</button>
            </div>
            <p style={{ margin: '8px 0 24px', color: '#64748b' }}>
                Cadastre as categorias para organizar seu catálogo de produtos.
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
                        ) : categorias.map(cat => (
                            <tr key={cat.id_categoria}>
                                <td>{cat.nome}</td>
                                <td style={{ textAlign: 'right' }}>
                                    <button onClick={() => handleAbrirModal(cat)} title="Editar" className="action-icon-btn"><FaEdit /></button>
                                    <button onClick={() => handleDeletar(cat.id_categoria)} title="Excluir" className="action-icon-btn cancel-action"><FaTrashAlt /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <CategoriaProdutoModal
                isOpen={isModalOpen}
                onClose={handleFecharModal}
                onSave={handleSalvar}
                categoriaEmEdicao={emEdicao}
            />
        </div>
    );
}

export default CategoriaProdutosPage;