import React, { createContext, useState } from 'react';

export const VendaContext = createContext(null);

const initialState = {
    cliente: null,
    itens: [],
};

export const VendaProvider = ({ children }) => {
    const [vendaAtiva, setVendaAtiva] = useState(initialState);

    const iniciarNovaVenda = (cliente) => {
        setVendaAtiva({ cliente: cliente, itens: [] });
    };

    const addItem = (produto) => {
        setVendaAtiva(prevVenda => {
            const itemExistente = prevVenda.itens.find(item => item.id_produto === produto.id_produto);
            let novosItens;
            if (itemExistente) {
                novosItens = prevVenda.itens.map(item =>
                    item.id_produto === produto.id_produto
                        ? { ...item, quantidade: item.quantidade + 1 }
                        : item
                );
            } else {
                novosItens = [...prevVenda.itens, { ...produto, quantidade: 1 }];
            }
            return { ...prevVenda, itens: novosItens };
        });
    };

    const removeItem = (idProdutoParaRemover) => {
        setVendaAtiva(prevVenda => ({
            ...prevVenda,
            itens: prevVenda.itens.filter(item => item.id_produto !== idProdutoParaRemover)
        }));
    };

    const removeMultipleItems = (idsParaRemover) => {
        setVendaAtiva(prevVenda => ({
            ...prevVenda,
            itens: prevVenda.itens.filter(item => !idsParaRemover.includes(item.id_produto))
        }));
    };

    const clearVenda = () => {
        setVendaAtiva(initialState);
    };

    const value = {
        vendaAtiva,
        iniciarNovaVenda,
        addItem,
        removeItem,
        removeMultipleItems,
        clearVenda,
    };

    return (
        <VendaContext.Provider value={value}>
            {children}
        </VendaContext.Provider>
    );
};