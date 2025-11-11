import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { IMaskInput } from 'react-imask';
import './ConfirmationModal.css'; 

function AddClienteModal({ isOpen, onClose, onClientSaved, cliente }) {
    const { token } = useContext(AuthContext);
    
    // --- ETAPA 1: Novos estados para todos os campos do banco ---
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [cpf, setCpf] = useState('');
    const [telefone, setTelefone] = useState('');
    const [cep, setCep] = useState('');
    const [logradouro, setLogradouro] = useState('');
    const [numero, setNumero] = useState('');
    const [complemento, setComplemento] = useState('');
    const [bairro, setBairro] = useState('');
    const [id_cidade, setId_cidade] = useState(''); // Armazena o ID da cidade selecionada
    
    // --- ETAPA 2: Estado para armazenar a lista de cidades vinda do backend ---
    const [cidades, setCidades] = useState([]); // ex: [{id_cidade: 1, nome: 'Criciúma', sigla: 'SC'}]
    
    const [error, setError] = useState('');
    const [loadingCep, setLoadingCep] = useState(false);

    // --- ETAPA 3: Buscar a lista de cidades quando o modal abrir ---
    useEffect(() => {
        if (isOpen && token) {
            const fetchCidades = async () => {
                try {
                    // Você precisará criar esta rota no seu backend (veja passo 2)
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
    }, [isOpen, token]); // Roda sempre que o modal abrir

    // --- ETAPA 4: Popular campos se estiver em modo de EDIÇÃO ---
    useEffect(() => {
        if (isOpen) {
            if (cliente) { // Modo Edição
                setNome(cliente.nome || '');
                setEmail(cliente.email || '');
                setCpf(cliente.cpf || '');
                setTelefone(cliente.telefone || '');
                setCep(cliente.cep || '');
                setLogradouro(cliente.logradouro || '');
                setNumero(cliente.numero || '');
                setComplemento(cliente.complemento || '');
                setBairro(cliente.bairro || '');
                setId_cidade(cliente.id_cidade || '');
            } else { // Modo Criação
                handleClose(false); // Limpa os campos
            }
        }
    }, [cliente, isOpen]); // Roda se o 'cliente' (prop) ou 'isOpen' mudar

    // --- ETAPA 5: Função para buscar CEP (ViaCEP) ---
    const handleCepSearch = async () => {
        const cepLimpo = cep.replace(/\D/g, ''); // Remove máscara
        if (cepLimpo.length !== 8) return; // Só busca com 8 dígitos

        setLoadingCep(true);
        setError('');
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
            const data = await response.json();
            if (data.erro) {
                throw new Error('CEP não encontrado.');
            }
            
            setLogradouro(data.logradouro);
            setBairro(data.bairro);
            
            // Tenta encontrar a cidade do ViaCEP na nossa lista do banco
            // Isso funciona se o nome da cidade no ViaCEP for igual ao do seu banco
            if (cidades.length > 0) {
                const cidadeEncontrada = cidades.find(c => 
                    c.nome.toLowerCase() === data.localidade.toLowerCase() &&
                    c.sigla.toLowerCase() === data.uf.toLowerCase()
                );
                
                if (cidadeEncontrada) {
                    setId_cidade(cidadeEncontrada.id_cidade);
                } else {
                    setError(`Cidade (${data.localidade}-${data.uf}) não encontrada no cadastro.`);
                }
            }
            
        } catch (err) {
            setError(err.message);
        } finally {
            setLoadingCep(false);
        }
    };

    // --- ETAPA 6: handleSubmit atualizado com TODOS os campos ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!id_cidade) {
            setError('Por favor, selecione uma cidade.');
            return;
        }

        // Monta o 'body' exatamente como o backend/banco espera
        const clienteData = {
            nome,
            email,
            cpf,
            telefone,
            cep,
            logradouro,
            numero,
            complemento,
            bairro,
            id_cidade: Number(id_cidade) // Garante que é um número
        };

        try {
            const url = cliente
                ? `http://localhost:3001/api/clientes/${cliente.id_cliente}`
                : 'http://localhost:3001/api/clientes';
            
            const method = cliente ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(clienteData), // Envia o objeto completo
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            
            onClientSaved(cliente ? data : data.cliente);
            handleClose();
        } catch (err) {
            setError(err.message);
        }
    };
    
    // --- ETAPA 7: Limpar TODOS os campos ---
    const handleClose = (shouldCloseModal = true) => {
        setNome(''); setEmail(''); setCpf(''); setTelefone(''); setError('');
        setCep(''); setLogradouro(''); setNumero(''); setComplemento(''); 
        setBairro(''); setId_cidade(''); setLoadingCep(false);
        
        if (shouldCloseModal) {
            onClose();
        }
    };

    if (!isOpen) return null;

    // --- ETAPA 8: JSX ATUALIZADO com todos os campos ---
    return (
        <div className="modal-overlay">
            <form onSubmit={handleSubmit} className="modal-content" style={{textAlign: 'left'}}>
                <h2>{cliente ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}</h2>
                
                {/* --- DADOS PESSOAIS --- */}
                <div className="modal-form-group">
                    <label htmlFor="nome">Nome Completo*</label>
                    <input id="nome" type="text" value={nome} onChange={e => setNome(e.target.value)} required />
                </div>
                
                {/* Grupo de 2 colunas */}
                <div className="modal-form-row">
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
                            id="cpf" required
                        />
                    </div>
                </div>

                <div className="modal-form-group">
                    <label htmlFor="telefone">Telefone*</label>
                    <IMaskInput
                        mask="(00) 00000-0000"
                        value={telefone}
                        onAccept={(value) => setTelefone(value)}
                        id="telefone" required
                    />
                </div>

                {/* --- ENDEREÇO --- */}
                <hr className="modal-divider" />
                <h3>Endereço</h3>

                <div className="modal-form-group">
                    <label htmlFor="cep">CEP*</label>
                    <div className="input-with-button">
                        <IMaskInput
                            mask="00000-000"
                            value={cep}
                            onAccept={(value) => setCep(value)}
                            id="cep" required
                        />
                        <button type="button" onClick={handleCepSearch} disabled={loadingCep} className="modal-button-cep">
                            {loadingCep ? '...' : 'Buscar'}
                        </button>
                    </div>
                </div>

                <div className="modal-form-group">
                    <label htmlFor="logradouro">Logradouro* (Rua, Av.)</label>
                    <input id="logradouro" type="text" value={logradouro} onChange={e => setLogradouro(e.target.value)} required />
                </div>

                <div className="modal-form-row">
                    <div className="modal-form-group">
                        <label htmlFor="numero">Número*</label>
                        <input id="numero" type="text" value={numero} onChange={e => setNumero(e.target.value)} required />
                    </div>
                    <div className="modal-form-group">
                        <label htmlFor="complemento">Complemento</label>
                        <input id="complemento" type="text" value={complemento} onChange={e => setComplemento(e.target.value)} />
                    </div>
                </div>

                <div className="modal-form-row">
                    <div className="modal-form-group">
                        <label htmlFor="bairro">Bairro*</label>
                        <input id="bairro" type="text" value={bairro} onChange={e => setBairro(e.target.value)} required />
                    </div>
                    
                    <div className="modal-form-group form-group-cidade">
                        <label htmlFor="cidade">Cidade*</label>
                        <select id="cidade" value={id_cidade} onChange={e => setId_cidade(e.target.value)} required>
                            <option value="">Selecione...</option>
                            {cidades.map(cidade => (
                                <option key={cidade.id_cidade} value={cidade.id_cidade}>
                                    {cidade.nome} - {cidade.sigla}
                                </option>
                            ))}
                        </select>
                    </div>
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