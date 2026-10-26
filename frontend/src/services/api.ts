import type { PesAccount } from '../types';

// API Base URL - uses Vite proxy in dev, direct URL in prod
const API_BASE = '/api';

// Generic fetch wrapper
const request = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = localStorage.getItem('token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
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
    request<{ success: boolean; message: string; data: { token: string; user: { id: string; name: string; role: string } } }>('/auth/admin-login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  adminVerify: () =>
    request<{ success: boolean; message: string; data: any }>('/auth/admin-verify'),

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
  buy: async (id: string, buyerPhone?: string): Promise<{ success: boolean; message: string; data: { deliveredAccount: any; remainingStock: number } }> => {
    return request(`/pes-accounts/${id}/buy`, {
      method: 'POST',
      body: JSON.stringify({ buyerPhone }),
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
    buyerPhone?: string;
  }): Promise<{ success: boolean; message: string; data: { deliveredAccount: any; alreadyDelivered?: boolean } }> => {
    return request('/paymob/verify-and-deliver', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },
};


