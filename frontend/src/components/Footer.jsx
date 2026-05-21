import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();
  return (
    <footer className="footer" style={{ padding: '0', textAlign: 'center', borderTop: '1px solid var(--outline-variant)', background: 'var(--surface-container-lowest)' }}>
      <div className="footer-container" style={{ padding: '16px 20px', maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/modoha_logo_soft.png" alt="MODOHA" style={{ height: '24px', width: '24px', objectFit: 'cover', borderRadius: '6px' }} />
          <span style={{ fontSize: '16px', fontWeight: '800', background: 'linear-gradient(90deg, #3b82f6, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '0.5px', fontFamily: 'var(--font-heading)' }}>MODOHA</span>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: '13px', margin: 0 }}>
            {t('footer.tagline')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
