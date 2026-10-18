import { Router } from 'express';
import { getAllUsers, getUserProfile } from '../controllers/user.controller';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// GET /api/users/profile  (protected)
router.get('/profile', authenticate, getUserProfile);

// GET /api/users/all  (admin only)
router.get('/all', authenticate, authorizeRoles('admin'), getAllUsers);

export default router;
