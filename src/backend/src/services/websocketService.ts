import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import NotificationService from './notificationService';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

class WebSocketService {
  private io: SocketIOServer;
  private notificationService: NotificationService;
  private connectedUsers: Map<string, string> = new Map(); // userId -> socketId

  constructor(server: HTTPServer, notificationService: NotificationService) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3001",
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    this.notificationService = notificationService;
    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware(): void {
    // Authentication middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        
        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        
        // Verify user exists and is active
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { id: true, role: true, isActive: true },
        });

        if (!user || !user.isActive) {
          return next(new Error('Authentication error: User not found or inactive'));
        }

        socket.userId = user.id;
        socket.userRole = user.role;
        next();
      } catch (error) {
        logger.error('WebSocket authentication error:', error);
        next(new Error('Authentication error: Invalid token'));
      }
    });
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      logger.info(`User ${socket.userId} connected via WebSocket`);

      // Store user connection
      if (socket.userId) {
        this.connectedUsers.set(socket.userId, socket.id);
        socket.join(`user_${socket.userId}`);
      }

      // Join role-based rooms
      if (socket.userRole) {
        socket.join(`role_${socket.userRole}`);
      }

      // Handle property updates
      socket.on('join_property', (propertyId: string) => {
        socket.join(`property_${propertyId}`);
        logger.info(`User ${socket.userId} joined property room: ${propertyId}`);
      });

      socket.on('leave_property', (propertyId: string) => {
        socket.leave(`property_${propertyId}`);
        logger.info(`User ${socket.userId} left property room: ${propertyId}`);
      });

      // Handle booking updates
      socket.on('join_booking', (bookingId: string) => {
        socket.join(`booking_${bookingId}`);
        logger.info(`User ${socket.userId} joined booking room: ${bookingId}`);
      });

      socket.on('leave_booking', (bookingId: string) => {
        socket.leave(`booking_${bookingId}`);
        logger.info(`User ${socket.userId} left booking room: ${bookingId}`);
      });

      // Handle lead updates
      socket.on('join_lead', (leadId: string) => {
        socket.join(`lead_${leadId}`);
        logger.info(`User ${socket.userId} joined lead room: ${leadId}`);
      });

      socket.on('leave_lead', (leadId: string) => {
        socket.leave(`lead_${leadId}`);
        logger.info(`User ${socket.userId} left lead room: ${leadId}`);
      });

      // Handle real-time collaboration
      socket.on('property_edit_start', (propertyId: string) => {
        socket.to(`property_${propertyId}`).emit('user_editing', {
          userId: socket.userId,
          propertyId,
          timestamp: new Date(),
        });
      });

      socket.on('property_edit_end', (propertyId: string) => {
        socket.to(`property_${propertyId}`).emit('user_stopped_editing', {
          userId: socket.userId,
          propertyId,
          timestamp: new Date(),
        });
      });

      // Handle live chat
      socket.on('send_message', async (data: {
        roomId: string;
        message: string;
        type: 'property' | 'booking' | 'lead' | 'general';
      }) => {
        try {
          const message = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: socket.userId,
            userName: await this.getUserName(socket.userId!),
            message: data.message,
            timestamp: new Date(),
            type: data.type,
          };

          // Broadcast to room
          this.io.to(data.roomId).emit('new_message', message);

          // Save to database
          await this.saveChatMessage(data.roomId, message);

          logger.info(`Message sent in room ${data.roomId} by user ${socket.userId}`);
        } catch (error) {
          logger.error('Failed to send message:', error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Handle typing indicators
      socket.on('typing_start', (roomId: string) => {
        socket.to(roomId).emit('user_typing', {
          userId: socket.userId,
          userName: 'User', // Would get from database
          timestamp: new Date(),
        });
      });

      socket.on('typing_stop', (roomId: string) => {
        socket.to(roomId).emit('user_stopped_typing', {
          userId: socket.userId,
          timestamp: new Date(),
        });
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        logger.info(`User ${socket.userId} disconnected from WebSocket`);
        
        if (socket.userId) {
          this.connectedUsers.delete(socket.userId);
        }
      });
    });
  }

  // Send notification to specific user
  async sendNotificationToUser(userId: string, notification: any): Promise<void> {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit('notification', notification);
    }
  }

  // Send notification to all users in a room
  async sendNotificationToRoom(roomId: string, notification: any): Promise<void> {
    this.io.to(roomId).emit('notification', notification);
  }

  // Broadcast to all connected users
  async broadcastToAll(event: string, data: any): Promise<void> {
    this.io.emit(event, data);
  }

  // Broadcast to users with specific role
  async broadcastToRole(role: string, event: string, data: any): Promise<void> {
    this.io.to(`role_${role}`).emit(event, data);
  }

  // Send property update
  async sendPropertyUpdate(propertyId: string, update: any): Promise<void> {
    this.io.to(`property_${propertyId}`).emit('property_updated', {
      propertyId,
      update,
      timestamp: new Date(),
    });
  }

  // Send booking update
  async sendBookingUpdate(bookingId: string, update: any): Promise<void> {
    this.io.to(`booking_${bookingId}`).emit('booking_updated', {
      bookingId,
      update,
      timestamp: new Date(),
    });
  }

  // Send lead update
  async sendLeadUpdate(leadId: string, update: any): Promise<void> {
    this.io.to(`lead_${leadId}`).emit('lead_updated', {
      leadId,
      update,
      timestamp: new Date(),
    });
  }

  // Send real-time analytics update
  async sendAnalyticsUpdate(analytics: any): Promise<void> {
    this.io.emit('analytics_updated', {
      analytics,
      timestamp: new Date(),
    });
  }

  // Send system alert
  async sendSystemAlert(alert: {
    type: 'info' | 'warning' | 'error' | 'success';
    title: string;
    message: string;
    data?: any;
  }): Promise<void> {
    this.io.emit('system_alert', {
      ...alert,
      timestamp: new Date(),
    });
  }

  // Get online users count
  getOnlineUsersCount(): number {
    return this.connectedUsers.size;
  }

  // Get online users by role
  async getOnlineUsersByRole(role: string): Promise<string[]> {
    const roleSockets = await this.io.in(`role_${role}`).fetchSockets();
    return roleSockets.map(socket => (socket as AuthenticatedSocket).userId!).filter(Boolean);
  }

  // Check if user is online
  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  // Get user's socket ID
  getUserSocketId(userId: string): string | undefined {
    return this.connectedUsers.get(userId);
  }

  // Private helper methods
  private async getUserName(userId: string): Promise<string> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });
      return user?.name || 'Unknown User';
    } catch (error) {
      logger.error('Failed to get user name:', error);
      return 'Unknown User';
    }
  }

  private async saveChatMessage(roomId: string, message: any): Promise<void> {
    try {
      // In a real implementation, you would save chat messages to the database
      // For now, we'll just log it
      logger.info(`Chat message saved for room ${roomId}:`, message);
    } catch (error) {
      logger.error('Failed to save chat message:', error);
    }
  }

  // Get WebSocket server instance
  getIO(): SocketIOServer {
    return this.io;
  }
}

export default WebSocketService;
