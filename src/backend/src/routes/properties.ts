import { Router } from 'express';
import {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
} from '../controllers/propertyController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Properties
 *   description: Property management operations
 */

// Public routes
router.get('/', getProperties);
router.get('/:id', getPropertyById);

// Protected routes
router.post('/', authenticate, authorize('SUPER_ADMIN', 'MANAGER', 'AGENT'), createProperty);
router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'MANAGER', 'AGENT'), updateProperty);
router.delete('/:id', authenticate, authorize('SUPER_ADMIN', 'MANAGER'), deleteProperty);

export default router;
