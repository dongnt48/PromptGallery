import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Bell } from 'lucide-react';

const Navbar = () => {
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
            <img 
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60" 
              alt="User" 
              className="avatar" 
            />
          </div>
        </div>
      </nav>
      
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
