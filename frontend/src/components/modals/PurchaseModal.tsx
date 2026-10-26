import { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import type { PesAccount, DeliveredAccount } from '../../types';

// TODO: move to env / config
const WHATSAPP_NUMBER = '201000000000';

interface PurchaseModalProps {
  account: PesAccount;
  isPayingWithPaymob: boolean;
  paymobResponseData: any;
  paymobError?: string | null;
  initialDeliveredData?: DeliveredAccount | null;
  onClose: () => void;
  onPayWithPaymob: () => void;
  onPurchaseSuccess?: () => void;
}

export function PurchaseModal({
  account,
  isPayingWithPaymob,
  paymobResponseData: _paymobResponseData,
  paymobError,
  initialDeliveredData,
  onClose,
  onPayWithPaymob,
}: PurchaseModalProps) {
  const { t, isRTL, formatPrice } = useLanguage();

  const [deliveredData] = useState<DeliveredAccount | null>(initialDeliveredData || null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const whatsappText = t('whatsappMessage', {
    title: account.title,
    id: account.id,
    price: formatPrice(account.price),
    currency: '',
    platform: account.platform,
  });

  return (
    <div className="modal-backdrop-overlay">
      <div className="device-modal-card" style={{ maxWidth: '520px', textAlign: isRTL ? 'right' : 'left' }}>
        <button onClick={onClose} className="btn-modal-close">✕</button>

        {/* ════════════════════════════════════════════════════════════════
            CASE 1: ACCOUNT DELIVERED SUCCESSFULLY (بعد تأكيد دفع Paymob)
        ════════════════════════════════════════════════════════════════ */}
        {deliveredData ? (
          <div>
            {/* Header Icon */}
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.2)',
                border: '2px solid rgba(16, 185, 129, 0.5)',
                margin: '0 auto 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '30px',
                boxShadow: '0 0 25px rgba(16, 185, 129, 0.4)',
              }}
            >
              🎉
            </div>

            <h3 className="modal-heading" style={{ color: '#34d399', textAlign: 'center', fontSize: '20px', marginBottom: '6px' }}>
              تم الشراء وتسليم الحساب بنجاح!
            </h3>
            <p className="modal-subtext" style={{ textAlign: 'center', marginBottom: '18px', color: '#cbd5e1' }}>
              تم سحب الحساب وحذفه من المخزون تلقائياً، وهو الآن ملكك وحدك 🔒
            </p>

            {/* Credentials Card */}
            <div
              style={{
                background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9))',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: '16px',
                padding: '18px',
                marginBottom: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              {/* Account title */}
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                  الحساب المشترى:
                </span>
                <span style={{ fontWeight: 'bold', color: '#fff', fontSize: '14px' }}>
                  {deliveredData.accountTitle}
                </span>
              </div>

              {/* Email Field */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#38bdf8', display: 'block', marginBottom: '6px' }}>
                  ✉️ البريد الإلكتروني (Email):
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    readOnly
                    value={deliveredData.email}
                    dir="ltr"
                    className="search-input-field"
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '13px',
                      background: 'rgba(0,0,0,0.4)',
                      color: '#34d399',
                      padding: '8px 12px',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(deliveredData.email, 'email')}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '10px',
                      background: copiedField === 'email' ? '#10b981' : 'rgba(56, 189, 248, 0.15)',
                      color: copiedField === 'email' ? '#030712' : '#38bdf8',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      fontWeight: 'bold',
                      fontSize: '12px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {copiedField === 'email' ? '✓ تم النسخ' : '📋 نسخ'}
                  </button>
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#38bdf8' }}>
                    🔑 كلمة المرور (Password):
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '11px', cursor: 'pointer' }}
                  >
                    {showPassword ? 'إخفاء 🙈' : 'إظهار 👁️'}
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    readOnly
                    value={deliveredData.password}
                    dir="ltr"
                    className="search-input-field"
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '13px',
                      background: 'rgba(0,0,0,0.4)',
                      color: '#fbbf24',
                      padding: '8px 12px',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(deliveredData.password, 'password')}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '10px',
                      background: copiedField === 'password' ? '#10b981' : 'rgba(56, 189, 248, 0.15)',
                      color: copiedField === 'password' ? '#030712' : '#38bdf8',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      fontWeight: 'bold',
                      fontSize: '12px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {copiedField === 'password' ? '✓ تم النسخ' : '📋 نسخ'}
                  </button>
                </div>
              </div>

              {/* Code Mail URL */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#38bdf8', display: 'block', marginBottom: '6px' }}>
                  📬 رابط استقبال كود تسجيل الدخول (Mail Box):
                </label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <input
                    type="text"
                    readOnly
                    value={deliveredData.codeUrl}
                    dir="ltr"
                    className="search-input-field"
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '12px',
                      background: 'rgba(0,0,0,0.4)',
                      color: '#93c5fd',
                      padding: '8px 12px',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(deliveredData.codeUrl, 'codeUrl')}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '10px',
                      background: copiedField === 'codeUrl' ? '#10b981' : 'rgba(56, 189, 248, 0.15)',
                      color: copiedField === 'codeUrl' ? '#030712' : '#38bdf8',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      fontWeight: 'bold',
                      fontSize: '12px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {copiedField === 'codeUrl' ? '✓ تم النسخ' : '📋 نسخ'}
                  </button>
                </div>

                <a
                  href={deliveredData.codeUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '12px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '13px',
                    textDecoration: 'none',
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
                  }}
                >
                  <span>🚀</span>
                  <span>فتح صفحة استقبال الكود والرسائل الآن</span>
                </a>
              </div>
            </div>

            {/* Quick copy all button */}
            <button
              type="button"
              onClick={() => {
                const fullText = `🎮 بيانات حساب eFootball:\nالعنوان: ${deliveredData.accountTitle}\nالبريد: ${deliveredData.email}\nكلمة المرور: ${deliveredData.password}\nرابط الكود: ${deliveredData.codeUrl}`;
                copyToClipboard(fullText, 'all');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                background: copiedField === 'all' ? '#10b981' : 'rgba(255, 255, 255, 0.08)',
                color: copiedField === 'all' ? '#030712' : '#fff',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                fontWeight: 800,
                fontSize: '13px',
                cursor: 'pointer',
                marginBottom: '10px',
              }}
            >
              <span>📋</span>
              <span>{copiedField === 'all' ? 'تم نسخ جميع البيانات في الحافظة ✅' : 'نسخ جميع بيانات الحساب دفعة واحدة'}</span>
            </button>

            <button
              onClick={onClose}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                color: '#030712',
                fontWeight: 900,
                fontSize: '14px',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              تم وحفظت البيانات بنجاح ✅
            </button>
          </div>
        ) : (
          /* ════════════════════════════════════════════════════════════════
             CASE 2: ORDER & PAYMENT SELECTION (Paymob Only)
          ════════════════════════════════════════════════════════════════ */
          <div>
            {/* Header icon */}
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                margin: '0 auto 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '26px',
              }}
            >
              💳
            </div>

            <h3 className="modal-heading" style={{ textAlign: 'center' }}>{t('orderModalTitle')}</h3>
            <p className="modal-subtext" style={{ marginBottom: '16px', textAlign: 'center' }}>
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
                marginBottom: '18px',
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
              {account.stockCount !== undefined && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>المخزون المتوفر:</span>
                  <span style={{ fontWeight: 'bold', color: account.stockCount > 0 ? '#34d399' : '#f87171' }}>
                    {account.stockCount > 0 ? `${account.stockCount} حساب جاهز للتسليم ⚡` : 'نفد المخزون 🔴'}
                  </span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ color: 'var(--text-muted)' }}>{t('orderAmountRequired')}</span>
                <span
                  style={{
                    fontWeight: '900',
                    color: 'var(--accent-emerald)',
                    fontSize: '18px',
                    fontFamily: 'Outfit, sans-serif',
                  }}
                >
                  {formatPrice(account.price)}
                </span>
              </div>
            </div>

            {/* Security Guarantee Banner */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '12px 14px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                color: '#6ee7b7',
                fontSize: '12px',
                marginBottom: '16px',
                lineHeight: 1.6,
              }}
            >
              <span style={{ fontSize: '18px' }}>⚡</span>
              <div>
                <strong style={{ color: '#34d399', display: 'block', marginBottom: '2px' }}>تسليم فوري ومباشر بعد الدفع:</strong>
                بمجرد إتمام الدفع عبر Paymob، سيتم سحب الحساب من السيرفر وعرض البريد وكلمة المرور ورابط استلام الكود فوراً على شاشتك.
              </div>
            </div>

            {/* Error Banner – نفد المخزون أو أي خطأ من السيرفر */}
            {paymobError && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#fca5a5',
                  fontSize: '13px',
                  marginBottom: '14px',
                  lineHeight: 1.6,
                }}
              >
                <span style={{ fontSize: '20px', flexShrink: 0 }}>🚫</span>
                <div>
                  <strong style={{ color: '#f87171', display: 'block', marginBottom: '2px' }}>تعذّر إتمام الدفع:</strong>
                  {paymobError}
                </div>
              </div>
            )}

            {/* Paymob Primary Button */}
            <button
              onClick={onPayWithPaymob}
              disabled={isPayingWithPaymob || !account.isAvailable}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                width: '100%',
                padding: '16px',
                borderRadius: '14px',
                background: account.isAvailable
                  ? 'linear-gradient(135deg, #0284c7, #2563eb)'
                  : 'rgba(255,255,255,0.05)',
                color: account.isAvailable ? '#fff' : '#64748b',
                fontWeight: '900',
                fontSize: '15px',
                border: 'none',
                cursor: account.isAvailable ? 'pointer' : 'not-allowed',
                boxShadow: account.isAvailable ? '0 6px 20px rgba(37, 99, 235, 0.35)' : 'none',
                marginBottom: '12px',
              }}
            >
              <span style={{ fontSize: '18px' }}>💳</span>
              <span>{isPayingWithPaymob ? 'جاري توجيهك إلى Paymob...' : 'الدفع وتأكيد الشراء عبر Paymob (فيزا / محافظ)'}</span>
            </button>

            {/* Paymob response link if available — hidden, redirect is automatic */}

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
                padding: '12px',
                borderRadius: '14px',
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#34d399',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                fontWeight: '800',
                fontSize: '13px',
                textDecoration: 'none',
                marginBottom: '12px',
              }}
            >
              <span>💬</span>
              <span>تواصل مع الدعم عبر واتساب</span>
            </a>

            <button onClick={onClose} className="btn-all-devices-link">
              {t('backToStoreBtn')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
