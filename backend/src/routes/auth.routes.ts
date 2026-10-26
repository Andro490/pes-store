import { Router } from 'express';
import { register, login, getMe, adminLogin, verifyAdmin, checkAdminLockStatus } from '../controllers/auth.controller';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// GET /api/auth/me  (protected)
router.get('/me', authenticate, getMe);

// GET /api/auth/admin-status (Check device lockout status)
router.get('/admin-status', checkAdminLockStatus);

// POST /api/auth/admin-login (Admin credentials from .env)
router.post('/admin-login', adminLogin);

// GET /api/auth/admin-verify
router.get('/admin-verify', authenticate, authorizeRoles('admin'), verifyAdmin);

export default router;
