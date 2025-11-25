import React, { useState, useEffect, useRef, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';
import { AuthContext } from '../../context/AuthContext';
import ConfirmationModal from '../common/ConfirmationModal';
import { RxDashboard } from 'react-icons/rx';
import { CiShoppingTag, CiDeliveryTruck, CiUser, CiSettings, CiLogout } from 'react-icons/ci';
import { BsBoxSeam, BsArrowLeftRight, BsThreeDotsVertical, BsTools } from 'react-icons/bs';
import { IoDocumentTextOutline } from 'react-icons/io5';
import { HiOutlineCash } from "react-icons/hi";
import { FaRegCreditCard } from "react-icons/fa";
import { FiMenu, FiX } from "react-icons/fi";
import { FaFileInvoiceDollar } from 'react-icons/fa'; // Adicione FaFileInvoiceDollar

const getInitials = (name = '') => {
    const names = name.trim().split(' ').filter(Boolean);
    if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

function Sidebar() {
    const { user, logout } = useContext(AuthContext);
    const [isMenuOpen, setMenuOpen] = useState(false);
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [isLogoutModalOpen, setLogoutModalOpen] = useState(false);
    const menuRef = useRef(null);
    const location = useLocation();

    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // bloquear rolagem do body quando sidebar mobile aberta
    useEffect(() => {
        if (isSidebarOpen) {
            document.body.classList.add('sidebar-open');
        } else {
            document.body.classList.remove('sidebar-open');
        }
        return () => document.body.classList.remove('sidebar-open');
    }, [isSidebarOpen]);

    const handleLogoutClick = () => {
        setMenuOpen(false);
        setLogoutModalOpen(true);
    };

    const handleConfirmLogout = () => {
        logout();
        setLogoutModalOpen(false);
    };

    return (
        <>
            <button
                className="sidebar-toggle"
                aria-label={isSidebarOpen ? 'Fechar menu' : 'Abrir menu'}
                onClick={() => setSidebarOpen(!isSidebarOpen)}
            >
                {isSidebarOpen ? <FiX /> : <FiMenu />}
            </button>

            {/* Backdrop para mobile (fecha ao clicar) */}
            {isSidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}

            <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`} aria-hidden={!isSidebarOpen && window.innerWidth <= 1024}>
                <div className="sidebar-header">
                    <h3>Gold Ware</h3>
                </div>

                <div className="profile-section-wrapper" ref={menuRef}>
                    <div className="sidebar-profile">
                        <div className="profile-avatar">
                            {user ? getInitials(user.nome || '') : '..'}
                        </div>
                        <div className="profile-info">
                            <strong>{user ? user.nome : 'Carregando...'}</strong>
                            <span>{user ? user.tipo : ''}</span>
                        </div>
                        <button className="profile-menu-button" onClick={() => setMenuOpen(!isMenuOpen)}>
                            <BsThreeDotsVertical />
                        </button>
                    </div>

                    {isMenuOpen && (
                        <div className="profile-dropdown-menu">
                            <ul>
                                <li><Link to="/perfil"><CiUser /> Perfil</Link></li>
                                <li><Link to="/configuracoes"><CiSettings /> Configurações</Link></li>
                                <li>
                                    <button onClick={handleLogoutClick} className="sidebar-button-link">
                                        <CiLogout /> Sair
                                    </button>
                                </li>
                            </ul>
                        </div>
                    )}
                </div>

                <nav className="sidebar-nav" aria-label="Navegação principal">
                    <ul>
                        <li className={location.pathname === '/dashboard' ? 'active' : ''}>
                            <Link to="/dashboard"><RxDashboard /> Dashboard</Link>
                        </li>
                        <li className={location.pathname === '/vendas' ? 'active' : ''}>
                            <Link to="/vendas"><CiShoppingTag /> Vendas</Link>
                        </li>
                        <li className={location.pathname === '/servicos' ? 'active' : ''}>
                            <Link to="/servicos"><BsTools/> Serviços</Link>
                        </li>
                        <li className={location.pathname === '/estoque' ? 'active' : ''}>
                            <Link to="/estoque"><BsBoxSeam /> Estoque</Link>
                        </li>
                        <li className={location.pathname === '/movimentacoes' ? 'active' : ''}>
                            <Link to="/movimentacoes"><BsArrowLeftRight /> Movimentações</Link>
                        </li>
                        <li className={location.pathname === '/clientes' ? 'active' : ''}>
                            <Link to="/clientes"><CiUser /> Clientes</Link>
                        </li>
                        <li className={location.pathname === '/fornecedores' ? 'active' : ''}>
                            <Link to="/fornecedores"><CiDeliveryTruck /> Fornecedores</Link>
                        </li>
                        <li className={location.pathname === '/receber' ? 'active' : ''}>
                            <Link to="/receber"><HiOutlineCash /> Receber</Link>
                        </li>
                        <li className={location.pathname === '/pagar' ? 'active' : ''}>
                            <Link to="/pagar"><FaRegCreditCard /> Pagar</Link>
                        </li>
                        <li className={location.pathname === '/extrato' ? 'active' : ''}>
                            <Link to="/extrato"><FaFileInvoiceDollar /> Extrato</Link>
                        </li>
                        <li className={location.pathname === '/relatorios' ? 'active' : ''}>
                            <Link to="/relatorios"><IoDocumentTextOutline /> Relatórios</Link>
                        </li>
                    </ul>
                </nav>

                <div className="sidebar-footer" />
            </aside>

            <ConfirmationModal
                isOpen={isLogoutModalOpen}
                onClose={() => setLogoutModalOpen(false)}
                onConfirm={handleConfirmLogout}
                title="Confirmar Logout"
                message="Você tem certeza que deseja sair do sistema?"
            />
        </>
    );
}

export default Sidebar;
