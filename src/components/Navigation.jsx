import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navigation.css';

const Navigation = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const location = useLocation();

  const handleLogout = () => {
    logout();
  };

  if (!isAuthenticated) {
    return null; // Tidak tampilkan navigation jika belum login
  }

  return (
    <nav className="navbar">
      <div className="nav-container">
        {/* Logo/Brand */}
        <div className="nav-brand">
          <Link to="/home">🎬 UNEFF 2025</Link>
        </div>

        {/* Navigation Links */}
        <div className="nav-links">
          <Link 
            to="/home" 
            className={location.pathname === '/home' ? 'nav-link active' : 'nav-link'}
          >
            🏠 Home
          </Link>
          
          {/* Bundle Ticket */}
          <Link 
            to="/bundle-ticket" 
            className={location.pathname === '/bundle-ticket' ? 'nav-link active' : 'nav-link'}
          >
            🎁 Bundle Ticket
          </Link>
          
          {/* Tutorial */}
          <Link 
            to="/tutorial" 
            className={location.pathname === '/tutorial' ? 'nav-link active' : 'nav-link'}
          >
            📚 Tutorial
          </Link>
          
          {/* My Tickets */}
          <Link 
            to="/my-tickets" 
            className={location.pathname === '/my-tickets' ? 'nav-link active' : 'nav-link'}
          >
            🎫 My Tickets
          </Link>

          {/* ✅ ADMIN DATABASE - HANYA UNTUK ADMIN */}
          {user?.role === 'admin' && (
            <Link 
              to="/admin-database" 
              className={location.pathname === '/admin-database' ? 'nav-link active' : 'nav-link'}
            >
              🗃️ Admin Database
            </Link>
          )}

          {/* ✅ ADMIN PANEL - HANYA UNTUK ADMIN */}
          {user?.role === 'admin' && (
            <Link 
              to="/admin/verify" 
              className={location.pathname.includes('/admin') ? 'nav-link active' : 'nav-link'}
            >
              ⚙️ Admin Panel
            </Link>
          )}
        </div>

        {/* User Menu & Logout */}
        <div className="nav-user">
          <span className="user-name">
            Hai, {user?.username || user?.name || 'User'} 
            {user?.role === 'admin' && ' (Admin)'}
          </span>
          <button onClick={handleLogout} className="logout-btn">
            🚪 Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;