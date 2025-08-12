import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';
import { AuthContext } from '../../context/AuthContext';

import visibilityIcon from '../../assets/login/visibility.svg';
import visibilityoffIcon from '../../assets/login/off-visibility.svg';

function LoginPage() {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useContext(AuthContext);

    const handleLogin = async (e) => {
        e.preventDefault();
        
        if (!email || !senha) {
            setError('Por favor, insira seu email e senha.');
            return; 
        }

        setError('');

        try {
            const response = await fetch('http://localhost:3001/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha }),
            });

            const data = await response.json();

              if (!response.ok) { 
                throw new Error(data.message || 'Email ou senha estão inválidos.');
            }

            login(data.token);

            navigate('/dashboard');

        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="login-page-container">
            <div className="login-image-section">
                <div className="image-overlay">
                    <img src="https://cdn.prod.website-files.com/60c368fa646716418bdf9ce9/614b4884362e9151e5e4a4b5_189142-conheca-as-principais-caracteristicas-das-joias-de-ouro-amarelo-p-1080.jpeg" alt="Joias Gold Ware" />
                </div>
            </div>

            <div className="login-form-section">
                <div className="login-form-container">
                    <h1 className="form-title">Entre na sua conta</h1>
                    
                    <form onSubmit={handleLogin} className="login-form" noValidate>
                        <div className="input-group">
                            <label htmlFor="email">Email</label>
                            <input
                                id="email"
                                type="email"
                                placeholder="Digite seu email aqui"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={`login-input ${error ? 'input-error' : ''}`}
                            />
                        </div>
                        <div className="input-group">
                            <label htmlFor="password">Senha</label>
                            <div className="password-input-wrapper">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'} // O tipo muda com base no estado
                                    placeholder="Digite sua senha aqui"
                                    value={senha}
                                    onChange={(e) => setSenha(e.target.value)}
                                    className={`login-input ${error ? 'input-error' : ''}`}
                                />
                                <span 
                                    className="password-toggle-icon" 
                                    onClick={() => setShowPassword(!showPassword)} // Ação de clique para alternar a visibilidade
                                >
                                    {showPassword ? <img src={visibilityIcon} alt="Mostrar senha" /> : 
                                                    <img src={visibilityoffIcon} alt="Mostrar senha" />}
                                </span>
                            </div>
                        </div>

                        <a href="/esqueceu-senha" className="forgot-password-link">Esqueceu sua senha?</a>

                        {error && <p className="login-error">{error}</p>}
                        
                        <button type="submit" className="login-button">Fazer login</button>
                    </form>

                </div>
                 <p className="footer-brand">Gold Ware</p>
            </div>
        </div>
    );
}

export default LoginPage;