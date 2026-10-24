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

  return (
    <header className="site-header">
      <div className="header-container">
        {/* Logo */}
        <div className="logo-area" style={{ cursor: 'pointer' }} onClick={() => onNavigate('store')}>
          <div className="logo-icon-box">
            <div className="logo-icon-inner">⚽</div>
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
            style={{
              background: currentView === 'store' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
              color: currentView === 'store' ? '#38bdf8' : 'var(--text-muted)',
              border: currentView === 'store' ? '1px solid rgba(6, 182, 212, 0.3)' : 'none',
              padding: '8px 16px',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>🛒</span>
            <span>{t('navStore')}</span>
          </button>

          {isAdminLoggedIn && (
            <>
              <button
                onClick={() => onNavigate('admin')}
                style={{
                  background: currentView === 'admin' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                  color: currentView === 'admin' ? '#a5b4fc' : 'var(--text-muted)',
                  border: currentView === 'admin' ? '1px solid rgba(99, 102, 241, 0.4)' : 'none',
                  padding: '8px 16px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>⚙️</span>
                <span>{t('navAdmin')}</span>
              </button>

              <button
                onClick={onLogout}
                title={t('navLogout')}
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#f87171',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  padding: '8px 14px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
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
              <span>⚡</span>
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
