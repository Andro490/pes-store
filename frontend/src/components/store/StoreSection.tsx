import { useLanguage } from '../../i18n/LanguageContext';
import type { PesAccount } from '../../types';
import { AccountCard } from './AccountCard';
import type { PlatformFilter, SortOption } from '../../hooks/useAccounts';

interface StoreSectionProps {
  accounts: PesAccount[];
  filteredAccounts: PesAccount[];
  loading: boolean;
  error: string | null;
  selectedPlatform: PlatformFilter;
  setSelectedPlatform: (p: PlatformFilter) => void;
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
  selectedPlatform,
  setSelectedPlatform,
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

      {/* Filter Bar */}
      <div className="filter-bar-card">
        <div className="filter-pills-group">
          <span className="filter-group-label">{t('osFilterLabel')}</span>

          <button
            onClick={() => setSelectedPlatform('all')}
            className={`btn-filter-pill ${selectedPlatform === 'all' ? 'active-all' : ''}`}
          >
            <div className="filter-pill-content">
              <span>🌐</span>
              <span>{t('filterAll')}</span>
            </div>
            <span className="pill-count-bubble">{accounts.length}</span>
          </button>

          <button
            onClick={() => setSelectedPlatform('android')}
            className={`btn-filter-pill ${selectedPlatform === 'android' ? 'active-android' : ''}`}
          >
            <div className="filter-pill-content">
              <span>🤖</span>
              <span>{t('filterAndroid')}</span>
            </div>
            <span className="pill-count-bubble">
              {accounts.filter((a) => a.platform === 'android').length}
            </span>
          </button>

          <button
            onClick={() => setSelectedPlatform('ios')}
            className={`btn-filter-pill ${selectedPlatform === 'ios' ? 'active-ios' : ''}`}
          >
            <div className="filter-pill-content">
              <span>🍏</span>
              <span>{t('filterIos')}</span>
            </div>
            <span className="pill-count-bubble">
              {accounts.filter((a) => a.platform === 'ios').length}
            </span>
          </button>
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
              setSelectedPlatform('all');
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
