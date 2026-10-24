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

  const field = (key: keyof AccountFormData) =>
    (value: any) => onChange((prev) => ({ ...prev, [key]: value }));

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

          {/* Strength + Coins */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <FormField label={t('formStrengthLabel')}>
              <input
                type="number"
                placeholder="3185"
                value={formData.teamStrength}
                onChange={(e) => field('teamStrength')(Number(e.target.value))}
                className="search-input-field"
                style={{ padding: '10px 14px' }}
              />
            </FormField>
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
          </div>

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
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => field('imageUrl')(e.target.value)}
                className="search-input-field"
                style={{ padding: '10px 14px' }}
              />
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
