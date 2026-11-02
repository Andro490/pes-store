import { useLanguage } from '../../i18n/LanguageContext';

interface FooterProps {
  isAdminLoggedIn?: boolean;
  onAdminClick?: () => void;
  onNavigate?: (view: 'store' | 'admin' | 'terms' | 'privacy' | 'refund' | 'pricing') => void;
}

export function Footer({ onNavigate }: FooterProps) {
  const { t } = useLanguage();

  const handleLink = (e: React.MouseEvent, view: 'store' | 'admin' | 'terms' | 'privacy' | 'refund' | 'pricing') => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate(view);
    } else {
      window.location.href = view === 'store' ? '/' : view === 'admin' ? '/admfoad' : `/${view}`;
    }
  };

  return (
    <footer className="site-footer bg-[#070b14]/90 border-t border-cyan-500/20 py-8 px-4 sm:px-8 mt-12 text-sm text-gray-400">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Logo + tagline */}
        <div className="flex items-center gap-3">
          <div className="text-3xl">⚽</div>
          <div>
            <div className="text-white font-extrabold text-lg tracking-wide">{t('storeTitle')}</div>
            <div className="text-cyan-400 text-xs font-mono">{t('storeSubtitle')}</div>
          </div>
        </div>

        {/* Legal & Compliance Links for Paddle / Users */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium">
          <a
            href="/pricing"
            onClick={(e) => handleLink(e, 'pricing')}
            className="hover:text-cyan-300 transition text-gray-300"
          >
            💎 الأسعار والخطط
          </a>
          <span className="text-gray-700">•</span>
          <a
            href="/terms"
            onClick={(e) => handleLink(e, 'terms')}
            className="hover:text-cyan-300 transition text-gray-300"
          >
            📜 شروط الخدمة
          </a>
          <span className="text-gray-700">•</span>
          <a
            href="/privacy"
            onClick={(e) => handleLink(e, 'privacy')}
            className="hover:text-cyan-300 transition text-gray-300"
          >
            🔒 سياسة الخصوصية
          </a>
          <span className="text-gray-700">•</span>
          <a
            href="/refund"
            onClick={(e) => handleLink(e, 'refund')}
            className="hover:text-cyan-300 transition text-gray-300"
          >
            🔄 سياسة الاسترداد
          </a>
        </div>

        {/* Copyright */}
        <div className="text-xs text-gray-500 text-center md:text-left">
          <p>{t('footerCopyright')}</p>
          <p className="text-[10px] text-gray-600 mt-1">Verified Merchant of Record: Paddle.com</p>
        </div>

      </div>
    </footer>
  );
}
