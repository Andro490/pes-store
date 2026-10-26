import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

// Routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import pesRoutes from './routes/pesAccounts.routes';
import paymobRoutes from './routes/paymob.routes';
import supportRoutes from './routes/support.routes';

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Security Headers (Helmet) ───────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: false, // Vite / Client assets loaded dynamically
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// ─── Rate Limiting ───────────────────────────────────────────────────────────
// Global limiter: 300 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'تم تجاوز الحد المسموح من الطلبات. يرجى الانتظار قليلاً.' },
});
app.use('/api/', globalLimiter);

// Stricter auth limiter: 25 attempts per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'محاولات دخول كثيرة جداً. يرجى الانتظار 15 دقيقة.' },
});
app.use('/api/auth/admin-login', authLimiter);
app.use('/api/auth/login', authLimiter);

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(morgan('dev'));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/pes-accounts', pesRoutes);
app.use('/api/paymob', paymobRoutes);
app.use('/api/support', supportRoutes);

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is running 🚀',
    timestamp: new Date().toISOString(),
  });
});

// ─── Static Frontend (Production) ──────────────────────────────────────────
import path from 'path';
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// ─── 404 Handler for API ──────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'المسار المطلوب غير موجود' });
});

// ─── Safe Global Error Handler (Hides Internal Server Traces in Prod) ──────────
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'حدث خطأ غير متوقع في الخادم'
      : (err.message || 'Internal Server Error'),
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
import { seedInitialAccountsIfEmpty } from './services/prisma.service';

app.listen(PORT, async () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV}`);
  await seedInitialAccountsIfEmpty();
});

export default app;
