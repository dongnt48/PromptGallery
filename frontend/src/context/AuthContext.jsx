import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }, []);

  useEffect(() => {
    const verifySession = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        try {
          const response = await fetch('http://localhost:3000/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const freshUser = await response.json();
            setUser(freshUser);
            localStorage.setItem('user', JSON.stringify(freshUser));
          } else {
            // Token invalid or user deleted
            logout();
          }
        } catch (error) {
          console.error('Session verification failed:', error);
          setUser(JSON.parse(savedUser));
        }
      }
      setLoading(false);
    };

    verifySession();
  }, [logout]);

  const loginWithToken = useCallback((token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const loginWithGoogle = useCallback(() => {
    window.location.href = 'http://localhost:3000/auth/google';
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    loginWithGoogle,
    loginWithToken,
    logout
  }), [user, loading, loginWithGoogle, loginWithToken, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
