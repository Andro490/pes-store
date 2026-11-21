import { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import type { PesAccount } from '../../types';

interface PurchaseModalProps {
  account: PesAccount;
  onClose: () => void;
  onPurchaseSuccess?: () => void;
}

const TELEGRAM_PHONE = '201144231586';
const TELEGRAM_URL = `https://t.me/+${TELEGRAM_PHONE}`;

export function PurchaseModal({
  account,
  onClose,
}: PurchaseModalProps) {
  const { t, isRTL, formatPrice } = useLanguage();
  const [copied, setCopied] = useState(false);

  const handleTelegramClick = () => {
    const orderDetails = `مرحباً 👋 أريد شراء حساب eFootball التالي:
🎮 الحساب: ${account.title}
💰 السعر: ${formatPrice(account.price)}
🪙 الكوينز: ${account.coins}
📱 المنصة: ${account.platform === 'android' ? 'Android' : 'iOS'}
🆔 كود الحساب: ${account.id}`;

    // Copy to clipboard
    try {
      navigator.clipboard.writeText(orderDetails);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // ignore clipboard error
    }

    // Open Telegram chat directly with the phone number
    window.open(TELEGRAM_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="modal-backdrop-overlay">
      <div className="device-modal-card" style={{ maxWidth: '500px', textAlign: isRTL ? 'right' : 'left' }}>
        <button onClick={onClose} className="btn-modal-close">✕</button>

        {/* Header icon */}
        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'rgba(34, 158, 217, 0.15)',
            border: '2px solid rgba(34, 158, 217, 0.4)',
            margin: '0 auto 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            boxShadow: '0 0 25px rgba(34, 158, 217, 0.3)',
          }}
        >
          ✈️
        </div>

        <h3 className="modal-heading" style={{ textAlign: 'center', fontSize: '20px', marginBottom: '6px' }}>
          {t('orderModalTitle')}
        </h3>
        <p className="modal-subtext" style={{ marginBottom: '16px', textAlign: 'center', color: '#cbd5e1' }}>
          {t('orderSelectedPrefix')}{' '}
          <strong style={{ color: '#38bdf8' }}>{account.title}</strong>
        </p>

        {/* Order details card */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-light)',
            borderRadius: '16px',
            padding: '16px',
            marginBottom: '16px',
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

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
            <span style={{ color: 'var(--text-muted)' }}>{t('modalCoins')}:</span>
            <span style={{ fontWeight: 'bold', color: '#fde68a' }}>
              🪙 {account.coins}
            </span>
          </div>

          {account.stockCount !== undefined && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-muted)' }}>المخزون المتوفر:</span>
              <span style={{ fontWeight: 'bold', color: account.stockCount > 0 ? '#34d399' : '#f87171' }}>
                {account.stockCount > 0 ? `${account.stockCount} حساب جاهز للتسليم ⚡` : 'نفد المخزون 🔴'}
              </span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ color: 'var(--text-muted)' }}>{t('orderAmountRequired')}</span>
            <span
              style={{
                fontWeight: '900',
                color: 'var(--accent-emerald)',
                fontSize: '19px',
                fontFamily: 'Outfit, sans-serif',
              }}
            >
              {formatPrice(account.price)}
            </span>
          </div>
        </div>

        {/* Telegram Direct Notice Banner */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            padding: '12px 14px',
            borderRadius: '12px',
            background: 'rgba(34, 158, 217, 0.1)',
            border: '1px solid rgba(34, 158, 217, 0.3)',
            color: '#7dd3fc',
            fontSize: '12px',
            marginBottom: '16px',
            lineHeight: 1.6,
          }}
        >
          <span style={{ fontSize: '18px' }}>💬</span>
          <div>
            <strong style={{ color: '#38bdf8', display: 'block', marginBottom: '2px' }}>
              الشراء المباشر عبر تيليجرام:
            </strong>
            عند الضغط أدناه سيتم نسخ كود وتفاصيل الحساب تلقائياً وفتح محادثة تيليجرام مباشرة مع الإدارة على الرقم <span dir="ltr" style={{ fontWeight: 'bold', color: '#fff' }}>+20 114 423 1586</span> لإتمام الشراء واستلام الحساب فوراً.
          </div>
        </div>

        {/* Copy confirmation toast */}
        {copied && (
          <div
            style={{
              padding: '10px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid #10b981',
              color: '#34d399',
              fontSize: '12px',
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: '12px',
            }}
          >
            ✓ تم نسخ تفاصيل الحساب إلى الحافظة! جاري فتح تيليجرام...
          </div>
        )}

        {/* ─── MAIN BUTTON: تواصل للشراء عبر تيليجرام ─── */}
        <button
          onClick={handleTelegramClick}
          disabled={!account.isAvailable}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            width: '100%',
            padding: '15px',
            borderRadius: '14px',
            background: account.isAvailable
              ? 'linear-gradient(135deg, #0088cc, #229ED9)'
              : 'rgba(255,255,255,0.05)',
            color: account.isAvailable ? '#ffffff' : '#64748b',
            fontWeight: '900',
            fontSize: '15px',
            border: 'none',
            cursor: account.isAvailable ? 'pointer' : 'not-allowed',
            boxShadow: account.isAvailable ? '0 6px 20px rgba(0, 136, 204, 0.4)' : 'none',
            marginBottom: '10px',
            transition: 'all 0.2s ease',
          }}
        >
          <span style={{ fontSize: '20px' }}>✈️</span>
          <span>تواصل للشراء عبر تيليجرام (01144231586)</span>
        </button>

        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '10px',
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          إلغاء والعودة للمتجر
        </button>
      </div>
    </div>
  );
}
