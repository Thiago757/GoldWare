import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import { HiMenuAlt2 } from 'react-icons/hi';
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
import PerfilPage from '../features/perfil/PerfilPage';
import SettingsPage from '../features/settings/SettingsPage';
import TiposServicoSettingsPage from '../features/settings/TiposServicoSettingsPage';
import RelatoriosPage from '../features/relatorios/RelatoriosPage';
import OrdensServicoListPage from '../features/servicos/OrdensServicoListPage';
import CatalogoServicosPage from '../features/settings/CatalogoServicosPage';
import CategoriaProdutosPage from '../features/settings/CategoriaProdutosPage';
import OSDetailPage from '../features/servicos/OSDetailPage';
import ReceberPage from '../features/receber/ReceberPage';
import PagarPage from '../features/pagar/PagarPage';
import ExtratoPage from '../features/financeiro/ExtratoPage';
import MinhaLojaPage from '../features/settings/MinhaLojaPage';
import UsuariosPage from '../features/settings/UsuariosPage';

function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/esqueceu-senha" element={<ForgotPasswordPage />} />
            <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
            
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/vendas" element={<ProtectedRoute><VendasListPage /></ProtectedRoute>} />
            <Route path="/vendas/nova" element={<ProtectedRoute><PDVPage /></ProtectedRoute>} />
            <Route path="/servicos" element={<ProtectedRoute><OrdensServicoListPage /></ProtectedRoute>} />
            <Route path="/ordens-servico/:id_os" element={<ProtectedRoute><OSDetailPage /></ProtectedRoute>} />
            <Route path="/estoque" element={<ProtectedRoute><EstoquePage /></ProtectedRoute>} />
            <Route path="/movimentacoes" element={<ProtectedRoute><MovimentacoesPage /></ProtectedRoute>} />
            <Route path="/clientes" element={<ProtectedRoute><ClientesPage /></ProtectedRoute>} />
            <Route path="/fornecedores" element={<ProtectedRoute><FornecedoresPage /></ProtectedRoute>} />
            <Route path="/relatorios" element={<ProtectedRoute><RelatoriosPage /></ProtectedRoute>} />
            <Route path="/receber" element={<ProtectedRoute><ReceberPage /></ProtectedRoute>} />
            <Route path="/pagar" element={<ProtectedRoute><PagarPage /></ProtectedRoute>} />
            <Route path="/extrato" element={<ProtectedRoute><ExtratoPage /></ProtectedRoute>} />
            <Route path="/perfil" element={<ProtectedRoute><PerfilPage /></ProtectedRoute>} />            
            
            <Route path="/configuracoes" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>}>
                <Route index element={<MinhaLojaPage />} />
                <Route path="minha-loja" element={<MinhaLojaPage />} />
                <Route path="usuarios" element={<UsuariosPage />} />
                <Route path="servicos/tipos" element={<TiposServicoSettingsPage />} />
                <Route path="servicos/catalogo" element={<CatalogoServicosPage />} />
                <Route path="produtos/categorias" element={<CategoriaProdutosPage />} />
            </Route>
            
            <Route path="/" element={<LoginPage />} />
        </Routes>
    );
}

export default AppRoutes;