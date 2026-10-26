export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'student' | 'instructor';
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthPayload {
  id: string;
  email: string;
  role: string;
  adminSession?: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}
