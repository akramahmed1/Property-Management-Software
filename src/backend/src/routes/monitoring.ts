import express from 'express';
import {
  getHealthCheck,
  getSystemMetrics,
  getPerformanceMetrics,
  getMetricsSummary,
  getAlerts,
  getDashboard,
  recordPerformanceMetric,
  cleanupOldMetrics,
  getSystemInfo,
  getDatabaseStats,
  getLogStats,
  exportMetrics,
} from '../controllers/monitoringController';
import { validateSession, requireRole } from '../middleware/security';

const router = express.Router();

// Public routes (no authentication required)
router.get('/health', getHealthCheck);
router.get('/system-info', getSystemInfo);

// Protected routes (authentication required)
router.use(validateSession);

// Metrics
router.get('/metrics/system', getSystemMetrics);
router.get('/metrics/performance', getPerformanceMetrics);
router.get('/metrics/summary', getMetricsSummary);
router.post('/metrics/performance', recordPerformanceMetric);

// Alerts and dashboard
router.get('/alerts', getAlerts);
router.get('/dashboard', getDashboard);

// Statistics
router.get('/stats/database', getDatabaseStats);
router.get('/stats/logs', getLogStats);

// Export
router.get('/export', exportMetrics);

// Maintenance (admin only)
router.post('/cleanup', requireRole(['SUPER_ADMIN', 'ADMIN']), cleanupOldMetrics);

export default router;