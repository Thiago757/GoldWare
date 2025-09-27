import React, { useContext, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useReports } from '../context/ReportProvider';
import Sidebar from '../components/layout/Sidebar';

const GlobalReportShortcut = () => {
  const { openReportManager } = useReports();
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'F4') {
        event.preventDefault();
        openReportManager();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openReportManager]);
  return null;
};

const ProtectedRoute = ({ children }) => {
    const { token } = useContext(AuthContext);

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div style={{ display: 'flex', height: '100vh' }}>
            <GlobalReportShortcut />
            <Sidebar />
            <main style={{ flexGrow: 1, padding: '20px', backgroundColor: '#f8fafc', overflow: 'auto' }}>
                {children}
            </main>
        </div>
    );
};

export default ProtectedRoute;