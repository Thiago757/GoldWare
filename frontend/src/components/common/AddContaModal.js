import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import './ConfirmationModal.css'; // Reutiliza seu CSS padrão

function AddContaModal({ isOpen, onClose, onContaSaved }) {
    const { token } = useContext(AuthContext);
    
    const [nomeConta, setNomeConta] = useState('');
    const [banco, setBanco] = useState('');
    const [agencia, setAgencia] = useState('');
    const [numeroConta, setNumeroConta] = useState('');
    const [saldoInicial, setSaldoInicial] = useState('');
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('http://localhost:3001/api/contas-bancarias', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({
                    nome_conta: nomeConta,
                    banco,
                    agencia,
                    numero_conta: numeroConta,
                    saldo_inicial: Number(saldoInicial)
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message);

            onContaSaved(); // Atualiza a lista na tela pai
            onClose(); // Fecha modal
            
            // Limpa campos
            setNomeConta(''); setBanco(''); setAgencia(''); setNumeroConta(''); setSaldoInicial('');

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <form onSubmit={handleSubmit} className="modal-content" style={{textAlign: 'left'}}>
                <h2>Nova Conta Bancária</h2>

                <div className="modal-form-group">
                    <label>Nome da Conta (Apelido)*</label>
                    <input 
                        type="text" 
                        placeholder="Ex: Nubank Principal"
                        value={nomeConta} 
                        onChange={e => setNomeConta(e.target.value)} 
                        required 
                    />
                </div>

                <div className="modal-form-row">
                    <div className="modal-form-group">
                        <label>Banco*</label>
                        <input 
                            type="text" 
                            placeholder="Ex: Nubank"
                            value={banco} 
                            onChange={e => setBanco(e.target.value)} 
                            required 
                        />
                    </div>
                    <div className="modal-form-group">
                        <label>Saldo Inicial (R$)</label>
                        <input 
                            type="number" 
                            step="0.01"
                            placeholder="0.00"
                            value={saldoInicial} 
                            onChange={e => setSaldoInicial(e.target.value)} 
                        />
                    </div>
                </div>

                <div className="modal-form-row">
                    <div className="modal-form-group">
                        <label>Agência</label>
                        <input type="text" value={agencia} onChange={e => setAgencia(e.target.value)} />
                    </div>
                    <div className="modal-form-group">
                        <label>Número da Conta</label>
                        <input type="text" value={numeroConta} onChange={e => setNumeroConta(e.target.value)} />
                    </div>
                </div>

                {error && <p className="modal-error-message">{error}</p>}

                <div className="modal-actions">
                    <button type="button" onClick={onClose} className="modal-button cancel" disabled={loading}>Cancelar</button>
                    <button type="submit" className="modal-button confirm save" disabled={loading}>
                        {loading ? 'Salvando...' : 'Cadastrar'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default AddContaModal;