import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import './MobileNav.css';

const MobileNav = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = user?.role === 'admin' ? [
    { path: '/admin/verify', label: '🔧 Verify', icon: '🔧' },
    { path: '/admin/scanner', label: '📷 Scanner', icon: '📷' },
    { path: '/staff', label: '📊 Dashboard', icon: '📊' },
  ] : [
    { path: '/home', label: '🏠 Home', icon: '🏠' },
    { path: '/booking', label: '🎫 Booking', icon: '🎫' },
    { path: '/ticket', label: '📱 My Ticket', icon: '📱' },
  ];

  return (
    <>
      {/* Mobile Header */}
      <div className="mobile-header">
        <button 
          className="menu-toggle"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          ☰
        </button>
        <h1 className="mobile-title">🎬 Bioskop</h1>
        <div className="user-badge">
          {user?.username?.charAt(0).toUpperCase()}
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="mobile-menu">
          <div className="menu-header">
            <span>Hi, {user?.username}!</span>
            <button 
              className="close-menu"
              onClick={() => setIsMenuOpen(false)}
            >
              ✕
            </button>
          </div>
          
          <nav className="mobile-nav">
            {navItems.map(item => (
              <button
                key={item.path}
                className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => {
                  navigate(item.path);
                  setIsMenuOpen(false);
                }}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            ))}
          </nav>

          <button 
            className="logout-mobile"
            onClick={handleLogout}
          >
            🚪 Logout
          </button>
        </div>
      )}

      {/* Overlay */}
      {isMenuOpen && (
        <div 
          className="menu-overlay"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </>
  );
};

export default MobileNav;