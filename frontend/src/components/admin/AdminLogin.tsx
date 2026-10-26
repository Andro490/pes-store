import { useLanguage } from '../../i18n/LanguageContext';

interface AdminLoginProps {
  username: string;
  password: string;
  loading: boolean;
  error: string | null;
  isLocked: boolean;
  lockRemainingSeconds: number;
  remainingAttempts: number | null;
  onUsernameChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBackToStore: () => void;
}

function formatCountdown(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function AdminLogin({
  username,
  password,
  loading,
  error,
  isLocked,
  lockRemainingSeconds,
  remainingAttempts,
  onUsernameChange,
  onPasswordChange,
  onSubmit,
  onBackToStore,
}: AdminLoginProps) {
  const { t, isRTL } = useLanguage();

  const inputDisabled = loading || isLocked;

  return (
    <main
      className="store-section"
      style={{
        minHeight: '65vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: '40px',
        paddingBottom: '60px',
      }}
    >
      <div
        style={{
          maxWidth: '460px',
          width: '100%',
          background: 'rgba(12, 14, 20, 0.94)',
          backdropFilter: 'blur(20px)',
          border: `1px solid ${isLocked ? 'rgba(239, 68, 68, 0.5)' : 'rgba(220, 38, 38, 0.35)'}`,
          borderRadius: '24px',
          padding: '36px 28px',
          boxShadow: isLocked
            ? '0 25px 60px rgba(0,0,0,0.85), 0 0 40px rgba(239,68,68,0.2)'
            : '0 25px 60px rgba(0,0,0,0.85), 0 0 40px rgba(220,38,38,0.18)',
          textAlign: isRTL ? 'right' : 'left',
          transition: 'border 0.3s, box-shadow 0.3s',
        }}
      >
        {/* Icon + Title */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: isLocked
                ? 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(180,20,20,0.3))'
                : 'linear-gradient(135deg, rgba(220,38,38,0.18), rgba(148,163,184,0.15))',
              border: `1px solid ${isLocked ? 'rgba(239,68,68,0.5)' : 'rgba(220,38,38,0.4)'}`,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              marginBottom: '14px',
              boxShadow: isLocked
                ? '0 8px 24px rgba(239,68,68,0.3)'
                : '0 8px 24px rgba(220,38,38,0.25)',
            }}
          >
            {isLocked ? '🔒' : '🔐'}
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#fff', marginBottom: '8px' }}>
            {t('adminLoginTitle')}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
            {t('adminLoginDesc')}
          </p>
        </div>

        {/* ⛔ Lockout Banner */}
        {isLocked && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '16px',
              padding: '18px 20px',
              marginBottom: '20px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>⛔</div>
            <p
              style={{
                color: '#f87171',
                fontWeight: 800,
                fontSize: '14px',
                marginBottom: '12px',
                lineHeight: 1.6,
              }}
            >
              تم قفل تسجيل الدخول مؤقتاً
              <br />
              بسبب تكرار إدخال بيانات خاطئة 5 مرات
            </p>
            <div
              style={{
                background: 'rgba(0,0,0,0.4)',
                borderRadius: '12px',
                padding: '12px 16px',
                display: 'inline-block',
                minWidth: '160px',
              }}
            >
              <p style={{ color: '#94a3b8', fontSize: '11px', marginBottom: '4px', fontWeight: 600 }}>
                الوقت المتبقي لفك الحظر
              </p>
              <p
                style={{
                  color: '#fca5a5',
                  fontSize: '28px',
                  fontWeight: 900,
                  fontFamily: 'monospace',
                  letterSpacing: '2px',
                }}
              >
                {formatCountdown(lockRemainingSeconds)}
              </p>
              <p style={{ color: '#6b7280', fontSize: '10px', marginTop: '2px' }}>
                ساعة : دقيقة : ثانية
              </p>
            </div>
          </div>
        )}

        {/* ⚠️ Wrong password warning (not locked) */}
        {!isLocked && error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              padding: '12px 16px',
              color: '#f87171',
              fontSize: '13px',
              fontWeight: 'bold',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Remaining attempts hint */}
        {!isLocked && remainingAttempts !== null && remainingAttempts > 0 && (
          <div
            style={{
              background: 'rgba(220, 38, 38, 0.1)',
              border: '1px solid rgba(220, 38, 38, 0.3)',
              borderRadius: '10px',
              padding: '10px 14px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              color: '#f87171',
              fontWeight: 700,
            }}
          >
            <span>🛡️</span>
            <span>
              تحذير: متبقي {remainingAttempts}{' '}
              {remainingAttempts === 1 ? 'محاولة واحدة' : 'محاولات'} قبل حظر الجهاز لمدة ساعة
            </span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#cbd5e1', marginBottom: '8px' }}>
              {t('adminUsernameLabel')}
            </label>
            <input
              type="text"
              required
              disabled={inputDisabled}
              placeholder={isLocked ? '🔒 محظور مؤقتاً...' : t('adminUsernamePlaceholder')}
              value={username}
              onChange={(e) => onUsernameChange(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: '14px',
                background: inputDisabled ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${isLocked ? 'rgba(239,68,68,0.2)' : 'var(--border-light)'}`,
                color: inputDisabled ? '#4b5563' : '#fff',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
                cursor: inputDisabled ? 'not-allowed' : 'text',
                transition: 'all 0.2s',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#cbd5e1', marginBottom: '8px' }}>
              {t('adminPasswordLabel')}
            </label>
            <input
              type="password"
              required
              disabled={inputDisabled}
              placeholder={isLocked ? '🔒 محظور مؤقتاً...' : t('adminPasswordPlaceholder')}
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: '14px',
                background: inputDisabled ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${isLocked ? 'rgba(239,68,68,0.2)' : 'var(--border-light)'}`,
                color: inputDisabled ? '#4b5563' : '#fff',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
                cursor: inputDisabled ? 'not-allowed' : 'text',
                transition: 'all 0.2s',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={inputDisabled}
            style={{
              width: '100%',
              padding: '15px',
              borderRadius: '14px',
              background: isLocked
                ? 'rgba(75,85,99,0.4)'
                : 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: isLocked ? '#6b7280' : '#ffffff',
              fontWeight: 900,
              fontSize: '15px',
              border: 'none',
              cursor: inputDisabled ? 'not-allowed' : 'pointer',
              opacity: inputDisabled ? 0.6 : 1,
              boxShadow: isLocked ? 'none' : '0 8px 25px rgba(220,38,38,0.45)',
              marginTop: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.3s',
            }}
          >
            <span>{isLocked ? '⛔' : loading ? '⏳' : '🚀'}</span>
            <span>
              {isLocked
                ? `محظور • ${formatCountdown(lockRemainingSeconds)}`
                : loading
                ? t('adminVerifying')
                : t('adminLoginBtn')}
            </span>
          </button>

          <button
            type="button"
            onClick={onBackToStore}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              marginTop: '10px',
              textAlign: 'center',
            }}
          >
            {t('adminBackToStore')}
          </button>
        </form>
      </div>
    </main>
  );
}
