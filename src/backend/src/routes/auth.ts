import { Router } from 'express';
import { login, register, getProfile, refreshToken, logout } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and authorization
 */

// Public routes
router.post('/login', login);
router.post('/register', register);

// Protected routes
router.get('/me', authenticate, getProfile);
router.post('/refresh', authenticate, refreshToken);
router.post('/logout', authenticate, logout);

export default router;
