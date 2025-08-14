import React, { createContext, useState } from 'react';

export const VendaContext = createContext(null);

export const VendaProvider = ({ children }) => {
    const [itensVenda, setItensVenda] = useState([]);

    const addItem = (produto) => {
        setItensVenda(prevItens => {
            const itemExistente = prevItens.find(item => item.id_produto === produto.id_produto);
            if (itemExistente) {
                return prevItens.map(item =>
                    item.id_produto === produto.id_produto
                        ? { ...item, quantidade: item.quantidade + 1 }
                        : item
                );
            } else {
                return [...prevItens, { ...produto, quantidade: 1 }];
            }
        });
    };

    const removeItem = (idProdutoParaRemover) => {
        setItensVenda(prevItens => prevItens.filter(item => item.id_produto !== idProdutoParaRemover));
    };

    const removeMultipleItems = (idsParaRemover) => {
        setItensVenda(prevItens => prevItens.filter(item => !idsParaRemover.includes(item.id_produto)));
    };

    const clearVenda = () => {
        setItensVenda([]);
    };

    const value = {
        itensVenda,
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