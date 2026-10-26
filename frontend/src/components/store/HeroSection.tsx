import { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';

interface HeroSectionProps {
  totalAccounts: number;
  onBuyClick: () => void;
}

export function HeroSection({ totalAccounts, onBuyClick }: HeroSectionProps) {
  const { t } = useLanguage();
  const [isCardHovered, setIsCardHovered] = useState(false);

  return (
    <section className="hero-section" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Stadium Spotlight Beam FX */}
      <div className="stadium-spotlight-beam" />

      {/* Official PES Tournament Badge */}
      <div
        className="hero-pill-tag"
        style={{
          background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.15), rgba(148, 163, 184, 0.1))',
          border: '1px solid rgba(220, 38, 38, 0.4)',
          boxShadow: '0 0 22px rgba(220, 38, 38, 0.25)',
          padding: '8px 22px',
        }}
      >
        <span className="pulse-dot" style={{ background: '#ef4444', boxShadow: '0 0 14px #ef4444' }} />
        <span style={{ fontWeight: 800, letterSpacing: '0.5px', color: '#f1f5f9' }}>
          ⚽ eFootball™ 2026 OFFICIAL MARKETPLACE
        </span>
      </div>

      {/* Main Grid: Content + 3D Floating Epic Card */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr)',
          gap: '36px',
          alignItems: 'center',
          textAlign: 'right',
          marginTop: '10px',
          marginBottom: '48px',
        }}
        className="hero-main-grid"
      >
        {/* Left Side (Text & CTAs) */}
        <div>
          <h1
            className="hero-main-title"
            style={{
              textAlign: 'right',
              fontSize: 'clamp(32px, 5vw, 54px)',
              lineHeight: 1.2,
              marginBottom: '16px',
            }}
          >
            {t('heroTitlePart1')}{' '}
            <span
              className="gradient-pes-text"
              style={{
                background: 'linear-gradient(135deg, #ffffff 15%, #f87171 45%, #ef4444 75%, #dc2626 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 0 30px rgba(239, 68, 68, 0.4)',
              }}
            >
              {t('heroTitlePart2')}
            </span>{' '}
            {t('heroTitlePart3')}
          </h1>

          <p
            className="hero-desc"
            style={{
              textAlign: 'right',
              margin: '0 0 28px 0',
              fontSize: '16px',
              color: '#94a3b8',
              lineHeight: 1.8,
            }}
          >
            {t('heroDesc')}
          </p>

          {/* CTA Buttons */}
          <div
            className="hero-buttons-container"
            style={{
              justifyContent: 'flex-start',
              margin: '0 0 32px 0',
              gap: '14px',
            }}
          >
            <button
              onClick={onBuyClick}
              id="buy-main-button"
              className="btn-hero-primary-buy"
              style={{
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #991b1b 100%)',
                color: '#ffffff',
                boxShadow: '0 8px 32px rgba(220, 38, 38, 0.55), 0 0 20px rgba(239, 68, 68, 0.35)',
                border: '1px solid rgba(248, 113, 113, 0.6)',
              }}
            >
              <span style={{ fontSize: '22px' }}>⚡</span>
              <span>{t('heroBuyNow')}</span>
              <span
                className="btn-hero-sub-tag"
                style={{
                  background: 'rgba(0, 0, 0, 0.45)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#ffffff',
                }}
              >
                {t('heroSelectDevice')}
              </span>
            </button>

            <a
              href="#store-section"
              className="btn-hero-secondary"
              style={{
                border: '1px solid rgba(148, 163, 184, 0.3)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#f1f5f9',
              }}
            >
              <span>{t('heroBrowseAccounts')}</span>
              <span>👇</span>
            </a>
          </div>

          {/* Trust Ticker Chips */}
          <div
            style={{
              display: 'flex',
              gap: '10px',
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: '#34d399',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '4px 12px',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>✓</span> تسليم فوري في 3 ثوانٍ
            </span>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: '#f1f5f9',
                background: 'rgba(148, 163, 184, 0.12)',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                padding: '4px 12px',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>🛡️</span> ضمان كامل Konami ID
            </span>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: '#f87171',
                background: 'rgba(220, 38, 38, 0.12)',
                border: '1px solid rgba(220, 38, 38, 0.3)',
                padding: '4px 12px',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>💳</span> محافظ وفيزا Paymob
            </span>
          </div>
        </div>

        {/* Right Side: 3D Holographic eFootball Showcase Card */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            perspective: '1200px',
          }}
          className="hero-card-col"
        >
          <div
            onMouseEnter={() => setIsCardHovered(true)}
            onMouseLeave={() => setIsCardHovered(false)}
            style={{
              position: 'relative',
              width: '320px',
              borderRadius: '24px',
              background: 'linear-gradient(145deg, #12141c 0%, #08090d 100%)',
              border: isCardHovered
                ? '2px solid #ef4444'
                : '2px solid rgba(220, 38, 38, 0.5)',
              boxShadow: isCardHovered
                ? '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 45px rgba(239, 68, 68, 0.45)'
                : '0 20px 50px rgba(0, 0, 0, 0.75), 0 0 30px rgba(220, 38, 38, 0.25)',
              transform: isCardHovered
                ? 'perspective(1200px) rotateY(-2deg) rotateX(2deg) translateY(-8px) scale(1.03)'
                : 'perspective(1200px) rotateY(-8deg) rotateX(4deg) translateY(0px)',
              transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
              overflow: 'hidden',
              cursor: 'pointer',
            }}
            onClick={onBuyClick}
          >
            {/* Holographic Sweep Light */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(115deg, transparent 30%, rgba(239, 68, 68, 0.2) 50%, transparent 70%)',
                transform: isCardHovered ? 'translateX(100%)' : 'translateX(-100%)',
                transition: 'transform 0.8s ease',
                pointerEvents: 'none',
                zIndex: 6,
              }}
            />

            {/* Top Epic Card Header */}
            <div
              style={{
                position: 'relative',
                height: '240px',
                overflow: 'hidden',
                background: '#090a0f',
              }}
            >
              <img
                src="https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&auto=format&fit=crop&q=80"
                alt="eFootball Card"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: isCardHovered ? 'scale(1.08)' : 'scale(1)',
                  transition: 'transform 0.5s ease',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, #08090d 0%, transparent 60%)',
                }}
              />

              {/* Big Time / Epic Badge */}
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: '#ffffff',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 900,
                  letterSpacing: '1px',
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.45)',
                }}
              >
                ⭐ EPIC BIG TIME
              </div>

              {/* Platform */}
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  background: 'rgba(0, 0, 0, 0.75)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(148, 163, 184, 0.35)',
                  color: '#e2e8f0',
                  padding: '4px 10px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: 800,
                }}
              >
                🤖 Android + iOS
              </div>
            </div>

            {/* Card Body */}
            <div style={{ padding: '16px 18px', textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#f87171', fontWeight: 800, marginBottom: '4px' }}>
                ⭐ تشكيلة أساطير خارقة
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#fff', marginBottom: '12px' }}>
                ميسي البيج تايم + رونالدو 102 إبيك
              </h3>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  borderRadius: '12px',
                  padding: '10px',
                  marginBottom: '14px',
                  border: '1px solid rgba(220, 38, 38, 0.2)',
                }}
              >
                <div>
                  <div style={{ fontSize: '10px', color: '#fbbf24', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <img src="/efootball-coin.png" alt="coin" style={{ width: '12px', height: '12px', objectFit: 'contain' }} />
                    رصيد الكوينز
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 900, color: '#fde68a', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    6,500 كوينز
                    <img src="/efootball-coin.png" alt="eFootball Coin" style={{ width: '22px', height: '22px', objectFit: 'contain', filter: 'drop-shadow(0 0 5px rgba(255,215,0,0.7))', animation: 'coinBounce 1.8s ease-in-out infinite' }} />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: '#94a3b8' }}>أساطير الإبيك</div>
                  <div style={{ fontSize: '14px', fontWeight: 900, color: '#ef4444' }}>⭐ 19 أسطورة</div>
                </div>
              </div>

              {/* Action Button inside showcase */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: '#ffffff',
                  padding: '10px',
                  borderRadius: '12px',
                  textAlign: 'center',
                  fontWeight: 900,
                  fontSize: '13px',
                  boxShadow: '0 4px 16px rgba(220, 38, 38, 0.45)',
                }}
              >
                ⚡ احصل على حساب مثل هذا الآن
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="stats-grid-wrapper">
        <div className="stat-item-box" style={{ border: '1px solid rgba(220, 38, 38, 0.25)' }}>
          <div className="stat-icon">🏆</div>
          <div className="stat-value" style={{ color: '#ef4444' }}>+{totalAccounts}</div>
          <div className="stat-label">{t('statGuaranteedAccounts')}</div>
        </div>
        <div className="stat-item-box" style={{ border: '1px solid rgba(148, 163, 184, 0.25)' }}>
          <div className="stat-icon">⭐</div>
          <div className="stat-value" style={{ color: '#f1f5f9' }}>4.9/5</div>
          <div className="stat-label">{t('statCustomerRating')}</div>
        </div>
        <div className="stat-item-box" style={{ border: '1px solid rgba(16, 185, 129, 0.22)' }}>
          <div className="stat-icon">⚡</div>
          <div className="stat-value" style={{ color: '#34d399' }}>{t('statThreeMins')}</div>
          <div className="stat-label">{t('statInstantDelivery')}</div>
        </div>
        <div className="stat-item-box" style={{ border: '1px solid rgba(220, 38, 38, 0.25)' }}>
          <div className="stat-icon">💳</div>
          <div className="stat-value" style={{ color: '#f87171' }}>{t('statPaymentMethods')}</div>
          <div className="stat-label">{t('statInstantCheckout')}</div>
        </div>
      </div>
    </section>
  );
}
