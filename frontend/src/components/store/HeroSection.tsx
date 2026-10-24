import { useLanguage } from '../../i18n/LanguageContext';

interface HeroSectionProps {
  totalAccounts: number;
  onBuyClick: () => void;
}

export function HeroSection({ totalAccounts, onBuyClick }: HeroSectionProps) {
  const { t } = useLanguage();

  return (
    <section className="hero-section">
      <div className="hero-pill-tag">
        <span className="pulse-dot" />
        <span>{t('heroPill')}</span>
      </div>

      <h1 className="hero-main-title">
        {t('heroTitlePart1')}{' '}
        <span className="gradient-pes-text">{t('heroTitlePart2')}</span>{' '}
        {t('heroTitlePart3')}
      </h1>

      <p className="hero-desc">{t('heroDesc')}</p>

      <div className="hero-buttons-container">
        <button onClick={onBuyClick} id="buy-main-button" className="btn-hero-primary-buy">
          <span>⚡</span>
          <span>{t('heroBuyNow')}</span>
          <span className="btn-hero-sub-tag">{t('heroSelectDevice')}</span>
        </button>

        <a href="#store-section" className="btn-hero-secondary">
          <span>{t('heroBrowseAccounts')}</span>
          <span>👇</span>
        </a>
      </div>

      {/* Quick Stats */}
      <div className="stats-grid-wrapper">
        <div className="stat-item-box">
          <div className="stat-icon">🏆</div>
          <div className="stat-value">+{totalAccounts}</div>
          <div className="stat-label">{t('statGuaranteedAccounts')}</div>
        </div>
        <div className="stat-item-box">
          <div className="stat-icon">⭐</div>
          <div className="stat-value">4.9/5</div>
          <div className="stat-label">{t('statCustomerRating')}</div>
        </div>
        <div className="stat-item-box">
          <div className="stat-icon">⚡</div>
          <div className="stat-value">{t('statThreeMins')}</div>
          <div className="stat-label">{t('statInstantDelivery')}</div>
        </div>
        <div className="stat-item-box">
          <div className="stat-icon">💳</div>
          <div className="stat-value">{t('statPaymentMethods')}</div>
          <div className="stat-label">{t('statInstantCheckout')}</div>
        </div>
      </div>
    </section>
  );
}
