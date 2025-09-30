import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { BsTools } from 'react-icons/bs';

function ServicosPage() {
    const [servicos, setServicos] = useState([]);
    const [loading, setLoading] = useState(true);
    const { token } = useContext(AuthContext);
    const [isModalOpen, setModalOpen] = useState(false);
    const [servicoEmEdicao, setServicoEmEdicao] = useState(null);
    const fetchServicos = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const response = await fetch('http://localhost:3001/api/servicos', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Falha ao buscar serviços');
            const data = await response.json();
            setServicos(data);
        } catch (error) {
            console.error("Erro:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServicos();
    }, [token]);

    const handleAbreModalCadastro = () => {
        setServicoEmEdicao(null);
        setModalOpen(true);
    };

    const handleAbreModalEdicao = (servico) => {
        setServicoEmEdicao(servico);
        setModalOpen(true);
    };

    const handleSalvarServico = () => {
        setModalOpen(false);
        fetchServicos(); 
    };

    return (
        <div className="vendas-list-container">
            <div className="vendas-list-header">
                <h1><BsTools style={{ marginRight: '10px' }} /> Gerenciamento de Serviços</h1>
                <button onClick={handleAbreModalCadastro} className="nova-venda-btn">+ Cadastrar Serviço</button>
            </div>

            <div className="vendas-table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Nome do Serviço</th>
                            <th>Descrição</th>
                            <th>Preço</th>
                            <th>Duração Estimada</th>
                            <th>Status</th>
                            <th style={{ textAlign: 'right' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6">Carregando...</td></tr>
                        ) : servicos.map(servico => (
                            <tr key={servico.id_servico}>
                                <td>{servico.nome}</td>
                                <td>{servico.descricao}</td>
                                <td>R$ {parseFloat(servico.preco).toFixed(2)}</td>
                                <td>{servico.duracao_estimada}</td>
                                <td>{servico.ativo === 'S' ? 'Ativo' : 'Inativo'}</td>
                                <td style={{ textAlign: 'right' }}>
                                    <button onClick={() => handleAbreModalEdicao(servico)}>Editar</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* O modal de cadastro/edição viria aqui */}
            {/* <ServicoModal
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
                onSave={handleSalvarServico}
                servico={servicoEmEdicao}
            /> 
            */}
        </div>
    );
}

export default ServicosPage;