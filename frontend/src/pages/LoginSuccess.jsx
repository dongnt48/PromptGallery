import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithToken } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const userStr = params.get('user');

    if (token && userStr) {
      try {
        const userData = JSON.parse(userStr);
        loginWithToken(token, userData);
        
        // Brief delay to ensure state persists before navigation
        const timer = setTimeout(() => {
          navigate('/', { replace: true });
        }, 50);
        return () => clearTimeout(timer);
      } catch (error) {
        console.error('Login error:', error);
        navigate('/');
      }
    } else {
      navigate('/');
    }
  }, [location, loginWithToken, navigate]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div className="headline-md">Authenticating...</div>
    </div>
  );
};

export default LoginSuccess;
