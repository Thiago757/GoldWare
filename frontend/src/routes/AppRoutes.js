import React from 'react';
import { Routes, Route } from 'react-router-dom';

import LoginPage from '../features/auth/LoginPage';
import DashboardPage from '../features/dashboard/DashboardPage';
import ProtectedRoute from './ProtectedRoute';
import ForgotPasswordPage from '../features/auth/ForgotPasswordPage';
import ResetPasswordPage from '../features/auth/ResetPasswordPage';
import VendasListPage from '../features/vendas/VendasListPage';
import PDVPage from '../features/vendas/PDVPage';
import EstoquePage from '../features/estoque/EstoquePage';
import MovimentacoesPage from '../features/movimentacoes/MovimentacoesPage';
import ClientesPage from '../features/clientes/ClientesPage';
import FornecedoresPage from '../features/fornecedores/FornecedoresPage';
import PagamentosPage from '../features/pagamentos/PagamentosPage';
import PerfilPage from '../features/perfil/PerfilPage';
import ConfiguracoesPage from '../features/configuracoes/ConfiguracoesPage';


function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/esqueceu-senha" element={<ForgotPasswordPage />} />
            <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
            <Route 
                path="/dashboard" 
                element={
                    <ProtectedRoute>
                        <DashboardPage />
                    </ProtectedRoute>
                } 
            />
            <Route path="/vendas" element={<ProtectedRoute><VendasListPage /></ProtectedRoute>} />
            <Route path="/vendas/nova" element={<ProtectedRoute><PDVPage /></ProtectedRoute>} />
            <Route path="/estoque" element={<ProtectedRoute><EstoquePage /></ProtectedRoute>} />
            <Route path="/movimentacoes" element={<ProtectedRoute><MovimentacoesPage /></ProtectedRoute>} />
            <Route path="/clientes" element={<ProtectedRoute><ClientesPage /></ProtectedRoute>} />
            <Route path="/fornecedores" element={<ProtectedRoute><FornecedoresPage /></ProtectedRoute>} />
            <Route path="/pagamentos" element={<ProtectedRoute><PagamentosPage /></ProtectedRoute>} />
            <Route path="/perfil" element={<ProtectedRoute><PerfilPage /></ProtectedRoute>} />
            <Route path="/configuracoes" element={<ProtectedRoute><ConfiguracoesPage /></ProtectedRoute>} />
            
            <Route path="/" element={<LoginPage />} />
        </Routes>
    );
}

export default AppRoutes;