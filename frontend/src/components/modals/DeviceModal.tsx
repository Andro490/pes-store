import { useLanguage } from '../../i18n/LanguageContext';

interface DeviceModalProps {
  onClose: () => void;
  onSelectDevice: (platform: 'android' | 'ios' | 'all') => void;
}

export function DeviceModal({ onClose, onSelectDevice }: DeviceModalProps) {
  const { t } = useLanguage();

  return (
    <div className="modal-backdrop-overlay">
      <div className="device-modal-card">
        <button onClick={onClose} className="btn-modal-close">✕</button>

        <div className="modal-icon-badge">
          <div className="modal-icon-inner">📱</div>
        </div>

        <h3 className="modal-heading">{t('deviceModalTitle')}</h3>
        <p className="modal-subtext">{t('deviceModalSubtext')}</p>

        <div className="device-options-grid">
          <div onClick={() => onSelectDevice('android')} className="device-picker-btn android-pick">
            <div className="device-emoji">🤖</div>
            <div className="device-btn-title">{t('androidTitle')}</div>
            <div className="device-btn-sub">{t('androidSub')}</div>
            <span className="device-action-tag">{t('androidAction')}</span>
          </div>

          <div onClick={() => onSelectDevice('ios')} className="device-picker-btn ios-pick">
            <div className="device-emoji">🍏</div>
            <div className="device-btn-title">{t('iosTitle')}</div>
            <div className="device-btn-sub">{t('iosSub')}</div>
            <span className="device-action-tag">{t('iosAction')}</span>
          </div>
        </div>

        <button onClick={() => onSelectDevice('all')} className="btn-all-devices-link">
          {t('allDevicesLink')}
        </button>
      </div>
    </div>
  );
}
