import { useState, useCallback, useEffect, useRef } from 'react';
import { authApi } from '../services/api';

export interface AdminUser {
  name: string;
  role: string;
}

export interface UseAdminAuthReturn {
  isAdminLoggedIn: boolean;
  adminUser: AdminUser | null;
  adminUsername: string;
  adminPassword: string;
  adminAuthLoading: boolean;
  adminAuthError: string | null;
  isLocked: boolean;
  lockRemainingSeconds: number;
  remainingAttempts: number | null;
  setAdminUsername: (v: string) => void;
  setAdminPassword: (v: string) => void;
  checkAdminAuth: () => Promise<void>;
  handleAdminLogin: (e: React.FormEvent) => Promise<void>;
  handleAdminLogout: () => void;
}

const LOCK_STORAGE_KEY = 'pes_admin_lock_until';

export function useAdminAuth(onLogout?: () => void): UseAdminAuthReturn {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminAuthLoading, setAdminAuthLoading] = useState(false);
  const [adminAuthError, setAdminAuthError] = useState<string | null>(null);

  // Lockout state
  const [isLocked, setIsLocked] = useState(false);
  const [lockRemainingSeconds, setLockRemainingSeconds] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start countdown timer
  const startCountdown = useCallback((seconds: number) => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setIsLocked(true);
    setLockRemainingSeconds(seconds);

    countdownRef.current = setInterval(() => {
      setLockRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          countdownRef.current = null;
          setIsLocked(false);
          setAdminAuthError(null);
          localStorage.removeItem(LOCK_STORAGE_KEY);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // On mount: check localStorage for existing lock, then check server
  useEffect(() => {
    const stored = localStorage.getItem(LOCK_STORAGE_KEY);
    if (stored) {
      const lockUntil = parseInt(stored, 10);
      const remaining = Math.ceil((lockUntil - Date.now()) / 1000);
      if (remaining > 0) {
        startCountdown(remaining);
        return; // No need to ping server
      } else {
        localStorage.removeItem(LOCK_STORAGE_KEY);
      }
    }

    // Also ping server in case locked from another tab/browser
    authApi.getAdminLockStatus().then(res => {
      if (res?.data?.isLocked && res.data.remainingSeconds > 0) {
        localStorage.setItem(LOCK_STORAGE_KEY, String(res.data.lockUntil));
        startCountdown(res.data.remainingSeconds);
      }
    }).catch(() => {/* ignore */});

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [startCountdown]);

  const checkAdminAuth = useCallback(async () => {
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
  }, []);

  const handleAdminLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (isLocked) return;
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
          setRemainingAttempts(null);
          localStorage.removeItem(LOCK_STORAGE_KEY);
        }
      } catch (err: any) {
        if (err.isLocked || err.status === 429) {
          // Device locked
          const seconds = err.remainingSeconds || 3600;
          const lockUntil = err.lockUntil || (Date.now() + seconds * 1000);
          localStorage.setItem(LOCK_STORAGE_KEY, String(lockUntil));
          startCountdown(seconds);
          setRemainingAttempts(0);
          setAdminAuthError(err.message || 'تم قفل تسجيل الدخول لمدة ساعة');
        } else {
          // Regular wrong password
          if (typeof err.remainingAttempts === 'number') {
            setRemainingAttempts(err.remainingAttempts);
          }
          setAdminAuthError(err.message || 'بيانات الدخول غير صحيحة');
        }
      } finally {
        setAdminAuthLoading(false);
      }
    },
    [adminUsername, adminPassword, isLocked, startCountdown]
  );

  const handleAdminLogout = useCallback(() => {
    localStorage.removeItem('token');
    setIsAdminLoggedIn(false);
    setAdminUser(null);
    onLogout?.();
  }, [onLogout]);

  return {
    isAdminLoggedIn,
    adminUser,
    adminUsername,
    adminPassword,
    adminAuthLoading,
    adminAuthError,
    isLocked,
    lockRemainingSeconds,
    remainingAttempts,
    setAdminUsername,
    setAdminPassword,
    checkAdminAuth,
    handleAdminLogin,
    handleAdminLogout,
  };
}
