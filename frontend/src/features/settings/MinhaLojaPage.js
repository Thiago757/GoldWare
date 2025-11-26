import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../../context/AuthContext';
import './SettingsPage.css'; 

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

function MinhaLojaPage() {
    const { token } = useContext(AuthContext);
    const [lojaData, setLojaData] = useState({
        nome_loja: '',
        cnpj: '',
        endereco: '',
        telefone: '',
        email_contato: ''
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    const fetchLojaData = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`${API_BASE}/api/configuracoes/minha-loja`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                console.warn("Resposta não-JSON recebida da API.");
                return;
            }

            if (!response.ok) {
                throw new Error('Falha ao carregar configurações da loja.');
            }
            const data = await response.json();
            if (data && Object.keys(data).length > 0) {
                setLojaData(data);
            }
        } catch (err) {
            setError(err.message);
            console.error('Erro ao buscar configurações da loja:', err);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchLojaData();
    }, [fetchLojaData]);

    const handleEditClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setSuccessMsg('');
        setIsEditing(true);
    };

    const handleCancelClick = (e) => {
        e.preventDefault();
        setIsEditing(false);
        setSuccessMsg('');
        fetchLojaData(); 
    };

    const handleSaveLoja = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');
        
        try {
            const response = await fetch(`${API_BASE}/api/configuracoes/minha-loja`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(lojaData)
            });
            
            if (!response.ok) {
                throw new Error('Falha ao atualizar configurações da loja.');
            }
            
            setIsEditing(false); 
            setSuccessMsg('Configurações salvas com sucesso!');
            setTimeout(() => setSuccessMsg(''), 3000);

            fetchLojaData(); 
        } catch (err) {
            setError(err.message);
            console.error('Erro ao salvar configurações da loja:', err);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setLojaData(prevData => ({ ...prevData, [name]: value }));
    };

    if (loading) return <div className="config-content">Carregando...</div>;

    return (
        <div className="config-content">
            {error && <div className="error-message">{error}</div>}
            {successMsg && <div className="success-message">{successMsg}</div>}

            <form onSubmit={handleSaveLoja} className="config-form">
                <div className="form-row">
                    <div className="form-group half-width">
                        <label htmlFor="nomeLoja">Nome da Loja</label>
                        <input type="text" id="nomeLoja" name="nome_loja" value={lojaData.nome_loja || ''} onChange={handleChange} disabled={!isEditing} />
                    </div>
                    <div className="form-group half-width">
                        <label htmlFor="cnpj">CNPJ</label>
                        <input type="text" id="cnpj" name="cnpj" value={lojaData.cnpj || ''} onChange={handleChange} disabled={!isEditing} />
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="endereco">Endereço Completo</label>
                    <input type="text" id="endereco" name="endereco" value={lojaData.endereco || ''} onChange={handleChange} disabled={!isEditing} />
                </div>

                <div className="form-row">
                    <div className="form-group half-width">
                        <label htmlFor="telefone">Telefone / WhatsApp</label>
                        <input type="text" id="telefone" name="telefone" value={lojaData.telefone || ''} onChange={handleChange} disabled={!isEditing} />
                    </div>
                    <div className="form-group half-width">
                        <label htmlFor="email">Email de Contato</label>
                        <input type="email" id="email" name="email_contato" value={lojaData.email_contato || ''} onChange={handleChange} disabled={!isEditing} />
                    </div>
                </div>
                
                <div className="form-actions">
                    {!isEditing ? (
                        <button type="button" onClick={handleEditClick} className="btn-primary">Editar Dados</button>
                    ) : (
                        <>
                            <button type="submit" className="btn-success">Salvar Alterações</button>
                            <button type="button" onClick={handleCancelClick} className="btn-secondary">Cancelar</button>
                        </>
                    )}
                </div>
            </form>
        </div>
    );
}

export default MinhaLojaPage;