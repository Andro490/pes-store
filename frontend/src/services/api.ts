import type { PesAccount } from '../types';

// API Base URL - uses Vite proxy in dev, direct URL in prod
const API_BASE = '/api';

// ─── Persistent Device ID ─────────────────────────────────────────────────────
function getDeviceId(): string {
  let deviceId = localStorage.getItem('pes_device_id');
  if (!deviceId) {
    deviceId = 'dev_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('pes_device_id', deviceId);
  }
  return deviceId;
}

// Generic fetch wrapper
const request = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = localStorage.getItem('token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'x-device-id': getDeviceId(),
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: 'include', // Send and receive HttpOnly cookies
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Request failed' }));
    const errorMsg = errorData.error ? `${errorData.message} (${errorData.error})` : (errorData.message || 'Request failed');
    const err: any = new Error(errorMsg);
    err.status = response.status;
    err.isLocked = errorData.isLocked;
    err.lockUntil = errorData.lockUntil;
    err.remainingSeconds = errorData.remainingSeconds;
    err.remainingAttempts = errorData.remainingAttempts;
    throw err;
  }

  return response.json();
};

// ─── Auth API ─────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  adminLogin: (data: { username: string; password: string }) =>
    request<{ success: boolean; message: string; data: { user: { id: string; name: string; role: string } } }>('/auth/admin-login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  adminLogout: () =>
    request<{ success: boolean; message: string }>('/auth/admin-logout', {
      method: 'POST',
    }),

  adminVerify: () =>
    request<{ success: boolean; message: string; data: any }>('/auth/admin-verify'),

  getAdminLockStatus: () =>
    request<{ success: boolean; data: { isLocked: boolean; lockUntil: number; remainingSeconds: number; remainingMinutes: number; attempts: number } }>('/auth/admin-status'),

  getMe: () => request('/auth/me'),
};

// ─── Users API ────────────────────────────────────────────────────────────────
export const usersApi = {
  getProfile: () => request('/users/profile'),
  getAll: () => request('/users/all'),
};

// ─── PES Accounts API ─────────────────────────────────────────────────────────
export const pesAccountsApi = {
  getAll: async (params?: { platform?: 'android' | 'ios'; search?: string }): Promise<{ success: boolean; count: number; data: PesAccount[] }> => {
    const query = new URLSearchParams();
    if (params?.platform) query.append('platform', params.platform);
    if (params?.search) query.append('search', params.search);

    const qs = query.toString() ? `?${query.toString()}` : '';
    return request(`/pes-accounts${qs}`);
  },
  getById: async (id: string): Promise<{ success: boolean; data: PesAccount }> => {
    return request(`/pes-accounts/${id}`);
  },
  create: async (data: any): Promise<{ success: boolean; message: string; data: PesAccount }> => {
    return request('/pes-accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  update: async (id: string, data: any): Promise<{ success: boolean; message: string; data: PesAccount }> => {
    return request(`/pes-accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  togglePaid: async (id: string): Promise<{ success: boolean; message: string; data: PesAccount }> => {
    return request(`/pes-accounts/${id}/toggle-paid`, {
      method: 'PATCH',
    });
  },
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    return request(`/pes-accounts/${id}`, {
      method: 'DELETE',
    });
  },
  getStock: async (id: string): Promise<{ success: boolean; data: { count: number; stocks: any[] } }> => {
    return request(`/pes-accounts/${id}/stock`);
  },
  addStock: async (id: string, bulkAccounts: string): Promise<{ success: boolean; message: string; data: any }> => {
    return request(`/pes-accounts/${id}/stock`, {
      method: 'POST',
      body: JSON.stringify({ bulkAccounts }),
    });
  },
  deleteStockItem: async (stockId: string): Promise<{ success: boolean; message: string }> => {
    return request(`/pes-accounts/stock/${stockId}`, {
      method: 'DELETE',
    });
  },
};

// ─── Paymob API ───────────────────────────────────────────────────────────────
export const paymobApi = {
  initiate: async (params: {
    accountId: string;
    accountTitle: string;
    amountEgp: number;
    customer?: { firstName: string; lastName: string; email: string; phone: string };
  }) => {
    return request<any>('/paymob/initiate', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },
  verifyAndDeliver: async (params: {
    transactionId: string | number;
    accountId: string;
    claimToken: string;
  }): Promise<{ success: boolean; message: string; data: { deliveredAccount: any; alreadyDelivered?: boolean } }> => {
    return request('/paymob/verify-and-deliver', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },
};

// ─── Support Chat API ────────────────────────────────────────────────────────
export interface SupportMessageItem {
  id: string;
  phone: string;
  sender: 'user' | 'admin';
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface SupportConversationItem {
  phone: string;
  lastMessage: string;
  lastSender: string;
  lastTime: string;
  unreadCount: number;
  totalMessages: number;
}

export const supportApi = {
  sendMessage: async (phone: string, message: string) => {
    const cleanPhone = phone.trim();
    return request<{ success: boolean; data: SupportMessageItem }>('/support/message', {
      method: 'POST',
      body: JSON.stringify({ phone: cleanPhone, message }),
    });
  },

  getMessages: async (phone: string) => {
    const cleanPhone = phone.trim();
    return request<{ success: boolean; data: SupportMessageItem[] }>(
      `/support/messages/${encodeURIComponent(cleanPhone)}`,
    );
  },

  getConversations: () =>
    request<{ success: boolean; data: SupportConversationItem[] }>('/support/conversations'),

  sendReply: (phone: string, message: string) =>
    request<{ success: boolean; data: SupportMessageItem }>('/support/reply', {
      method: 'POST',
      body: JSON.stringify({ phone, message }),
    }),

  deleteConversation: (phone: string) =>
    request<{ success: boolean; message: string }>(`/support/conversations/${encodeURIComponent(phone)}`, {
      method: 'DELETE',
    }),
};
