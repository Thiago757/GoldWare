import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import '../vendas/VendasListPage.css';

function PagamentosPage() {
    const [contas, setContas] = useState([]);
    const [loading, setLoading] = useState(true);
    const { token } = useContext(AuthContext);

    useEffect(() => {
        const fetchContas = async () => {
            try {
                const response = await fetch('http://localhost:3001/api/pagamentos/contas-a-receber', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Falha ao buscar contas a receber');
                const data = await response.json();
                setContas(data);
            } catch (error) {
                console.error("Erro:", error);
            } finally {
                setLoading(false);
            }
        };
        if (token) {
            fetchContas();
        }
    }, [token]);

    if (loading) return <p>Carregando contas a receber...</p>;

    return (
        <div className="vendas-list-container">
            <div className="vendas-list-header">
                <h1>Contas a Receber (Pendentes)</h1>
            </div>
            <div className="vendas-table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Cliente</th>
                            <th>N° Venda</th>
                            <th>Parcela</th>
                            <th>Valor</th>
                            <th>Vencimento</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {contas.map(conta => (
                            <tr key={conta.id_conta}>
                                <td>{conta.nome_cliente}</td>
                                <td>#{conta.id_venda}</td>
                                <td>{conta.numero_parcela}/{conta.total_parcelas}</td>
                                <td>R$ {parseFloat(conta.valor_parcela).toFixed(2)}</td>
                                <td>{new Date(conta.data_vencimento).toLocaleDateString('pt-BR')}</td>
                                <td>
                                    <button className="nova-venda-btn" style={{padding: '8px 15px'}}>Marcar como Pago</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default PagamentosPage;