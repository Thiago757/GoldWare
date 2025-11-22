import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { IMaskInput } from 'react-imask';
import './AddClienteModal.css'; 

const defaultFormState = {
    nome: '',
    email: '',
    cnpj: '',
    telefone: '',
    responsavel: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    id_cidade: '', 
};

function AddFornecedorModal({ isOpen, onClose, onSaved, fornecedor }) {
    const { token } = useContext(AuthContext);
    const [formData, setFormData] = useState(defaultFormState);
    const [cidades, setCidades] = useState([]);
    const [error, setError] = useState('');
    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [loadingCep, setLoadingCep] = useState(false);     

    useEffect(() => {
        if (isOpen && token) {
            const fetchCidades = async () => {
                try {
                    const response = await fetch('http://localhost:3001/api/cidades', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (!response.ok) throw new Error('Falha ao buscar cidades');
                    const data = await response.json();
                    setCidades(data);
                } catch (err) {
                    console.error("Erro ao buscar cidades:", err);
                    setError("Não foi possível carregar a lista de cidades.");
                }
            };
            fetchCidades();
        }
    }, [isOpen, token]);

    useEffect(() => {
        if (isOpen) {
            if (fornecedor) {
                setFormData({
                    nome: fornecedor.nome || '',
                    email: fornecedor.email || '',
                    cnpj: fornecedor.cpf_cnpj || '', // NO BANCO É cpf_cnpj
                    telefone: fornecedor.telefone || '',
                    responsavel: fornecedor.responsavel || '',
                    cep: fornecedor.cep || '',
                    logradouro: fornecedor.logradouro || '',
                    numero: fornecedor.numero || '',
                    complemento: fornecedor.complemento || '',
                    bairro: fornecedor.bairro || '',
                    id_cidade: fornecedor.id_cidade || '',
                });
            } else {
                setFormData(defaultFormState);
            }
            setError('');
            setLoadingCep(false);
            setLoadingSubmit(false);
        }
    }, [fornecedor, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleMaskedChange = (value, name) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCepSearch = async () => {
        const cepLimpo = formData.cep.replace(/\D/g, '');
        if (cepLimpo.length !== 8) return; 

        setLoadingCep(true);
        setError('');
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
            const data = await response.json();
            if (data.erro) {
                throw new Error('CEP não encontrado.');
            }
            
            const cidadeEncontrada = cidades.find(c => 
                c.nome.toLowerCase() === data.localidade.toLowerCase() &&
                c.sigla.toLowerCase() === data.uf.toLowerCase()
            );
            
            setFormData(prev => ({
                ...prev,
                logradouro: data.logradouro,
                bairro: data.bairro,
                id_cidade: cidadeEncontrada ? cidadeEncontrada.id_cidade : ''
            }));
            
            if (!cidadeEncontrada) {
                setError(`Cidade (${data.localidade}-${data.uf}) não encontrada no cadastro.`);
            }
            
        } catch (err) {
            setError(err.message);
        } finally {
            setLoadingCep(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.id_cidade) {
            setError('Por favor, selecione uma cidade.');
            return;
        }

        setLoadingSubmit(true);

        const fornecedorData = {
            nome: formData.nome,
            email: formData.email,
            cnpj: formData.cnpj.replace(/[^\d]/g, ""),
            telefone: formData.telefone.replace(/\D/g, ''),
            responsavel: formData.responsavel,
            cep: formData.cep.replace(/\D/g, ''),
            logradouro: formData.logradouro,
            numero: formData.numero,
            complemento: formData.complemento,
            bairro: formData.bairro,
            id_cidade: Number(formData.id_cidade)
        };

        try {
            const url = fornecedor
                ? `http://localhost:3001/api/fornecedores/${fornecedor.id_fornecedor}`
                : 'http://localhost:3001/api/fornecedores';
            
            const method = fornecedor ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(fornecedorData), 
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || data.message || 'Erro ao salvar fornecedor');
            
            onSaved();
            handleClose(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoadingSubmit(false);
        }
    };
    
    const handleClose = (shouldCloseModal = true) => {
        setFormData(defaultFormState);
        setError('');
        setLoadingCep(false);
        setLoadingSubmit(false);
        
        if (shouldCloseModal) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={() => handleClose(true)}>
            <form onSubmit={handleSubmit} className="modal-content" style={{textAlign: 'left'}} onClick={(e) => e.stopPropagation()}> 
                
                <button type="button" className="modal-close-btn" onClick={() => handleClose(true)}>&times;</button>
                
                <h2>{fornecedor ? 'Editar Fornecedor' : 'Cadastrar Novo Fornecedor'}</h2>
                
                <div className="modal-form-body"> 
                    
                    <div className="modal-form-group">
                        <label htmlFor="nome">Razão Social / Nome*</label>
                        <input id="nome" name="nome" type="text" value={formData.nome} onChange={handleChange} required />
                    </div>
                    
                    <div className="modal-form-row">
                        <div className="modal-form-group">
                            <label htmlFor="email">Email</label>
                            <input id="email" name="email" type="email" value={formData.email} onChange={handleChange} />
                        </div>
                        <div className="modal-form-group">
                            <label htmlFor="cnpj">CNPJ*</label>
                            <IMaskInput
                                mask="00.000.000/0000-00"
                                id="cnpj"
                                name="cnpj"
                                value={formData.cnpj}
                                onAccept={(value) => handleMaskedChange(value, 'cnpj')}
                                required
                            />
                        </div>
                    </div>

                    <div className="modal-form-row">
                        <div className="modal-form-group">
                            <label htmlFor="telefone">Telefone</label>
                            <IMaskInput
                                mask="(00) 00000-0000"
                                id="telefone"
                                name="telefone"
                                value={formData.telefone}
                                onAccept={(value) => handleMaskedChange(value, 'telefone')}
                            />
                        </div>
                        <div className="modal-form-group">
                            <label htmlFor="responsavel">Responsável</label>
                            <input 
                                id="responsavel" 
                                name="responsavel" 
                                type="text" 
                                value={formData.responsavel} 
                                onChange={handleChange} 
                                placeholder="Ex: João Silva"
                            />
                        </div>
                    </div>

                    <hr className="modal-divider" />
                    <h3>Endereço</h3>

                    <div className="modal-form-group">
                        <label htmlFor="cep">CEP</label>
                        <div className="input-with-button">
                            <IMaskInput
                                mask="00000-000"
                                id="cep"
                                name="cep"
                                value={formData.cep}
                                onAccept={(value) => handleMaskedChange(value, 'cep')}
                            />
                            <button type="button" onClick={handleCepSearch} disabled={loadingCep} className="modal-button-cep">
                                {loadingCep ? '...' : 'Buscar'}
                            </button>
                        </div>
                    </div>

                    <div className="modal-form-group">
                        <label htmlFor="logradouro">Logradouro (Rua/Av)*</label>
                        <input id="logradouro" name="logradouro" type="text" value={formData.logradouro} onChange={handleChange} required />
                    </div>

                    <div className="modal-form-row">
                        <div className="modal-form-group">
                            <label htmlFor="numero">Número</label>
                            <input id="numero" name="numero" type="text" value={formData.numero} onChange={handleChange} />
                        </div>
                        <div className="modal-form-group">
                            <label htmlFor="complemento">Complemento</label>
                            <input id="complemento" name="complemento" type="text" value={formData.complemento} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="modal-form-row">
                        <div className="modal-form-group">
                            <label htmlFor="bairro">Bairro</label>
                            <input id="bairro" name="bairro" type="text" value={formData.bairro} onChange={handleChange} />
                        </div>
                        
                        <div className="modal-form-group form-group-cidade">
                            <label htmlFor="cidade">Cidade*</label>
                            <select id="cidade" name="id_cidade" value={formData.id_cidade} onChange={handleChange} required>
                                <option value="">Selecione...</option>
                                {cidades.map(cidade => (
                                    <option key={cidade.id_cidade} value={cidade.id_cidade}>
                                        {cidade.nome} - {cidade.sigla}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                
                </div>

                <div className="modal-actions">
                    {error && <p className="modal-error-message">{error}</p>}

                    {!error && <div className="modal-error-spacer"></div>}

                    <div className="modal-button-group">
                        <button 
                            type="button" 
                            onClick={() => handleClose(true)} 
                            className="modal-button cancel" 
                            disabled={loadingSubmit}
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            className="modal-button confirm save" 
                            disabled={loadingCep || loadingSubmit}
                        >
                            {loadingSubmit ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}

export default AddFornecedorModal;