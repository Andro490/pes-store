export type PesAccount = {
  id: string;
  title: string;
  platform: 'android' | 'ios';
  price: number;
  oldPrice?: number;
  currency: string;
  teamStrength: number;
  coins: number;
  gp: string;
  epicCount: number;
  highlightPlayers: string[];
  loginMethod: string;
  isAvailable: boolean;
  featured: boolean;
  badge?: string;
  imageUrl: string;
  details: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'student' | 'instructor';
};

export type AuthResponse = {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
  };
};

export type ApiError = {
  success: false;
  message: string;
  error?: string;
};

// Also export runtime constants so Vite/ESM never throws "does not provide an export named"
export const PesAccount = {};
export const User = {};
