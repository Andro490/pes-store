import { useLanguage } from '../../i18n/LanguageContext';
import type { PesAccount } from '../../types';

interface AccountDetailModalProps {
  account: PesAccount;
  onClose: () => void;
  onOrder: (account: PesAccount) => void;
}

export function AccountDetailModal({ account, onClose, onOrder }: AccountDetailModalProps) {
  const { t, formatPrice } = useLanguage();

  return (
    <div className="modal-backdrop-overlay">
      <div className="detail-modal-card">
        <div className="detail-modal-header">
          <img src={account.imageUrl} alt={account.title} className="detail-modal-img" />
          <button onClick={onClose} className="btn-modal-close">✕</button>
        </div>

        <div className="detail-modal-body">
          {/* Title + Price */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#fff' }}>{account.title}</h3>
            <div
              style={{
                fontSize: '24px',
                fontWeight: '900',
                color: 'var(--accent-emerald)',
                fontFamily: 'Outfit, sans-serif',
              }}
            >
              {formatPrice(account.price)}
            </div>
          </div>

          {/* Stats */}
          <div className="detail-stats-grid">
            <div className="detail-stat-box">
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t('modalCoins')}</div>
              <div style={{ fontSize: '16px', fontWeight: '900', color: '#ffffff' }}>🪙 {account.coins}</div>
            </div>
            <div className="detail-stat-box">
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t('modalEpic')}</div>
              <div style={{ fontSize: '16px', fontWeight: '900', color: '#38bdf8' }}>⭐ {account.epicCount}</div>
            </div>
          </div>

          {/* Details */}
          <div className="detail-desc-box">
            <div style={{ fontWeight: '700', marginBottom: '6px', color: '#fff' }}>
              {t('modalExtraDetails')}
            </div>
            {account.details}
          </div>

          {/* Players */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px' }}>
              {t('modalSquadStars')}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {account.highlightPlayers.map((player, idx) => (
                <span key={idx} className="player-single-tag" style={{ padding: '4px 10px', fontSize: '12px' }}>
                  ⚽ {player}
                </span>
              ))}
            </div>
          </div>

          {/* Security banner */}
          <div className="detail-security-banner">
            <span style={{ fontSize: '20px' }}>🛡️</span>
            <span>
              <strong>{t('modalDeliveryMethod')} </strong>
              {account.loginMethod}. {t('modalDeliveryDetails')}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="detail-modal-footer">
          <button onClick={onClose} className="btn-hero-secondary" style={{ padding: '8px 18px', fontSize: '13px' }}>
            {t('modalClose')}
          </button>

          {account.isAvailable ? (
            <button
              onClick={() => {
                onClose();
                onOrder(account);
              }}
              className="btn-card-order"
              style={{ padding: '10px 24px', fontSize: '14px' }}
            >
              {t('modalConfirmOrder')}
            </button>
          ) : (
            <span style={{ color: '#f87171', fontWeight: 800, fontSize: '13px' }}>
              {t('modalAccountSold')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
