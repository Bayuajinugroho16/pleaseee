import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null); 
  const [loading, setLoading] = useState(true);

  // ✅ Auto-login from localStorage - DIPERBAIKI
  useEffect(() => {
    const storedToken = localStorage.getItem('token'); // ✅ PERBAIKI VARIABLE NAME
    const storedUser = localStorage.getItem('user');   // ✅ PERBAIKI VARIABLE NAME

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setToken(storedToken); // ✅ GUNAKAN storedToken, BUKAN storedToken
        console.log('✅ Auto-login from localStorage:', parsedUser.username);
        console.log('🔐 Token loaded:', storedToken.substring(0, 20) + '...');
      } catch (error) {
        console.error('❌ Error parsing user data:', error);
        logout();
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const res = await fetch('https://beckendflyio.vercel.app/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const result = await res.json();
      console.log('📨 Login response:', result);

      if (result.success) {
        const { user, token } = result.data;
        if (!user || !token) {
          return { success: false, message: 'User data or token not received' };
        }

        setUser(user);
        setToken(token);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        console.log('🎉 Login successful, role:', user.role);
        console.log('🔐 Token stored:', token.substring(0, 20) + '...');

        return { success: true, user, token, role: user.role };
      } else {
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error('💥 Login error:', error);
      return { success: false, message: 'Network error: ' + error.message };
    }
  };

  const register = async (userData) => {
    try {
      const res = await fetch('https://beckendflyio.vercel.app/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: userData.username,
          password: userData.password,
          phone: userData.phone,
          email: userData.email || `${userData.username}@gmail.com`,
        }),
      });

      const result = await res.json();
      if (result.success) {
        console.log('✅ Registration successful');
        // Auto login after registration if token is provided
        if (result.data && result.data.token) {
          setUser(result.data.user);
          setToken(result.data.token);
          localStorage.setItem('token', result.data.token);
          localStorage.setItem('user', JSON.stringify(result.data.user));
        }
      }
      return result;
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, message: 'Network error' };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    console.log('✅ Logout successful - token cleared');
  };

  // ✅ Function to get headers with authentication
  const getAuthHeaders = () => {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  };

  // ✅ Function to make authenticated requests
  const authFetch = async (url, options = {}) => {
    const headers = getAuthHeaders();
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });
    
    if (response.status === 401) {
      // Token expired or invalid
      logout();
      throw new Error('Authentication failed');
    }
    
    return response;
  };

  // ✅ Helper function to check if user is admin
  const isAdmin = () => {
    return user?.role === 'admin';
  };

  // ✅ Helper function to check authentication
  const isAuthenticated = () => {
    return !!user && !!token;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        loading,
        isAuthenticated: isAuthenticated(), // ✅ GUNAKAN FUNCTION
        isAdmin: isAdmin(), // ✅ GUNAKAN FUNCTION
        getAuthHeaders, 
        authFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};