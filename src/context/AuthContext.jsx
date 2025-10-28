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

  // ✅ Auto-login from localStorage
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      try {
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
      const res = await fetch('https://beckendflyio.vercel.app/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const result = await res.json();
      console.log('📨 Login response:', result);

      if (result.success) {
        const { user, token } = result.data;
        if (!user) return { success: false, message: 'User data not received' };

        setUser(user);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        console.log('🎉 Login successful, role:', user.role);
        console.log('🔐 Token stored:', token);

        return { success: true, user, role: user.role };
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
      if (result.success) console.log('✅ Registration successful');
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

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        loading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
