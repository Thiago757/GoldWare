import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AsyncSelect from 'react-select/async';
import AddClienteModal from './AddClienteModal';
import './ConfirmationModal.css';
import { AuthContext } from '../../context/AuthContext';

function ClienteSelectModal({ isOpen, onClose, onConfirm }) {
    const [clienteSelecionado, setClienteSelecionado] = useState(null);
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const { token } = useContext(AuthContext);
    const navigate = useNavigate();

    const loadClientes = async (inputValue) => {
        try {
            const response = await fetch(`http://localhost:3001/api/clientes/search?q=${inputValue}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            return data.map(cliente => ({
                value: cliente.id_cliente,
                label: cliente.nome,
            }));
        } catch (error) {
            console.error("Erro ao carregar clientes", error);
            return [];
        }
    };

    const handleConfirm = () => {
        if (clienteSelecionado) {
            onConfirm(clienteSelecionado);
        }
    };

    const handleClientSaved = (novoCliente) => {
        setAddModalOpen(false);
        const clienteFormatado = { value: novoCliente.id_cliente, label: novoCliente.nome };
        setClienteSelecionado(clienteFormatado);
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="modal-overlay">
                <div className="modal-content" style={{ minWidth: '500px' }}>
                    <h2>Iniciar Nova Venda</h2>
                    <p>Selecione um cliente para continuar ou cadastre um novo.</p>

                    <div style={{ margin: '20px 0' }}>
                        <AsyncSelect
                            cacheOptions
                            defaultOptions
                            loadOptions={loadClientes}
                            onChange={setClienteSelecionado}
                            value={clienteSelecionado}
                            placeholder="Digite para buscar um cliente..."
                        />
                    </div>

                    <div className="modal-actions" style={{justifyContent: 'space-between'}}>
                        <button onClick={() => setAddModalOpen(true)} className="modal-button cancel">
                            + Novo Cliente
                        </button>
                        
                        <div style={{display: 'flex', gap: '15px'}}>
                            <button onClick={onClose} className="modal-button cancel">
                                Voltar
                            </button>
                            <button onClick={handleConfirm} className="modal-button confirm" disabled={!clienteSelecionado}>
                                Continuar
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <AddClienteModal
                isOpen={isAddModalOpen}
                onClose={() => setAddModalOpen(false)}
                onClientSaved={handleClientSaved}
            />
        </>
    );
}

export default ClienteSelectModal;