import { useLanguage } from '../../i18n/LanguageContext';

interface FooterProps {
  isAdminLoggedIn: boolean;
  onAdminClick: () => void;
}

export function Footer({ isAdminLoggedIn, onAdminClick }: FooterProps) {
  const { t } = useLanguage();

  return (
    <footer
      className="site-footer"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        padding: '24px 30px',
      }}
    >
      <p style={{ margin: 0 }}>{t('footerCopyright')}</p>

      <div>
        <button
          onClick={onAdminClick}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.25)',
            fontSize: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span>🔐</span>
          <span>{isAdminLoggedIn ? t('footerAdminDashboard') : t('footerAdminLogin')}</span>
        </button>
      </div>
    </footer>
  );
}
