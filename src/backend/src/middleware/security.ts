import { Request, Response, NextFunction } from 'express';
import { SecurityService } from '../services/securityService';
import { logger } from '../utils/logger';
import { CustomError } from '../utils/errors';
import { SecuritySeverity } from '@prisma/client';

const securityService = SecurityService.getInstance();

// IP Whitelist/Blacklist Middleware
export const ipSecurity = (req: Request, res: Response, next: NextFunction) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    
    // Check blacklist first
    if (securityService.checkIPBlacklist(ipAddress)) {
      logger.warn('Blocked request from blacklisted IP', { ipAddress });
      return res.status(403).json({
        success: false,
        message: 'Access denied from this IP address',
      });
    }

    // Check whitelist if configured
    if (!securityService.checkIPWhitelist(ipAddress)) {
      logger.warn('Blocked request from non-whitelisted IP', { ipAddress });
      return res.status(403).json({
        success: false,
        message: 'Access denied from this IP address',
      });
    }

    next();
  } catch (error) {
    logger.error('IP security middleware error:', error);
    next(error);
  }
};

// Request Validation Middleware
export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check for suspicious patterns
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /union\s+select/i,
      /drop\s+table/i,
      /delete\s+from/i,
      /insert\s+into/i,
      /update\s+set/i,
      /exec\s*\(/i,
      /eval\s*\(/i,
    ];

    const checkSuspiciousContent = (obj: any, path: string = ''): string[] => {
      const issues: string[] = [];
      
      if (typeof obj === 'string') {
        for (const pattern of suspiciousPatterns) {
          if (pattern.test(obj)) {
            issues.push(`Suspicious content detected in ${path}: ${obj.substring(0, 100)}`);
          }
        }
      } else if (typeof obj === 'object' && obj !== null) {
        for (const [key, value] of Object.entries(obj)) {
          issues.push(...checkSuspiciousContent(value, `${path}.${key}`));
        }
      }
      
      return issues;
    };

    const issues = checkSuspiciousContent(req.body, 'body')
      .concat(checkSuspiciousContent(req.query, 'query'))
      .concat(checkSuspiciousContent(req.params, 'params'));

    if (issues.length > 0) {
      logger.warn('Suspicious request detected', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        issues,
      });

      securityService.logSecurityEvent({
        eventType: 'SUSPICIOUS_REQUEST',
        severity: SecuritySeverity.WARNING,
        message: 'Suspicious request detected',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { issues },
      });

      return res.status(400).json({
        success: false,
        message: 'Invalid request format',
      });
    }

    next();
  } catch (error) {
    logger.error('Request validation middleware error:', error);
    next(error);
  }
};

// Rate Limiting Middleware
export const rateLimitMiddleware = (limiterName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const limiter = securityService.getRateLimiter(limiterName);
    if (limiter) {
      return limiter(req, res, next);
    }
    next();
  };
};

// Session Validation Middleware
export const validateSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token required',
      });
    }

    // Verify JWT token
    try {
      const decoded = securityService.verifyJWT(token);
      req.user = decoded;
    } catch (error) {
      logger.warn('Invalid JWT token', { ip: req.ip, error: error.message });
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token',
      });
    }

    // Validate session in database
    const sessionId = req.user.sessionId;
    if (sessionId) {
      const isValidSession = await securityService.validateSession(sessionId);
      if (!isValidSession) {
        return res.status(401).json({
          success: false,
          message: 'Session expired or invalid',
        });
      }
    }

    next();
  } catch (error) {
    logger.error('Session validation middleware error:', error);
    next(error);
  }
};

// Role-based Access Control Middleware
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const userRole = req.user.role;
      if (!roles.includes(userRole)) {
        logger.warn('Access denied due to insufficient role', {
          userId: req.user.userId,
          userRole,
          requiredRoles: roles,
          ip: req.ip,
        });

        securityService.logSecurityEvent({
          userId: req.user.userId,
          eventType: 'ACCESS_DENIED_ROLE',
          severity: SecuritySeverity.WARNING,
          message: `Access denied due to insufficient role: ${userRole}`,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          metadata: { userRole, requiredRoles: roles },
        });

        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
        });
      }

      next();
    } catch (error) {
      logger.error('Role validation middleware error:', error);
      next(error);
    }
  };
};

// Two-Factor Authentication Middleware
export const require2FA = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const userId = req.user.userId;
    
    // Check if 2FA is enabled for the user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { twoFactorAuth: true },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.twoFactorAuth?.enabled) {
      // Check if 2FA token is provided and valid
      const twoFactorToken = req.headers['x-2fa-token'] as string;
      
      if (!twoFactorToken) {
        return res.status(401).json({
          success: false,
          message: 'Two-factor authentication token required',
        });
      }

      // Verify 2FA token (implementation depends on your 2FA method)
      // This is a placeholder - implement based on your 2FA solution
      const isValid2FA = await verify2FAToken(userId, twoFactorToken);
      
      if (!isValid2FA) {
        securityService.logSecurityEvent({
          userId,
          eventType: '2FA_FAILED',
          severity: SecuritySeverity.WARNING,
          message: 'Invalid 2FA token provided',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        });

        return res.status(401).json({
          success: false,
          message: 'Invalid two-factor authentication token',
        });
      }
    }

    next();
  } catch (error) {
    logger.error('2FA middleware error:', error);
    next(error);
  }
};

// Helper function to verify 2FA token (placeholder)
async function verify2FAToken(userId: string, token: string): Promise<boolean> {
  // Implement your 2FA verification logic here
  // This could be TOTP, SMS, email verification, etc.
  return true; // Placeholder
}

// Security Headers Middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Set security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    // Content Security Policy
    res.setHeader('Content-Security-Policy', 
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "font-src 'self' data:; " +
      "connect-src 'self' https:; " +
      "frame-ancestors 'none';"
    );

    next();
  } catch (error) {
    logger.error('Security headers middleware error:', error);
    next(error);
  }
};

// Request Logging Middleware
export const requestLogging = (req: Request, res: Response, next: NextFunction) => {
  try {
    const startTime = Date.now();
    
    // Log request
    logger.info('Request received', {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.userId,
    });

    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function(chunk?: any, encoding?: any) {
      const duration = Date.now() - startTime;
      
      logger.info('Request completed', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration,
        ip: req.ip,
        userId: req.user?.userId,
      });

      // Log security events for certain status codes
      if (res.statusCode >= 400) {
        securityService.logSecurityEvent({
          userId: req.user?.userId,
          eventType: 'HTTP_ERROR',
          severity: res.statusCode >= 500 ? SecuritySeverity.ERROR : SecuritySeverity.WARNING,
          message: `HTTP ${res.statusCode} error`,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          metadata: {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration,
          },
        });
      }

      originalEnd.call(this, chunk, encoding);
    };

    next();
  } catch (error) {
    logger.error('Request logging middleware error:', error);
    next(error);
  }
};

// CSRF Protection Middleware
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Skip CSRF for GET requests
    if (req.method === 'GET') {
      return next();
    }

    // Check for CSRF token
    const csrfToken = req.headers['x-csrf-token'] as string;
    const sessionCsrfToken = req.session?.csrfToken;

    if (!csrfToken || !sessionCsrfToken || csrfToken !== sessionCsrfToken) {
      logger.warn('CSRF token validation failed', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        providedToken: csrfToken,
        expectedToken: sessionCsrfToken,
      });

      securityService.logSecurityEvent({
        eventType: 'CSRF_ATTACK',
        severity: SecuritySeverity.ERROR,
        message: 'CSRF token validation failed',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { providedToken: csrfToken },
      });

      return res.status(403).json({
        success: false,
        message: 'CSRF token validation failed',
      });
    }

    next();
  } catch (error) {
    logger.error('CSRF protection middleware error:', error);
    next(error);
  }
};

// Input Sanitization Middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  try {
    const sanitizeObject = (obj: any): any => {
      if (typeof obj === 'string') {
        // Remove potentially dangerous characters
        return obj
          .replace(/[<>]/g, '') // Remove < and >
          .replace(/javascript:/gi, '') // Remove javascript: protocol
          .replace(/on\w+\s*=/gi, '') // Remove event handlers
          .trim();
      } else if (typeof obj === 'object' && obj !== null) {
        const sanitized: any = Array.isArray(obj) ? [] : {};
        for (const [key, value] of Object.entries(obj)) {
          sanitized[key] = sanitizeObject(value);
        }
        return sanitized;
      }
      return obj;
    };

    // Sanitize request body, query, and params
    if (req.body) {
      req.body = sanitizeObject(req.body);
    }
    if (req.query) {
      req.query = sanitizeObject(req.query);
    }
    if (req.params) {
      req.params = sanitizeObject(req.params);
    }

    next();
  } catch (error) {
    logger.error('Input sanitization middleware error:', error);
    next(error);
  }
};

// Error Handling Middleware
export const securityErrorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  try {
    logger.error('Security error occurred', {
      error: error.message,
      stack: error.stack,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.userId,
    });

    // Log security event for certain errors
    if (error.name === 'JsonWebTokenError') {
      securityService.logSecurityEvent({
        userId: req.user?.userId,
        eventType: 'JWT_ERROR',
        severity: SecuritySeverity.WARNING,
        message: 'JWT token error',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { error: error.message },
      });
    }

    // Don't expose sensitive error details
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      ...(isDevelopment && { error: error.message }),
    });
  } catch (handlerError) {
    logger.error('Security error handler failed:', handlerError);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
