import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { IMaskInput } from 'react-imask';
import './ConfirmationModal.css'; 

function AddClienteModal({ isOpen, onClose, onClientSaved, cliente }) {
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [cpf, setCpf] = useState('');
    const [telefone, setTelefone] = useState('');
    const [endereco, setEndereco] = useState('');
    const [error, setError] = useState('');
    const { token } = useContext(AuthContext);

    useEffect(() => {
        if (isOpen) {
            if (cliente) { 
                setNome(cliente.nome || '');
                setEmail(cliente.email || '');
                setCpf(cliente.cpf || '');
                setTelefone(cliente.telefone || '');
                setEndereco(cliente.endereco || '');
            } else {
                handleClose(false);
            }
        }
    }, [cliente, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const url = cliente
                ? `http://localhost:3001/api/clientes/${cliente.id_cliente}`
                : 'http://localhost:3001/api/clientes';
            
            const method = cliente ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ nome, email, cpf, telefone, endereco }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            
            onClientSaved(cliente ? data : data.cliente);
            handleClose();
        } catch (err) {
            setError(err.message);
        }
    };
    
    const handleClose = (shouldCloseModal = true) => {
        setNome(''); setEmail(''); setCpf(''); setTelefone(''); setEndereco(''); setError('');
        if (shouldCloseModal) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <form onSubmit={handleSubmit} className="modal-content" style={{textAlign: 'left'}}>
                {/* O título do modal agora é dinâmico */}
                <h2>{cliente ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}</h2>
                
                <div className="modal-form-group">
                    <label htmlFor="nome">Nome Completo*</label>
                    <input id="nome" type="text" value={nome} onChange={e => setNome(e.target.value)} required />
                </div>
                <div className="modal-form-group">
                    <label htmlFor="email">Email*</label>
                    <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div className="modal-form-group">
                    <label htmlFor="cpf">CPF*</label>
                    <IMaskInput
                        mask="000.000.000-00"
                        value={cpf}
                        onAccept={(value) => setCpf(value)}
                        id="cpf"
                        placeholder="___.___.___-__"
                        required
                    />
                </div>
                <div className="modal-form-group">
                    <label htmlFor="telefone">Telefone*</label>
                     <IMaskInput
                        mask="(00) 00000-0000"
                        value={telefone}
                        onAccept={(value) => setTelefone(value)}
                        id="telefone"
                        placeholder="(__) _____-____"
                        required
                    />
                </div>
                <div className="modal-form-group">
                    <label htmlFor="endereco">Endereço*</label>
                    <input id="endereco" type="text" value={endereco} onChange={e => setEndereco(e.target.value)} required />
                </div>

                {error && <p className="modal-error-message">{error}</p>}
                
                <div className="modal-actions">
                    <button type="button" onClick={() => handleClose(true)} className="modal-button cancel">Cancelar</button>
                    <button type="submit" className="modal-button confirm save">Salvar</button>
                </div>
            </form>
        </div>
    );
}
export default AddClienteModal;