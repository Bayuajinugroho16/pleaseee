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
          <Link to="/home">🎬 CinemaApp</Link>
        </div>

        {/* Navigation Links */}
        <div className="nav-links">
          <Link 
            to="/home" 
            className={location.pathname === '/home' ? 'nav-link active' : 'nav-link'}
          >
            🏠 Home
          </Link>
          
          {/* ✅ TUTORIAL - menggantikan Booking */}
          <Link 
            to="/tutorial" 
            className={location.pathname === '/tutorial' ? 'nav-link active' : 'nav-link'}
          >
            📚 Tutorial
          </Link>
          
          <Link 
            to="/my-tickets" 
            className={location.pathname === '/my-tickets' ? 'nav-link active' : 'nav-link'}
          >
            🎫 My Tickets
          </Link>

          {/* Admin Links */}
          {user?.role === 'admin' && (
            <Link 
              to="/admin/verify" 
              className={location.pathname.includes('/admin') ? 'nav-link active' : 'nav-link'}
            >
              ⚙️ Admin
            </Link>
          )}
        </div>

        {/* User Menu & Logout */}
        <div className="nav-user">
          <span className="user-name">Hai, {user?.name || 'User'}</span>
          <button onClick={handleLogout} className="logout-btn">
            🚪 Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;