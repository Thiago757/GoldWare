import React, { createContext, useState, useContext, useCallback } from 'react';

// 1. Cria o Contexto
const ReportContext = createContext();

// 2. Cria o Provedor que vai gerenciar o estado
export const ReportProvider = ({ children }) => {
  const [isManagerOpen, setManagerOpen] = useState(false);

  // Funções para controlar o assistente
  const openReportManager = useCallback(() => setManagerOpen(true), []);
  const closeReportManager = useCallback(() => setManagerOpen(false), []);

  const value = {
    isManagerOpen,
    openReportManager,
    closeReportManager,
  };

  return (
    <ReportContext.Provider value={value}>
      {children}
    </ReportContext.Provider>
  );
};

// 3. Cria um Hook customizado para facilitar o uso
export const useReports = () => {
  const context = useContext(ReportContext);
  if (!context) {
    throw new Error('useReports deve ser usado dentro de um ReportProvider');
  }
  return context;
};