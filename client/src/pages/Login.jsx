import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let result;
      
      if (isLogin) {
        // ✅ PERBAIKAN: Login hanya dengan username & password
        if (!formData.username.trim() || !formData.password.trim()) {
          setError('Username dan password harus diisi');
          setLoading(false);
          return;
        }
        
        console.log('🔐 Attempting login with username:', formData.username);
        result = await login(formData.username, formData.password);
      } else {
        // Register tetap butuh semua field
        if (!formData.username || !formData.email || !formData.password || !formData.phone) {
          setError('Semua field harus diisi');
          setLoading(false);
          return;
        }
        
        console.log('📝 Attempting register for:', formData.username);
        result = await register(formData);
      }

      if (result.success) {
        console.log('✅ Auth successful, user role:', result.user?.role);
        
        // Redirect berdasarkan role
        if (result.user?.role === 'admin') {
          navigate('/admin/verify');
        } else {
          navigate('/home');
        }
      } else {
        setError(result.message || 'Authentication failed');
      }
    } catch (error) {
      setError('Terjadi error. Silakan coba lagi.');
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Test server connection
  const testServerConnection = async () => {
    try {
      setError('Testing server connection...');
      const response = await fetch('http://localhost:5000/');
      if (response.ok) {
        const data = await response.json();
        setError(`✅ Server is running: ${data.message}`);
      } else {
        setError('❌ Server responded with error');
      }
    } catch (error) {
      setError('❌ Cannot connect to server. Please make sure backend is running on port 5000.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>{isLogin ? 'Login' : 'Register'} </h1>
        <p>  {isLogin ? 'Hallo Unneffelas' : 'Buat akun baru'}</p>
        <p>  {isLogin ? 'Masuk ke akun anda' : 'Buat '}</p>
         
        
        {error && (
          <div className={`error-message ${error.includes('✅') ? 'success' : 'error'}`}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          {/* ✅ LOGIN: Hanya Username & Password */}
          {isLogin ? (
            <>
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  placeholder="Masukkan username Anda"
                  autoComplete="username"
                  disabled={loading}
                />
              </div>
              
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Masukkan password Anda"
                  minLength="6"
                  autoComplete="current-password"
                  disabled={loading}
                />
              </div>
            </>
          ) : (
            /* REGISTER: Semua Field */
            <>
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  placeholder="Pilih username unik"
                  autoComplete="username"
                  disabled={loading}
                />
              </div>
              
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="email@example.com"
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
              
              <div className="form-group">
                <label>Nomor Telepon</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="08xxxxxxxxxx"
                  autoComplete="tel"
                  disabled={loading}
                />
              </div>
              
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Minimal 6 karakter"
                  minLength="6"
                  autoComplete="new-password"
                  disabled={loading}
                />
              </div>
            </>
          )}
          
          <button 
            type="submit" 
            className="login-btn"
            disabled={loading}
          >
            {loading ? 'Loading...' : (isLogin ? 'Login' : 'Daftar')}
          </button>
        </form>

        {/* Debug Section */}
        <div className="debug-section">
          <button 
            type="button" 
            onClick={testServerConnection}
            className="test-connection-btn"
            disabled={loading}
          >
            Test Server Connection
          </button>
          
          <div className="server-info">
            <small>
              <strong>Backend:</strong> http://localhost:5000<br/>
              <strong>Login dengan:</strong> username & password
            </small>
          </div>
        </div>
        
        <div className="auth-switch">
          <p>
            {isLogin ? 'Belum punya akun? ' : 'Sudah punya akun? '}
            <span 
              className="switch-link"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
            >
              {isLogin ? 'Daftar di sini' : 'Login di sini'}
            </span>
          </p>
        </div>

        
      </div>
    </div>
  );
};

export default Login;