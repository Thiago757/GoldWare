import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import './ConfirmationModal.css'; 

function AddClienteModal({ isOpen, onClose, onClientSaved }) {
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [cpf, setCpf] = useState('');
    const [telefone, setTelefone] = useState('');
    const [endereco, setEndereco] = useState('');
    const [error, setError] = useState('');
    const { token } = useContext(AuthContext);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await fetch('http://localhost:3001/api/clientes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ nome, email, cpf, telefone, endereco }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);

           
            onClientSaved(data.cliente);
            handleClose();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleClose = () => {
        setNome(''); setEmail(''); setCpf(''); setTelefone(''); setEndereco(''); setError('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <form onSubmit={handleSubmit} className="modal-content" style={{textAlign: 'left'}}>
                <h2>Cadastrar Novo Cliente</h2>
                <div className="pagamento-form-group">
                    <label htmlFor="nome">Nome Completo*</label>
                    <input id="nome" type="text" value={nome} onChange={e => setNome(e.target.value)} required />
                </div>
                <div className="pagamento-form-group">
                    <label htmlFor="email">Email</label>
                    <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div className="pagamento-form-group">
                    <label htmlFor="cpf">CPF</label>
                    <input id="cpf" type="text" value={cpf} onChange={e => setCpf(e.target.value)} />
                </div>
                <div className="pagamento-form-group">
                    <label htmlFor="telefone">Telefone</label>
                    <input id="telefone" type="text" value={telefone} onChange={e => setTelefone(e.target.value)} />
                </div>
                <div className="pagamento-form-group">
                    <label htmlFor="endereco">Endereço</label>
                    <input id="endereco" type="text" value={endereco} onChange={e => setEndereco(e.target.value)} />
                </div>
                {error && <p className="login-error" style={{textAlign: 'center'}}>{error}</p>}
                <div className="modal-actions">
                    <button type="button" onClick={handleClose} className="modal-button cancel">Cancelar</button>
                    <button type="submit" className="modal-button confirm">Salvar Cliente</button>
                </div>
            </form>
        </div>
    );
}
export default AddClienteModal;