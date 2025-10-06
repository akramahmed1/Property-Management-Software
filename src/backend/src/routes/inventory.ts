import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Inventory
 *   description: Inventory management operations
 */

// Placeholder routes - will be implemented
router.get('/', (req, res) => {
  res.json({ message: 'Inventory routes - to be implemented' });
});

export default router;
