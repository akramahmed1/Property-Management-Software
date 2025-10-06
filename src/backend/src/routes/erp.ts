import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  getFinancialSummary,
  getPayments,
  getProcurementAlerts,
} from '../controllers/erpController';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: ERP
 *   description: Enterprise Resource Planning operations
 */

// Transaction routes
router.get('/transactions', authenticate, getTransactions);
router.post('/transactions', authenticate, authorize('SUPER_ADMIN', 'MANAGER'), createTransaction);
router.put('/transactions/:id', authenticate, authorize('SUPER_ADMIN', 'MANAGER'), updateTransaction);

// Financial routes
router.get('/financials', authenticate, getFinancialSummary);
router.get('/payments', authenticate, getPayments);

// Procurement routes
router.get('/procurement', authenticate, getProcurementAlerts);

export default router;
