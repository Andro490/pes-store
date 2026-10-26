import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ApiResponse } from '../types';

// In-memory users store (استبدل بـ Database لاحقاً)
const users: { id: string; name: string; email: string; password: string; role: string }[] = [];

// ─── Register ─────────────────────────────────────────────────────────────────
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;
    const role = 'student';

    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: 'Name, email and password are required' });
      return;
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      res.status(400).json({ success: false, message: 'A valid email address is required' });
      return;
    }

    const existingUser = users.find(u => u.email === normalizedEmail);
    if (existingUser) {
      res.status(409).json({ success: false, message: 'Email already registered' });
      return;
    }

    if (typeof password !== 'string' || password.length < 8) {
      res.status(400).json({ success: false, message: 'Password must be at least 8 characters long' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = {
      id: Date.now().toString(),
      name: String(name).trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role,
    };
    users.push(newUser);

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

// ─── Brute-Force Protection for Admin Login (5 failed attempts -> 1 hour lockout) ─
interface LoginAttemptRecord {
  attempts: number;
  lockUntil?: number;
  lastAttempt: number;
}

const loginAttempts = new Map<string, LoginAttemptRecord>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60 * 60 * 1000; // 1 hour

function getLockoutKeys(req: Request): string[] {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : '') ||
             req.socket.remoteAddress ||
             req.ip ||
             '127.0.0.1';
  const deviceId = (req.headers['x-device-id'] as string) || '';
  const keys: string[] = [`ip:${ip}`];
  if (deviceId && deviceId.trim()) {
    keys.push(`dev:${deviceId.trim()}`);
  }
  return keys;
}

function getLockInfo(req: Request) {
  const keys = getLockoutKeys(req);
  const now = Date.now();
  let maxLockUntil = 0;
  let maxAttempts = 0;

  for (const k of keys) {
    const rec = loginAttempts.get(k);
    if (rec) {
      if (rec.attempts > maxAttempts) maxAttempts = rec.attempts;
      if (rec.lockUntil && rec.lockUntil > maxLockUntil) {
        maxLockUntil = rec.lockUntil;
      }
    }
  }

  if (maxLockUntil > now) {
    const remainingSeconds = Math.ceil((maxLockUntil - now) / 1000);
    const remainingMinutes = Math.ceil(remainingSeconds / 60);
    return { isLocked: true, lockUntil: maxLockUntil, remainingSeconds, remainingMinutes, attempts: maxAttempts };
  }

  return { isLocked: false, lockUntil: 0, remainingSeconds: 0, remainingMinutes: 0, attempts: maxAttempts };
}

function registerFailure(req: Request) {
  const keys = getLockoutKeys(req);
  const now = Date.now();
  let maxAttempts = 0;

  for (const k of keys) {
    const rec = loginAttempts.get(k);
    if (rec && rec.attempts > maxAttempts) {
      maxAttempts = rec.attempts;
    }
  }

  const newAttempts = maxAttempts + 1;
  const lockUntil = newAttempts >= MAX_ATTEMPTS ? now + LOCKOUT_DURATION_MS : undefined;

  for (const k of keys) {
    loginAttempts.set(k, {
      attempts: newAttempts,
      lockUntil,
      lastAttempt: now,
    });
  }

  if (lockUntil) {
    return {
      isLocked: true,
      lockUntil,
      remainingSeconds: 3600,
      remainingMinutes: 60,
      remainingAttempts: 0,
      attempts: newAttempts,
    };
  }

  return {
    isLocked: false,
    lockUntil: 0,
    remainingSeconds: 0,
    remainingMinutes: 0,
    remainingAttempts: MAX_ATTEMPTS - newAttempts,
    attempts: newAttempts,
  };
}

function clearLockout(req: Request) {
  const keys = getLockoutKeys(req);
  for (const k of keys) {
    loginAttempts.delete(k);
  }
}

// Check Lock Status Endpoint
export const checkAdminLockStatus = (req: Request, res: Response): void => {
  const lockInfo = getLockInfo(req);
  res.json({
    success: true,
    data: lockInfo,
  });
};

// ─── Admin Login (Credentials from .env + 5 Attempts Lockout) ──────────────────
export const adminLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Check if client is currently locked out
    const lockInfo = getLockInfo(req);
    if (lockInfo.isLocked) {
      res.status(429).json({
        success: false,
        isLocked: true,
        lockUntil: lockInfo.lockUntil,
        remainingSeconds: lockInfo.remainingSeconds,
        remainingMinutes: lockInfo.remainingMinutes,
        message: `تم قفل محاولات تسجيل الدخول من هذا الجهاز بعد 5 محاولات خاطئة. يرجى الانتظار ${lockInfo.remainingMinutes} دقيقة.`,
      });
      return;
    }

    const { username, password } = req.body;
    const adminUser = process.env.ADMIN_USERNAME;
    const adminPass = process.env.ADMIN_PASSWORD;
    const jwtSecret = process.env.JWT_SECRET;

    if (!adminUser || !adminPass || !jwtSecret) {
      console.error('CRITICAL: ADMIN_USERNAME, ADMIN_PASSWORD or JWT_SECRET is not configured in .env');
      res.status(500).json({ success: false, message: 'خطأ في إعدادات النظام الأمنية. يرجى مراجعة المسؤول.' });
      return;
    }

    if (!username || !password) {
      res.status(400).json({ success: false, message: 'اسم المستخدم وكلمة المرور مطلوبة' });
      return;
    }

    // 2. Validate Credentials using timing-safe comparison
    const uA = Buffer.from(username.trim());
    const uB = Buffer.from(adminUser.trim());
    const pA = Buffer.from(password);
    const pB = Buffer.from(adminPass);

    const isUserMatch = uA.length === uB.length && require('crypto').timingSafeEqual(uA, uB);
    const isPassMatch = pA.length === pB.length && require('crypto').timingSafeEqual(pA, pB);

    if (!isUserMatch || !isPassMatch) {
      const failInfo = registerFailure(req);

      if (failInfo.isLocked) {
        res.status(429).json({
          success: false,
          isLocked: true,
          lockUntil: failInfo.lockUntil,
          remainingSeconds: failInfo.remainingSeconds,
          remainingMinutes: failInfo.remainingMinutes,
          message: 'تم استنفاد 5 محاولات خاطئة! تم قفل تسجيل الدخول من هذا الجهاز لمدة ساعة كاملة.',
        });
        return;
      }

      res.status(401).json({
        success: false,
        isLocked: false,
        remainingAttempts: failInfo.remainingAttempts,
        message: `بيانات الدخول غير صحيحة. متبقي لك ${failInfo.remainingAttempts} ${failInfo.remainingAttempts === 1 ? 'محاولة واحدة' : 'محاولات'} قبل حظر الجهاز لمدة ساعة.`,
      });
      return;
    }

    // 3. Login Successful -> Reset any failed attempt records
    clearLockout(req);

    // Generate Admin JWT token
    const token = jwt.sign(
      { id: 'admin-root', email: `${adminUser}@pes.store`, role: 'admin', adminSession: true },
      jwtSecret,
      { expiresIn: (process.env.JWT_EXPIRES_IN as any) || '7d' }
    );

    // Set secure HttpOnly cookie for XSS protection
    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: 'تم تسجيل دخول لوحة التحكم بنجاح 👑',
      data: {
        user: { id: 'admin-root', name: adminUser, role: 'admin' },
      },
    });
  } catch (error) {
    console.error('adminLogin error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم أثناء تسجيل الدخول' });
  }
};

// ─── Admin Logout ─────────────────────────────────────────────────────────────
export const adminLogout = (_req: Request, res: Response): void => {
  res.clearCookie('admin_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  res.json({ success: true, message: 'تم تسجيل الخروج بنجاح' });
};

// ─── Admin Verify Token ───────────────────────────────────────────────────────
export const verifyAdmin = (req: Request, res: Response): void => {
  res.json({
    success: true,
    message: 'جلسة الإدارة صالحة',
    data: req.user,
  });
};
