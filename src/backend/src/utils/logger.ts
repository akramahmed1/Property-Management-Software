import winston from 'winston';
import { Request, Response } from 'express';

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'property-management-api' },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    // File transport for errors
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // File transport for all logs
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ],
  
  // Handle exceptions
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' })
  ],
  
  // Handle rejections
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' })
  ]
});

// Add request logging middleware
export const requestLogger = (req: Request, res: Response, next: Function) => {
  const start = Date.now();
  
  // Log request
  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  
  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any) {
    const duration = Date.now() - start;
    
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
    
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

// Security event logger
export const securityLogger = {
  loginAttempt: (userId: string, success: boolean, ip: string, userAgent: string) => {
    logger.warn('Login attempt', {
      userId,
      success,
      ip,
      userAgent,
      eventType: 'LOGIN_ATTEMPT',
      timestamp: new Date().toISOString()
    });
  },
  
  suspiciousActivity: (userId: string, activity: string, ip: string, metadata: any) => {
    logger.error('Suspicious activity detected', {
      userId,
      activity,
      ip,
      metadata,
      eventType: 'SUSPICIOUS_ACTIVITY',
      timestamp: new Date().toISOString()
    });
  },
  
  dataAccess: (userId: string, resource: string, action: string, ip: string) => {
    logger.info('Data access', {
      userId,
      resource,
      action,
      ip,
      eventType: 'DATA_ACCESS',
      timestamp: new Date().toISOString()
    });
  },
  
  systemError: (error: Error, context: string, metadata: any) => {
    logger.error('System error', {
      error: error.message,
      stack: error.stack,
      context,
      metadata,
      eventType: 'SYSTEM_ERROR',
      timestamp: new Date().toISOString()
    });
  }
};

// Performance logger
export const performanceLogger = {
  databaseQuery: (query: string, duration: number, success: boolean) => {
    logger.info('Database query', {
      query,
      duration: `${duration}ms`,
      success,
      eventType: 'DATABASE_QUERY',
      timestamp: new Date().toISOString()
    });
  },
  
  apiCall: (endpoint: string, duration: number, statusCode: number) => {
    logger.info('API call', {
      endpoint,
      duration: `${duration}ms`,
      statusCode,
      eventType: 'API_CALL',
      timestamp: new Date().toISOString()
    });
  },
  
  externalService: (service: string, duration: number, success: boolean) => {
    logger.info('External service call', {
      service,
      duration: `${duration}ms`,
      success,
      eventType: 'EXTERNAL_SERVICE',
      timestamp: new Date().toISOString()
    });
  }
};

// Business logic logger
export const businessLogger = {
  propertyCreated: (propertyId: string, userId: string, metadata: any) => {
    logger.info('Property created', {
      propertyId,
      userId,
      metadata,
      eventType: 'PROPERTY_CREATED',
      timestamp: new Date().toISOString()
    });
  },
  
  leadConverted: (leadId: string, bookingId: string, userId: string) => {
    logger.info('Lead converted to booking', {
      leadId,
      bookingId,
      userId,
      eventType: 'LEAD_CONVERTED',
      timestamp: new Date().toISOString()
    });
  },
  
  paymentProcessed: (paymentId: string, amount: number, currency: string, userId: string) => {
    logger.info('Payment processed', {
      paymentId,
      amount,
      currency,
      userId,
      eventType: 'PAYMENT_PROCESSED',
      timestamp: new Date().toISOString()
    });
  },
  
  userRegistered: (userId: string, email: string, role: string) => {
    logger.info('User registered', {
      userId,
      email,
      role,
      eventType: 'USER_REGISTERED',
      timestamp: new Date().toISOString()
    });
  }
};

// Audit logger
export const auditLogger = {
  dataModified: (userId: string, entity: string, entityId: string, action: string, oldData: any, newData: any) => {
    logger.info('Data modification', {
      userId,
      entity,
      entityId,
      action,
      oldData,
      newData,
      eventType: 'DATA_MODIFIED',
      timestamp: new Date().toISOString()
    });
  },
  
  permissionChanged: (userId: string, targetUserId: string, permissions: string[]) => {
    logger.warn('Permission changed', {
      userId,
      targetUserId,
      permissions,
      eventType: 'PERMISSION_CHANGED',
      timestamp: new Date().toISOString()
    });
  },
  
  configurationChanged: (userId: string, configKey: string, oldValue: any, newValue: any) => {
    logger.info('Configuration changed', {
      userId,
      configKey,
      oldValue,
      newValue,
      eventType: 'CONFIGURATION_CHANGED',
      timestamp: new Date().toISOString()
    });
  }
};

// Error logger with context
export const errorLogger = {
  validationError: (field: string, value: any, rule: string, context: string) => {
    logger.warn('Validation error', {
      field,
      value,
      rule,
      context,
      eventType: 'VALIDATION_ERROR',
      timestamp: new Date().toISOString()
    });
  },
  
  authenticationError: (reason: string, ip: string, userAgent: string) => {
    logger.warn('Authentication error', {
      reason,
      ip,
      userAgent,
      eventType: 'AUTHENTICATION_ERROR',
      timestamp: new Date().toISOString()
    });
  },
  
  authorizationError: (userId: string, resource: string, action: string, ip: string) => {
    logger.warn('Authorization error', {
      userId,
      resource,
      action,
      ip,
      eventType: 'AUTHORIZATION_ERROR',
      timestamp: new Date().toISOString()
    });
  },
  
  databaseError: (operation: string, table: string, error: Error) => {
    logger.error('Database error', {
      operation,
      table,
      error: error.message,
      stack: error.stack,
      eventType: 'DATABASE_ERROR',
      timestamp: new Date().toISOString()
    });
  },
  
  externalServiceError: (service: string, endpoint: string, error: Error) => {
    logger.error('External service error', {
      service,
      endpoint,
      error: error.message,
      stack: error.stack,
      eventType: 'EXTERNAL_SERVICE_ERROR',
      timestamp: new Date().toISOString()
    });
  }
};

// Metrics logger
export const metricsLogger = {
  userActivity: (userId: string, activity: string, metadata: any) => {
    logger.info('User activity', {
      userId,
      activity,
      metadata,
      eventType: 'USER_ACTIVITY',
      timestamp: new Date().toISOString()
    });
  },
  
  systemMetrics: (cpu: number, memory: number, disk: number) => {
    logger.info('System metrics', {
      cpu: `${cpu}%`,
      memory: `${memory}%`,
      disk: `${disk}%`,
      eventType: 'SYSTEM_METRICS',
      timestamp: new Date().toISOString()
    });
  },
  
  businessMetrics: (metric: string, value: number, context: any) => {
    logger.info('Business metrics', {
      metric,
      value,
      context,
      eventType: 'BUSINESS_METRICS',
      timestamp: new Date().toISOString()
    });
  }
};

export default logger;