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
      {/* Header Row */}
      <div className="store-header-row">
        <div>
          <div className="store-title-sub">
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
            <span>🌐</span>
            <span>{t('filterAll')}</span>
            <span className="pill-count-bubble">{accounts.length}</span>
          </button>

          <button
            onClick={() => setSelectedPlatform('android')}
            className={`btn-filter-pill ${selectedPlatform === 'android' ? 'active-android' : ''}`}
          >
            <span>🤖</span>
            <span>{t('filterAndroid')}</span>
            <span className="pill-count-bubble">
              {accounts.filter((a) => a.platform === 'android').length}
            </span>
          </button>

          <button
            onClick={() => setSelectedPlatform('ios')}
            className={`btn-filter-pill ${selectedPlatform === 'ios' ? 'active-ios' : ''}`}
          >
            <span>🍏</span>
            <span>{t('filterIos')}</span>
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
            <option value="strength">{t('sortStrength')}</option>
            <option value="price-asc">{t('sortPriceAsc')}</option>
            <option value="price-desc">{t('sortPriceDesc')}</option>
          </select>
        </div>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div style={{ padding: '80px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚽</div>
          <p style={{ color: 'var(--text-muted)' }}>{t('loadingAccounts')}</p>
        </div>
      ) : error ? (
        <div
          style={{
            padding: '30px',
            textAlign: 'center',
            background: 'rgba(239, 68, 68, 0.1)',
            borderRadius: '16px',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          }}
        >
          <p style={{ color: '#f87171', fontWeight: 'bold', marginBottom: '12px' }}>{error}</p>
          <button onClick={onFetchRetry} className="btn-hero-secondary">
            {t('retry')}
          </button>
        </div>
      ) : filteredAccounts.length === 0 ? (
        <div
          style={{
            padding: '60px 20px',
            textAlign: 'center',
            background: 'rgba(255,255,255,0.02)',
            borderRadius: '20px',
          }}
        >
          <div style={{ fontSize: '36px', marginBottom: '10px' }}>🔍</div>
          <h3 style={{ color: '#fff', fontSize: '18px', marginBottom: '6px' }}>
            {t('noAccountsFound')}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' }}>
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
          {filteredAccounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onPreview={onPreview}
              onOrder={onOrder}
            />
          ))}
        </div>
      )}
    </section>
  );
}
