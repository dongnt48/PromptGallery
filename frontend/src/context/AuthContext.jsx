import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }, []);

  useEffect(() => {
    const verifySession = async () => {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (savedToken && savedUser) {
        try {
          const response = await fetch('http://localhost:3000/auth/me', {
            headers: {
              'Authorization': `Bearer ${savedToken}`
            }
          });

          if (response.ok) {
            const freshUser = await response.json();
            setUser(freshUser);
            setToken(savedToken);
            localStorage.setItem('user', JSON.stringify(freshUser));
          } else {
            // Token invalid or user deleted
            logout();
          }
        } catch (error) {
          console.error('Session verification failed:', error);
          setUser(JSON.parse(savedUser));
          setToken(savedToken);
        }
      }
      setLoading(false);
    };

    verifySession();
  }, [logout]);

  const loginWithToken = useCallback((newToken, userData) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
  }, []);

  const loginWithGoogle = useCallback(() => {
    window.location.href = 'http://localhost:3000/auth/google';
  }, []);

  const value = useMemo(() => ({
    user,
    token,
    loading,
    loginWithGoogle,
    loginWithToken,
    logout
  }), [user, token, loading, loginWithGoogle, loginWithToken, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
