import { useState, useEffect } from 'react';

// ─── Hooks ─────────────────────────────────────────────────────────
import { useAdminAuth } from './hooks/useAdminAuth';
import { useAccounts } from './hooks/useAccounts';
import { useStore } from './hooks/useStore';

// ─── Layout ────────────────────────────────────────────────────────
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';

// ─── Store Pages ───────────────────────────────────────────────────
import { HeroSection } from './components/store/HeroSection';
import { StoreSection } from './components/store/StoreSection';

// ─── Admin Pages ───────────────────────────────────────────────────
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminDashboard } from './components/admin/AdminDashboard';

// ─── Modals ────────────────────────────────────────────────────────
import { AccountDetailModal } from './components/modals/AccountDetailModal';
import { PurchaseModal } from './components/modals/PurchaseModal';
import { AccountFormModal } from './components/modals/AccountFormModal';
import { SupportChatWidget } from './components/support/SupportChatWidget';

type AppView = 'store' | 'admin';

function getInitialView(): AppView {
  const path = window.location.pathname.toLowerCase().replace(/\/+$/, '');
  const hash = window.location.hash.toLowerCase();
  if (path === '/admfoad' || hash === '#admfoad') return 'admin';
  return 'store';
}

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>(getInitialView);

  const navigateTo = (view: AppView) => {
    setCurrentView(view);
    const path = view === 'admin' ? '/admfoad' : '/';
    window.history.pushState(null, '', path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handler = () => setCurrentView(getInitialView());
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  // ── Admin auth ───────────────────────────────────────────────────
  const {
    isAdminLoggedIn, adminUser,
    adminUsername, adminPassword, adminAuthLoading, adminAuthError,
    isLocked, lockRemainingSeconds, remainingAttempts,
    setAdminUsername, setAdminPassword,
    checkAdminAuth, handleAdminLogin, handleAdminLogout,
  } = useAdminAuth(() => navigateTo('store'));

  // ── Accounts data + CRUD ─────────────────────────────────────────
  const {
    accounts, filteredAccounts, loading, error,
    sortBy, setSortBy,
    fetchAccounts, handleSaveAccount, handleTogglePaid, handleApplyDiscount, handleDeleteAccount,
    isAccountModalOpen, setIsAccountModalOpen,
    editingAccount, accountFormData, setAccountFormData,
    handleOpenCreateModal, handleOpenEditModal,
    totalAccounts, availableAccounts, soldAccounts, totalRevenue,
  } = useAccounts();

  // ── Store UI state ───────────────────────────────────────────────
  const {
    handleOpenBuyFlow,
    selectedAccountForView, setSelectedAccountForView,
    purchaseSuccessAccount,
    handleOpenOrder, handleCloseOrder,
  } = useStore();

  // ── Bootstrap ────────────────────────────────────────────────────
  useEffect(() => {
    fetchAccounts();
    checkAdminAuth();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="app-wrapper">
      {/* Background glow orbs */}
      <div className="bg-glow-container">
        <div className="glow-orb-1" />
        <div className="glow-orb-2" />
        <div className="glow-orb-3" />
      </div>

      {/* ── Navbar ── */}
      <Navbar
        currentView={currentView}
        isAdminLoggedIn={isAdminLoggedIn}
        onNavigate={navigateTo}
        onLogout={handleAdminLogout}
        onBuyClick={handleOpenBuyFlow}
        onCreateAccount={handleOpenCreateModal}
      />

      {/* ══ ADMIN VIEW ══════════════════════════════════════════════ */}
      {currentView === 'admin' && !isAdminLoggedIn && (
        <AdminLogin
          username={adminUsername}
          password={adminPassword}
          loading={adminAuthLoading}
          error={adminAuthError}
          isLocked={isLocked}
          lockRemainingSeconds={lockRemainingSeconds}
          remainingAttempts={remainingAttempts}
          onUsernameChange={setAdminUsername}
          onPasswordChange={setAdminPassword}
          onSubmit={handleAdminLogin}
          onBackToStore={() => navigateTo('store')}
        />
      )}

      {currentView === 'admin' && isAdminLoggedIn && (
        <AdminDashboard
          adminUser={adminUser}
          accounts={accounts}
          totalAccounts={totalAccounts}
          availableAccounts={availableAccounts}
          soldAccounts={soldAccounts}
          totalRevenue={totalRevenue}
          onLogout={handleAdminLogout}
          onCreateAccount={handleOpenCreateModal}
          onEditAccount={handleOpenEditModal}
          onTogglePaid={handleTogglePaid}
          onApplyDiscount={handleApplyDiscount}
          onDeleteAccount={handleDeleteAccount}
        />
      )}

      {/* ══ STORE VIEW ══════════════════════════════════════════════ */}
      {currentView === 'store' && (
        <>
          <HeroSection totalAccounts={totalAccounts} />

          <StoreSection
            accounts={accounts}
            filteredAccounts={filteredAccounts}
            loading={loading}
            error={error}
            sortBy={sortBy}
            setSortBy={setSortBy}
            onFetchRetry={fetchAccounts}
            onPreview={setSelectedAccountForView}
            onOrder={handleOpenOrder}
          />
        </>
      )}

      {/* ══ MODALS ══════════════════════════════════════════════════ */}

      {selectedAccountForView && (
        <AccountDetailModal
          account={selectedAccountForView}
          onClose={() => setSelectedAccountForView(null)}
          onOrder={(acc) => {
            setSelectedAccountForView(null);
            handleOpenOrder(acc);
          }}
        />
      )}

      {/* نافذة الشراء المباشر وتسليم الحساب فوراً */}
      {purchaseSuccessAccount && (
        <PurchaseModal
          account={purchaseSuccessAccount}
          onClose={handleCloseOrder}
          onPurchaseSuccess={fetchAccounts}
        />
      )}

      {isAccountModalOpen && (
        <AccountFormModal
          editingAccount={editingAccount}
          formData={accountFormData}
          onChange={setAccountFormData}
          onSubmit={handleSaveAccount}
          onClose={() => setIsAccountModalOpen(false)}
        />
      )}

      {/* ── Support Floating Chat Widget ── */}
      <SupportChatWidget />

      {/* ── Footer ── */}
      <Footer />
    </div>
  );
}
