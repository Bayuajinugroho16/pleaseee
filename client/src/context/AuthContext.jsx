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
    if (token) {
      verifyToken(token);
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async (token) => {
    try {
      console.log('🔐 Verifying token...');
      
      const response = await fetch('http://localhost:5000/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log('❌ Verify endpoint not found, using fallback');
          const userData = localStorage.getItem('user');
          if (userData) {
            const user = JSON.parse(userData);
            setUser(user);
            console.log('✅ Using fallback user data:', user.username);
          } else {
            throw new Error('No user data found');
          }
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setUser(result.data.user);
        localStorage.setItem('user', JSON.stringify(result.data.user));
        console.log('✅ Token verified, user:', result.data.user.username);
      } else {
        console.log('❌ Token verification failed:', result.message);
        logout();
      }
    } catch (error) {
      console.error('❌ Token verification failed:', error.message);
      
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          setUser(user);
          console.log('✅ Using existing user data as fallback:', user.username);
        } catch (parseError) {
          console.error('❌ Failed to parse user data:', parseError);
          logout();
        }
      } else {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
  try {
    const response = await fetch('http://localhost:5000/api/auth/login', {
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
        
        // ✅ Hanya return success, TIDAK redirect di sini
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

 // Di AuthContext.js - register function
const register = async (userData) => {
  try {
    console.log('📝 Registering user:', userData);
    
    const response = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: userData.username,
        password: userData.password,
        phone: userData.phone,
        // email: userData.email // Opsional, bisa dikosongkan
      }),
    });

    const result = await response.json();
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