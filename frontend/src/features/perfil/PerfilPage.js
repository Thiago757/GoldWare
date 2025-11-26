import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../../context/AuthContext';
import './PerfilPage.css';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

function PerfilPage() {
    const { token } = useContext(AuthContext);
    const [userId, setUserId] = useState(null);
    
    const [userData, setUserData] = useState({
        nome: '',
        email: '',
        senha: '', 
        tipo: ''
    });
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    const parseJwt = (token) => {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (e) {
            return null;
        }
    };

    useEffect(() => {
        if (token) {
            const decoded = parseJwt(token);
            if (decoded) {
                const id = decoded.userId || decoded.id || decoded.sub || decoded.id_usuario;
                setUserId(id);
            } else {
                setError("Token inválido.");
                setLoading(false);
            }
        }
    }, [token]);

    const fetchPerfil = useCallback(async () => {
        if (!userId || !token) return;
        
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`${API_BASE}/api/perfil/${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Erro ${response.status}: Falha ao carregar perfil.`);
            }
            
            const data = await response.json();
            setUserData({ ...data, senha: '' });
        } catch (err) {
            console.error("Erro fetchPerfil:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [userId, token]);

    useEffect(() => {
        if (userId) {
            fetchPerfil();
        }
    }, [userId, fetchPerfil]);

    const handleEditClick = (e) => {
        e.preventDefault();
        setIsEditing(true);
        setSuccessMsg('');
    };

    const handleCancelClick = (e) => {
        e.preventDefault();
        setIsEditing(false);
        setSuccessMsg('');
        fetchPerfil();
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');

        try {
            const response = await fetch(`${API_BASE}/api/perfil/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Erro ao atualizar perfil.');
            }

            setIsEditing(false);
            setSuccessMsg('Perfil atualizado com sucesso!');
            setTimeout(() => setSuccessMsg(''), 3000);
            
            fetchPerfil();
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) return <div className="perfil-page-container">Carregando perfil...</div>;

    return (
        <div className="perfil-page-container">
            <div className="perfil-content">
                <div className="perfil-header">
                    <h2>Meu Perfil</h2>
                    <p>Gerencie as suas informações de acesso e dados pessoais.</p>
                </div>

                {error && <div className="error-message">{error}</div>}
                {successMsg && <div className="success-message">{successMsg}</div>}

                <form onSubmit={handleSave} className="perfil-form">
                    <div className="form-group">
                        <label>Nome Completo</label>
                        <input type="text" value={userData.nome || ''} onChange={(e) => setUserData({...userData, nome: e.target.value})} disabled={!isEditing} />
                    </div>

                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" value={userData.email || ''} onChange={(e) => setUserData({...userData, email: e.target.value})} disabled={!isEditing} />
                    </div>

                    <div className="form-group">
                        <label>Função / Permissão</label>
                        <input type="text" value={userData.tipo || ''} disabled={true} style={{backgroundColor: '#f1f5f9', color: '#64748b'}} />
                    </div>

                    <div className="form-group">
                        <label>Nova Senha <small style={{fontWeight: 'normal', color: '#64748b'}}>(Deixe em branco para manter a atual)</small></label>
                        <input type="password" value={userData.senha} onChange={(e) => setUserData({...userData, senha: e.target.value})} disabled={!isEditing} placeholder={isEditing ? "Digite a nova senha" : "********"} />
                    </div>

                    <div className="form-actions">
                        {!isEditing ? (
                            <button type="button" onClick={handleEditClick} className="btn-primary">Editar Perfil</button>
                        ) : (
                            <>
                                <button type="submit" className="btn-success">Salvar Alterações</button>
                                <button type="button" onClick={handleCancelClick} className="btn-secondary">Cancelar</button>
                            </>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}

export default PerfilPage;