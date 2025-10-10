import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { logger } from './utils/logger';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';

// Import services
import NotificationService from './services/notificationService';
import PaymentService from './services/paymentService';
import FileService from './services/fileService';
import AnalyticsService from './services/analyticsService';
import WebSocketService from './services/websocketService';
import SecurityService from './services/securityService';
import PropertyService from './services/propertyService';
import AuthService from './services/authService';

// Import routes
import authRoutes from './routes/auth';
import propertyRoutes from './routes/properties';
import inventoryRoutes from './routes/inventory';
import crmRoutes from './routes/crm';
import erpRoutes from './routes/erp';
import reportRoutes from './routes/reports';
import webhookRoutes from './routes/webhooks';
import notificationRoutes from './routes/notifications';
import paymentRoutes from './routes/payments';
import fileRoutes from './routes/files';
import analyticsRoutes from './routes/analytics';
import securityRoutes from './routes/security';
import companyRoutes from './routes/company';
import projectRoutes from './routes/projects';
import leadRoutes from './routes/leads';
import bookingRoutes from './routes/bookings';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Initialize services
let notificationService: NotificationService;
let paymentService: PaymentService;
let fileService: FileService;
let analyticsService: AnalyticsService;
let webSocketService: WebSocketService;
let securityService: SecurityService;
let propertyService: PropertyService;
let authService: AuthService;

const PORT = process.env.PORT || 3000;

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Property Management API',
      version: '1.0.0',
      description: 'API documentation for Property Management Software MVP',
    },
    servers: [
      {
        url: `http://localhost:${PORT}/api`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  credentials: true
}));
app.use(compression());
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/erp', erpRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/v1/company', companyRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/leads', leadRoutes);
app.use('/api/v1/bookings', bookingRoutes);

// Initialize WebSocket service
webSocketService = new WebSocketService(server, notificationService);

// Make services available to routes
app.set('io', io);
app.set('notificationService', notificationService);
app.set('paymentService', paymentService);
app.set('fileService', fileService);
app.set('analyticsService', analyticsService);
app.set('webSocketService', webSocketService);
app.set('securityService', securityService);
app.set('propertyService', propertyService);
app.set('authService', authService);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();
    logger.info('Database connected successfully');
    
    // Connect to Redis
    await connectRedis();
    logger.info('Redis connected successfully');
    
    // Initialize services
    notificationService = NotificationService.getInstance();
    notificationService.setSocketIO(io);
    paymentService = PaymentService.getInstance();
    fileService = FileService.getInstance();
    analyticsService = AnalyticsService.getInstance();
    securityService = SecurityService.getInstance();
    propertyService = PropertyService.getInstance();
    authService = AuthService.getInstance();
    
    logger.info('All services initialized successfully');
    
    // Start HTTP server
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`API Documentation available at http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  logger.error('Unhandled Promise Rejection:', err);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

startServer();

export { app, server, io };
