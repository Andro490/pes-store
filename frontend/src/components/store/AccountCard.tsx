import { useLanguage } from '../../i18n/LanguageContext';
import type { PesAccount } from '../../types';

interface AccountCardProps {
  account: PesAccount;
  onPreview: (account: PesAccount) => void;
  onOrder: (account: PesAccount) => void;
}

export function AccountCard({ account, onPreview, onOrder }: AccountCardProps) {
  const { t, formatPrice, formatPriceParts } = useLanguage();
  const { amount, unit, prefix } = formatPriceParts(account.price);

  return (
    <div className="account-square-card" style={{ opacity: account.isAvailable ? 1 : 0.85 }}>
      {/* Image */}
      <div className="card-image-box">
        <img src={account.imageUrl} alt={account.title} className="card-thumb-img" loading="lazy" />
        <div className="card-img-overlay" />

        {/* Sold / Badge banner */}
        {!account.isAvailable ? (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              background: 'rgba(239, 68, 68, 0.9)',
              color: '#fff',
              textAlign: 'center',
              padding: '6px',
              fontWeight: 900,
              fontSize: '13px',
              zIndex: 10,
              boxShadow: '0 4px 14px rgba(239, 68, 68, 0.5)',
            }}
          >
            {t('soldBadge')}
          </div>
        ) : (
          account.badge && (
            <div className="card-badge-top-right">
              <span className="promo-badge">{account.badge}</span>
            </div>
          )
        )}

        {/* Platform badge */}
        <div className="card-badge-top-left" style={{ top: account.isAvailable ? '12px' : '38px' }}>
          <span className={`platform-badge ${account.platform}`}>
            <span>{account.platform === 'android' ? '🤖' : '🍏'}</span>
            <span>{account.platform === 'android' ? 'Android' : 'iOS'}</span>
          </span>
        </div>

        {/* Team Strength overlay */}
        <div className="card-strength-overlay">
          <span className="strength-label">⚡ {t('teamStrength')}</span>
          <span className="strength-num">{account.teamStrength}</span>
        </div>
      </div>

      {/* Content */}
      <div className="card-content-body">
        <div>
          {/* Price Row */}
          <div className="card-price-row">
            <div>
              <div className="price-currency-tag">{t('priceLabel')}</div>
              <div className="price-main-block">
                {prefix && (
                  <span style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--accent-emerald)' }}>
                    {unit}
                  </span>
                )}
                <span className="price-current-num">{amount}</span>
                {!prefix && (
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--accent-emerald)' }}>
                    {unit}
                  </span>
                )}
                {account.oldPrice && (
                  <span className="price-old-num" style={{ marginInlineStart: '6px' }}>
                    {formatPrice(account.oldPrice)}
                  </span>
                )}
              </div>
            </div>

            <div className="coins-pill-box">
              <div className="coins-sub-txt">{t('coinsBalance')}</div>
              <div className="coins-val-num">
                <span>🪙</span>
                <span>{account.coins}</span>
              </div>
            </div>
          </div>

          <h3 className="card-account-title">{account.title}</h3>

          {/* Specs */}
          <div className="card-specs-row">
            <div className="spec-mini-badge">
              <span className="spec-name">{t('epicLegends')}</span>
              <span className="spec-val-cyan">
                ⭐ {account.epicCount} {t('playerUnit')}
              </span>
            </div>
            <div className="spec-mini-badge">
              <span className="spec-name">{t('gpBalance')}</span>
              <span className="spec-val-indigo">💰 {account.gp}</span>
            </div>
          </div>

          {/* Players */}
          <div className="players-tag-container">
            <div className="players-sub-heading">{t('squadHighlights')}</div>
            <div className="players-flex-tags">
              {account.highlightPlayers.slice(0, 3).map((player, idx) => (
                <span key={idx} className="player-single-tag">
                  {player}
                </span>
              ))}
              {account.highlightPlayers.length > 3 && (
                <span className="player-more-tag">+{account.highlightPlayers.length - 3}</span>
              )}
            </div>
          </div>

          {/* Login method */}
          <div className="login-method-notice">
            <span className="dot-green" />
            <span>{account.loginMethod}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="card-actions-wrapper">
          <button onClick={() => onPreview(account)} className="btn-card-preview">
            <span>🔍</span>
            <span>{t('previewDetails')}</span>
          </button>

          {account.isAvailable ? (
            <button onClick={() => onOrder(account)} className="btn-card-order">
              <span>⚡</span>
              <span>{t('orderAccount')}</span>
            </button>
          ) : (
            <button
              disabled
              style={{
                padding: '10px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--text-dim)',
                fontSize: '13px',
                fontWeight: 700,
                border: '1px solid var(--border-light)',
                cursor: 'not-allowed',
              }}
            >
              {t('soldOutButton')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
