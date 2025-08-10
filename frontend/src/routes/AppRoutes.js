// O caminho completo deve ser: frontend/src/routes/AppRoutes.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from '../features/auth/LoginPage';
import DashboardPage from '../features/dashboard/DashboardPage';

function AppRoutes() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/" element={<LoginPage />} />
            </Routes>
        </Router>
    );
}

export default AppRoutes;