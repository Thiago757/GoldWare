import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes'; 
import { AuthProvider } from './context/AuthContext';
import { VendaProvider } from './context/VendaContext';

function App() {
  return (
     <Router>
      <AuthProvider>
        <VendaProvider> 
          <AppRoutes />
        </VendaProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;