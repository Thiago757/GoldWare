// frontend/src/routes/ProtectedRoute.js
import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Sidebar from '../components/layout/Sidebar';

const ProtectedRoute = ({ children }) => {
    const { token } = useContext(AuthContext);

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div style={{ display: 'flex', height: '100vh' }}>
            <Sidebar />
            <main style={{ flexGrow: 1, padding: '20px', backgroundColor: '#f8fafc', overflow: 'auto'  }}>
                {children}
            </main>
        </div>
    );
};

export default ProtectedRoute;