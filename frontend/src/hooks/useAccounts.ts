import { useState, useCallback, useMemo } from 'react';
import { pesAccountsApi } from '../services/api';
import type { PesAccount } from '../types';

export type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'strength';
export type PlatformFilter = 'all' | 'android' | 'ios';

export type AccountFormData = {
  title: string;
  platform: 'android' | 'ios';
  price: number;
  oldPrice: number;
  teamStrength: number;
  coins: number;
  gp: string;
  epicCount: number;
  highlightPlayers: string;
  loginMethod: string;
  badge: string;
  imageUrl: string;
  details: string;
  featured: boolean;
  bulkAccounts: string;
};

const DEFAULT_FORM: AccountFormData = {
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
  imageUrl:
    'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&auto=format&fit=crop&q=80',
  details: 'حساب مميز بأعلى قوة تناغم وجاهز للعب الفوري.',
  featured: true,
  bulkAccounts: '',
};

export interface UseAccountsReturn {
  // Data
  accounts: PesAccount[];
  filteredAccounts: PesAccount[];
  loading: boolean;
  error: string | null;
  // Filters
  selectedPlatform: PlatformFilter;
  setSelectedPlatform: (p: PlatformFilter) => void;
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  sortBy: SortOption;
  setSortBy: (s: SortOption) => void;
  // CRUD
  fetchAccounts: () => Promise<void>;
  handleSaveAccount: (e: React.FormEvent) => Promise<void>;
  handleTogglePaid: (account: PesAccount) => Promise<void>;
  handleDeleteAccount: (account: PesAccount) => Promise<void>;
  // Form modal state
  isAccountModalOpen: boolean;
  setIsAccountModalOpen: (v: boolean) => void;
  editingAccount: PesAccount | null;
  accountFormData: AccountFormData;
  setAccountFormData: React.Dispatch<React.SetStateAction<AccountFormData>>;
  handleOpenCreateModal: () => void;
  handleOpenEditModal: (account: PesAccount) => void;
  // Stats
  totalAccounts: number;
  availableAccounts: number;
  soldAccounts: number;
  totalRevenue: number;
}

export function useAccounts(): UseAccountsReturn {
  const [accounts, setAccounts] = useState<PesAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('featured');

  // Form modal
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<PesAccount | null>(null);
  const [accountFormData, setAccountFormData] = useState<AccountFormData>(DEFAULT_FORM);

  // ─── Filtered + sorted list ───
  const filteredAccounts = useMemo(() => {
    return accounts
      .filter((acc) => {
        if (selectedPlatform !== 'all' && acc.platform !== selectedPlatform) return false;
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          return (
            acc.title.toLowerCase().includes(term) ||
            acc.highlightPlayers.some((p) => p.toLowerCase().includes(term)) ||
            acc.details.toLowerCase().includes(term)
          );
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

  // ─── Stats ───
  const totalAccounts = accounts.length;
  const availableAccounts = accounts.filter((a) => a.isAvailable).length;
  const soldAccounts = accounts.filter((a) => !a.isAvailable).length;
  const totalRevenue = accounts
    .filter((a) => !a.isAvailable)
    .reduce((sum, a) => sum + a.price, 0);

  // ─── Fetch ───
  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await pesAccountsApi.getAll();
      if (res.data) setAccounts(res.data);
    } catch (err: any) {
      console.error('Error fetching accounts:', err);
      setError('فشل تحميل الحسابات. حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Modal helpers ───
  const handleOpenCreateModal = useCallback(() => {
    setEditingAccount(null);
    setAccountFormData(DEFAULT_FORM);
    setIsAccountModalOpen(true);
  }, []);

  const handleOpenEditModal = useCallback((account: PesAccount) => {
    setEditingAccount(account);
    setAccountFormData({
      title: account.title,
      platform: account.platform,
      price: account.price,
      oldPrice: account.oldPrice ?? account.price + 100,
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
      bulkAccounts: '',
    });
    setIsAccountModalOpen(true);
  }, []);

  // ─── CRUD ───
  const handleSaveAccount = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const payload: any = {
        ...accountFormData,
        price: Number(accountFormData.price),
        oldPrice: Number(accountFormData.oldPrice),
        teamStrength: Number(accountFormData.teamStrength),
        coins: Number(accountFormData.coins),
        epicCount: Number(accountFormData.epicCount),
        highlightPlayers: accountFormData.highlightPlayers.split(',').map((s) => s.trim()),
      };

      try {
        if (editingAccount) {
          const res = await pesAccountsApi.update(editingAccount.id, payload);
          if (res.success) {
            alert('تم التحديث بنجاح ✅');
            await fetchAccounts();
            setIsAccountModalOpen(false);
          }
        } else {
          const res = await pesAccountsApi.create(payload);
          if (res.success) {
            alert('تم نشر الحساب بنجاح ✅');
            await fetchAccounts();
            setIsAccountModalOpen(false);
          }
        }
      } catch (err: any) {
        alert('حدث خطأ: ' + err.message);
      }
    },
    [accountFormData, editingAccount, fetchAccounts]
  );

  const handleTogglePaid = useCallback(async (account: PesAccount) => {
    try {
      const res = await pesAccountsApi.togglePaid(account.id);
      if (res.success) {
        setAccounts((prev) =>
          prev.map((acc) =>
            acc.id === account.id ? { ...acc, isAvailable: !acc.isAvailable } : acc
          )
        );
      }
    } catch (err: any) {
      alert('فشل تغيير الحالة: ' + err.message);
    }
  }, []);

  const handleDeleteAccount = useCallback(
    async (account: PesAccount) => {
      if (!window.confirm(`هل أنت متأكد من حذف "${account.title}"?`)) return;
      try {
        const res = await pesAccountsApi.delete(account.id);
        if (res.success) {
          setAccounts((prev) => prev.filter((acc) => acc.id !== account.id));
          alert('تم الحذف بنجاح');
        }
      } catch (err: any) {
        alert('فشل الحذف: ' + err.message);
      }
    },
    []
  );

  return {
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
    fetchAccounts,
    handleSaveAccount,
    handleTogglePaid,
    handleDeleteAccount,
    isAccountModalOpen,
    setIsAccountModalOpen,
    editingAccount,
    accountFormData,
    setAccountFormData,
    handleOpenCreateModal,
    handleOpenEditModal,
    totalAccounts,
    availableAccounts,
    soldAccounts,
    totalRevenue,
  };
}
