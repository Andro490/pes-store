import { useState, useEffect, useRef } from 'react';

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
import { DeviceModal } from './components/modals/DeviceModal';
import { AccountDetailModal } from './components/modals/AccountDetailModal';
import { PurchaseModal } from './components/modals/PurchaseModal';
import { AccountFormModal } from './components/modals/AccountFormModal';
import { SupportChatWidget } from './components/support/SupportChatWidget';

// ─── Services & Types ──────────────────────────────────────────────
import { paymobApi } from './services/api';
import type { DeliveredAccount } from './types';

type AppView = 'store' | 'admin';

function getInitialView(): AppView {
  return window.location.pathname === '/admin' || window.location.hash === '#admin'
    ? 'admin'
    : 'store';
}

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>(getInitialView);

  // Paymob post-payment automatic verification & delivery state
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [paymentDeliveredAccount, setPaymentDeliveredAccount] = useState<DeliveredAccount | null>(null);
  const [paymentBanner, setPaymentBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const verifyingTxRef = useRef<string | null>(null);

  const navigateTo = (view: AppView) => {
    setCurrentView(view);
    window.history.pushState(null, '', view === 'admin' ? '/admin' : '/');
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
    setAdminUsername, setAdminPassword,
    checkAdminAuth, handleAdminLogin, handleAdminLogout,
  } = useAdminAuth(() => navigateTo('store'));

  // ── Accounts data + CRUD ─────────────────────────────────────────
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

  // ── Store UI state (modals, paymob) ──────────────────────────────
  const {
    isDeviceModalOpen, setIsDeviceModalOpen, handleOpenBuyFlow, handleSelectDevice,
    selectedAccountForView, setSelectedAccountForView,
    purchaseSuccessAccount, isPayingWithPaymob, paymobResponseData, paymobError,
    handlePayWithPaymob, handleOpenOrder, handleCloseOrder,
  } = useStore();

  // ── Bootstrap & Paymob Auto-Verification ──────────────────────────
  useEffect(() => {
    fetchAccounts();
    checkAdminAuth();

    // التحقق التلقائي إذا كان العميل عائداً من صفحة دفع Paymob
    const params = new URLSearchParams(window.location.search);
    const hasPaymobParams =
      params.get('paymob_callback') === 'true' ||
      params.has('success') ||
      params.has('id');

    if (hasPaymobParams) {
      const isSuccess = params.get('success') === 'true';
      const txId = params.get('id');

      let accountId = params.get('account_id');
      if (!accountId) {
        try {
          const pending = localStorage.getItem('pes_pending_purchase');
          if (pending) {
            const parsed = JSON.parse(pending);
            accountId = parsed.accountId;
          }
        } catch {
          // ignore storage error
        }
      }

      if (isSuccess && txId && accountId) {
        if (verifyingTxRef.current === txId) {
          return; // تم إرسال الطلب بالفعل، منع التكرار بالتوازي (Strict Mode)
        }
        verifyingTxRef.current = txId;

        setIsVerifyingPayment(true);
        paymobApi.verifyAndDeliver({
          transactionId: txId,
          accountId,
        })
          .then((res) => {
            if (res.success && res.data?.deliveredAccount) {
              setPaymentDeliveredAccount(res.data.deliveredAccount);
              setPaymentBanner({
                type: 'success',
                message: 'تم تأكيد الدفع من Paymob بنجاح! تم استلام بيانات حسابك 🎉',
              });
              fetchAccounts(); // تحديث قائمة الحسابات لخصم المخزون
            } else {
              setPaymentBanner({
                type: 'error',
                message: res.message || 'حدث خطأ أثناء استلام بيانات الحساب',
              });
            }
          })
          .catch((err: any) => {
            setPaymentBanner({
              type: 'error',
              message: err.message || 'فشل التحقق من نجاح الدفع مع Paymob',
            });
          })
          .finally(() => {
            setIsVerifyingPayment(false);
            try {
              localStorage.removeItem('pes_pending_purchase');
            } catch {}
            // تنظيف الرابط حتى لا يعيد الفحص عند عمل Refresh
            window.history.replaceState({}, document.title, window.location.pathname);
          });
      } else if (params.get('success') === 'false') {
        setPaymentBanner({
          type: 'error',
          message: 'تم إلغاء عملية الدفع عبر Paymob أو لم تكتمل بنجاح.',
        });
        try {
          localStorage.removeItem('pes_pending_purchase');
        } catch {}
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="app-wrapper">
      {/* Background glow orbs */}
      <div className="bg-glow-container">
        <div className="glow-orb-1" />
        <div className="glow-orb-2" />
        <div className="glow-orb-3" />
      </div>

      {/* ── Status Banner (Paymob results) ── */}
      {paymentBanner && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            left: '20px',
            maxWidth: '540px',
            margin: '0 auto',
            zIndex: 9999,
            padding: '14px 18px',
            borderRadius: '14px',
            background: paymentBanner.type === 'success' ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)',
            backdropFilter: 'blur(10px)',
            color: '#fff',
            fontWeight: 800,
            fontSize: '14px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            animation: 'fadeIn 0.3s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>{paymentBanner.type === 'success' ? '🎉' : '⚠️'}</span>
            <span>{paymentBanner.message}</span>
          </div>
          <button
            onClick={() => setPaymentBanner(null)}
            style={{
              background: 'rgba(0,0,0,0.2)',
              border: 'none',
              color: '#fff',
              borderRadius: '8px',
              padding: '4px 8px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Loading verification modal ── */}
      {isVerifyingPayment && (
        <div className="modal-backdrop-overlay" style={{ zIndex: 99999 }}>
          <div
            className="device-modal-card"
            style={{
              maxWidth: '420px',
              textAlign: 'center',
              padding: '36px 24px',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                border: '3px solid rgba(56, 189, 248, 0.2)',
                borderTopColor: '#38bdf8',
                margin: '0 auto 20px',
                animation: 'spin 1s linear infinite',
              }}
            />
            <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#38bdf8', marginBottom: '8px' }}>
              جاري التحقق من عملية الدفع...
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8' }}>
              ننتظر تأكيد بنك Paymob لاستلام بيانات حسابك فورياً ⚡
            </p>
          </div>
        </div>
      )}

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

      {/* ══ STORE VIEW ══════════════════════════════════════════════ */}
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

      {/* ══ MODALS ══════════════════════════════════════════════════ */}

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

      {/* نافذة اختيار الدفع عبر Paymob */}
      {purchaseSuccessAccount && (
        <PurchaseModal
          account={purchaseSuccessAccount}
          isPayingWithPaymob={isPayingWithPaymob}
          paymobResponseData={paymobResponseData}
          paymobError={paymobError}
          onClose={handleCloseOrder}
          onPayWithPaymob={handlePayWithPaymob}
          onPurchaseSuccess={fetchAccounts}
        />
      )}

      {/* نافذة تسليم بيانات الحساب الفعلية بعد تأكيد دفع Paymob بنجاح */}
      {paymentDeliveredAccount && (
        <PurchaseModal
          account={{
            id: paymentDeliveredAccount.accountId,
            title: paymentDeliveredAccount.accountTitle,
            platform: paymentDeliveredAccount.platform || 'android',
            price: paymentDeliveredAccount.price,
            currency: 'EGP',
            teamStrength: 0,
            coins: 0,
            gp: '',
            epicCount: 0,
            highlightPlayers: [],
            loginMethod: 'KONAMI ID',
            isAvailable: true,
            featured: false,
            imageUrl: '',
            details: '',
          }}
          isPayingWithPaymob={false}
          paymobResponseData={null}
          initialDeliveredData={paymentDeliveredAccount}
          onClose={() => setPaymentDeliveredAccount(null)}
          onPayWithPaymob={() => {}}
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
      <Footer
        isAdminLoggedIn={isAdminLoggedIn}
        onAdminClick={() => navigateTo('admin')}
      />
    </div>
  );
}
