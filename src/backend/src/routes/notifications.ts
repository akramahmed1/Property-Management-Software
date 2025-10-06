import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { Request, Response } from 'express';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Notification management operations
 */

// Get user notifications
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const userId = (req as any).user.id;

    const notificationService = req.app.get('notificationService');
    
    const notifications = await notificationService.getUserNotifications(
      userId,
      parseInt(limit as string),
      (parseInt(page as string) - 1) * parseInt(limit as string)
    );

    const unreadCount = await notificationService.getUnreadCount(userId);

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: notifications.length,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get notifications',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Mark notification as read
router.put('/:id/read', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    const notificationService = req.app.get('notificationService');
    await notificationService.markAsRead(id, userId);

    res.json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Mark all notifications as read
router.put('/read-all', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const notificationService = req.app.get('notificationService');
    await notificationService.markAllAsRead(userId);

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get unread count
router.get('/unread-count', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const notificationService = req.app.get('notificationService');
    const unreadCount = await notificationService.getUnreadCount(userId);

    res.json({
      success: true,
      data: { unreadCount },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Send test notification (admin only)
router.post('/test', authenticate, authorize('SUPER_ADMIN'), async (req: Request, res: Response) => {
  try {
    const { userId, type, title, message, channels = ['realtime'] } = req.body;

    const notificationService = req.app.get('notificationService');
    
    await notificationService.sendMultiChannelNotification(
      userId,
      {
        userId,
        type: type || 'TEST',
        title: title || 'Test Notification',
        message: message || 'This is a test notification',
        priority: 'medium',
      },
      channels
    );

    res.json({
      success: true,
      message: 'Test notification sent successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to send test notification',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
