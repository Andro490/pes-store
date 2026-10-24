import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import type { Currency } from '../i18n/LanguageContext';

interface LanguageSwitcherProps {
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ className = '' }) => {
  const { language, toggleLanguage, t, currency, setCurrency, isOutsideEgypt } = useLanguage();

  const handleCurrencyToggle = () => {
    setCurrency(currency === 'EGP' ? 'USD' : 'EGP');
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {/* Language Toggle Button */}
      <button
        onClick={toggleLanguage}
        type="button"
        className={`lang-switcher-btn ${className}`}
        title={language === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
        aria-label="Toggle language"
      >
        <span className="lang-flag">{t('langFlag')}</span>
        <span className="lang-text">{t('langSwitch')}</span>
      </button>

      {/* Currency Toggle Button — shown when user is outside Egypt OR in English mode */}
      {(isOutsideEgypt || language === 'en') && (
        <button
          onClick={handleCurrencyToggle}
          type="button"
          className="lang-switcher-btn"
          title={currency === 'EGP' ? 'Switch to USD' : 'Switch to EGP'}
          aria-label="Toggle currency"
        >
          <span className="lang-flag">{currency === 'EGP' ? '🇪🇬' : '💵'}</span>
          <span className="lang-text">{currency === 'EGP' ? 'EGP' : 'USD'}</span>
        </button>
      )}
    </div>
  );
};
