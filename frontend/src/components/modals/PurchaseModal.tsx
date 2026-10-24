import { useLanguage } from '../../i18n/LanguageContext';
import type { PesAccount } from '../../types';

// TODO: move to env / config
const WHATSAPP_NUMBER = '201000000000';

interface PurchaseModalProps {
  account: PesAccount;
  isPayingWithPaymob: boolean;
  paymobResponseData: any;
  onClose: () => void;
  onPayWithPaymob: () => void;
}

export function PurchaseModal({
  account,
  isPayingWithPaymob,
  paymobResponseData,
  onClose,
  onPayWithPaymob,
}: PurchaseModalProps) {
  const { t, isRTL, formatPrice } = useLanguage();

  const whatsappText = t('whatsappMessage', {
    title: account.title,
    id: account.id,
    price: formatPrice(account.price),
    currency: '',
    platform: account.platform,
  });

  return (
    <div className="modal-backdrop-overlay">
      <div className="device-modal-card" style={{ maxWidth: '480px' }}>
        <button onClick={onClose} className="btn-modal-close">✕</button>

        {/* Success icon */}
        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.2)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            margin: '0 auto 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
          }}
        >
          ✅
        </div>

        <h3 className="modal-heading">{t('orderModalTitle')}</h3>
        <p className="modal-subtext" style={{ marginBottom: '16px' }}>
          {t('orderSelectedPrefix')}{' '}
          <strong style={{ color: '#38bdf8' }}>{account.title}</strong>
        </p>

        {/* Order details card */}
        <div
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border-light)',
            borderRadius: '16px',
            padding: '16px',
            marginBottom: '20px',
            textAlign: isRTL ? 'right' : 'left',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
            <span style={{ color: 'var(--text-muted)' }}>{t('orderAccountId')}</span>
            <span style={{ fontWeight: 'bold', color: '#38bdf8', fontFamily: 'monospace' }}>{account.id}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
            <span style={{ color: 'var(--text-muted)' }}>{t('orderDeviceOS')}</span>
            <span style={{ fontWeight: 'bold', color: '#fff' }}>
              {account.platform === 'android' ? '🤖 Android' : '🍏 iOS'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
            <span style={{ color: 'var(--text-muted)' }}>{t('orderAmountRequired')}</span>
            <span
              style={{
                fontWeight: '900',
                color: 'var(--accent-emerald)',
                fontSize: '18px',
                fontFamily: 'Outfit, sans-serif',
              }}
            >
              {account.price} {t('currency')}
            </span>
          </div>
        </div>

        {/* Paymob button */}
        <button
          onClick={onPayWithPaymob}
          disabled={isPayingWithPaymob}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            width: '100%',
            padding: '14px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
            color: '#030712',
            fontWeight: '900',
            fontSize: '15px',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 6px 20px rgba(6, 182, 212, 0.4)',
            marginBottom: '10px',
          }}
        >
          <span>💳</span>
          <span>{isPayingWithPaymob ? t('paymobConnecting') : t('payWithPaymob')}</span>
        </button>

        {/* Paymob response */}
        {paymobResponseData && (
          <div
            style={{
              background: 'rgba(6, 182, 212, 0.1)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              borderRadius: '12px',
              padding: '14px',
              marginBottom: '14px',
              fontSize: '13px',
              color: '#38bdf8',
              textAlign: isRTL ? 'right' : 'left',
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '6px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>✅</span>
              <span>{t('paymobReadyTitle')}</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px' }}>
              {t('orderIdLabel')} <strong style={{ color: '#fff' }}>#{paymobResponseData.orderId}</strong>
            </div>

            {paymobResponseData.checkoutUrl && (
              <a
                href={paymobResponseData.checkoutUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                  color: '#ffffff',
                  fontWeight: '800',
                  fontSize: '13px',
                  textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)',
                }}
              >
                <span>🚀</span>
                <span>{t('paymobProceedBtn')}</span>
              </a>
            )}
          </div>
        )}

        {/* WhatsApp button */}
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappText)}`}
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            width: '100%',
            padding: '13px',
            borderRadius: '14px',
            background: '#10b981',
            color: '#030712',
            fontWeight: '800',
            fontSize: '14px',
            textDecoration: 'none',
            boxShadow: '0 4px 16px var(--accent-emerald-glow)',
            marginBottom: '12px',
          }}
        >
          <span>💬</span>
          <span>{t('whatsappBtn')}</span>
        </a>

        <button onClick={onClose} className="btn-all-devices-link">
          {t('backToStoreBtn')}
        </button>
      </div>
    </div>
  );
}
