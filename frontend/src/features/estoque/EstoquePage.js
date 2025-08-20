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

    const fetchProdutos = async () => {
        if (!token) return;
        setLoading(true); 
        try {
            const response = await fetch('http://localhost:3001/api/produtos', {
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
        fetchProdutos();
    }, [token]);

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
            let produtoSalvo;
            if (formData.id_produto) {
                console.log("Editando produto:", formData);
                produtoSalvo = formData;
            } else {
                const response = await fetch('http://localhost:3001/api/produtos', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(formData)
                });
                if (!response.ok) throw new Error('Falha ao cadastrar produto.');
                produtoSalvo = await response.json();
            }

            if (imagemFile && produtoSalvo.id_produto) {
                const uploadFormData = new FormData();
                uploadFormData.append('imagem', imagemFile);

                const uploadResponse = await fetch(`http://localhost:3001/api/produtos/${produtoSalvo.id_produto}/upload-image`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: uploadFormData
                });
                if (!uploadResponse.ok) throw new Error('Falha ao enviar imagem.');
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

    if (loading) return <p>Carregando produtos...</p>;

    return (
        <>
            <div className="estoque-container">
                <div className="estoque-header">
                    <h1>Gerenciamento de Estoque</h1>
                    <button onClick={handleAbreModalCadastro} className="add-produto-btn">+ Cadastrar Produto</button>
                </div>
                <div className="produtos-grid">
                    {produtos.length > 0 ? (
                        produtos.map(produto => (
                            <ProdutoCard 
                                key={produto.id_produto} 
                                produto={produto}
                                onEdit={() => handleAbreModalEdicao(produto)}
                                onToggleStatus={() => handleUpdateStatus(produto)}
                            />
                        ))
                    ) : (
                        <p>Nenhum produto encontrado. Clique em "+ Cadastrar Produto" para começar.</p>
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