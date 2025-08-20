import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import ProdutoCard from './components/ProdutoCard';
import ProdutoModal from './components/ProdutoModal';
import './EstoquePage.css';

function EstoquePage() {
    const [produtos, setProdutos] = useState([]);
    const [loading, setLoading] = useState(true);
    const { token } = useContext(AuthContext);
    const [isModalOpen, setModalOpen] = useState(false);
    const [produtoEmEdicao, setProdutoEmEdicao] = useState(null);
    const [filtroNome, setFiltroNome] = useState('');
    const [filtroStatus, setFiltroStatus] = useState('');

    const fetchProdutos = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filtroNome) params.append('nome', filtroNome);
            if (filtroStatus) params.append('ativo', filtroStatus);

            const response = await fetch(`http://localhost:3001/api/produtos?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Falha ao buscar produtos');
            const data = await response.json();
            setProdutos(data);
        } catch (error) {
            console.error("Erro:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (token) {
                fetchProdutos();
            }
        }, 300);

        return () => clearTimeout(timer); 
    }, [filtroNome, filtroStatus, token]);


    const handleAbreModalCadastro = () => {
        setProdutoEmEdicao(null);
        setModalOpen(true);
    };

    const handleAbreModalEdicao = (produto) => {
        setProdutoEmEdicao(produto);
        setModalOpen(true);
    };

    const handleSalvarProduto = async (formData, imagemFile) => {
        try {
            const dataToSend = new FormData();
            Object.keys(formData).forEach(key => {
                if (key !== 'id_produto') dataToSend.append(key, formData[key]);
            });
            if (imagemFile) {
                dataToSend.append('imagem', imagemFile);
            }

            let produtoSalvo;

            if (formData.id_produto) {
                const response = await fetch(`http://localhost:3001/api/produtos/${formData.id_produto}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(formData)
                });
                if (!response.ok) throw new Error('Falha ao editar produto.');
                produtoSalvo = await response.json();
            } else {
                const response = await fetch('http://localhost:3001/api/produtos', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: dataToSend
                });
                if (!response.ok) throw new Error('Falha ao cadastrar produto.');
                produtoSalvo = await response.json();
            }

            if (imagemFile && produtoSalvo.id_produto) {
                const uploadFormData = new FormData();
                uploadFormData.append('imagem', imagemFile);
                await fetch(`http://localhost:3001/api/produtos/${produtoSalvo.id_produto}/upload-image`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: uploadFormData
                });
            }

            setModalOpen(false);
            fetchProdutos();

        } catch (error) {
            console.error("Erro ao salvar produto:", error);
            alert(`Erro: ${error.message}`);
        }
    };

    const handleUpdateStatus = async (produto) => {
        const novoStatus = produto.ativo === 'S' ? 'N' : 'S';
        try {
            const response = await fetch(`http://localhost:3001/api/produtos/${produto.id_produto}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ ativo: novoStatus })
            });
            if (!response.ok) throw new Error('Falha ao atualizar status');
            fetchProdutos();
        } catch (error) {
            console.error("Erro ao atualizar status:", error);
            alert('Erro ao atualizar status.');
        }
    };

    if (loading && produtos.length === 0) return <p>Carregando produtos...</p>;

    return (
        <>
            <div className="estoque-container">
                <div className="estoque-header">
                    <h1>Gerenciamento de Estoque</h1>
                    <button onClick={handleAbreModalCadastro} className="add-produto-btn">+ Cadastrar Produto</button>
                </div>

                <div className="filtros-container-estoque">
                    <input 
                        type="text"
                        placeholder="Pesquisar por nome..."
                        className="filtro-input-estoque nome"
                        value={filtroNome}
                        onChange={e => setFiltroNome(e.target.value)}
                    />
                    <select 
                        className="filtro-input-estoque status"
                        value={filtroStatus}
                        onChange={e => setFiltroStatus(e.target.value)}
                    >
                        <option value="">Todos</option>
                        <option value="S">Ativo</option>
                        <option value="N">Inativo</option>
                    </select>
                </div>

                <div className="produtos-grid">
                    {loading ? (
                        <p>Carregando...</p>
                    ) : produtos.length > 0 ? (
                        produtos.map(produto => (
                            <ProdutoCard 
                                key={produto.id_produto} 
                                produto={produto}
                                onEdit={() => handleAbreModalEdicao(produto)}
                                onToggleStatus={() => handleUpdateStatus(produto)}
                            />
                        ))
                    ) : (
                        <p>Nenhum produto encontrado. Verifique os filtros ou cadastre um novo produto.</p>
                    )}
                </div>
            </div>

            <ProdutoModal
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
                produto={produtoEmEdicao}
                onSave={handleSalvarProduto}
            />
        </>
    );
}

export default EstoquePage;