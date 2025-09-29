import React, { createContext, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';

export const VendaContext = createContext();

export const VendaProvider = ({ children }) => {
    const [vendaAtiva, setVendaAtiva] = useState(null);
    const [loading, setLoading] = useState(false);
    const { token } = useContext(AuthContext);
    const navigate = useNavigate();

    // Função interna para buscar os dados mais recentes de uma venda no backend
    const carregarVendaAtiva = async (id_venda) => {
        const response = await fetch(`http://localhost:3001/api/vendas/aberta/${id_venda}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Falha ao carregar dados da venda');
        const vendaData = await response.json();
        const clienteFormatado = { value: vendaData.id_cliente, label: vendaData.nome_cliente };
        setVendaAtiva({ ...vendaData, cliente: clienteFormatado });
    };

    const iniciarNovaVenda = async (cliente) => {
        if (!cliente || !cliente.id_cliente) {
            alert("Por favor, selecione um cliente válido.");
            return; 
        }
        setLoading(true);
        try {
            const response = await fetch('http://localhost:3001/api/vendas/iniciar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ id_cliente: cliente.id_cliente })
            });
            if (!response.ok) throw new Error('Falha ao iniciar a venda no backend');
            const novaVenda = await response.json();
            setVendaAtiva({ ...novaVenda, cliente, itens: [] });
            navigate('/vendas/nova');
        } catch (error) {
            console.error("Erro ao iniciar nova venda:", error);
            alert("Não foi possível iniciar a venda. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    const retomarVenda = async (id_venda) => {
        setLoading(true);
        try {
            await carregarVendaAtiva(id_venda);
            navigate('/vendas/nova');
        } catch (error) {
            console.error("Erro ao retomar venda:", error);
            alert("Não foi possível carregar a venda. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    const addItem = async (produto, quantidade = 1) => {
        if (!vendaAtiva) return;
        setLoading(true);
        try {
            await fetch(`http://localhost:3001/api/vendas/${vendaAtiva.id_venda}/itens`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ id_produto: produto.id_produto, quantidade, preco_unitario: produto.preco_venda })
            });
            await carregarVendaAtiva(vendaAtiva.id_venda);
        } catch (error) {
            console.error("Erro ao adicionar item:", error);
        } finally {
            setLoading(false);
        }
    };

    const removeItem = async (id_item_venda) => {
        if (!vendaAtiva) return;
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:3001/api/vendas/${vendaAtiva.id_venda}/itens/${id_item_venda}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Falha ao remover item');
            await carregarVendaAtiva(vendaAtiva.id_venda);
        } catch (error) {
            console.error("Erro ao remover item:", error);
        } finally {
            setLoading(false);
        }
    };

    // Limpa a venda ativa do estado
    const limparVenda = () => {
        setVendaAtiva(null);
    };

const updateItemQuantidade = async (id_item_venda, nova_quantidade) => {
    if (!vendaAtiva) return;
    setLoading(true);
    try {
        await fetch(`http://localhost:3001/api/vendas/${vendaAtiva.id_venda}/itens/${id_item_venda}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ nova_quantidade })
        });
        await carregarVendaAtiva(vendaAtiva.id_venda);
    } catch (error) {
        console.error("Erro ao atualizar quantidade:", error);
    } finally {
        setLoading(false);
    }
};

const removeMultipleItems = async (ids_itens) => {
    if (!vendaAtiva) return;
    setLoading(true);
    try {
        await fetch(`http://localhost:3001/api/vendas/${vendaAtiva.id_venda}/itens`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ ids_itens })
        });
        await carregarVendaAtiva(vendaAtiva.id_venda);
    } catch (error) {
        console.error("Erro ao remover múltiplos itens:", error);
    } finally {
        setLoading(false);
    }
};

    const value = { 
        vendaAtiva, 
        loading, 
        iniciarNovaVenda,
        retomarVenda,
        addItem,
        removeItem,
        limparVenda,
        updateItemQuantidade,
        removeMultipleItems 
    };

    return (
        <VendaContext.Provider value={value}>
            {children}
        </VendaContext.Provider>
    );
};