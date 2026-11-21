import { useLanguage } from '../../i18n/LanguageContext';

export function Footer() {
  const { t } = useLanguage();

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

        {/* Copyright */}
        <div className="text-xs text-gray-500 text-center md:text-left">
          <p>{t('footerCopyright')}</p>
        </div>

      </div>
    </footer>
  );
}

