import { useLanguage } from '../../i18n/LanguageContext';

interface FooterProps {
  isAdminLoggedIn?: boolean;
  onAdminClick?: () => void;
}

export function Footer({}: FooterProps) {
  const { t } = useLanguage();

  return (
    <footer className="site-footer">
      <div className="footer-top-line" />
      <div className="footer-inner">
        {/* Logo + tagline */}
        <div className="footer-brand">
          <div style={{ fontSize: '22px' }}>⚽</div>
          <div>
            <div className="footer-brand-name">{t('storeTitle')}</div>
            <div className="footer-brand-sub">{t('storeSubtitle')}</div>
          </div>
        </div>

        {/* Copyright */}
        <p className="footer-copy">{t('footerCopyright')}</p>
      </div>
    </footer>
  );
}
