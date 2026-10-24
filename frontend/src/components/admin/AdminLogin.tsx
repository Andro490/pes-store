import { useLanguage } from '../../i18n/LanguageContext';

interface AdminLoginProps {
  username: string;
  password: string;
  loading: boolean;
  error: string | null;
  onUsernameChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBackToStore: () => void;
}

export function AdminLogin({
  username,
  password,
  loading,
  error,
  onUsernameChange,
  onPasswordChange,
  onSubmit,
  onBackToStore,
}: AdminLoginProps) {
  const { t, isRTL } = useLanguage();

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
          background: 'rgba(14, 18, 28, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(99, 102, 241, 0.35)',
          borderRadius: '24px',
          padding: '36px 28px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(99, 102, 241, 0.15)',
          textAlign: isRTL ? 'right' : 'left',
        }}
      >
        {/* Icon + Title */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(6, 182, 212, 0.2))',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              marginBottom: '14px',
              boxShadow: '0 8px 24px rgba(99, 102, 241, 0.2)',
            }}
          >
            🔐
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#fff', marginBottom: '8px' }}>
            {t('adminLoginTitle')}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
            {t('adminLoginDesc')}
          </p>
        </div>

        {/* Error */}
        {error && (
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

        {/* Form */}
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#cbd5e1', marginBottom: '8px' }}>
              {t('adminUsernameLabel')}
            </label>
            <input
              type="text"
              required
              placeholder={t('adminUsernamePlaceholder')}
              value={username}
              onChange={(e) => onUsernameChange(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: '14px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-light)',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
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
              placeholder={t('adminPasswordPlaceholder')}
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: '14px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-light)',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '15px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
              color: '#fff',
              fontWeight: 900,
              fontSize: '15px',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              boxShadow: '0 8px 25px rgba(99, 102, 241, 0.35)',
              marginTop: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <span>{loading ? '⏳' : '🚀'}</span>
            <span>{loading ? t('adminVerifying') : t('adminLoginBtn')}</span>
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
