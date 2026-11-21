import { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import type { PesAccount } from '../../types';

interface PurchaseModalProps {
  account: PesAccount;
  onClose: () => void;
  onPurchaseSuccess?: () => void;
}

const TELEGRAM_USERNAME = 'joker_19011';
const WHATSAPP_PHONE = '201288152515';

export function PurchaseModal({
  account,
  onClose,
}: PurchaseModalProps) {
  const { t, isRTL, formatPrice } = useLanguage();
  const [copied, setCopied] = useState<string | null>(null);

  const getOrderDetails = () => {
    const discountText = account.oldPrice && account.oldPrice > account.price
      ? ` (بعد خصم ${Math.round(((account.oldPrice - account.price) / account.oldPrice) * 100)}% - السعر الأصلي ${formatPrice(account.oldPrice)})`
      : '';

    return `مرحباً 👋 أريد شراء حساب eFootball التالي:
🪙 عدد الكوينز: ${account.coins} كوين
🎮 الحساب: ${account.title}
💰 السعر: ${formatPrice(account.price)}${discountText}
📱 يعمل على: Android + iOS
🆔 كود الحساب: ${account.id}`;
  };

  const handleTelegramClick = () => {
    const orderDetails = getOrderDetails();

    // Copy to clipboard as backup
    try {
      navigator.clipboard.writeText(orderDetails);
      setCopied('telegram');
      setTimeout(() => setCopied(null), 3000);
    } catch {
      // ignore clipboard error
    }

    // Open Telegram chat directly with pre-filled message using username
    const telegramUrl = `https://t.me/${TELEGRAM_USERNAME}?text=${encodeURIComponent(orderDetails)}`;
    window.open(telegramUrl, '_blank', 'noopener,noreferrer');
  };

  const handleWhatsAppClick = () => {
    const orderDetails = getOrderDetails();

    // Copy to clipboard as backup
    try {
      navigator.clipboard.writeText(orderDetails);
      setCopied('whatsapp');
      setTimeout(() => setCopied(null), 3000);
    } catch {
      // ignore clipboard error
    }

    // Open WhatsApp chat directly with pre-filled message
    const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(orderDetails)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
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
              📱 متاح للجهازين (Android + iOS)
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
            <span style={{ color: 'var(--text-muted)' }}>{t('modalCoins')}:</span>
            <span style={{ fontWeight: 'bold', color: '#fde68a' }}>
              🪙 {account.coins}
            </span>
          </div>



          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)' }}>{t('orderAmountRequired')}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {account.oldPrice && account.oldPrice > account.price && (
                <span
                  style={{
                    textDecoration: 'line-through',
                    color: '#64748b',
                    fontSize: '14px',
                  }}
                >
                  {formatPrice(account.oldPrice)}
                </span>
              )}
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
              {account.oldPrice && account.oldPrice > account.price && (
                <span
                  style={{
                    background: 'linear-gradient(135deg, #ea580c, #dc2626)',
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: 900,
                    padding: '2px 6px',
                    borderRadius: '6px',
                  }}
                >
                  خصم {Math.round(((account.oldPrice - account.price) / account.oldPrice) * 100)}%
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Contact Direct Notice Banner */}
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
              {isRTL ? 'الشراء المباشر الفوري:' : 'Direct Instant Purchase:'}
            </strong>
            {isRTL
              ? 'اختر وسيلة التواصل المناسبة لك أدناه؛ سيتم نسخ تفاصيل الحساب وفتح المحادثة تلقائياً لإتمام الشراء واستلام الحساب فوراً.'
              : 'Choose your preferred contact method below; account details will be copied and chat opened automatically to complete your purchase.'}
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
            {copied === 'whatsapp'
              ? (isRTL ? '✓ تم نسخ تفاصيل الحساب إلى الحافظة! جاري فتح واتساب...' : '✓ Order details copied! Opening WhatsApp...')
              : (isRTL ? '✓ تم نسخ تفاصيل الحساب إلى الحافظة! جاري فتح تيليجرام...' : '✓ Order details copied! Opening Telegram...')}
          </div>
        )}

        {/* ─── BUTTON 1: تواصل للشراء عبر تيليجرام ─── */}
        <button
          onClick={handleTelegramClick}
          disabled={!account.isAvailable}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            width: '100%',
            padding: '14px',
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
          <span>{isRTL ? 'تواصل للشراء عبر تيليجرام' : 'Contact to Buy via Telegram'}</span>
        </button>

        {/* ─── BUTTON 2: تواصل للشراء عبر واتساب ─── */}
        <button
          onClick={handleWhatsAppClick}
          disabled={!account.isAvailable}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            width: '100%',
            padding: '14px',
            borderRadius: '14px',
            background: account.isAvailable
              ? 'linear-gradient(135deg, #25D366, #128C7E)'
              : 'rgba(255,255,255,0.05)',
            color: account.isAvailable ? '#ffffff' : '#64748b',
            fontWeight: '900',
            fontSize: '15px',
            border: 'none',
            cursor: account.isAvailable ? 'pointer' : 'not-allowed',
            boxShadow: account.isAvailable ? '0 6px 20px rgba(37, 211, 102, 0.35)' : 'none',
            marginBottom: '10px',
            transition: 'all 0.2s ease',
          }}
        >
          <span style={{ fontSize: '20px' }}>💬</span>
          <span>{isRTL ? 'تواصل للشراء عبر واتساب' : 'Contact to Buy via WhatsApp'}</span>
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
          {isRTL ? 'إلغاء والعودة للمتجر' : 'Cancel and return to store'}
        </button>
      </div>
    </div>
  );
}
