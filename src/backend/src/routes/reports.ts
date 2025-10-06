import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Reporting and analytics operations
 */

// Placeholder routes - will be implemented
router.get('/', (req, res) => {
  res.json({ message: 'Reports routes - to be implemented' });
});

export default router;
