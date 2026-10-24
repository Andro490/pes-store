import { useState, useCallback } from 'react';
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
  setAdminUsername: (v: string) => void;
  setAdminPassword: (v: string) => void;
  checkAdminAuth: () => Promise<void>;
  handleAdminLogin: (e: React.FormEvent) => Promise<void>;
  handleAdminLogout: () => void;
}

export function useAdminAuth(onLogout?: () => void): UseAdminAuthReturn {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminAuthLoading, setAdminAuthLoading] = useState(false);
  const [adminAuthError, setAdminAuthError] = useState<string | null>(null);

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
    },
    [adminUsername, adminPassword]
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
    setAdminUsername,
    setAdminPassword,
    checkAdminAuth,
    handleAdminLogin,
    handleAdminLogout,
  };
}
