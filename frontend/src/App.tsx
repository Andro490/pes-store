import { useState, useEffect } from 'react';

// â”€â”€â”€ Hooks â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
import { useAdminAuth } from './hooks/useAdminAuth';
import { useAccounts } from './hooks/useAccounts';
import { useStore } from './hooks/useStore';

// â”€â”€â”€ Layout â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';

// â”€â”€â”€ Store Pages â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
import { HeroSection } from './components/store/HeroSection';
import { StoreSection } from './components/store/StoreSection';

// â”€â”€â”€ Admin Pages â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminDashboard } from './components/admin/AdminDashboard';

// â”€â”€â”€ Modals â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
import { DeviceModal } from './components/modals/DeviceModal';
import { AccountDetailModal } from './components/modals/AccountDetailModal';
import { PurchaseModal } from './components/modals/PurchaseModal';
import { AccountFormModal } from './components/modals/AccountFormModal';

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
type AppView = 'store' | 'admin';

function getInitialView(): AppView {
  return window.location.pathname === '/admin' || window.location.hash === '#admin'
    ? 'admin'
    : 'store';
}

// â”€â”€â”€ Root Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function App() {
  const [currentView, setCurrentView] = useState<AppView>(getInitialView);

  const navigateTo = (view: AppView) => {
    setCurrentView(view);
    window.history.pushState(null, '', view === 'admin' ? '/admin' : '/');
  };

  useEffect(() => {
    const handler = () => setCurrentView(getInitialView());
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  // â”€â”€ Admin auth â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const {
    isAdminLoggedIn, adminUser,
    adminUsername, adminPassword, adminAuthLoading, adminAuthError,
    setAdminUsername, setAdminPassword,
    checkAdminAuth, handleAdminLogin, handleAdminLogout,
  } = useAdminAuth(() => navigateTo('store'));

  // â”€â”€ Accounts data + CRUD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const {
    accounts, filteredAccounts, loading, error,
    selectedPlatform, setSelectedPlatform,
    searchTerm, setSearchTerm,
    sortBy, setSortBy,
    fetchAccounts, handleSaveAccount, handleTogglePaid, handleDeleteAccount,
    isAccountModalOpen, setIsAccountModalOpen,
    editingAccount, accountFormData, setAccountFormData,
    handleOpenCreateModal, handleOpenEditModal,
    totalAccounts, availableAccounts, soldAccounts, totalRevenue,
  } = useAccounts();

  // â”€â”€ Store UI state (modals, paymob) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const {
    isDeviceModalOpen, setIsDeviceModalOpen, handleOpenBuyFlow, handleSelectDevice,
    selectedAccountForView, setSelectedAccountForView,
    purchaseSuccessAccount, isPayingWithPaymob, paymobResponseData,
    handlePayWithPaymob, handleOpenOrder, handleCloseOrder,
  } = useStore();

  // â”€â”€ Bootstrap â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    fetchAccounts();
    checkAdminAuth();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <div className="app-wrapper">
      {/* Background glow orbs */}
      <div className="bg-glow-container">
        <div className="glow-orb-1" />
        <div className="glow-orb-2" />
        <div className="glow-orb-3" />
      </div>

      {/* â”€â”€ Navbar â”€â”€ */}
      <Navbar
        currentView={currentView}
        isAdminLoggedIn={isAdminLoggedIn}
        onNavigate={navigateTo}
        onLogout={handleAdminLogout}
        onBuyClick={handleOpenBuyFlow}
        onCreateAccount={handleOpenCreateModal}
      />

      {/* â•â• ADMIN VIEW â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {currentView === 'admin' && !isAdminLoggedIn && (
        <AdminLogin
          username={adminUsername}
          password={adminPassword}
          loading={adminAuthLoading}
          error={adminAuthError}
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
          onDeleteAccount={handleDeleteAccount}
        />
      )}

      {/* â•â• STORE VIEW â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {currentView === 'store' && (
        <>
          <HeroSection totalAccounts={totalAccounts} onBuyClick={handleOpenBuyFlow} />

          <StoreSection
            accounts={accounts}
            filteredAccounts={filteredAccounts}
            loading={loading}
            error={error}
            selectedPlatform={selectedPlatform}
            setSelectedPlatform={setSelectedPlatform}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            sortBy={sortBy}
            setSortBy={setSortBy}
            onFetchRetry={fetchAccounts}
            onPreview={setSelectedAccountForView}
            onOrder={handleOpenOrder}
          />
        </>
      )}

      {/* â•â• MODALS â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}

      {isDeviceModalOpen && (
        <DeviceModal
          onClose={() => setIsDeviceModalOpen(false)}
          onSelectDevice={(platform) => handleSelectDevice(platform, setSelectedPlatform)}
        />
      )}

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

      {purchaseSuccessAccount && (
        <PurchaseModal
          account={purchaseSuccessAccount}
          isPayingWithPaymob={isPayingWithPaymob}
          paymobResponseData={paymobResponseData}
          onClose={handleCloseOrder}
          onPayWithPaymob={handlePayWithPaymob}
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

      {/* â”€â”€ Footer â”€â”€ */}
      <Footer
        isAdminLoggedIn={isAdminLoggedIn}
        onAdminClick={() => navigateTo('admin')}
      />
    </div>
  );
}

