import React, { createContext, useState, useContext, useCallback } from 'react';

const ReportContext = createContext();

export const ReportProvider = ({ children }) => {
  const [reportForParams, setReportForParams] = useState(null);

  const openParamsForReport = useCallback((report) => {
      setReportForParams(report);
  }, []);

  const closeReportManager = useCallback(() => {
    setReportForParams(null);
  }, []);

  const value = {
    reportForParams,
    openParamsForReport,
    closeReportManager,
  };

  return (
    <ReportContext.Provider value={value}>
      {children}
    </ReportContext.Provider>
  );
};

export const useReports = () => {
  const context = useContext(ReportContext);
  if (!context) {
    throw new Error('useReports deve ser usado dentro de um ReportProvider');
  }
  return context;
};