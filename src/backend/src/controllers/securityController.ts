import { Request, Response } from 'express';
import { SecurityService } from '../services/securityService';
import { logger } from '../utils/logger';
import { CustomError } from '../utils/errors';
import { SecuritySeverity } from '@prisma/client';

const securityService = SecurityService.getInstance();

export const getSecurityEvents = async (req: Request, res: Response) => {
  try {
    const {
      userId,
      eventType,
      severity,
      limit = 100,
      page = 1,
    } = req.query;

    const events = await securityService.getSecurityEvents(
      userId as string,
      eventType as string,
      severity as SecuritySeverity,
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: events,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: events.length,
      },
    });
  } catch (error) {
    logger.error('Failed to get security events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get security events',
    });
  }
};

export const getSecurityStats = async (req: Request, res: Response) => {
  try {
    const stats = await securityService.getSecurityStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Failed to get security stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get security statistics',
    });
  }
};

export const getSecurityConfig = async (req: Request, res: Response) => {
  try {
    const config = securityService.getSecurityConfig();

    res.json({
      success: true,
      data: config,
    });
  } catch (error) {
    logger.error('Failed to get security config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get security configuration',
    });
  }
};

export const updateSecurityConfig = async (req: Request, res: Response) => {
  try {
    const { config } = req.body;

    if (!config || typeof config !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Invalid configuration data',
      });
    }

    await securityService.updateSecurityConfig(config);

    res.json({
      success: true,
      message: 'Security configuration updated successfully',
    });
  } catch (error) {
    logger.error('Failed to update security config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update security configuration',
    });
  }
};

export const validatePassword = async (req: Request, res: Response) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required',
      });
    }

    const validation = securityService.validatePassword(password);

    res.json({
      success: true,
      data: validation,
    });
  } catch (error) {
    logger.error('Failed to validate password:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate password',
    });
  }
};

export const generateSecureToken = async (req: Request, res: Response) => {
  try {
    const { length = 32 } = req.body;
    const token = securityService.generateSecureToken(parseInt(length));

    res.json({
      success: true,
      data: { token },
    });
  } catch (error) {
    logger.error('Failed to generate secure token:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate secure token',
    });
  }
};

export const checkLoginAttempts = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const ipAddress = req.ip;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    const isAllowed = await securityService.checkLoginAttempts(email, ipAddress);

    res.json({
      success: true,
      data: { isAllowed },
    });
  } catch (error) {
    logger.error('Failed to check login attempts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check login attempts',
    });
  }
};

export const recordFailedLogin = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const ipAddress = req.ip;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    await securityService.recordFailedLogin(email, ipAddress);

    res.json({
      success: true,
      message: 'Failed login recorded',
    });
  } catch (error) {
    logger.error('Failed to record failed login:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record failed login',
    });
  }
};

export const recordSuccessfulLogin = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const ipAddress = req.ip;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    await securityService.recordSuccessfulLogin(userId, ipAddress);

    res.json({
      success: true,
      message: 'Successful login recorded',
    });
  } catch (error) {
    logger.error('Failed to record successful login:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record successful login',
    });
  }
};

export const createSession = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent') || '';

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    const sessionId = await securityService.createSession(userId, ipAddress, userAgent);

    res.json({
      success: true,
      data: { sessionId },
    });
  } catch (error) {
    logger.error('Failed to create session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create session',
    });
  }
};

export const invalidateSession = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required',
      });
    }

    await securityService.invalidateSession(sessionId);

    res.json({
      success: true,
      message: 'Session invalidated successfully',
    });
  } catch (error) {
    logger.error('Failed to invalidate session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to invalidate session',
    });
  }
};

export const invalidateUserSessions = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    await securityService.invalidateUserSessions(userId);

    res.json({
      success: true,
      message: 'All user sessions invalidated successfully',
    });
  } catch (error) {
    logger.error('Failed to invalidate user sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to invalidate user sessions',
    });
  }
};

export const checkRateLimit = async (req: Request, res: Response) => {
  try {
    const { key, identifier, action } = req.body;

    if (!key || !identifier || !action) {
      return res.status(400).json({
        success: false,
        message: 'Key, identifier, and action are required',
      });
    }

    const isAllowed = await securityService.checkRateLimit(key, identifier, action);

    res.json({
      success: true,
      data: { isAllowed },
    });
  } catch (error) {
    logger.error('Failed to check rate limit:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check rate limit',
    });
  }
};

export const cleanupExpiredSessions = async (req: Request, res: Response) => {
  try {
    await securityService.cleanupExpiredSessions();

    res.json({
      success: true,
      message: 'Expired sessions cleaned up successfully',
    });
  } catch (error) {
    logger.error('Failed to cleanup expired sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup expired sessions',
    });
  }
};

export const cleanupExpiredRateLimits = async (req: Request, res: Response) => {
  try {
    await securityService.cleanupExpiredRateLimits();

    res.json({
      success: true,
      message: 'Expired rate limits cleaned up successfully',
    });
  } catch (error) {
    logger.error('Failed to cleanup expired rate limits:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup expired rate limits',
    });
  }
};

export const logSecurityEvent = async (req: Request, res: Response) => {
  try {
    const {
      userId,
      eventType,
      severity = SecuritySeverity.INFO,
      message,
      metadata,
    } = req.body;

    if (!eventType || !message) {
      return res.status(400).json({
        success: false,
        message: 'Event type and message are required',
      });
    }

    await securityService.logSecurityEvent({
      userId,
      eventType,
      severity,
      message,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      metadata,
    });

    res.json({
      success: true,
      message: 'Security event logged successfully',
    });
  } catch (error) {
    logger.error('Failed to log security event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to log security event',
    });
  }
};

export const getSecurityDashboard = async (req: Request, res: Response) => {
  try {
    const [
      stats,
      recentEvents,
      config,
    ] = await Promise.all([
      securityService.getSecurityStats(),
      securityService.getSecurityEvents(undefined, undefined, undefined, 10),
      securityService.getSecurityConfig(),
    ]);

    res.json({
      success: true,
      data: {
        stats,
        recentEvents,
        config,
      },
    });
  } catch (error) {
    logger.error('Failed to get security dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get security dashboard',
    });
  }
};

export const exportSecurityEvents = async (req: Request, res: Response) => {
  try {
    const {
      userId,
      eventType,
      severity,
      startDate,
      endDate,
      format = 'json',
    } = req.query;

    const events = await securityService.getSecurityEvents(
      userId as string,
      eventType as string,
      severity as SecuritySeverity,
      10000 // Large limit for export
    );

    // Filter by date range if provided
    let filteredEvents = events;
    if (startDate || endDate) {
      filteredEvents = events.filter(event => {
        const eventDate = new Date(event.createdAt);
        if (startDate && eventDate < new Date(startDate as string)) {
          return false;
        }
        if (endDate && eventDate > new Date(endDate as string)) {
          return false;
        }
        return true;
      });
    }

    if (format === 'csv') {
      // Convert to CSV format
      const csvHeaders = 'ID,User ID,Event Type,Severity,Message,IP Address,User Agent,Created At\n';
      const csvRows = filteredEvents.map(event => 
        `${event.id},${event.userId || ''},${event.eventType},${event.severity},"${event.message}","${event.ipAddress || ''}","${event.userAgent || ''}",${event.createdAt}`
      ).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=security_events.csv');
      res.send(csvHeaders + csvRows);
    } else {
      res.json({
        success: true,
        data: filteredEvents,
        count: filteredEvents.length,
      });
    }
  } catch (error) {
    logger.error('Failed to export security events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export security events',
    });
  }
};
