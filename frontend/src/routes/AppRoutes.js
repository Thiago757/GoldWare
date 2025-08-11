// O caminho completo deve ser: frontend/src/routes/AppRoutes.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from '../features/auth/LoginPage';
import DashboardPage from '../features/dashboard/DashboardPage';
import ForgotPasswordPage from '../features/auth/ForgotPasswordPage';
import ResetPasswordPage from '../features/auth/ResetPasswordPage';

function AppRoutes() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/esqueceu-senha" element={<ForgotPasswordPage />} /> 
                <Route path="/redefinir-senha" element={<ResetPasswordPage />} /> 
                <Route path="/" element={<LoginPage />} />
            </Routes>
        </Router>
    );
}

export default AppRoutes;