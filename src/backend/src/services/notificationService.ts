import { PrismaClient, Notification, NotificationType, User } from '@prisma/client';
import { Server } from 'socket.io';
import nodemailer from 'nodemailer';
import twilio from 'twilio';
import { logger } from '../utils/logger';
import { Redis } from 'ioredis';

const prisma = new PrismaClient();

// Redis client for caching
let redis: Redis;
try {
  redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
} catch (error) {
  logger.warn('Redis connection failed, notification caching disabled:', error);
}

// Initialize email transporter
const emailTransporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  }
});

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID || '',
  process.env.TWILIO_AUTH_TOKEN || ''
);

export interface NotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  channels?: ('email' | 'sms' | 'push' | 'in_app')[];
}

export interface NotificationTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  channels: string[];
  variables: string[];
}

export class NotificationService {
  private static instance: NotificationService;
  private io: Server | null = null;
  private readonly CACHE_PREFIX = 'notification:';
  private readonly CACHE_TTL = 300; // 5 minutes

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Set Socket.IO instance for real-time notifications
   */
  public setSocketIO(io: Server) {
    this.io = io;
  }

  /**
   * Send notification to user
   */
  async sendNotification(notificationData: NotificationData) {
    try {
      const {
        userId,
        type,
        title,
        message,
        data = {},
        priority = 'medium',
        channels = ['in_app', 'email']
      } = notificationData;

      // Create notification record
      const notification = await prisma.notification.create({
        data: {
          userId,
          type,
          title,
          message,
          data,
          priority
        }
      });

      // Send through specified channels
      const promises = [];

      if (channels.includes('in_app')) {
        promises.push(this.sendInAppNotification(notification));
      }

      if (channels.includes('email')) {
        promises.push(this.sendEmailNotification(notification));
      }

      if (channels.includes('sms')) {
        promises.push(this.sendSMSNotification(notification));
      }

      if (channels.includes('push')) {
        promises.push(this.sendPushNotification(notification));
      }

      await Promise.allSettled(promises);

      logger.info(`Notification sent: ${notification.id} to user ${userId}`);

      return notification;
    } catch (error) {
      logger.error('Error sending notification:', error);
      throw error;
    }
  }

  /**
   * Send bulk notifications
   */
  async sendBulkNotifications(notifications: NotificationData[]) {
    try {
      const results = {
        success: 0,
        failed: 0,
        errors: [] as string[]
      };

      for (const notificationData of notifications) {
        try {
          await this.sendNotification(notificationData);
          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push(`${notificationData.userId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      logger.info(`Bulk notifications sent: ${results.success} success, ${results.failed} failed`);

      return results;
    } catch (error) {
      logger.error('Error sending bulk notifications:', error);
      throw error;
    }
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId: string, filters: any = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        isRead,
        type,
        priority,
        startDate,
        endDate
      } = filters;

      const where: any = { userId };

      if (isRead !== undefined) where.isRead = isRead;
      if (type) where.type = type;
      if (priority) where.priority = priority;

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.notification.count({ where })
      ]);

      return {
        notifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error fetching user notifications:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string) {
    try {
      const notification = await prisma.notification.update({
        where: {
          id: notificationId,
          userId
        },
        data: { isRead: true }
      });

      logger.info(`Notification marked as read: ${notificationId}`);

      return notification;
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string) {
    try {
      const result = await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true }
      });

      logger.info(`All notifications marked as read for user: ${userId}`);

      return { count: result.count };
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string, userId: string) {
    try {
      await prisma.notification.delete({
        where: {
          id: notificationId,
          userId
        }
      });

      logger.info(`Notification deleted: ${notificationId}`);

      return { success: true };
    } catch (error) {
      logger.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(userId: string, period: string = '30d') {
    try {
      const now = new Date();
      let startDate = new Date();

      switch (period) {
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(now.getDate() - 90);
          break;
        default:
          startDate.setDate(now.getDate() - 30);
      }

      const [
        totalNotifications,
        unreadNotifications,
        notificationsByType,
        notificationsByPriority
      ] = await Promise.all([
        prisma.notification.count({
          where: {
            userId,
            createdAt: { gte: startDate }
          }
        }),
        prisma.notification.count({
          where: {
            userId,
            isRead: false,
            createdAt: { gte: startDate }
          }
        }),
        prisma.notification.groupBy({
          by: ['type'],
          where: {
            userId,
            createdAt: { gte: startDate }
          },
          _count: { type: true }
        }),
        prisma.notification.groupBy({
          by: ['priority'],
          where: {
            userId,
            createdAt: { gte: startDate }
          },
          _count: { priority: true }
        })
      ]);

      return {
        period,
        totalNotifications,
        unreadNotifications,
        readNotifications: totalNotifications - unreadNotifications,
        readRate: totalNotifications > 0 ? ((totalNotifications - unreadNotifications) / totalNotifications) * 100 : 0,
        byType: notificationsByType.reduce((acc, item) => {
          acc[item.type] = item._count.type;
          return acc;
        }, {} as Record<string, number>),
        byPriority: notificationsByPriority.reduce((acc, item) => {
          acc[item.priority] = item._count.priority;
          return acc;
        }, {} as Record<string, number>)
      };
    } catch (error) {
      logger.error('Error fetching notification stats:', error);
      throw error;
    }
  }

  /**
   * Create notification template
   */
  async createTemplate(template: NotificationTemplate) {
    try {
      // Store template in Redis for quick access
      if (redis) {
        await redis.setex(
          `${this.CACHE_PREFIX}template:${template.id}`,
          this.CACHE_TTL,
          JSON.stringify(template)
        );
      }

      logger.info(`Notification template created: ${template.id}`);

      return template;
    } catch (error) {
      logger.error('Error creating notification template:', error);
      throw error;
    }
  }

  /**
   * Send notification using template
   */
  async sendTemplateNotification(
    templateId: string,
    userId: string,
    variables: Record<string, any>,
    channels: string[] = ['in_app', 'email']
  ) {
    try {
      // Get template from cache or database
      let template: NotificationTemplate | null = null;

      if (redis) {
        const cached = await redis.get(`${this.CACHE_PREFIX}template:${templateId}`);
        if (cached) {
          template = JSON.parse(cached);
        }
      }

      if (!template) {
        // Load from database or create default templates
        template = this.getDefaultTemplate(templateId);
      }

      if (!template) {
        throw new Error('Template not found');
      }

      // Replace variables in template
      let subject = template.subject;
      let body = template.body;

      for (const [key, value] of Object.entries(variables)) {
        const placeholder = `{{${key}}}`;
        subject = subject.replace(new RegExp(placeholder, 'g'), String(value));
        body = body.replace(new RegExp(placeholder, 'g'), String(value));
      }

      // Send notification
      return await this.sendNotification({
      userId,
        type: 'SYSTEM_ALERT' as NotificationType,
        title: subject,
        message: body,
        data: variables,
        channels
      });
    } catch (error) {
      logger.error('Error sending template notification:', error);
      throw error;
    }
  }

  // Private helper methods

  private async sendInAppNotification(notification: Notification) {
    try {
      if (this.io) {
        this.io.to(`user_${notification.userId}`).emit('notification', {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          priority: notification.priority,
          createdAt: notification.createdAt
        });
      }

      logger.debug(`In-app notification sent: ${notification.id}`);
    } catch (error) {
      logger.error('Error sending in-app notification:', error);
    }
  }

  private async sendEmailNotification(notification: Notification) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: notification.userId }
      });

      if (!user || !user.email) {
        logger.warn(`No email found for user: ${notification.userId}`);
        return;
      }

      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@propertymanagement.com',
        to: user.email,
        subject: notification.title,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">${notification.title}</h2>
            <p style="color: #666; line-height: 1.6;">${notification.message}</p>
            <div style="margin-top: 20px; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
              <p style="margin: 0; font-size: 12px; color: #999;">
                This is an automated notification from Property Management Software.
              </p>
            </div>
          </div>
        `
      };

      await emailTransporter.sendMail(mailOptions);

      logger.debug(`Email notification sent: ${notification.id} to ${user.email}`);
    } catch (error) {
      logger.error('Error sending email notification:', error);
    }
  }

  private async sendSMSNotification(notification: Notification) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: notification.userId }
      });

      if (!user || !user.phone) {
        logger.warn(`No phone found for user: ${notification.userId}`);
        return;
      }

      // Only send SMS for high priority notifications
      if (notification.priority !== 'high' && notification.priority !== 'urgent') {
        return;
      }

      await twilioClient.messages.create({
        body: `${notification.title}: ${notification.message}`,
        from: process.env.TWILIO_PHONE_NUMBER || '',
        to: user.phone
      });

      logger.debug(`SMS notification sent: ${notification.id} to ${user.phone}`);
    } catch (error) {
      logger.error('Error sending SMS notification:', error);
    }
  }

  private async sendPushNotification(notification: Notification) {
    try {
      // This would integrate with Firebase Cloud Messaging or similar
      // For now, we'll just log it
      logger.debug(`Push notification would be sent: ${notification.id}`);
    } catch (error) {
      logger.error('Error sending push notification:', error);
    }
  }

  private getDefaultTemplate(templateId: string): NotificationTemplate | null {
    const templates: Record<string, NotificationTemplate> = {
      'booking_created': {
        id: 'booking_created',
        name: 'Booking Created',
        subject: 'New Booking Created - {{propertyName}}',
        body: 'A new booking has been created for {{propertyName}} by {{customerName}} for ₹{{amount}}.',
        channels: ['in_app', 'email'],
        variables: ['propertyName', 'customerName', 'amount']
      },
      'booking_confirmed': {
        id: 'booking_confirmed',
        name: 'Booking Confirmed',
        subject: 'Booking Confirmed - {{propertyName}}',
        body: 'Your booking for {{propertyName}} has been confirmed. Booking ID: {{bookingId}}',
        channels: ['in_app', 'email', 'sms'],
        variables: ['propertyName', 'bookingId']
      },
      'payment_received': {
        id: 'payment_received',
        name: 'Payment Received',
        subject: 'Payment Received - ₹{{amount}}',
        body: 'Payment of ₹{{amount}} has been received for booking {{bookingId}}.',
        channels: ['in_app', 'email'],
        variables: ['amount', 'bookingId']
      },
      'lead_assigned': {
        id: 'lead_assigned',
        name: 'Lead Assigned',
        subject: 'New Lead Assigned - {{leadName}}',
        body: 'A new lead {{leadName}} has been assigned to you. Contact: {{phone}}',
        channels: ['in_app', 'email'],
        variables: ['leadName', 'phone']
      }
    };

    return templates[templateId] || null;
  }
}

export default NotificationService;