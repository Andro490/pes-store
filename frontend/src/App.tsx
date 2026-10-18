import { useState, useEffect, useMemo } from 'react';
import { pesAccountsApi, paymobApi, authApi } from './services/api';
import type { PesAccount } from './types';

export default function App() {
  const initialIsAdminPath = window.location.pathname === '/admin' || window.location.hash === '#admin';
  const [currentView, setCurrentView] = useState<'store' | 'admin'>(initialIsAdminPath ? 'admin' : 'store');
  const [accounts, setAccounts] = useState<PesAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Admin authentication states
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminAuthLoading, setAdminAuthLoading] = useState(false);
  const [adminAuthError, setAdminAuthError] = useState<string | null>(null);
  const [adminUser, setAdminUser] = useState<{ name: string; role: string } | null>(null);

  // Store filter states
  const [selectedPlatform, setSelectedPlatform] = useState<'all' | 'android' | 'ios'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'strength'>('featured');

  // Modals for Store
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [selectedAccountForView, setSelectedAccountForView] = useState<PesAccount | null>(null);
  const [purchaseSuccessAccount, setPurchaseSuccessAccount] = useState<PesAccount | null>(null);

  // Paymob states
  const [isPayingWithPaymob, setIsPayingWithPaymob] = useState(false);
  const [paymobResponseData, setPaymobResponseData] = useState<any>(null);

  // Admin states
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<PesAccount | null>(null);
  const [accountFormData, setAccountFormData] = useState({
    title: '',
    platform: 'android' as 'android' | 'ios',
    price: 350,
    oldPrice: 450,
    teamStrength: 3180,
    coins: 1500,
    gp: '3.5M',
    epicCount: 12,
    highlightPlayers: 'Messi, Ronaldo, Vieira',
    loginMethod: 'Konami ID كامل البيانات والتغيير متاح',
    badge: 'الأكثر طلباً 🔥',
    imageUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&auto=format&fit=crop&q=80',
    details: 'تشكيلة بيس قوية جداً بتناغم كامل وأساطير خط الوسط والهجوم.',
    featured: false,
  });

  useEffect(() => {
    fetchAccounts();
    checkAdminAuth();

    const handlePopState = () => {
      const isAdminPath = window.location.pathname === '/admin' || window.location.hash === '#admin';
      setCurrentView(isAdminPath ? 'admin' : 'store');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateToView = (view: 'store' | 'admin') => {
    setCurrentView(view);
    if (view === 'admin') {
      window.history.pushState(null, '', '/admin');
    } else {
      window.history.pushState(null, '', '/');
    }
  };

  const checkAdminAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsAdminLoggedIn(false);
      return;
    }
    try {
      const res = await authApi.adminVerify();
      if (res && res.success) {
        setIsAdminLoggedIn(true);
        setAdminUser(res.data);
      } else {
        localStorage.removeItem('token');
        setIsAdminLoggedIn(false);
      }
    } catch {
      localStorage.removeItem('token');
      setIsAdminLoggedIn(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminAuthError(null);
    setAdminAuthLoading(true);
    try {
      const res = await authApi.adminLogin({
        username: adminUsername,
        password: adminPassword,
      });
      if (res.success && res.data.token) {
        localStorage.setItem('token', res.data.token);
        setIsAdminLoggedIn(true);
        setAdminUser(res.data.user);
        setAdminPassword('');
      }
    } catch (err: any) {
      setAdminAuthError(err.message || 'بيانات الدخول غير صحيحة');
    } finally {
      setAdminAuthLoading(false);
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('token');
    setIsAdminLoggedIn(false);
    setAdminUser(null);
    navigateToView('store');
  };

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await pesAccountsApi.getAll();
      if (res.data) {
        setAccounts(res.data);
      }
    } catch (err: any) {
      console.error('Error fetching accounts:', err);
      setError('تعذر تحميل الحسابات من الخادم. تأكد من تشغيل الـ Backend.');
    } finally {
      setLoading(false);
    }
  };

  // Filtered accounts for Store
  const filteredAccounts = useMemo(() => {
    return accounts
      .filter((acc) => {
        if (selectedPlatform !== 'all' && acc.platform !== selectedPlatform) {
          return false;
        }
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const matchTitle = acc.title.toLowerCase().includes(term);
          const matchPlayers = acc.highlightPlayers.some((p) => p.toLowerCase().includes(term));
          const matchDetails = acc.details.toLowerCase().includes(term);
          return matchTitle || matchPlayers || matchDetails;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'strength') return b.teamStrength - a.teamStrength;
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      });
  }, [accounts, selectedPlatform, searchTerm, sortBy]);

  // Main Buy Action
  const handleOpenBuyFlow = () => {
    setIsDeviceModalOpen(true);
  };

  // Select Device Type
  const handleSelectDevice = (platform: 'android' | 'ios' | 'all') => {
    setSelectedPlatform(platform);
    setIsDeviceModalOpen(false);

    const storeElem = document.getElementById('store-section');
    if (storeElem) {
      storeElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Paymob Payment Trigger
  const handlePayWithPaymob = async () => {
    if (!purchaseSuccessAccount) return;
    try {
      setIsPayingWithPaymob(true);
      const res = await paymobApi.initiate({
        accountId: purchaseSuccessAccount.id,
        accountTitle: purchaseSuccessAccount.title,
        amountEgp: purchaseSuccessAccount.price,
      });

      if (res.data) {
        setPaymobResponseData(res.data);
        if (res.data.checkoutUrl) {
          window.open(res.data.checkoutUrl, '_blank');
        }
      }
    } catch (err: any) {
      alert('حدث خطأ في الاتصال مع Paymob: ' + err.message);
    } finally {
      setIsPayingWithPaymob(false);
    }
  };

  // ─── Admin Actions ───
  const handleOpenCreateModal = () => {
    setEditingAccount(null);
    setAccountFormData({
      title: '',
      platform: 'android',
      price: 300,
      oldPrice: 400,
      teamStrength: 3170,
      coins: 1000,
      gp: '2.5M',
      epicCount: 10,
      highlightPlayers: 'Messi, Ronaldinho, Cruyff',
      loginMethod: 'Konami ID كامل البيانات والتغيير متاح',
      badge: 'عرض جديد ⚡',
      imageUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&auto=format&fit=crop&q=80',
      details: 'حساب مميز بأعلى قوة تناغم وجاهز للعب الفوري.',
      featured: true,
    });
    setIsAccountModalOpen(true);
  };

  const handleOpenEditModal = (account: PesAccount) => {
    setEditingAccount(account);
    setAccountFormData({
      title: account.title,
      platform: account.platform,
      price: account.price,
      oldPrice: account.oldPrice || account.price + 100,
      teamStrength: account.teamStrength,
      coins: account.coins,
      gp: account.gp,
      epicCount: account.epicCount,
      highlightPlayers: account.highlightPlayers.join(', '),
      loginMethod: account.loginMethod,
      badge: account.badge || '',
      imageUrl: account.imageUrl,
      details: account.details,
      featured: account.featured,
    });
    setIsAccountModalOpen(true);
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        ...accountFormData,
        price: Number(accountFormData.price),
        oldPrice: Number(accountFormData.oldPrice),
        teamStrength: Number(accountFormData.teamStrength),
        coins: Number(accountFormData.coins),
        epicCount: Number(accountFormData.epicCount),
        highlightPlayers: accountFormData.highlightPlayers.split(',').map((s) => s.trim()),
      };

      if (editingAccount) {
        const res = await pesAccountsApi.update(editingAccount.id, payload);
        if (res.success) {
          alert('تم تعديل بيانات الحساب بنجاح ✅');
          await fetchAccounts();
          setIsAccountModalOpen(false);
        }
      } else {
        const res = await pesAccountsApi.create(payload);
        if (res.success) {
          alert('تم رفع الحساب الجديد بنجاح ✅');
          await fetchAccounts();
          setIsAccountModalOpen(false);
        }
      }
    } catch (err: any) {
      alert('خطأ أثناء حفظ الحساب: ' + err.message);
    }
  };

  const handleTogglePaid = async (account: PesAccount) => {
    try {
      const res = await pesAccountsApi.togglePaid(account.id);
      if (res.success) {
        setAccounts((prev) =>
          prev.map((acc) => (acc.id === account.id ? { ...acc, isAvailable: !acc.isAvailable } : acc))
        );
      }
    } catch (err: any) {
      alert('خطأ أثناء تغيير حالة الدفع: ' + err.message);
    }
  };

  const handleDeleteAccount = async (account: PesAccount) => {
    if (!window.confirm(`هل أنت متأكد من حذف الحساب: "${account.title}"؟`)) {
      return;
    }
    try {
      const res = await pesAccountsApi.delete(account.id);
      if (res.success) {
        setAccounts((prev) => prev.filter((acc) => acc.id !== account.id));
        alert('تم حذف الحساب بنجاح 🗑️');
      }
    } catch (err: any) {
      alert('خطأ أثناء حذف الحساب: ' + err.message);
    }
  };

  // Stats calculation
  const totalAccounts = accounts.length;
  const availableAccounts = accounts.filter((a) => a.isAvailable).length;
  const soldAccounts = accounts.filter((a) => !a.isAvailable).length;
  const totalRevenue = accounts.filter((a) => !a.isAvailable).reduce((sum, a) => sum + a.price, 0);

  return (
    <div className="app-wrapper">
      {/* ─── Glowing Orbs ─── */}
      <div className="bg-glow-container">
        <div className="glow-orb-1" />
        <div className="glow-orb-2" />
        <div className="glow-orb-3" />
      </div>

      {/* ─── Navbar with View Switcher ─── */}
      <header className="site-header">
        <div className="header-container">
          <div className="logo-area" style={{ cursor: 'pointer' }} onClick={() => navigateToView('store')}>
            <div className="logo-icon-box">
              <div className="logo-icon-inner">⚽</div>
            </div>
            <div>
              <div className="logo-text-title">
                eFootball Store
                <span className="logo-badge">متجر بيس</span>
              </div>
              <div className="logo-subtitle">حسابات أصلية ومضمونة 100%</div>
            </div>
          </div>

          <nav className="header-nav">
            <button
              onClick={() => navigateToView('store')}
              style={{
                background: currentView === 'store' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                color: currentView === 'store' ? '#38bdf8' : 'var(--text-muted)',
                border: currentView === 'store' ? '1px solid rgba(6, 182, 212, 0.3)' : 'none',
                padding: '8px 16px',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>🛒</span>
              <span>واجهة المتجر</span>
            </button>

            {isAdminLoggedIn && (
              <>
                <button
                  onClick={() => navigateToView('admin')}
                  style={{
                    background: currentView === 'admin' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                    color: currentView === 'admin' ? '#a5b4fc' : 'var(--text-muted)',
                    border: currentView === 'admin' ? '1px solid rgba(99, 102, 241, 0.4)' : 'none',
                    padding: '8px 16px',
                    borderRadius: '12px',
                    fontWeight: 700,
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>⚙️</span>
                  <span>لوحة التحكم</span>
                </button>

                <button
                  onClick={handleAdminLogout}
                  title="تسجيل الخروج"
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#f87171',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    padding: '8px 14px',
                    borderRadius: '12px',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>🚪</span>
                  <span>خروج</span>
                </button>
              </>
            )}
          </nav>

          <div>
            {currentView === 'store' ? (
              <button onClick={handleOpenBuyFlow} className="btn-header-buy">
                <span>⚡</span>
                <span>شراء حساب</span>
              </button>
            ) : isAdminLoggedIn ? (
              <button onClick={handleOpenCreateModal} className="btn-header-buy" style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}>
                <span>➕</span>
                <span>رفع حساب جديد</span>
              </button>
            ) : null}
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════
          صفحة 1: لوحة تحكم الباك إند (Admin Dashboard & Login)
      ═══════════════════════════════════════════════════════ */}
      {currentView === 'admin' && !isAdminLoggedIn && (
        <main className="store-section" style={{ minHeight: '65vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '40px', paddingBottom: '60px' }}>
          <div style={{
            maxWidth: '460px',
            width: '100%',
            background: 'rgba(14, 18, 28, 0.9)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(99, 102, 241, 0.35)',
            borderRadius: '24px',
            padding: '36px 28px',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(99, 102, 241, 0.15)',
            textAlign: 'right'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{
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
                boxShadow: '0 8px 24px rgba(99, 102, 241, 0.2)'
              }}>
                🔐
              </div>
              <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#fff', marginBottom: '8px' }}>
                تسجيل دخول الإدارة
              </h1>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                منطقة محمية خاصة بمسؤول المتجر لإدارة الحسابات، وتحديد الأسعار وتحديث المعروضات
              </p>
            </div>

            {adminAuthError && (
              <div style={{
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
                gap: '8px'
              }}>
                <span>⚠️</span>
                <span>{adminAuthError}</span>
              </div>
            )}

            <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#cbd5e1', marginBottom: '8px' }}>
                  اسم المستخدم (Username)
                </label>
                <input
                  type="text"
                  required
                  placeholder="أدخل اسم المستخدم..."
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: '14px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-light)',
                    color: '#fff',
                    fontSize: '14px',
                    fontFamily: 'Cairo, sans-serif',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#cbd5e1', marginBottom: '8px' }}>
                  كلمة المرور (Password)
                </label>
                <input
                  type="password"
                  required
                  placeholder="أدخل كلمة المرور المعتمدة..."
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: '14px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-light)',
                    color: '#fff',
                    fontSize: '14px',
                    fontFamily: 'Cairo, sans-serif',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={adminAuthLoading}
                style={{
                  width: '100%',
                  padding: '15px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                  color: '#fff',
                  fontWeight: 900,
                  fontSize: '15px',
                  border: 'none',
                  cursor: adminAuthLoading ? 'not-allowed' : 'pointer',
                  opacity: adminAuthLoading ? 0.7 : 1,
                  boxShadow: '0 8px 25px rgba(99, 102, 241, 0.35)',
                  marginTop: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <span>{adminAuthLoading ? '⏳' : '🚀'}</span>
                <span>{adminAuthLoading ? 'جاري التحقق...' : 'دخول لوحة التحكم'}</span>
              </button>

              <button
                type="button"
                onClick={() => navigateToView('store')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginTop: '10px',
                  textAlign: 'center'
                }}
              >
                ← العودة إلى واجهة المتجر
              </button>
            </form>
          </div>
        </main>
      )}

      {currentView === 'admin' && isAdminLoggedIn && (
        <main className="store-section" style={{ paddingTop: '30px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '28px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#818cf8' }}>
                  ⚙️ إدارة النظام والمعروضات
                </span>
                <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                  👑 مرحباً: {adminUser?.name || 'المدير'}
                </span>
              </div>
              <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#fff' }}>
                لوحة تحكم حسابات بيس (Backend Dashboard)
              </h1>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={handleAdminLogout}
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
                  gap: '6px'
                }}
              >
                <span>🚪</span>
                <span>تسجيل الخروج</span>
              </button>

              <button
                onClick={handleOpenCreateModal}
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
                  gap: '8px'
                }}
              >
                <span>➕</span>
                <span>رفع حساب بيس جديد الآن</span>
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            <div className="stat-item-box" style={{ background: 'rgba(18, 24, 38, 0.8)' }}>
              <div className="stat-icon">📦</div>
              <div className="stat-value">{totalAccounts}</div>
              <div className="stat-label">إجمالي الحسابات</div>
            </div>
            <div className="stat-item-box" style={{ background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
              <div className="stat-icon">🟢</div>
              <div className="stat-value" style={{ color: '#34d399' }}>{availableAccounts}</div>
              <div className="stat-label">حسابات معروضة للبيع</div>
            </div>
            <div className="stat-item-box" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
              <div className="stat-icon">🔴</div>
              <div className="stat-value" style={{ color: '#f87171' }}>{soldAccounts}</div>
              <div className="stat-label">تم الدفع / مباعة</div>
            </div>
            <div className="stat-item-box" style={{ background: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
              <div className="stat-icon">💰</div>
              <div className="stat-value" style={{ color: '#fbbf24' }}>{totalRevenue} EGP</div>
              <div className="stat-label">قيمة المبيعات المحصلة</div>
            </div>
          </div>

          {/* Table / Cards List */}
          <div style={{ background: 'rgba(14, 18, 28, 0.85)', border: '1px solid var(--border-light)', borderRadius: '24px', padding: '24px', overflowX: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>قائمة جميع الحسابات وإدارتها</h2>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>يتم الحفظ تلقائياً في ملف accounts.json</span>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px 10px' }}>الحساب</th>
                  <th style={{ padding: '12px 10px' }}>النظام</th>
                  <th style={{ padding: '12px 10px' }}>السعر</th>
                  <th style={{ padding: '12px 10px' }}>قوة التشكيلة</th>
                  <th style={{ padding: '12px 10px' }}>الكوينز</th>
                  <th style={{ padding: '12px 10px' }}>الحالة</th>
                  <th style={{ padding: '12px 10px', textAlign: 'center' }}>إجراءات التحكم</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <tr key={account.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '14px 10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img
                          src={account.imageUrl}
                          alt={account.title}
                          style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover' }}
                        />
                        <div>
                          <div style={{ fontWeight: 800, color: '#fff', maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {account.title}
                          </div>
                          <span style={{ fontSize: '11px', color: '#38bdf8', fontFamily: 'monospace' }}>#{account.id}</span>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '14px 10px' }}>
                      <span className={`platform-badge ${account.platform}`} style={{ padding: '3px 8px', fontSize: '11px' }}>
                        {account.platform === 'android' ? '🤖 Android' : '🍏 iOS'}
                      </span>
                    </td>

                    <td style={{ padding: '14px 10px', fontWeight: 900, color: 'var(--accent-emerald)', fontFamily: 'Outfit, sans-serif' }}>
                      {account.price} {account.currency}
                    </td>

                    <td style={{ padding: '14px 10px', fontWeight: 700, color: '#fbbf24' }}>
                      ⚡ {account.teamStrength}
                    </td>

                    <td style={{ padding: '14px 10px', fontWeight: 700, color: '#f59e0b' }}>
                      🪙 {account.coins}
                    </td>

                    <td style={{ padding: '14px 10px' }}>
                      {account.isAvailable ? (
                        <span style={{ padding: '4px 10px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)', fontSize: '12px', fontWeight: 700 }}>
                          🟢 معروض للبيع
                        </span>
                      ) : (
                        <span style={{ padding: '4px 10px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', fontSize: '12px', fontWeight: 700 }}>
                          🔴 تم الدفع / مباع
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '14px 10px', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        {/* زر تبديل تم الدفع / متاح */}
                        <button
                          onClick={() => handleTogglePaid(account)}
                          title={account.isAvailable ? 'تحديد كـ تم الدفع' : 'إعادة متاح للبيع'}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '10px',
                            background: account.isAvailable ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            color: account.isAvailable ? '#f87171' : '#34d399',
                            border: `1px solid ${account.isAvailable ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {account.isAvailable ? 'تحديد: تم الدفع 🔒' : 'إعادة: متاح 🟢'}
                        </button>

                        {/* زر التعديل */}
                        <button
                          onClick={() => handleOpenEditModal(account)}
                          title="تعديل بيانات الحساب"
                          style={{
                            padding: '6px 12px',
                            borderRadius: '10px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            color: '#e2e8f0',
                            border: '1px solid var(--border-light)',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          ✏️ تعديل
                        </button>

                        {/* زر الحذف */}
                        <button
                          onClick={() => handleDeleteAccount(account)}
                          title="حذف الحساب نهائياً"
                          style={{
                            padding: '6px 10px',
                            borderRadius: '10px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#f87171',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            fontSize: '12px',
                            cursor: 'pointer'
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
      )}

      {/* ═══════════════════════════════════════════════════════
          صفحة 2: واجهة المتجر الرئيسية (Store Front)
      ═══════════════════════════════════════════════════════ */}
      {currentView === 'store' && (
        <>
          {/* Hero Section */}
          <section className="hero-section">
            <div className="hero-pill-tag">
              <span className="pulse-dot" />
              <span>تحديث فوري لأسعار حسابات eFootball 2026</span>
            </div>

            <h1 className="hero-main-title">
              متجر حسابات <span className="gradient-pes-text">بيس موبايل</span> الأقوى
            </h1>

            <p className="hero-desc">
              امتلك أقوى التشكيلات بأسعار خيالية. حسابات أندرويد و iOS موثقة مع كونامي ID وتغيير كامل للبيانات فور الشراء مع ضمان شامل.
            </p>

            <div className="hero-buttons-container">
              <button onClick={handleOpenBuyFlow} id="buy-main-button" className="btn-hero-primary-buy">
                <span>⚡</span>
                <span>شراء الآن</span>
                <span className="btn-hero-sub-tag">اختر جهازك</span>
              </button>

              <a href="#store-section" className="btn-hero-secondary">
                <span>استعراض كافة الحسابات</span>
                <span>👇</span>
              </a>
            </div>

            {/* Quick Stats Grid */}
            <div className="stats-grid-wrapper">
              <div className="stat-item-box">
                <div className="stat-icon">🏆</div>
                <div className="stat-value">+{totalAccounts}</div>
                <div className="stat-label">حساب معروض ومضمون</div>
              </div>
              <div className="stat-item-box">
                <div className="stat-icon">⭐</div>
                <div className="stat-value">4.9/5</div>
                <div className="stat-label">تقييم العملاء</div>
              </div>
              <div className="stat-item-box">
                <div className="stat-icon">⚡</div>
                <div className="stat-value">3 دقائق</div>
                <div className="stat-label">تسليم فوري ومباشر</div>
              </div>
              <div className="stat-item-box">
                <div className="stat-icon">💳</div>
                <div className="stat-value">Paymob & فيزا & كاش</div>
                <div className="stat-label">دفع إلكتروني فوري</div>
              </div>
            </div>
          </section>

          {/* Store Section */}
          <section id="store-section" className="store-section">
            <div className="store-header-row">
              <div>
                <div className="store-title-sub">
                  <span>🎮</span>
                  <span>سوق الحسابات الجاهزة</span>
                </div>
                <h2 className="store-main-title">اختر حسابك المفضل</h2>
              </div>

              {/* Search Box */}
              <div className="search-box-wrapper">
                <input
                  type="text"
                  placeholder="ابحث بلاعب (ميسي، رونالدو...)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input-field"
                />
                <span className="search-icon-pos">🔍</span>
              </div>
            </div>

            {/* Filter Bar (Android / iOS / الكل) */}
            <div className="filter-bar-card">
              <div className="filter-pills-group">
                <span className="filter-group-label">نظام التشغيل:</span>

                <button
                  onClick={() => setSelectedPlatform('all')}
                  className={`btn-filter-pill ${selectedPlatform === 'all' ? 'active-all' : ''}`}
                >
                  <span>🌐</span>
                  <span>جميع الحسابات</span>
                  <span className="pill-count-bubble">{accounts.length}</span>
                </button>

                <button
                  onClick={() => setSelectedPlatform('android')}
                  className={`btn-filter-pill ${selectedPlatform === 'android' ? 'active-android' : ''}`}
                >
                  <span>🤖</span>
                  <span>حسابات Android</span>
                  <span className="pill-count-bubble">
                    {accounts.filter((a) => a.platform === 'android').length}
                  </span>
                </button>

                <button
                  onClick={() => setSelectedPlatform('ios')}
                  className={`btn-filter-pill ${selectedPlatform === 'ios' ? 'active-ios' : ''}`}
                >
                  <span>🍏</span>
                  <span>حسابات iOS (آيفون/آيباد)</span>
                  <span className="pill-count-bubble">
                    {accounts.filter((a) => a.platform === 'ios').length}
                  </span>
                </button>
              </div>

              {/* Sorting */}
              <div className="sort-select-box">
                <span>ترتيب حسب:</span>
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="custom-select"
                >
                  <option value="featured">المميز أولاً</option>
                  <option value="strength">أعلى قوة تشكيلة</option>
                  <option value="price-asc">الأقل سعراً</option>
                  <option value="price-desc">الأعلى سعراً</option>
                </select>
              </div>
            </div>

            {/* Cards Grid */}
            {loading ? (
              <div style={{ padding: '80px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚽</div>
                <p style={{ color: 'var(--text-muted)' }}>جاري تحميل حسابات بيس...</p>
              </div>
            ) : error ? (
              <div style={{ padding: '30px', textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                <p style={{ color: '#f87171', fontWeight: 'bold', marginBottom: '12px' }}>{error}</p>
                <button onClick={fetchAccounts} className="btn-hero-secondary">إعادة المحاولة</button>
              </div>
            ) : filteredAccounts.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '20px' }}>
                <div style={{ fontSize: '36px', marginBottom: '10px' }}>🔍</div>
                <h3 style={{ color: '#fff', fontSize: '18px', marginBottom: '6px' }}>لا توجد حسابات مطابقة للبحث</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' }}>جرب تغيير شروط الفلترة أو مسح كلمة البحث</p>
                <button onClick={() => { setSelectedPlatform('all'); setSearchTerm(''); }} className="btn-filter-pill active-all">
                  إظهار كل الحسابات
                </button>
              </div>
            ) : (
              <div className="accounts-grid">
                {filteredAccounts.map((account) => (
                  <div key={account.id} className="account-square-card" style={{ opacity: account.isAvailable ? 1 : 0.85 }}>
                    {/* Image section */}
                    <div className="card-image-box">
                      <img src={account.imageUrl} alt={account.title} className="card-thumb-img" loading="lazy" />
                      <div className="card-img-overlay" />

                      {/* Sold / Paid Banner */}
                      {!account.isAvailable ? (
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          background: 'rgba(239, 68, 68, 0.9)',
                          color: '#fff',
                          textAlign: 'center',
                          padding: '6px',
                          fontWeight: 900,
                          fontSize: '13px',
                          zIndex: 10,
                          boxShadow: '0 4px 14px rgba(239, 68, 68, 0.5)'
                        }}>
                          🔒 تم الدفع / هذا الحساب مباع
                        </div>
                      ) : (
                        account.badge && (
                          <div className="card-badge-top-right">
                            <span className="promo-badge">{account.badge}</span>
                          </div>
                        )
                      )}

                      <div className="card-badge-top-left" style={{ top: account.isAvailable ? '12px' : '38px' }}>
                        <span className={`platform-badge ${account.platform}`}>
                          <span>{account.platform === 'android' ? '🤖' : '🍏'}</span>
                          <span>{account.platform === 'android' ? 'Android' : 'iOS'}</span>
                        </span>
                      </div>

                      <div className="card-strength-overlay">
                        <span className="strength-label">⚡ القوة:</span>
                        <span className="strength-num">{account.teamStrength}</span>
                      </div>
                    </div>

                    {/* Content Body */}
                    <div className="card-content-body">
                      <div>
                        <div className="card-price-row">
                          <div>
                            <div className="price-currency-tag">السعر المطلوب:</div>
                            <div className="price-main-block">
                              <span className="price-current-num">{account.price}</span>
                              <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--accent-emerald)' }}>{account.currency}</span>
                              {account.oldPrice && (
                                <span className="price-old-num">{account.oldPrice} {account.currency}</span>
                              )}
                            </div>
                          </div>

                          <div className="coins-pill-box">
                            <div className="coins-sub-txt">رصيد الكوينز</div>
                            <div className="coins-val-num">
                              <span>🪙</span>
                              <span>{account.coins}</span>
                            </div>
                          </div>
                        </div>

                        <h3 className="card-account-title">{account.title}</h3>

                        <div className="card-specs-row">
                          <div className="spec-mini-badge">
                            <span className="spec-name">أساطير الإبيك:</span>
                            <span className="spec-val-cyan">⭐ {account.epicCount} لاعب</span>
                          </div>
                          <div className="spec-mini-badge">
                            <span className="spec-name">رصيد GP:</span>
                            <span className="spec-val-indigo">💰 {account.gp}</span>
                          </div>
                        </div>

                        <div className="players-tag-container">
                          <div className="players-sub-heading">أبرز نجوم التشكيلة:</div>
                          <div className="players-flex-tags">
                            {account.highlightPlayers.slice(0, 3).map((player, idx) => (
                              <span key={idx} className="player-single-tag">{player}</span>
                            ))}
                            {account.highlightPlayers.length > 3 && (
                              <span className="player-more-tag">+{account.highlightPlayers.length - 3}</span>
                            )}
                          </div>
                        </div>

                        <div className="login-method-notice">
                          <span className="dot-green" />
                          <span>{account.loginMethod}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="card-actions-wrapper">
                        <button
                          onClick={() => setSelectedAccountForView(account)}
                          className="btn-card-preview"
                        >
                          <span>🔍</span>
                          <span>معاينة وتفاصيل</span>
                        </button>
                        
                        {account.isAvailable ? (
                          <button
                            onClick={() => {
                              setPurchaseSuccessAccount(account);
                              setPaymobResponseData(null);
                            }}
                            className="btn-card-order"
                          >
                            <span>⚡</span>
                            <span>طلب الحساب</span>
                          </button>
                        ) : (
                          <button
                            disabled
                            style={{
                              padding: '10px',
                              borderRadius: '12px',
                              background: 'rgba(255, 255, 255, 0.05)',
                              color: 'var(--text-dim)',
                              fontSize: '13px',
                              fontWeight: 700,
                              border: '1px solid var(--border-light)',
                              cursor: 'not-allowed'
                            }}
                          >
                            تم البيع 🚫
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════
          Modal: إضافة أو تعديل حساب بيس (Admin Form)
      ═══════════════════════════════════════════════════════ */}
      {isAccountModalOpen && (
        <div className="modal-backdrop-overlay">
          <div className="device-modal-card" style={{ maxWidth: '640px', textAlign: 'right', maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={() => setIsAccountModalOpen(false)} className="btn-modal-close">✕</button>

            <h3 className="modal-heading" style={{ marginBottom: '6px' }}>
              {editingAccount ? '✏️ تعديل بيانات الحساب' : '➕ إضافة ورفع حساب بيس جديد'}
            </h3>
            <p className="modal-subtext" style={{ marginBottom: '20px' }}>
              ادخل تفاصيل الحساب وستظهر فوراً في واجهة المتجر لجميع الزبائن.
            </p>

            <form onSubmit={handleSaveAccount} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* عنوان الحساب */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', display: 'block', marginBottom: '6px' }}>
                  عنوان الحساب (وصف جذاب):
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: تشكيلة خرافية 3190+ مع ميسي ورونالدو وكرويف"
                  value={accountFormData.title}
                  onChange={(e) => setAccountFormData({ ...accountFormData, title: e.target.value })}
                  className="search-input-field"
                  style={{ padding: '10px 14px' }}
                />
              </div>

              {/* المنصة والسعر */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', display: 'block', marginBottom: '6px' }}>
                    نظام التشغيل:
                  </label>
                  <select
                    value={accountFormData.platform}
                    onChange={(e: any) => setAccountFormData({ ...accountFormData, platform: e.target.value })}
                    className="custom-select"
                    style={{ width: '100%', padding: '10px 14px' }}
                  >
                    <option value="android">🤖 Android (أندرويد)</option>
                    <option value="ios">🍏 Apple iOS (أيفون / أيباد)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', display: 'block', marginBottom: '6px' }}>
                    السعر المطلوب (جنيه EGP):
                  </label>
                  <input
                    type="number"
                    required
                    value={accountFormData.price}
                    onChange={(e) => setAccountFormData({ ...accountFormData, price: Number(e.target.value) })}
                    className="search-input-field"
                    style={{ padding: '10px 14px' }}
                  />
                </div>
              </div>

              {/* قوة الفريق والكوينز والـ GP */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', display: 'block', marginBottom: '6px' }}>
                    قوة التشكيلة:
                  </label>
                  <input
                    type="number"
                    placeholder="3185"
                    value={accountFormData.teamStrength}
                    onChange={(e) => setAccountFormData({ ...accountFormData, teamStrength: Number(e.target.value) })}
                    className="search-input-field"
                    style={{ padding: '10px 14px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', display: 'block', marginBottom: '6px' }}>
                    رصيد الكوينز:
                  </label>
                  <input
                    type="number"
                    placeholder="1500"
                    value={accountFormData.coins}
                    onChange={(e) => setAccountFormData({ ...accountFormData, coins: Number(e.target.value) })}
                    className="search-input-field"
                    style={{ padding: '10px 14px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', display: 'block', marginBottom: '6px' }}>
                    رصيد GP:
                  </label>
                  <input
                    type="text"
                    placeholder="4.5M"
                    value={accountFormData.gp}
                    onChange={(e) => setAccountFormData({ ...accountFormData, gp: e.target.value })}
                    className="search-input-field"
                    style={{ padding: '10px 14px' }}
                  />
                </div>
              </div>

              {/* عدد الإبيك وأبرز اللاعبين */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', display: 'block', marginBottom: '6px' }}>
                    عدد نجوم الإبيك:
                  </label>
                  <input
                    type="number"
                    value={accountFormData.epicCount}
                    onChange={(e) => setAccountFormData({ ...accountFormData, epicCount: Number(e.target.value) })}
                    className="search-input-field"
                    style={{ padding: '10px 14px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', display: 'block', marginBottom: '6px' }}>
                    أبرز اللاعبين (مفصولة بفواصل):
                  </label>
                  <input
                    type="text"
                    placeholder="Messi, Ronaldo, Vieira, Kaka"
                    value={accountFormData.highlightPlayers}
                    onChange={(e) => setAccountFormData({ ...accountFormData, highlightPlayers: e.target.value })}
                    className="search-input-field"
                    style={{ padding: '10px 14px' }}
                  />
                </div>
              </div>

              {/* رابط الصورة وشارة الحساب */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', display: 'block', marginBottom: '6px' }}>
                    رابط صورة التشكيلة (Image URL):
                  </label>
                  <input
                    type="url"
                    value={accountFormData.imageUrl}
                    onChange={(e) => setAccountFormData({ ...accountFormData, imageUrl: e.target.value })}
                    className="search-input-field"
                    style={{ padding: '10px 14px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', display: 'block', marginBottom: '6px' }}>
                    شارة العرض:
                  </label>
                  <input
                    type="text"
                    placeholder="الأكثر طلباً 🔥"
                    value={accountFormData.badge}
                    onChange={(e) => setAccountFormData({ ...accountFormData, badge: e.target.value })}
                    className="search-input-field"
                    style={{ padding: '10px 14px' }}
                  />
                </div>
              </div>

              {/* تفاصيل إضافية */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', display: 'block', marginBottom: '6px' }}>
                  تفاصيل إضافية وطريقة الدخول:
                </label>
                <textarea
                  rows={2}
                  value={accountFormData.details}
                  onChange={(e) => setAccountFormData({ ...accountFormData, details: e.target.value })}
                  className="search-input-field"
                  style={{ padding: '10px 14px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsAccountModalOpen(false)}
                  className="btn-hero-secondary"
                  style={{ padding: '10px 20px', fontSize: '13px' }}
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  className="btn-card-order"
                  style={{ padding: '12px 28px', fontSize: '14px' }}
                >
                  {editingAccount ? 'حفظ التعديلات ✅' : 'رفع ونشر الحساب 🚀'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal: اختيار الجهاز عند الشراء ─── */}
      {isDeviceModalOpen && (
        <div className="modal-backdrop-overlay">
          <div className="device-modal-card">
            <button onClick={() => setIsDeviceModalOpen(false)} className="btn-modal-close">✕</button>

            <div className="modal-icon-badge">
              <div className="modal-icon-inner">📱</div>
            </div>

            <h3 className="modal-heading">ما هو نظام هاتفك؟</h3>
            <p className="modal-subtext">
              اختر نظام تشغيل جهازك لعرض الحسابات المتوافقة معك بدقة وضمان نقل الكوينز والتشكيلة بأمان 100%.
            </p>

            <div className="device-options-grid">
              <div onClick={() => handleSelectDevice('android')} className="device-picker-btn android-pick">
                <div className="device-emoji">🤖</div>
                <div className="device-btn-title">Android (أندرويد)</div>
                <div className="device-btn-sub">سامسونج، شاومي، أوبو، ريلمي...</div>
                <span className="device-action-tag">عرض حسابات أندرويد</span>
              </div>

              <div onClick={() => handleSelectDevice('ios')} className="device-picker-btn ios-pick">
                <div className="device-emoji">🍏</div>
                <div className="device-btn-title">Apple iOS (أيفون / أيباد)</div>
                <div className="device-btn-sub">جميع موديلات iPhone و iPad</div>
                <span className="device-action-tag">عرض حسابات iOS</span>
              </div>
            </div>

            <button onClick={() => handleSelectDevice('all')} className="btn-all-devices-link">
              تصفح جميع الحسابات دون فلترة (Android & iOS)
            </button>
          </div>
        </div>
      )}

      {/* ─── Modal: تفاصيل الحساب ─── */}
      {selectedAccountForView && (
        <div className="modal-backdrop-overlay">
          <div className="detail-modal-card">
            <div className="detail-modal-header">
              <img src={selectedAccountForView.imageUrl} alt={selectedAccountForView.title} className="detail-modal-img" />
              <button onClick={() => setSelectedAccountForView(null)} className="btn-modal-close">✕</button>
            </div>

            <div className="detail-modal-body">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#fff' }}>{selectedAccountForView.title}</h3>
                <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--accent-emerald)', fontFamily: 'Outfit, sans-serif' }}>
                  {selectedAccountForView.price} {selectedAccountForView.currency}
                </div>
              </div>

              <div className="detail-stats-grid">
                <div className="detail-stat-box">
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>قوة التشكيلة</div>
                  <div style={{ fontSize: '16px', fontWeight: '900', color: '#fbbf24' }}>⚡ {selectedAccountForView.teamStrength}</div>
                </div>
                <div className="detail-stat-box">
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>رصيد الكوينز</div>
                  <div style={{ fontSize: '16px', fontWeight: '900', color: '#f59e0b' }}>🪙 {selectedAccountForView.coins}</div>
                </div>
                <div className="detail-stat-box">
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>رصيد GP</div>
                  <div style={{ fontSize: '16px', fontWeight: '900', color: '#818cf8' }}>💰 {selectedAccountForView.gp}</div>
                </div>
                <div className="detail-stat-box">
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>لاعبي الإبيك</div>
                  <div style={{ fontSize: '16px', fontWeight: '900', color: '#38bdf8' }}>⭐ {selectedAccountForView.epicCount}</div>
                </div>
              </div>

              <div className="detail-desc-box">
                <div style={{ fontWeight: '700', marginBottom: '6px', color: '#fff' }}>تفاصيل إضافية:</div>
                {selectedAccountForView.details}
              </div>

              <div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px' }}>أبرز نجوم التشكيلة:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {selectedAccountForView.highlightPlayers.map((player, idx) => (
                    <span key={idx} className="player-single-tag" style={{ padding: '4px 10px', fontSize: '12px' }}>
                      ⚽ {player}
                    </span>
                  ))}
                </div>
              </div>

              <div className="detail-security-banner">
                <span style={{ fontSize: '20px' }}>🛡️</span>
                <span>
                  <strong>طريقة التسليم: </strong> {selectedAccountForView.loginMethod}. يتم تسليم الإيميل والباسورد فور إتمام الدفع مع شرح كامل لتسجيل الدخول بأمان.
                </span>
              </div>
            </div>

            <div className="detail-modal-footer">
              <button onClick={() => setSelectedAccountForView(null)} className="btn-hero-secondary" style={{ padding: '8px 18px', fontSize: '13px' }}>
                إغلاق
              </button>
              {selectedAccountForView.isAvailable ? (
                <button
                  onClick={() => {
                    const acc = selectedAccountForView;
                    setSelectedAccountForView(null);
                    setPurchaseSuccessAccount(acc);
                    setPaymobResponseData(null);
                  }}
                  className="btn-card-order"
                  style={{ padding: '10px 24px', fontSize: '14px' }}
                >
                  تأكيد طلب هذا الحساب ⚡
                </button>
              ) : (
                <span style={{ color: '#f87171', fontWeight: 800, fontSize: '13px' }}>هذا الحساب تم بيعه 🔴</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal: إتمام الطلب والدفع بـ Paymob ─── */}
      {purchaseSuccessAccount && (
        <div className="modal-backdrop-overlay">
          <div className="device-modal-card" style={{ maxWidth: '480px' }}>
            <button onClick={() => setPurchaseSuccessAccount(null)} className="btn-modal-close">✕</button>

            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.4)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>
              ✅
            </div>

            <h3 className="modal-heading">طلب شراء حساب بيس</h3>
            <p className="modal-subtext" style={{ marginBottom: '16px' }}>
              تم اختيار: <strong style={{ color: '#38bdf8' }}>{purchaseSuccessAccount.title}</strong>
            </p>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '16px', marginBottom: '20px', textAlign: 'right' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-muted)' }}>كود الحساب:</span>
                <span style={{ fontWeight: 'bold', color: '#38bdf8', fontFamily: 'monospace' }}>{purchaseSuccessAccount.id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-muted)' }}>نظام الجهاز:</span>
                <span style={{ fontWeight: 'bold', color: '#fff' }}>
                  {purchaseSuccessAccount.platform === 'android' ? '🤖 Android' : '🍏 iOS'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: 'var(--text-muted)' }}>المبلغ المطلوب:</span>
                <span style={{ fontWeight: '900', color: 'var(--accent-emerald)', fontSize: '18px', fontFamily: 'Outfit, sans-serif' }}>
                  {purchaseSuccessAccount.price} {purchaseSuccessAccount.currency}
                </span>
              </div>
            </div>

            {/* زر الدفع الإلكتروني عبر Paymob */}
            <button
              onClick={handlePayWithPaymob}
              disabled={isPayingWithPaymob}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                padding: '14px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                color: '#030712',
                fontWeight: '900',
                fontSize: '15px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(6, 182, 212, 0.4)',
                marginBottom: '10px'
              }}
            >
              <span>💳</span>
              <span>{isPayingWithPaymob ? 'جاري الاتصال بـ Paymob...' : 'الدفع الإلكتروني (فيزا / فودافون كاش - Paymob)'}</span>
            </button>

            {/* إشعار ورابط صفحة دفع Paymob */}
            {paymobResponseData && (
              <div style={{
                background: 'rgba(6, 182, 212, 0.1)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                borderRadius: '12px',
                padding: '14px',
                marginBottom: '14px',
                fontSize: '13px',
                color: '#38bdf8',
                textAlign: 'right'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '6px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>✅</span>
                  <span>تم تجهيز صفحة الدفع الرسمية من Paymob!</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  رقم العملية: <strong style={{ color: '#fff' }}>#{paymobResponseData.orderId}</strong>
                </div>

                {paymobResponseData.checkoutUrl && (
                  <a
                    href={paymobResponseData.checkoutUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      width: '100%',
                      padding: '12px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                      color: '#ffffff',
                      fontWeight: '800',
                      fontSize: '13px',
                      textDecoration: 'none',
                      boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)'
                    }}
                  >
                    <span>🚀</span>
                    <span>اضغط هنا للانتقال لصفحة دفع Paymob الآن</span>
                  </a>
                )}
              </div>
            )}

            {/* زر الواتساب المباشر */}
            <a
              href={`https://wa.me/201000000000?text=${encodeURIComponent(
                `السلام عليكم، أريد شراء حساب بيس (${purchaseSuccessAccount.title}) كود: ${purchaseSuccessAccount.id} بسعر ${purchaseSuccessAccount.price} ${purchaseSuccessAccount.currency} لجهاز ${purchaseSuccessAccount.platform}`
              )}`}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                padding: '13px',
                borderRadius: '14px',
                background: '#10b981',
                color: '#030712',
                fontWeight: '800',
                fontSize: '14px',
                textDecoration: 'none',
                boxShadow: '0 4px 16px var(--accent-emerald-glow)',
                marginBottom: '12px'
              }}
            >
              <span>💬</span>
              <span>تأكيد الشراء والتسليم عبر WhatsApp</span>
            </a>

            <button onClick={() => { setPurchaseSuccessAccount(null); setPaymobResponseData(null); }} className="btn-all-devices-link">
              الرجوع للمتجر
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="site-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', padding: '24px 30px' }}>
        <p style={{ margin: 0 }}>© 2026 eFootball Accounts Store - جميع الحقوق محفوظة لمتجر حسابات بيس موبايل</p>
        
        <div>
          <button
            onClick={() => navigateToView('admin')}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.25)',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'Cairo, sans-serif'
            }}
          >
            <span>🔐</span>
            <span>{isAdminLoggedIn ? 'لوحة تحكم المدير' : 'دخول الإدارة'}</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
