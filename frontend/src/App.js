import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { AuthProvider } from './context/AuthContext';
import { ReportProvider } from './context/ReportProvider';
import { VendaProvider } from './context/VendaContext'; // Certifique-se que esta importação existe
import ReportManager from './components/common/ReportManager';

function App() {
  return (
    <Router>
      <AuthProvider> 
        <ReportProvider>
          {/* VendaProvider ADICIONADO AQUI PARA ENVOLVER AS ROTAS */}
          <VendaProvider>
            
            <AppRoutes />

            <ReportManager />

          </VendaProvider>
        </ReportProvider>
      </AuthProvider>
    </Router>
  );
}

export default App; 