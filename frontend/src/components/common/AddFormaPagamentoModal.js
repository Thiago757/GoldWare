import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import './ConfirmationModal.css'; // Reutiliza CSS

function AddFormaPagamentoModal({ isOpen, onClose }) {
    const { token } = useContext(AuthContext);
    const [nome, setNome] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('http://localhost:3001/api/formas-pagamento', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ nome })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message);

            // Sucesso
            setNome('');
            onClose(); 
            alert('Forma de pagamento cadastrada com sucesso!');

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <form onSubmit={handleSubmit} className="modal-content" style={{textAlign: 'left', maxWidth: '400px'}}>
                <h2>Nova Forma de Pagamento</h2>

                <div className="modal-form-group">
                    <label>Nome (Ex: PIX, Boleto)*</label>
                    <input 
                        type="text" 
                        value={nome} 
                        onChange={e => setNome(e.target.value)} 
                        required 
                        placeholder="Digite o nome..."
                    />
                </div>

                {error && <p className="modal-error-message">{error}</p>}

                <div className="modal-actions">
                    <button type="button" onClick={onClose} className="modal-button cancel" disabled={loading}>
                        Cancelar
                    </button>
                    <button type="submit" className="modal-button confirm save" disabled={loading}>
                        {loading ? 'Salvando...' : 'Cadastrar'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default AddFormaPagamentoModal;