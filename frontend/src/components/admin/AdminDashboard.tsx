import { useLanguage } from '../../i18n/LanguageContext';
import type { AdminUser } from '../../hooks/useAdminAuth';
import type { PesAccount } from '../../types';

interface AdminDashboardProps {
  adminUser: AdminUser | null;
  accounts: PesAccount[];
  totalAccounts: number;
  availableAccounts: number;
  soldAccounts: number;
  totalRevenue: number;
  onLogout: () => void;
  onCreateAccount: () => void;
  onEditAccount: (account: PesAccount) => void;
  onTogglePaid: (account: PesAccount) => void;
  onDeleteAccount: (account: PesAccount) => void;
}

export function AdminDashboard({
  adminUser,
  accounts,
  totalAccounts,
  availableAccounts,
  soldAccounts,
  totalRevenue,
  onLogout,
  onCreateAccount,
  onEditAccount,
  onTogglePaid,
  onDeleteAccount,
}: AdminDashboardProps) {
  const { t, isRTL, formatPrice } = useLanguage();

  return (
    <main className="store-section" style={{ paddingTop: '30px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#818cf8' }}>
              ⚙️ {t('adminHeaderSub')}
            </span>
            <span
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '8px',
                background: 'rgba(99, 102, 241, 0.15)',
                color: '#a5b4fc',
                border: '1px solid rgba(99, 102, 241, 0.3)',
              }}
            >
              👑 {t('adminWelcome')} {adminUser?.name || t('adminDefaultRole')}
            </span>
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#fff' }}>
            {t('adminDashboardTitle')}
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onLogout}
            style={{
              padding: '12px 20px',
              borderRadius: '14px',
              background: 'rgba(239, 68, 68, 0.12)',
              color: '#f87171',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              fontWeight: 800,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>🚪</span>
            <span>{t('adminLogoutBtn')}</span>
          </button>

          <button
            onClick={onCreateAccount}
            style={{
              padding: '12px 24px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #10b981, #06b6d4)',
              color: '#030712',
              fontWeight: 900,
              fontSize: '15px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 6px 20px var(--accent-emerald-glow)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>➕</span>
            <span>{t('adminAddNewAccountBtn')}</span>
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        <div className="stat-item-box" style={{ background: 'rgba(18, 24, 38, 0.8)' }}>
          <div className="stat-icon">📦</div>
          <div className="stat-value">{totalAccounts}</div>
          <div className="stat-label">{t('adminTotalAccounts')}</div>
        </div>
        <div
          className="stat-item-box"
          style={{ background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)' }}
        >
          <div className="stat-icon">🟢</div>
          <div className="stat-value" style={{ color: '#34d399' }}>{availableAccounts}</div>
          <div className="stat-label">{t('adminAvailableAccounts')}</div>
        </div>
        <div
          className="stat-item-box"
          style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
        >
          <div className="stat-icon">🔴</div>
          <div className="stat-value" style={{ color: '#f87171' }}>{soldAccounts}</div>
          <div className="stat-label">{t('adminSoldAccounts')}</div>
        </div>
        <div
          className="stat-item-box"
          style={{ background: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.3)' }}
        >
          <div className="stat-icon">💰</div>
          <div className="stat-value" style={{ color: '#fbbf24' }}>{formatPrice(totalRevenue)}</div>
          <div className="stat-label">{t('adminTotalRevenue')}</div>
        </div>
      </div>

      {/* Table */}
      <div
        style={{
          background: 'rgba(14, 18, 28, 0.85)',
          border: '1px solid var(--border-light)',
          borderRadius: '24px',
          padding: '24px',
          overflowX: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
          }}
        >
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>
            {t('adminTableTitle')}
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('adminTableSub')}</span>
        </div>

        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: isRTL ? 'right' : 'left',
            fontSize: '14px',
          }}
        >
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '12px 10px' }}>{t('adminThAccount')}</th>
              <th style={{ padding: '12px 10px' }}>{t('adminThPlatform')}</th>
              <th style={{ padding: '12px 10px' }}>{t('adminThPrice')}</th>
              <th style={{ padding: '12px 10px' }}>{t('adminThStrength')}</th>
              <th style={{ padding: '12px 10px' }}>{t('adminThCoins')}</th>
              <th style={{ padding: '12px 10px' }}>المخزون التلقائي</th>
              <th style={{ padding: '12px 10px' }}>{t('adminThStatus')}</th>
              <th style={{ padding: '12px 10px', textAlign: 'center' }}>{t('adminThActions')}</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account) => (
              <tr
                key={account.id}
                style={{
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                  transition: 'background 0.2s',
                }}
              >
                <td style={{ padding: '14px 10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img
                      src={account.imageUrl}
                      alt={account.title}
                      style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover' }}
                    />
                    <div>
                      <div
                        style={{
                          fontWeight: 800,
                          color: '#fff',
                          maxWidth: '280px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {account.title}
                      </div>
                      <span style={{ fontSize: '11px', color: '#38bdf8', fontFamily: 'monospace' }}>
                        #{account.id}
                      </span>
                    </div>
                  </div>
                </td>

                <td style={{ padding: '14px 10px' }}>
                  <span className={`platform-badge ${account.platform}`} style={{ padding: '3px 8px', fontSize: '11px' }}>
                    {account.platform === 'android' ? '🤖 Android' : '🍏 iOS'}
                  </span>
                </td>

                <td style={{ padding: '14px 10px', fontWeight: 900, color: 'var(--accent-emerald)', fontFamily: 'Outfit, sans-serif' }}>
                  {formatPrice(account.price)}
                </td>

                <td style={{ padding: '14px 10px', fontWeight: 700, color: '#fbbf24' }}>
                  ⚡ {account.teamStrength}
                </td>

                <td style={{ padding: '14px 10px', fontWeight: 700, color: '#f59e0b' }}>
                  🪙 {account.coins}
                </td>

                <td style={{ padding: '14px 10px' }}>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: '10px',
                      background: (account.stockCount ?? 0) > 0 ? 'rgba(56, 189, 248, 0.15)' : 'rgba(239, 68, 68, 0.12)',
                      color: (account.stockCount ?? 0) > 0 ? '#38bdf8' : '#f87171',
                      border: `1px solid ${(account.stockCount ?? 0) > 0 ? 'rgba(56, 189, 248, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                      fontSize: '12px',
                      fontWeight: 800,
                    }}
                  >
                    📦 {account.stockCount ?? 0} حساب
                  </span>
                </td>

                <td style={{ padding: '14px 10px' }}>
                  {account.isAvailable ? (
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '10px',
                        background: 'rgba(16, 185, 129, 0.15)',
                        color: '#34d399',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        fontSize: '12px',
                        fontWeight: 700,
                      }}
                    >
                      {t('adminStatusAvailable')}
                    </span>
                  ) : (
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '10px',
                        background: 'rgba(239, 68, 68, 0.15)',
                        color: '#f87171',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        fontSize: '12px',
                        fontWeight: 700,
                      }}
                    >
                      {t('adminStatusSold')}
                    </span>
                  )}
                </td>

                <td style={{ padding: '14px 10px', textAlign: 'center' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => onTogglePaid(account)}
                      title={account.isAvailable ? t('adminActionMarkPaid') : t('adminActionMarkAvailable')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '10px',
                        background: account.isAvailable ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        color: account.isAvailable ? '#f87171' : '#34d399',
                        border: `1px solid ${account.isAvailable ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {account.isAvailable ? t('adminActionMarkPaid') : t('adminActionMarkAvailable')}
                    </button>

                    <button
                      onClick={() => onEditAccount(account)}
                      title={t('adminActionEdit')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '10px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: '#e2e8f0',
                        border: '1px solid var(--border-light)',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {t('adminActionEdit')}
                    </button>

                    <button
                      onClick={() => onDeleteAccount(account)}
                      title={t('adminActionDeleteTitle')}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '10px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#f87171',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
