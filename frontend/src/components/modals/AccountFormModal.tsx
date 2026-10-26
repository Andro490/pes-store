import { useMemo, useState, useRef } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import type { AccountFormData } from '../../hooks/useAccounts';
import type { PesAccount } from '../../types';

interface AccountFormModalProps {
  editingAccount: PesAccount | null;
  formData: AccountFormData;
  onChange: React.Dispatch<React.SetStateAction<AccountFormData>>;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function AccountFormModal({
  editingAccount,
  formData,
  onChange,
  onSubmit,
  onClose,
}: AccountFormModalProps) {
  const { t, isRTL } = useLanguage();

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const field = (key: keyof AccountFormData) =>
    (value: any) => onChange((prev) => ({ ...prev, [key]: value }));

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingImage(true);
      setUploadError(null);

      const body = new FormData();
      body.append('image', file);

      const res = await fetch('https://api.imgbb.com/1/upload?key=878a3e7d1975c224f0cfc02c0bd29299', {
        method: 'POST',
        body,
      });

      const data = await res.json();
      if (data.success && data.data?.url) {
        field('imageUrl')(data.data.url);
      } else {
        setUploadError(data.error?.message || 'فشل رفع الصورة على ImgBB');
      }
    } catch (err: any) {
      setUploadError(err.message || 'حدث خطأ أثناء رفع الصورة');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const parsedStockCount = useMemo(() => {
    if (!formData.bulkAccounts) return 0;
    return formData.bulkAccounts
      .split(/\r?\n/)
      .filter((line) => {
        const parts = line.split('|').map((s) => s.trim());
        return parts.length >= 2 && Boolean(parts[0]) && Boolean(parts[1]);
      }).length;
  }, [formData.bulkAccounts]);

  return (
    <div className="modal-backdrop-overlay">
      <div
        className="device-modal-card"
        style={{
          maxWidth: '640px',
          textAlign: isRTL ? 'right' : 'left',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <button onClick={onClose} className="btn-modal-close">✕</button>

        <h3 className="modal-heading" style={{ marginBottom: '6px' }}>
          {editingAccount ? t('modalEditTitle') : t('modalAddTitle')}
        </h3>
        <p className="modal-subtext" style={{ marginBottom: '20px' }}>
          {t('modalFormDesc')}
        </p>

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Title */}
          <FormField label={t('formTitleLabel')}>
            <input
              type="text"
              required
              placeholder={t('formTitlePlaceholder')}
              value={formData.title}
              onChange={(e) => field('title')(e.target.value)}
              className="search-input-field"
              style={{ padding: '10px 14px' }}
            />
          </FormField>

          {/* Platform + Price */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <FormField label={t('formPlatformLabel')}>
              <select
                value={formData.platform}
                onChange={(e: any) => field('platform')(e.target.value)}
                className="custom-select"
                style={{ width: '100%', padding: '10px 14px' }}
              >
                <option value="android">🤖 Android</option>
                <option value="ios">🍏 Apple iOS</option>
              </select>
            </FormField>

            <FormField label={t('formPriceLabel')}>
              <input
                type="number"
                required
                value={formData.price}
                onChange={(e) => field('price')(Number(e.target.value))}
                className="search-input-field"
                style={{ padding: '10px 14px' }}
              />
            </FormField>
          </div>

          {/* Coins */}
          <FormField label={t('formCoinsLabel')}>
            <input
              type="number"
              placeholder="1500"
              value={formData.coins}
              onChange={(e) => field('coins')(Number(e.target.value))}
              className="search-input-field"
              style={{ padding: '10px 14px' }}
            />
          </FormField>

          {/* Epic + Players */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
            <FormField label={t('formEpicLabel')}>
              <input
                type="number"
                value={formData.epicCount}
                onChange={(e) => field('epicCount')(Number(e.target.value))}
                className="search-input-field"
                style={{ padding: '10px 14px' }}
              />
            </FormField>
            <FormField label={t('formPlayersLabel')}>
              <input
                type="text"
                placeholder={t('formPlayersPlaceholder')}
                value={formData.highlightPlayers}
                onChange={(e) => field('highlightPlayers')(e.target.value)}
                className="search-input-field"
                style={{ padding: '10px 14px' }}
              />
            </FormField>
          </div>

          {/* Image + Badge */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
            <FormField label={t('formImageLabel')}>
              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageUpload}
              />

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="url"
                  placeholder="https://i.ibb.co/..."
                  value={formData.imageUrl}
                  onChange={(e) => field('imageUrl')(e.target.value)}
                  className="search-input-field"
                  style={{ padding: '10px 14px', flex: 1 }}
                />

                <button
                  type="button"
                  disabled={isUploadingImage}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    background: isUploadingImage
                      ? 'rgba(56, 189, 248, 0.2)'
                      : 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: isUploadingImage ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)',
                    transition: 'all 0.2s',
                  }}
                >
                  <span>{isUploadingImage ? '⏳' : '📤'}</span>
                  <span>{isUploadingImage ? 'جاري الرفع...' : 'رفع صورة'}</span>
                </button>
              </div>

              {uploadError && (
                <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px' }}>
                  ⚠️ {uploadError}
                </div>
              )}

              {/* Preview Thumbnail if image is set */}
              {formData.imageUrl && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                  <img
                    src={formData.imageUrl}
                    alt="Preview"
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '8px',
                      objectFit: 'cover',
                      border: '1px solid #38bdf8',
                    }}
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>
                    ✓ تم اختيار الصورة بنجاح
                  </span>
                </div>
              )}
            </FormField>

            <FormField label={t('formBadgeLabel')}>
              <input
                type="text"
                placeholder={t('formBadgePlaceholder')}
                value={formData.badge}
                onChange={(e) => field('badge')(e.target.value)}
                className="search-input-field"
                style={{ padding: '10px 14px' }}
              />
            </FormField>
          </div>

          {/* Details */}
          <FormField label={t('formDetailsLabel')}>
            <textarea
              rows={2}
              value={formData.details}
              onChange={(e) => field('details')(e.target.value)}
              className="search-input-field"
              style={{ padding: '10px 14px', resize: 'vertical' }}
            />
          </FormField>

          {/* Bulk Accounts Stock Input */}
          <div
            style={{
              background: 'linear-gradient(145deg, rgba(14, 20, 36, 0.8), rgba(6, 182, 212, 0.05))',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '16px',
              padding: '14px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <label
                style={{
                  fontSize: '13px',
                  fontWeight: 'bold',
                  color: '#38bdf8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>📦</span>
                <span>بيانات الحسابات والمخزون (البريد | الباسورد | رابط استقبال الكود):</span>
              </label>

              {parsedStockCount > 0 ? (
                <span
                  style={{
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: '#34d399',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    padding: '2px 10px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                  }}
                >
                  ⚡ تم التعرف على {parsedStockCount} حسابات جاهزة للإضافة
                </span>
              ) : (
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                  {editingAccount?.stockCount !== undefined
                    ? `المخزون الحالي: ${editingAccount.stockCount} حساب`
                    : 'يمكنك لصق عدة أسطر دفعة واحدة'}
                </span>
              )}
            </div>

            <textarea
              rows={4}
              placeholder={`muzxzkolfs@lutianqiwy.xyz | abcd123456 | http://mail.lutianqiwy.xyz/\ncguxlikybu@lutianqiwy.xyz | abcd123456 | http://mail.lutianqiwy.xyz/\niedvclcbuj@lutianqiwy.xyz | abcd123456 | http://mail.lutianqiwy.xyz/`}
              value={formData.bulkAccounts}
              onChange={(e) => field('bulkAccounts')(e.target.value)}
              className="search-input-field"
              dir="ltr"
              style={{
                width: '100%',
                padding: '10px 14px',
                fontFamily: 'monospace',
                fontSize: '12px',
                lineHeight: '1.6',
                background: '#090d16',
                borderColor: parsedStockCount > 0 ? '#10b981' : 'rgba(255, 255, 255, 0.15)',
                color: '#e2e8f0',
                resize: 'vertical',
              }}
            />

            <div
              style={{
                fontSize: '11px',
                color: '#94a3b8',
                marginTop: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                textAlign: isRTL ? 'right' : 'left',
              }}
            >
              <span>ℹ️</span>
              <span>
                كل سطر يمثل حساب منفصل. افصل بين (البريد | كلمة المرور | رابط الأكواد) بالرمز <strong>|</strong>
              </span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-hero-secondary"
              style={{ padding: '10px 20px', fontSize: '13px' }}
            >
              {t('formCancelBtn')}
            </button>
            <button
              type="submit"
              className="btn-card-order"
              style={{ padding: '12px 28px', fontSize: '14px' }}
            >
              {editingAccount ? t('formSaveEditBtn') : t('formPublishBtn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Tiny helper to avoid repeating label styles ──
function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', display: 'block', marginBottom: '6px' }}>
        {label}
      </label>
      {children}
    </div>
  );
}
