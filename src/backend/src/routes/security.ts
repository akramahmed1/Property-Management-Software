import express from 'express';
import {
  getSecurityEvents,
  getSecurityStats,
  getSecurityConfig,
  updateSecurityConfig,
  validatePassword,
  generateSecureToken,
  checkLoginAttempts,
  recordFailedLogin,
  recordSuccessfulLogin,
  createSession,
  invalidateSession,
  invalidateUserSessions,
  checkRateLimit,
  cleanupExpiredSessions,
  cleanupExpiredRateLimits,
  logSecurityEvent,
  getSecurityDashboard,
  exportSecurityEvents,
} from '../controllers/securityController';
import { validateSession, requireRole } from '../middleware/security';
import { SecurityService } from '../services/securityService';

const router = express.Router();
const securityService = SecurityService.getInstance();

// Apply rate limiting to all security routes
router.use(securityService.getRateLimiter('general'));

// Public routes (no authentication required)
router.post('/validate-password', validatePassword);
router.post('/check-login-attempts', checkLoginAttempts);
router.post('/record-failed-login', recordFailedLogin);
router.post('/record-successful-login', recordSuccessfulLogin);
router.post('/create-session', createSession);
router.post('/check-rate-limit', checkRateLimit);

// Protected routes (authentication required)
router.use(validateSession);

// Security events
router.get('/events', getSecurityEvents);
router.get('/events/export', exportSecurityEvents);
router.post('/events/log', logSecurityEvent);

// Security statistics
router.get('/stats', getSecurityStats);

// Security configuration
router.get('/config', getSecurityConfig);
router.put('/config', requireRole(['SUPER_ADMIN', 'ADMIN']), updateSecurityConfig);

// Session management
router.delete('/sessions/:sessionId', invalidateSession);
router.delete('/sessions/user/:userId', requireRole(['SUPER_ADMIN', 'ADMIN']), invalidateUserSessions);

// Utility functions
router.post('/generate-token', generateSecureToken);

// Maintenance tasks (admin only)
router.post('/cleanup/sessions', requireRole(['SUPER_ADMIN', 'ADMIN']), cleanupExpiredSessions);
router.post('/cleanup/rate-limits', requireRole(['SUPER_ADMIN', 'ADMIN']), cleanupExpiredRateLimits);

// Dashboard
router.get('/dashboard', getSecurityDashboard);

export default router;