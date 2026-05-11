import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-logo">LUMINA</div>
        <div className="footer-text">© 2024 Lumina Editorial. All rights reserved.</div>
        <div className="footer-links">
          <Link to="#">Privacy</Link>
          <Link to="#">Terms</Link>
          <Link to="#">API</Link>
          <Link to="#">Press</Link>
          <Link to="#">Contact</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
