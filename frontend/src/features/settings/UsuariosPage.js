import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../../context/AuthContext';
import UserModal from './components/UserModal';
import './SettingsPage.css';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

function UsuariosPage() {
    const { token } = useContext(AuthContext);
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState(null);

    const fetchUsuarios = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/api/usuarios`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Falha ao buscar usuários.');
            const data = await response.json();
            setUsuarios(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchUsuarios();
    }, [fetchUsuarios]);

    const handleSaveUser = async (userData) => {
        try {
            const method = userToEdit ? 'PUT' : 'POST';
            const url = userToEdit 
                ? `${API_BASE}/api/usuarios/${userToEdit.id_usuario}`
                : `${API_BASE}/api/usuarios`;

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao salvar usuário.');
            }

            alert(userToEdit ? 'Usuário atualizado!' : 'Usuário criado com sucesso!');
            setIsModalOpen(false);
            fetchUsuarios(); 
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Tem certeza que deseja excluir este usuário?")) return;
        
        try {
            const response = await fetch(`${API_BASE}/api/usuarios/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Erro ao excluir.');
            
            fetchUsuarios();
        } catch (err) {
            alert(err.message);
        }
    };

    const openCreateModal = () => {
        setUserToEdit(null);
        setIsModalOpen(true);
    };

    const openEditModal = (user) => {
        setUserToEdit(user);
        setIsModalOpen(true);
    };

    if (loading) return <div className="config-content">Carregando...</div>;

    return (
        <div className="config-content">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                <h2 style={{borderBottom: 'none', margin: 0, fontSize: '1.25rem'}}>Usuários do Sistema</h2>
                <button onClick={openCreateModal} className="btn-primary">+ Novo Usuário</button>
            </div>

            {error && <div className="error-message">{error}</div>}

            <table className="user-table">
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Email</th>
                        <th>Tipo</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {usuarios.map(user => (
                        <tr key={user.id_usuario}>
                            <td>{user.nome}</td>
                            <td>{user.email}</td>
                            <td>
                                <span style={{
                                    padding: '4px 8px', 
                                    borderRadius: '4px', 
                                    backgroundColor: user.tipo === 'admin' ? '#e0e7ff' : '#f3f4f6',
                                    color: user.tipo === 'admin' ? '#4338ca' : '#374151',
                                    fontSize: '0.85rem',
                                    fontWeight: '500',
                                    textTransform: 'capitalize'
                                }}>
                                    {user.tipo}
                                </span>
                            </td>
                            <td>
                                <button onClick={() => openEditModal(user)} className="btn-action edit">Editar</button>
                                <button onClick={() => handleDelete(user.id_usuario)} className="btn-action delete">Excluir</button>
                            </td>
                        </tr>
                    ))}
                    {usuarios.length === 0 && (
                        <tr>
                            <td colSpan="4" style={{textAlign: 'center', padding: '20px', color: '#888'}}>
                                Nenhum usuário encontrado.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            <UserModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                userToEdit={userToEdit} 
                onSave={handleSaveUser}
            />
        </div>
    );
}

export default UsuariosPage;