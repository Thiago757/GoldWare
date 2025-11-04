import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../../context/AuthContext';
import ProdutoCard from './components/ProdutoCard';
import ProdutoModal from './components/ProdutoModal';
import BarcodeModal from './components/BarcodeModal';
import ImageModal from '../../components/common/ImagemModal';
import './EstoquePage.css';
import '../vendas/VendasListPage.css';

function EstoquePage() {
    const [produtos, setProdutos] = useState([]);
    const [loading, setLoading] = useState(true);
    const { token } = useContext(AuthContext);
    const [isModalOpen, setModalOpen] = useState(false);
    const [produtoEmEdicao, setProdutoEmEdicao] = useState(null);
    const [filtroNome, setFiltroNome] = useState('');
    const [filtroCodigoBarras, setFiltroCodigoBarras] = useState('');
    const [filtroStatus, setFiltroStatus] = useState('');
    const [scannedCode, setScannedCode] = useState('');
    const [isBarcodeModalOpen, setBarcodeModalOpen] = useState(false);
    const [produtoParaEtiqueta, setProdutoParaEtiqueta] = useState(null);
    const [categorias, setCategorias] = useState([]);
    const [isImageModalOpen, setImageModalOpen] = useState(false);
    const [currentImageForView, setCurrentImageForView] = useState('');

    const fetchProdutos = useCallback(async (barcodeToSearch) => {
        if (!token) return;
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filtroNome) params.append('nome', filtroNome);

            const finalBarcode = barcodeToSearch !== undefined ? barcodeToSearch : filtroCodigoBarras;
            if (finalBarcode) {
                params.append('codigo_barras', finalBarcode);
            }
            
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
    }, [token, filtroNome, filtroCodigoBarras, filtroStatus]);

    const fetchCategorias = useCallback(async () => {
        if (!token) return;
        try {
            const response = await fetch(`http://localhost:3001/api/categorias`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Falha ao buscar categorias');
            const data = await response.json();
            setCategorias(data);
        } catch (error) {
            console.error("Erro ao buscar categorias:", error);
        }
    }, [token]);

    useEffect(() => {
        fetchProdutos();
        fetchCategorias(); 
    }, [fetchProdutos, fetchCategorias]); 

    useEffect(() => {
        const handleGlobalKeyDown = (e) => {
            const targetTagName = e.target.tagName.toLowerCase();
            if (['input', 'select', 'textarea'].includes(targetTagName)) {
                return;
            }

            if (e.key === 'Enter') {
                if (scannedCode) {
                    e.preventDefault();
                    setFiltroCodigoBarras(scannedCode); 
                    fetchProdutos(scannedCode);       
                    setScannedCode('');                
                }
            } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                setScannedCode(prevCode => prevCode + e.key);
            }
        };

        document.addEventListener('keydown', handleGlobalKeyDown);

        return () => {
            document.removeEventListener('keydown', handleGlobalKeyDown);
        };
    }, [scannedCode, fetchProdutos]);

    const handleBarcodeKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); 
            fetchProdutos();
            setFiltroCodigoBarras(''); 
        }
    };

    const handleFiltroSubmit = (e) => {
        e.preventDefault();
        fetchProdutos();
    };

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
            let isEdit = !!formData.id_produto;

            if (isEdit) {
                const response = await fetch(`http://localhost:3001/api/produtos/${formData.id_produto}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(formData)
                });
                if (!response.ok) throw new Error('Falha ao editar produto.');
                produtoSalvo = await response.json();

                if (imagemFile) {
                    const uploadFormData = new FormData();
                    uploadFormData.append('imagem', imagemFile);
                    await fetch(`http://localhost:3001/api/produtos/${produtoSalvo.id_produto}/upload-image`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` },
                        body: uploadFormData
                    });
                }
            } else {
                const dataToSend = new FormData();
                Object.keys(formData).forEach(key => {
                    dataToSend.append(key, formData[key]);
                });
                if (imagemFile) {
                    dataToSend.append('imagem', imagemFile);
                }

                const response = await fetch('http://localhost:3001/api/produtos', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: dataToSend
                });
                if (!response.ok) throw new Error('Falha ao cadastrar produto.');
                produtoSalvo = await response.json();
            
            }

            setModalOpen(false);
            fetchProdutos();

        } catch (error) {
            console.error("Erro ao salvar produto:", error);
            throw error; 
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

     const handleAbreModalEtiqueta = (produto) => {
        setProdutoParaEtiqueta(produto);
        setBarcodeModalOpen(true);
    };

    const handleViewImage = (imageUrl) => {
        setCurrentImageForView(imageUrl);
        setImageModalOpen(true);
    };

    if (loading && produtos.length === 0) return <p>Carregando produtos...</p>;

    return (
        <>
            <div className="estoque-container">
                <div className="estoque-header">
                    <h1>Gerenciamento de Estoque</h1>
                    <button onClick={handleAbreModalCadastro} className="add-produto-btn">+ Cadastrar Produto</button>
                </div>
                <form onSubmit={handleFiltroSubmit} className="filtros-container">
                    <div className="filtro-item">
                        <label>Nome</label>
                        <input 
                            type="text"
                            placeholder="Digite o nome do produto..."
                            className="filtro-input"
                            value={filtroNome}
                            onChange={e => setFiltroNome(e.target.value)}
                        />
                    </div>
                    <div className="filtro-item">
                        <label>Código de Barras</label>
                        <input 
                            type="text"
                            placeholder="Digite ou leia o código..."
                            className="filtro-input"
                            value={filtroCodigoBarras}
                            onChange={e => setFiltroCodigoBarras(e.target.value)}
                            onKeyDown={handleBarcodeKeyDown}
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
                            <option value="S">Ativo</option>
                            <option value="N">Inativo</option>
                        </select>
                    </div>
                    <button type="submit" className="filtrar-btn">Filtrar</button>
                </form>

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
                                onGenerateBarcode={() => handleAbreModalEtiqueta(produto)}
                                onViewImage={handleViewImage}
                            />
                        ))
                    ) : (
                        <p>Nenhum produto encontrado. Verifique os filtros ou cadastre um novo produto.</p>
                    )}
                </div>
            </div>

            <ProdutoModal
                isOpen={isModalOpen}
                onClose={() => { setModalOpen(false); setProdutoEmEdicao(null); }}
                produto={produtoEmEdicao}
                onSave={handleSalvarProduto}
                categorias={categorias}
            />
            <BarcodeModal
                isOpen={isBarcodeModalOpen}
                onClose={() => setBarcodeModalOpen(false)}
                produto={produtoParaEtiqueta}
            />
            <ImageModal
                isOpen={isImageModalOpen}
                imageUrl={currentImageForView}
                onClose={() => setImageModalOpen(false)}
            />
        </>
    );
}

export default EstoquePage;