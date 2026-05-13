import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, FileText, ArrowLeft } from 'lucide-react';

const AdminLayout = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if not admin (after auth finishes loading)
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || !user || user.role !== 'admin') {
    return (
      <div className="admin-loading">
        <div className="admin-spinner"></div>
        {authLoading ? 'Loading...' : 'Checking permissions...'}
      </div>
    );
  }

  const path = location.pathname;

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h2>Admin Panel</h2>
          <p>Manage your platform</p>
        </div>
        <nav className="admin-sidebar-nav">
          <Link
            to="/admin"
            className={`admin-nav-item ${path === '/admin' || path === '/admin/' ? 'active' : ''}`}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </Link>
          <Link
            to="/admin/users"
            className={`admin-nav-item ${path.startsWith('/admin/users') ? 'active' : ''}`}
          >
            <Users size={18} />
            Users
          </Link>
          <Link
            to="/admin/prompts"
            className={`admin-nav-item ${path.startsWith('/admin/prompts') ? 'active' : ''}`}
          >
            <FileText size={18} />
            Prompts
          </Link>
        </nav>
        <div className="admin-sidebar-footer">
          <button className="admin-back-btn" onClick={() => navigate('/')}>
            <ArrowLeft size={16} />
            Back to site
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
