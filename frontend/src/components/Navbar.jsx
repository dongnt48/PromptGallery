import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Bell, LogOut } from 'lucide-react';
import LoginModal from './LoginModal';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { user, logout } = useAuth();

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
              <Link to="/" className="nav-link">Trending</Link>
              <Link to="/" className="nav-link">Following</Link>
            </div>
          </div>
          
          <div className="navbar-search">
            <Search size={18} color="var(--outline-variant)" />
            <input type="text" placeholder="Search prompts, styles, or creators..." />
          </div>
          
          <div className="navbar-actions">
            <button className="icon-btn">
              <Bell size={20} />
            </button>
            <button className="btn-primary">
              Create
            </button>
            {user ? (
              <div className="user-menu-container">
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
      
      <div className="subnav">
        <button className="filter-chip active">All Styles</button>
        <button className="filter-chip">Anime</button>
        <button className="filter-chip">Cinematic</button>
        <button className="filter-chip">Realistic</button>
        <button className="filter-chip">Fantasy</button>
        <button className="filter-chip">Flux</button>
        <button className="filter-chip">Midjourney</button>
        <button className="filter-chip">Video</button>
        <button className="filter-chip">3D Render</button>
        <button className="filter-chip">Concept Art</button>
        <button className="filter-chip">Cyberpunk</button>
      </div>
    </>
  );
};

export default Navbar;
