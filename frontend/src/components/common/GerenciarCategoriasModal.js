import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import './GerenciarCategoriasModal.css';

const FormularioCategoria = ({ categoria, onSave, onCancel }) => {
    const [nome, setNome] = useState(categoria ? categoria.nome : '');

    useEffect(() => {
        setNome(categoria ? categoria.nome : '');
    }, [categoria]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ ...categoria, nome });
        setNome('');
    };

    return (
        <form onSubmit={handleSubmit} className="categoria-form">
            <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome da categoria"
                required
            />
            <button type="submit" className="modal-button confirm save-categoria">
                {categoria ? 'Atualizar' : <><FaPlus /> Adicionar</>}
            </button>
            {categoria && (
                <button type="button" onClick={onCancel} className="modal-button cancel">
                    Cancelar
                </button>
            )}
        </form>
    );
};

function GerenciarCategoriasModal({ isOpen, onClose }) {
    const { token } = useContext(AuthContext);
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [categoriaEmEdicao, setCategoriaEmEdicao] = useState(null);

    const fetchCategorias = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const response = await fetch('http://localhost:3001/api/categorias', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Falha ao buscar categorias');
            const data = await response.json();
            setCategorias(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchCategorias();
            setError('');
            setCategoriaEmEdicao(null);
        }
    }, [isOpen, token]);

    const handleSave = async (categoria) => {
        try {
            const { id_categoria, nome } = categoria;
            const isEdit = !!id_categoria;
            
            const url = isEdit 
                ? `http://localhost:3001/api/categorias/${id_categoria}`
                : 'http://localhost:3001/api/categorias';
                
            const method = isEdit ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ nome })
            });
            
            const resData = await response.json();
            if (!response.ok) {
                throw new Error(resData.error || (isEdit ? 'Falha ao atualizar categoria' : 'Falha ao criar categoria'));
            }

            setCategoriaEmEdicao(null);
            fetchCategorias();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDelete = async (id_categoria) => {
        if (window.confirm('Tem a certeza que quer apagar esta categoria? Esta ação não pode ser desfeita.')) {
            try {
                const response = await fetch(`http://localhost:3001/api/categorias/${id_categoria}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.error || 'Falha ao apagar categoria');
                }
                
                fetchCategorias();
            } catch (err) {
                setError(err.message);
                alert(err.message);
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content categoria-modal">
                <div className="modal-header">
                    <h2>Gerir Categorias</h2>
                    <button onClick={onClose} className="modal-close-button">&times;</button>
                </div>
                <div className="modal-body">
                    {error && <p className="error-message">{error}</p>}
                    
                    {!categoriaEmEdicao && (
                        <FormularioCategoria onSave={handleSave} />
                    )}

                    <ul className="categoria-list">
                        {loading ? <p>A carregar...</p> : categorias.map(cat => (
                            <li key={cat.id_categoria} className="categoria-list-item">
                                {categoriaEmEdicao && categoriaEmEdicao.id_categoria === cat.id_categoria ? (
                                    <FormularioCategoria 
                                        categoria={categoriaEmEdicao} 
                                        onSave={handleSave}
                                        onCancel={() => setCategoriaEmEdicao(null)}
                                    />
                                ) : (
                                    <>
                                        <span>{cat.nome}</span>
                                        <div className="categoria-actions">
                                            <button onClick={() => setCategoriaEmEdicao(cat)} title="Editar"><FaEdit /></button>
                                            <button onClick={() => handleDelete(cat.id_categoria)} title="Apagar"><FaTrash /></button>
                                        </div>
                                    </>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default GerenciarCategoriasModal;