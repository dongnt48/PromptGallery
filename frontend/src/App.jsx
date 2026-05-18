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

function App() {
  return (
    <Router>
      <NotificationProvider>
        <FetchInterceptor />
        <div className="app-container">
          <Navbar />
          <main className="main-content">
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
          </main>
          <Footer />
        </div>
      </NotificationProvider>
    </Router>
  );
}

export default App;
