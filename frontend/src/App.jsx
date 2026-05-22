import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import MyPrompts from './pages/MyPrompts';
import Bookmarks from './pages/Bookmarks';
import LoginSuccess from './pages/LoginSuccess';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminPrompts from './pages/admin/AdminPrompts';
import { NotificationProvider } from './context/NotificationContext';
import FetchInterceptor from './components/FetchInterceptor';
import Blocked from './pages/Blocked';
import { useAuth } from './context/AuthContext';

function App() {
  const { user } = useAuth();
  const [blockedTimeLeft, setBlockedTimeLeft] = React.useState(() => {
    const until = localStorage.getItem('blockedUntil');
    if (until) {
      const diff = Math.ceil((parseInt(until, 10) - Date.now()) / 1000);
      return diff > 0 ? diff : 0;
    }
    return 0;
  });

  // Clear block if user is admin
  React.useEffect(() => {
    if (user && user.role === 'admin' && blockedTimeLeft > 0) {
      localStorage.removeItem('blockedUntil');
      setBlockedTimeLeft(0);
    }
  }, [user, blockedTimeLeft]);

  React.useEffect(() => {
    if (blockedTimeLeft <= 0) return;
    const interval = setInterval(() => {
      setBlockedTimeLeft(prev => {
        const next = prev - 1;
        if (next <= 0) {
          localStorage.removeItem('blockedUntil');
          clearInterval(interval);
          window.location.reload();
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [blockedTimeLeft]);

  React.useEffect(() => {
    const handleBlocked = (e) => {
      // Do not block if logged in user is admin
      if (user && user.role === 'admin') return;
      
      const seconds = e.detail || 600;
      localStorage.setItem('blockedUntil', String(Date.now() + seconds * 1000));
      setBlockedTimeLeft(seconds);
    };
    window.addEventListener('apiRateLimited', handleBlocked);
    return () => window.removeEventListener('apiRateLimited', handleBlocked);
  }, [user]);

  return (
    <Router>
      <NotificationProvider>
        <FetchInterceptor />
        <div className="app-container">
          <Navbar />
          <main className="main-content">
            {blockedTimeLeft > 0 ? (
              <Blocked />
            ) : (
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/my-prompts" element={<MyPrompts />} />
                <Route path="/bookmarks" element={<Bookmarks />} />
                <Route path="/login-success" element={<LoginSuccess />} />
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="prompts" element={<AdminPrompts />} />
                </Route>
              </Routes>
            )}
          </main>
          <Footer />
        </div>
      </NotificationProvider>
    </Router>
  );
}

export default App;
