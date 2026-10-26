import { useState } from 'react';
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
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`account-square-card ${hovered ? 'card-hovered' : ''}`}
      style={{ opacity: account.isAvailable ? 1 : 0.8 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Neon border glow on hover */}
      <div className="card-glow-border" />

      {/* Image */}
      <div className="card-image-box">
        <img src={account.imageUrl} alt={account.title} className="card-thumb-img" loading="lazy" />
        <div className="card-img-overlay" />

        {/* Sold Banner */}
        {!account.isAvailable ? (
          <div className="card-sold-banner">
            <span className="sold-icon">🔒</span>
            <span>{t('soldBadge')}</span>
          </div>
        ) : (
          account.badge && (
            <div className="card-badge-top-right">
              <span className="promo-badge">{account.badge}</span>
            </div>
          )
        )}

        {/* Platform Badge */}
        <div className="card-badge-top-left" style={{ top: account.isAvailable ? '12px' : '44px' }}>
          <span className={`platform-badge ${account.platform}`}>
            <span>{account.platform === 'android' ? '🤖' : '🍏'}</span>
            <span>{account.platform === 'android' ? 'Android' : 'iOS'}</span>
          </span>
        </div>

        {/* Hovering scan line */}
        {hovered && <div className="card-scan-line" />}
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
                <img src="/efootball-coin.png" alt="eFootball Coin" className="coin-img-icon" />
                <span>{account.coins}</span>
              </div>
            </div>
          </div>

          <h3 className="card-account-title">{account.title}</h3>

          {/* Epic Count */}
          <div className="card-specs-row" style={{ gridTemplateColumns: '1fr' }}>
            <div className="spec-mini-badge" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 12px' }}>
              <span className="spec-name">{t('epicLegends')}</span>
              <span className="spec-val-cyan" style={{ fontSize: '13px', fontWeight: '800' }}>
                ⭐ {account.epicCount} {t('playerUnit')}
              </span>
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
              <span className="btn-order-spark">⚡</span>
              <span>{t('orderAccount')}</span>
            </button>
          ) : (
            <button disabled className="btn-card-sold">
              🔒 {t('soldOutButton')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
