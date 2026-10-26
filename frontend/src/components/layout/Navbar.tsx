import { useState, useEffect } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { LanguageSwitcher } from '../LanguageSwitcher';

interface NavbarProps {
  currentView: 'store' | 'admin';
  isAdminLoggedIn: boolean;
  onNavigate: (view: 'store' | 'admin') => void;
  onLogout: () => void;
  onBuyClick: () => void;
  onCreateAccount: () => void;
}

export function Navbar({
  currentView,
  isAdminLoggedIn,
  onNavigate,
  onLogout,
  onBuyClick,
  onCreateAccount,
}: NavbarProps) {
  const { t } = useLanguage();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`site-header ${scrolled ? 'scrolled' : ''}`}>
      {/* Top neon line */}
      <div className="navbar-top-line" />

      <div className="header-container">
        {/* Logo */}
        <div className="logo-area" style={{ cursor: 'pointer' }} onClick={() => onNavigate('store')}>
          <div className="logo-icon-box">
            <div className="logo-icon-inner">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#ffffff" strokeWidth="1.5"/>
                <path d="M12 2C12 2 8 8 8 12s4 10 4 10" stroke="#ffffff" strokeWidth="1.5"/>
                <path d="M12 2C12 2 16 8 16 12s-4 10-4 10" stroke="#ffffff" strokeWidth="1.5"/>
                <path d="M2 12h20" stroke="#ffffff" strokeWidth="1.5"/>
                <path d="M4.93 7h14.14M4.93 17h14.14" stroke="#ffffff" strokeWidth="1" opacity="0.75"/>
              </svg>
            </div>
          </div>
          <div>
            <div className="logo-text-title">
              {t('storeTitle')}
              <span className="logo-badge">{t('storeBadge')}</span>
            </div>
            <div className="logo-subtitle">{t('storeSubtitle')}</div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="header-nav">
          <button
            onClick={() => onNavigate('store')}
            className={`nav-pill-btn ${currentView === 'store' ? 'nav-pill-active-cyan' : ''}`}
          >
            <span>🛒</span>
            <span>{t('navStore')}</span>
            {currentView === 'store' && <span className="nav-active-dot" />}
          </button>

          {isAdminLoggedIn && (
            <>
              <button
                onClick={() => onNavigate('admin')}
                className={`nav-pill-btn ${currentView === 'admin' ? 'nav-pill-active-indigo' : ''}`}
              >
                <span>⚙️</span>
                <span>{t('navAdmin')}</span>
                {currentView === 'admin' && <span className="nav-active-dot" style={{ background: '#818cf8' }} />}
              </button>

              <button onClick={onLogout} className="nav-pill-btn nav-pill-danger">
                <span>🚪</span>
                <span>{t('navLogout')}</span>
              </button>
            </>
          )}
        </nav>

        {/* Right Side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <LanguageSwitcher />
          {currentView === 'store' ? (
            <button onClick={onBuyClick} className="btn-header-buy">
              <span className="btn-buy-spark">⚡</span>
              <span>{t('navBuyAccount')}</span>
            </button>
          ) : isAdminLoggedIn ? (
            <button
              onClick={onCreateAccount}
              className="btn-header-buy"
              style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}
            >
              <span>➕</span>
              <span>{t('navUploadAccount')}</span>
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
