import { Router } from 'express';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Webhooks
 *   description: Webhook endpoints for external integrations
 */

// Placeholder routes - will be implemented
router.post('/', (req, res) => {
  res.json({ message: 'Webhook routes - to be implemented' });
});

export default router;
