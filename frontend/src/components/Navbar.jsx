import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, LogOut, Shield, Menu, X, Plus, LayoutGrid, Globe, Sparkles, Bookmark } from 'lucide-react';
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
            <Link to="/" className="navbar-logo" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
              <img src="/modoha_logo_soft.png" alt="MODOHA Icon" style={{ height: '36px', width: '36px', objectFit: 'cover', borderRadius: '8px' }} />
              <span className="navbar-logo-text" style={{ fontSize: '20px', fontWeight: '800', background: 'linear-gradient(90deg, #3b82f6, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '0.5px', fontFamily: 'var(--font-heading)' }}>MODOHA</span>
            </Link>
            <div className="navbar-links desktop-only-item">
              <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>{t('navbar.explore')}</Link>
              <Link to="/my-prompts" className={`nav-link ${location.pathname === '/my-prompts' ? 'active' : ''}`}>{t('navbar.myPrompts')}</Link>
              <Link to="/bookmarks" className={`nav-link ${location.pathname === '/bookmarks' ? 'active' : ''}`}>{t('navbar.bookmarks')}</Link>
            </div>
          </div>

          <div className="navbar-actions">
            <button
              className="icon-btn lang-toggle desktop-only-item"
              onClick={toggleLanguage}
              title={i18n.language === 'en' ? 'Switch to Vietnamese' : 'Switch to English'}
              style={{ fontSize: '14px', fontWeight: 'bold' }}
            >
              {i18n.language === 'en' ? 'VI' : 'EN'}
            </button>

            <form className="navbar-search desktop-only-item" onSubmit={handleSearchSubmit}>
              <Search size={18} color="var(--outline-variant)" />
              <input
                type="text"
                placeholder={t('navbar.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>

            {/* Notification Bell */}
            <div className="notif-container desktop-only-item" ref={notifRef}>
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

            <button className="btn-primary create-nav-btn desktop-only-item" onClick={handleCreateClick} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={18} className="create-nav-icon" style={{ display: 'none' }} />
              <span className="create-nav-text">{t('navbar.create')}</span>
            </button>

            {user ? (
              <div className="user-menu-container" ref={userMenuRef}>
                {/* Desktop Trigger (Avatar) */}
                <div 
                  className="desktop-only-item"
                  style={{ position: 'relative', cursor: 'pointer' }}
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <img
                    src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.name || user.username}&background=random`}
                    alt={user.name || user.username}
                    className="avatar"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${user.name || user.username}&background=random`;
                    }}
                  />
                  {unreadCount > 0 && (
                    <span className="avatar-notif-badge-mobile">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>

                {/* Mobile Trigger (Hamburger Menu) */}
                <div 
                  className="mobile-only-item"
                  style={{ position: 'relative', cursor: 'pointer', width: '38px', height: '38px', borderRadius: '50%', background: 'var(--surface-container)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <Menu size={20} />
                  {unreadCount > 0 && (
                    <span className="avatar-notif-badge-mobile">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>

                {isDropdownOpen && (
                  <div className="user-dropdown">
                    <div className="dropdown-header" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px' }}>
                      <img
                        src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.name || user.username}&background=random`}
                        alt={user.name || user.username}
                        style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(0,0,0,0.06)' }}
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${user.name || user.username}&background=random`;
                        }}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <span className="username" style={{ fontWeight: '600', color: 'var(--on-surface)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name || user.username}</span>
                        <span className="email" style={{ fontSize: '12px', color: 'var(--on-surface-variant)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</span>
                      </div>
                    </div>
                    
                    {/* Mobile Only Menu Links */}
                    <div className="mobile-only-item" style={{ flexDirection: 'column', width: '100%' }}>
                      <button className="dropdown-item" onClick={() => { setIsCreateOpen(true); setIsDropdownOpen(false); }}>
                        <Plus size={16} />
                        {t('navbar.create')}
                      </button>
                      <Link to="/" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                        <LayoutGrid size={16} />
                        {t('navbar.explore')}
                      </Link>
                      <Link to="/my-prompts" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                        <Sparkles size={16} />
                        {t('navbar.myPrompts')}
                      </Link>
                      <Link to="/bookmarks" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                        <Bookmark size={16} />
                        {t('navbar.bookmarks')}
                      </Link>
                      <button className="dropdown-item" onClick={(e) => { handleNotifClick(e); setIsDropdownOpen(false); }}>
                        <Bell size={16} />
                        {t('navbar.notifications')}
                        {unreadCount > 0 && (
                          <span className="menu-badge" style={{ marginLeft: 'auto', background: 'var(--error)', color: '#fff', fontSize: '11px', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold' }}>
                            {unreadCount}
                          </span>
                        )}
                      </button>
                      <button className="dropdown-item" onClick={() => { toggleLanguage(); setIsDropdownOpen(false); }}>
                        <Globe size={16} />
                        {i18n.language === 'en' ? 'Tiếng Việt' : 'English'}
                      </button>
                      <div style={{ height: '1px', background: 'rgba(0,0,0,0.06)', margin: '6px 0' }} />
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
              <div className="user-menu-container" ref={userMenuRef}>
                <button
                  className="icon-btn mobile-only-item"
                  style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'var(--surface-container)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <Menu size={20} />
                </button>
                
                <button
                  className="nav-link desktop-only-item"
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                  onClick={() => setIsModalOpen(true)}
                >
                  {t('navbar.login')}
                </button>

                {isDropdownOpen && (
                  <div className="user-dropdown mobile-only-item" style={{ flexDirection: 'column' }}>
                    <Link to="/" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                      <LayoutGrid size={16} />
                      {t('navbar.explore')}
                    </Link>
                    <button className="dropdown-item" onClick={() => { toggleLanguage(); setIsDropdownOpen(false); }}>
                      <Globe size={16} />
                      {i18n.language === 'en' ? 'Tiếng Việt' : 'English'}
                    </button>
                    <div style={{ height: '1px', background: 'rgba(0,0,0,0.06)', margin: '6px 0' }} />
                    <button className="dropdown-item" onClick={() => { setIsModalOpen(true); setIsDropdownOpen(false); }}>
                      <LogOut size={16} style={{ transform: 'rotate(180deg)' }} />
                      {t('navbar.login')}
                    </button>
                  </div>
                )}
              </div>
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
