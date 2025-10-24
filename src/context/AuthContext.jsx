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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        // ✅ SET USER DARI localStorage TANPA VERIFY (karena endpoint verify belum ada)
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        console.log('✅ Auto-login from localStorage:', parsedUser.username);
      } catch (error) {
        console.error('❌ Error parsing user data:', error);
        logout();
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await fetch('https://beckendflyio.vercel.app/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();

      console.log('📨 Login response:', result);

      if (result.success) {
        const { user, token } = result.data;
        if (!user) {
          console.error('❌ User data missing in response');
          return { success: false, message: 'User data not received' };
        }
        
        setUser(user);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        console.log('🎉 Login successful, user role:', user.role);
        console.log('🔐 Token stored:', token);
        
        return { 
          success: true, 
          user,
          role: user.role
        };
      } else {
        console.log('❌ Login failed:', result.message);
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error('💥 Login error:', error);
      return { success: false, message: 'Network error: ' + error.message };
    }
  };

 // AuthContext.js - register function
const register = async (userData) => {
  try {
    console.log('📝 Registering user:', userData);
    
    const response = await fetch('https://beckendflyio.vercel.app/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: userData.username,
        password: userData.password,
        phone: userData.phone,
        email: userData.email || `${userData.username}@no-email.com`
      }),
    });

    const result = await response.json();
    
    // ✅ JANGAN AUTO SET USER & TOKEN SETELAH REGISTER
    if (result.success) {
      console.log('✅ Registration successful, but not auto-login');
      // Tidak panggil setUser() atau setToken() di sini
    }
    
    return result;
  } catch (error) {
    console.error('Register error:', error);
    return { success: false, message: 'Network error' };
  }
};

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    console.log('✅ Logout successful');
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};