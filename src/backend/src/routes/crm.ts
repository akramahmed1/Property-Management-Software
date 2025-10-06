import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  updateLeadScore,
  getCustomers,
  getCustomer360,
} from '../controllers/crmController';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: CRM
 *   description: Customer Relationship Management operations
 */

// Lead routes
router.get('/leads', authenticate, getLeads);
router.get('/leads/:id', authenticate, getLeadById);
router.post('/leads', authenticate, authorize('SUPER_ADMIN', 'MANAGER', 'AGENT'), createLead);
router.put('/leads/:id', authenticate, authorize('SUPER_ADMIN', 'MANAGER', 'AGENT'), updateLead);
router.post('/leads/:id/score', authenticate, authorize('SUPER_ADMIN', 'MANAGER', 'AGENT'), updateLeadScore);

// Customer routes
router.get('/customers', authenticate, getCustomers);
router.get('/customers/:id', authenticate, getCustomer360);

export default router;
