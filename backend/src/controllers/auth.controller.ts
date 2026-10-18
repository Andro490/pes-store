import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ApiResponse } from '../types';

// In-memory users store (استبدل بـ Database لاحقاً)
const users: { id: string; name: string; email: string; password: string; role: string }[] = [];

// ─── Register ─────────────────────────────────────────────────────────────────
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role = 'student' } = req.body;

    // Validation
    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: 'Name, email and password are required' });
      return;
    }

    // Check if user exists
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      res.status(409).json({ success: false, message: 'Email already registered' });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      password: hashedPassword,
      role,
    };
    users.push(newUser);

    // Generate token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET as string,
      { expiresIn: (process.env.JWT_EXPIRES_IN as any) || '7d' }
    );

    const response: ApiResponse = {
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role },
      },
    };

    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: String(error) });
  }
};

// ─── Login ────────────────────────────────────────────────────────────────────
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required' });
      return;
    }

    // Find user
    const user = users.find(u => u.email === email);
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: (process.env.JWT_EXPIRES_IN as any) || '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: String(error) });
  }
};

// ─── Get Me ───────────────────────────────────────────────────────────────────
export const getMe = (req: Request, res: Response): void => {
  const user = users.find(u => u.id === req.user?.id);
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }
  res.json({
    success: true,
    message: 'User fetched',
    data: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
};

// ─── Admin Login (Credentials from .env) ──────────────────────────────────────
export const adminLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;
    const adminUser = process.env.ADMIN_USERNAME || 'admin';
    const adminPass = process.env.ADMIN_PASSWORD || 'pes2025@admin';

    if (!username || !password) {
      res.status(400).json({ success: false, message: 'اسم المستخدم وكلمة المرور مطلوبة' });
      return;
    }

    if (username.trim() !== adminUser.trim() || password !== adminPass) {
      res.status(401).json({ success: false, message: 'بيانات الدخول غير صحيحة. تأكد من اسم المستخدم وكلمة السر.' });
      return;
    }

    // Generate Admin JWT token
    const token = jwt.sign(
      { id: 'admin-root', email: `${adminUser}@pes.store`, role: 'admin' },
      process.env.JWT_SECRET || 'pes_store_jwt_super_secret_key_2025',
      { expiresIn: (process.env.JWT_EXPIRES_IN as any) || '7d' }
    );

    res.json({
      success: true,
      message: 'تم تسجيل دخول لوحة التحكم بنجاح 👑',
      data: {
        token,
        user: { id: 'admin-root', name: adminUser, role: 'admin' },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم', error: String(error) });
  }
};

// ─── Admin Verify Token ───────────────────────────────────────────────────────
export const verifyAdmin = (req: Request, res: Response): void => {
  res.json({
    success: true,
    message: 'جلسة الإدارة صالحة',
    data: req.user,
  });
};
