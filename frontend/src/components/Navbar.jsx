import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, Bell, LogOut } from 'lucide-react';
import LoginModal from './LoginModal';
import CreatePromptModal from './CreatePromptModal';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const Navbar = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAllRead } = useNotifications();

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

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          <div className="navbar-left">
            <Link to="/" className="navbar-logo">
              Lumina
            </Link>
            <div className="navbar-links">
              <Link to="/" className="nav-link active">Explore</Link>
              <Link to="/" className="nav-link">My Prompts</Link>
              <Link to="/" className="nav-link">Bookmarks</Link>
            </div>
          </div>

          <div className="navbar-actions">
            <div className="navbar-search">
              <Search size={18} color="var(--outline-variant)" />
              <input type="text" placeholder="Search prompts..." />
            </div>

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
                    <h4>Notifications</h4>
                    {notifications.length > 0 && (
                      <button className="notif-clear" onClick={() => { markAllRead(); }}>
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="notif-dropdown-body">
                    {notifications.length === 0 ? (
                      <div className="notif-empty">
                        <Bell size={24} color="var(--outline-variant)" />
                        <p>No notifications yet</p>
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
              Create
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
                    <button className="dropdown-item logout" onClick={logout}>
                      <LogOut size={16} />
                      Logout
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
                Login
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
