import { useLanguage } from '../../i18n/LanguageContext';
import type { PesAccount } from '../../types';
import { AccountCard } from './AccountCard';
import type { SortOption } from '../../hooks/useAccounts';

interface StoreSectionProps {
  accounts: PesAccount[];
  filteredAccounts: PesAccount[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  sortBy: SortOption;
  setSortBy: (s: SortOption) => void;
  onFetchRetry: () => void;
  onPreview: (account: PesAccount) => void;
  onOrder: (account: PesAccount) => void;
}

export function StoreSection({
  accounts,
  filteredAccounts,
  loading,
  error,
  searchTerm,
  setSearchTerm,
  sortBy,
  setSortBy,
  onFetchRetry,
  onPreview,
  onOrder,
}: StoreSectionProps) {
  const { t } = useLanguage();

  return (
    <section id="store-section" className="store-section">
      {/* Section Header */}
      <div className="store-header-row">
        <div>
          <div className="store-title-sub">
            <span className="store-title-dot" />
            <span>🎮</span>
            <span>{t('storeSectionSubtitle')}</span>
          </div>
          <h2 className="store-main-title">{t('storeSectionTitle')}</h2>
        </div>

        {/* Search */}
        <div className="search-box-wrapper">
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input-field"
          />
          <span className="search-icon-pos">🔍</span>
        </div>
      </div>

      {/* Filter / Sort Bar */}
      <div className="filter-bar-card" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', color: '#94a3b8' }}>إجمالي الحسابات المعروضة:</span>
          <span
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              padding: '4px 10px',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '13px',
              border: '1px solid rgba(239, 68, 68, 0.3)',
            }}
          >
            {accounts.length} حساب
          </span>
        </div>

        {/* Sort */}
        <div className="sort-select-box">
          <span>{t('sortByLabel')}</span>
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="custom-select"
          >
            <option value="featured">{t('sortFeatured')}</option>
            <option value="price-asc">{t('sortPriceAsc')}</option>
            <option value="price-desc">{t('sortPriceDesc')}</option>
          </select>
        </div>
      </div>

      {/* Cards Grid / States */}
      {loading ? (
        <div className="store-loading-state">
          <div className="loading-ball-spinner">
            <div className="spinner-ring" />
            <span>⚽</span>
          </div>
          <p style={{ color: 'var(--text-muted)', marginTop: '16px' }}>{t('loadingAccounts')}</p>
        </div>
      ) : error ? (
        <div className="store-error-state">
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>⚠️</div>
          <p style={{ color: '#f87171', fontWeight: 'bold', marginBottom: '16px' }}>{error}</p>
          <button onClick={onFetchRetry} className="btn-hero-secondary">
            {t('retry')}
          </button>
        </div>
      ) : filteredAccounts.length === 0 ? (
        <div className="store-empty-state">
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔍</div>
          <h3 style={{ color: '#fff', fontSize: '20px', marginBottom: '8px' }}>
            {t('noAccountsFound')}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>
            {t('noAccountsDesc')}
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
            }}
            className="btn-filter-pill active-all"
          >
            {t('showAllAccounts')}
          </button>
        </div>
      ) : (
        <div className="accounts-grid">
          {filteredAccounts.map((account, idx) => (
            <div
              key={account.id}
              className="card-animate-in"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <AccountCard
                account={account}
                onPreview={onPreview}
                onOrder={onOrder}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
