import React from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Blocked = () => {
  const { t } = useTranslation();

  return (
    <div className="blocked-page-container">
      <div className="blocked-card">
        <div className="blocked-icon-container">
          <ShieldAlert className="blocked-icon-alert" size={40} />
          <div className="blocked-pulse-ring"></div>
        </div>

        <h1 className="blocked-title">
          {t('blocked.title', 'Truy cập bị hạn chế')}
        </h1>
        
        <p className="blocked-description">
          {t('blocked.description', 'Bạn đã gửi quá nhiều yêu cầu liên tục. Vui lòng thử lại sau vài phút.')}
        </p>

        <div className="blocked-footer">
          <button 
            className="btn-primary blocked-retry-btn"
            onClick={() => window.location.reload()}
          >
            <RefreshCw size={14} style={{ marginRight: '6px' }} />
            <span>{t('blocked.retryBtn', 'Thử lại')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Blocked;
