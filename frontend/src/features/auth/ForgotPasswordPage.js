import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './LoginPage.css'; 

function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        try {
            const response = await fetch('http://localhost:3001/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await response.json();
            setMessage(data.message);
        } catch (error) {
            setMessage('Erro ao tentar enviar o email.');
        }
    };

    return (
        <div className="login-page-container">
            <div className="login-form-section">
                <div className="login-form-container">
                    <h1 className="form-title">Recuperar Senha</h1>
                    {!message ? (
                        <form onSubmit={handleSubmit} className="login-form">
                            <p style={{textAlign: 'center', marginBottom: '20px'}}>Digite seu email para enviarmos um link de recuperação.</p>
                            <div className="input-group">
                                <label htmlFor="email">Email</label>
                                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="login-input" />
                            </div>
                            <button type="submit" className="login-button">Enviar</button>
                        </form>
                    ) : (
                        <p style={{textAlign: 'center', color: 'green'}}>{message}</p>
                    )}
                     <Link to="/login" style={{textAlign: 'center', marginTop: '20px', textDecoration: 'none'}}>Voltar para o Login</Link>
                </div>
            </div>
        </div>
    );
}
export default ForgotPasswordPage;