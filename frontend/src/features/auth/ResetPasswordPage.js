import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './LoginPage.css';

function ResetPasswordPage() {
    const [senha, setSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const token = searchParams.get('token');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (senha !== confirmarSenha) {
            setError('As senhas não coincidem.');
            return;
        }
        if (!token) {
            setError('Token de redefinição não encontrado.');
            return;
        }
        setError('');
        setMessage('');

        try {
            const response = await fetch(`http://localhost:3001/api/auth/reset-password?token=${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ senha }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);

            setMessage(data.message);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="login-page-container">
            <div className="login-form-section">
                <div className="login-form-container">
                    <h1 className="form-title">Crie sua Nova Senha</h1>
                    {!message ? (
                        <form onSubmit={handleSubmit} className="login-form">
                            <div className="input-group">
                                <label htmlFor="senha">Nova Senha</label>
                                <input id="senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required className="login-input"/>
                            </div>
                            <div className="input-group">
                                <label htmlFor="confirmarSenha">Confirmar Nova Senha</label>
                                <input id="confirmarSenha" type="password" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} required className="login-input"/>
                            </div>
                            {error && <p className="login-error">{error}</p>}
                            <button type="submit" className="login-button">Redefinir Senha</button>
                        </form>
                    ) : (
                        <p style={{textAlign: 'center', color: 'green'}}>{message}</p>
                    )}
                </div>
            </div>
        </div>
    );
}
export default ResetPasswordPage;