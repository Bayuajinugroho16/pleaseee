import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand" onClick={() => navigate('/')}>
        🎬 BIOSKOP TIKET
      </div>
      
      <div className="navbar-links">
        {user ? (
          <>
            <span className="user-info">
              👋 Hello, {user.username} 
              {isAdmin && <span className="admin-badge">ADMIN</span>}
            </span>
            
            {isAdmin && (
              <button 
                onClick={() => navigate('/admin/verify')}
                className="staff-link"
              >
                📱 Scanner
              </button>
            )}
            
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </>
        ) : (
          <button onClick={() => navigate('/login')} className="login-btn">
            Login
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;