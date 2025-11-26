import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import './SettingsPage.css';

function SettingsPage() {
    return (
        <div className="settings-page">
            <aside className="settings-sidebar">
                <h2>Configurações</h2>
                <nav>
                    <NavLink to="/configuracoes/minha-loja">Minha Loja</NavLink>
                    <NavLink to="/configuracoes/usuarios">Usuários</NavLink>
                    <NavLink to="/configuracoes/produtos/categorias">Categorias de Produto</NavLink>
                    <NavLink to="/configuracoes/servicos/tipos">Tipos de Serviço</NavLink>
                    <NavLink to="/configuracoes/servicos/catalogo">Catálogo de Serviços</NavLink>
                </nav>
            </aside>
            <main className="settings-content">
                <Outlet />
            </main>
        </div>
    );
}

export default SettingsPage;