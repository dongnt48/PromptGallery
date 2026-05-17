import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, LogOut, Shield, Menu, X } from 'lucide-react';
import LoginModal from './LoginModal';
import CreatePromptModal from './CreatePromptModal';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useTranslation } from 'react-i18next';

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const [searchQuery, setSearchQuery] = useState('');

  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get('search');
    setSearchQuery(searchParam || '');
    setIsMobileMenuOpen(false);
  }, [location.search, location.pathname]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`${location.pathname}?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate(`${location.pathname}`);
    }
  };

  const handleCreateClick = () => {
    if (!user) {
      setIsModalOpen(true);
      return;
    }
    setIsCreateOpen(true);
  };

  const handleNotifClick = () => {
    setIsNotifOpen(!isNotifOpen);
    if (!isNotifOpen && unreadCount > 0) {
      markAllRead();
    }
  };

  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'vi' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          <div className="navbar-left">
            <button 
              className="icon-btn mobile-menu-btn" 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <Link to="/" className="navbar-logo">
              Lumina
            </Link>
            <div className={`navbar-links ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
              <form className="navbar-search mobile-search" onSubmit={handleSearchSubmit}>
                <Search size={18} color="var(--outline-variant)" />
                <input 
                  type="text" 
                  placeholder={t('navbar.search')} 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>
              <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>{t('navbar.explore')}</Link>
              <Link to="/my-prompts" className={`nav-link ${location.pathname === '/my-prompts' ? 'active' : ''}`}>{t('navbar.myPrompts')}</Link>
              <Link to="/bookmarks" className={`nav-link ${location.pathname === '/bookmarks' ? 'active' : ''}`}>{t('navbar.bookmarks')}</Link>
            </div>
          </div>

          <div className="navbar-actions">
            <button 
              className="icon-btn lang-toggle" 
              onClick={toggleLanguage}
              title={i18n.language === 'en' ? 'Switch to Vietnamese' : 'Switch to English'}
              style={{ fontSize: '14px', fontWeight: 'bold' }}
            >
              {i18n.language === 'en' ? 'EN' : 'VI'}
            </button>

            <form className="navbar-search" onSubmit={handleSearchSubmit}>
              <Search size={18} color="var(--outline-variant)" />
              <input 
                type="text" 
                placeholder={t('navbar.search')} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>

            {/* Notification Bell */}
            <div className="notif-container" ref={notifRef}>
              <button className="icon-btn" onClick={handleNotifClick}>
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </button>

              {isNotifOpen && (
                <div className="notif-dropdown">
                  <div className="notif-dropdown-header">
                    <h4>{t('navbar.notifications')}</h4>
                    {notifications.length > 0 && (
                      <button className="notif-clear" onClick={() => { markAllRead(); }}>
                        {t('navbar.markAllRead')}
                      </button>
                    )}
                  </div>
                  <div className="notif-dropdown-body">
                    {notifications.length === 0 ? (
                      <div className="notif-empty">
                        <Bell size={24} color="var(--outline-variant)" />
                        <p>{t('navbar.noNotifications')}</p>
                      </div>
                    ) : (
                      notifications.slice(0, 10).map(n => (
                        <div key={n.id} className={`notif-item ${!n.read ? 'unread' : ''}`}>
                          <span className="notif-message">{n.message}</span>
                          <span className="notif-time">{formatTimeAgo(n.timestamp)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button className="btn-primary" onClick={handleCreateClick}>
              {t('navbar.create')}
            </button>

            {user ? (
              <div className="user-menu-container" ref={userMenuRef}>
                <img
                  src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.name || user.username}&background=random`}
                  alt={user.name || user.username}
                  className="avatar"
                  referrerPolicy="no-referrer"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${user.name || user.username}&background=random`;
                  }}
                />
                {isDropdownOpen && (
                  <div className="user-dropdown">
                    <div className="dropdown-header">
                      <span className="username">{user.name || user.username}</span>
                      <span className="email">{user.email}</span>
                    </div>
                    {user.role === 'admin' && (
                      <Link to="/admin" className="dropdown-item" style={{ textDecoration: 'none', color: '#7c3aed' }} onClick={() => setIsDropdownOpen(false)}>
                        <Shield size={16} />
                        {t('navbar.adminPanel')}
                      </Link>
                    )}
                    <button className="dropdown-item logout" onClick={logout}>
                      <LogOut size={16} />
                      {t('navbar.logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                className="nav-link"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => setIsModalOpen(true)}
              >
                {t('navbar.login')}
              </button>
            )}
          </div>
        </div>
      </nav>

      <LoginModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <CreatePromptModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </>
  );
};

export default Navbar;
