import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    try {
      await fetch('http://localhost:3000/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout failed:', error);
    }
    setUser(null);
    localStorage.removeItem('user');
  }, []);

  useEffect(() => {
    const verifySession = async () => {
      try {
        const response = await fetch('http://localhost:3000/auth/me', {
          credentials: 'include'
        });

        if (response.ok) {
          const freshUser = await response.json();
          if (freshUser) {
            setUser(freshUser);
            localStorage.setItem('user', JSON.stringify(freshUser));
          } else {
            setUser(null);
            localStorage.removeItem('user');
          }
        } else {
          setUser(null);
          localStorage.removeItem('user');
        }
      } catch (error) {
        console.error('Session verification failed:', error);
        const savedUser = localStorage.getItem('user');
        if (savedUser) setUser(JSON.parse(savedUser));
      }
      setLoading(false);
    };

    verifySession();
  }, [logout]);

  const loginWithUser = useCallback((userData) => {
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
    loginWithUser,
    logout
  }), [user, loading, loginWithGoogle, loginWithUser, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
