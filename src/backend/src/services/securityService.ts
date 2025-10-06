import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { SecuritySeverity } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { CustomError } from '../utils/errors';

export interface SecurityEvent {
  userId?: string;
  eventType: string;
  severity: SecuritySeverity;
  message: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
}

export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: string;
  standardHeaders: boolean;
  legacyHeaders: boolean;
}

export interface SecurityConfig {
  maxLoginAttempts: number;
  lockoutDuration: number;
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSymbols: boolean;
  sessionTimeout: number;
  twoFactorRequired: boolean;
  ipWhitelist: string[];
  ipBlacklist: string[];
}

class SecurityService {
  private static instance: SecurityService;
  private config: SecurityConfig;
  private rateLimiters: Map<string, any> = new Map();

  private constructor() {
    this.config = {
      maxLoginAttempts: 5,
      lockoutDuration: 15 * 60 * 1000, // 15 minutes
      passwordMinLength: 8,
      passwordRequireUppercase: true,
      passwordRequireLowercase: true,
      passwordRequireNumbers: true,
      passwordRequireSymbols: true,
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
      twoFactorRequired: false,
      ipWhitelist: [],
      ipBlacklist: [],
    };
  }

  public static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  public async initialize(): Promise<void> {
    try {
      // Load security configuration from database
      await this.loadSecurityConfig();
      
      // Initialize rate limiters
      this.initializeRateLimiters();
      
      logger.info('Security service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize security service:', error);
      throw error;
    }
  }

  private async loadSecurityConfig(): Promise<void> {
    try {
      const configs = await prisma.systemConfig.findMany({
        where: {
          key: {
            startsWith: 'security_',
          },
        },
      });

      for (const config of configs) {
        const key = config.key.replace('security_', '');
        const value = this.parseConfigValue(config.value, config.type);
        
        switch (key) {
          case 'max_login_attempts':
            this.config.maxLoginAttempts = value;
            break;
          case 'lockout_duration':
            this.config.lockoutDuration = value;
            break;
          case 'password_min_length':
            this.config.passwordMinLength = value;
            break;
          case 'password_require_uppercase':
            this.config.passwordRequireUppercase = value;
            break;
          case 'password_require_lowercase':
            this.config.passwordRequireLowercase = value;
            break;
          case 'password_require_numbers':
            this.config.passwordRequireNumbers = value;
            break;
          case 'password_require_symbols':
            this.config.passwordRequireSymbols = value;
            break;
          case 'session_timeout':
            this.config.sessionTimeout = value;
            break;
          case 'two_factor_required':
            this.config.twoFactorRequired = value;
            break;
          case 'ip_whitelist':
            this.config.ipWhitelist = value;
            break;
          case 'ip_blacklist':
            this.config.ipBlacklist = value;
            break;
        }
      }
    } catch (error) {
      logger.error('Failed to load security configuration:', error);
    }
  }

  private parseConfigValue(value: string, type: string): any {
    switch (type) {
      case 'boolean':
        return value === 'true';
      case 'number':
        return parseInt(value, 10);
      case 'array':
        return JSON.parse(value);
      default:
        return value;
    }
  }

  private initializeRateLimiters(): void {
    // General API rate limiter
    this.rateLimiters.set('general', rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    }));

    // Authentication rate limiter
    this.rateLimiters.set('auth', rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // limit each IP to 5 auth requests per windowMs
      message: 'Too many authentication attempts, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    }));

    // Password reset rate limiter
    this.rateLimiters.set('passwordReset', rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 3, // limit each IP to 3 password reset requests per hour
      message: 'Too many password reset attempts, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    }));

    // File upload rate limiter
    this.rateLimiters.set('fileUpload', rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 50, // limit each IP to 50 file uploads per hour
      message: 'Too many file uploads, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    }));
  }

  public getRateLimiter(name: string): any {
    return this.rateLimiters.get(name);
  }

  public async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      await prisma.securityEvent.create({
        data: {
          userId: event.userId,
          eventType: event.eventType,
          severity: event.severity,
          message: event.message,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
          metadata: event.metadata,
        },
      });

      logger.warn('Security event logged', event);
    } catch (error) {
      logger.error('Failed to log security event:', error);
    }
  }

  public async checkLoginAttempts(email: string, ipAddress: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return true; // User doesn't exist, allow attempt
      }

      // Check if user is locked
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        await this.logSecurityEvent({
          userId: user.id,
          eventType: 'LOGIN_ATTEMPT_LOCKED',
          severity: SecuritySeverity.WARNING,
          message: `Login attempt on locked account: ${email}`,
          ipAddress,
          metadata: { email, lockedUntil: user.lockedUntil },
        });
        return false;
      }

      // Check if user has exceeded max attempts
      if (user.loginAttempts >= this.config.maxLoginAttempts) {
        // Lock the account
        const lockoutUntil = new Date(Date.now() + this.config.lockoutDuration);
        await prisma.user.update({
          where: { id: user.id },
          data: {
            lockedUntil: lockoutUntil,
            loginAttempts: 0, // Reset attempts after lockout
          },
        });

        await this.logSecurityEvent({
          userId: user.id,
          eventType: 'ACCOUNT_LOCKED',
          severity: SecuritySeverity.ERROR,
          message: `Account locked due to too many failed login attempts: ${email}`,
          ipAddress,
          metadata: { email, lockoutUntil },
        });

        return false;
      }

      return true;
    } catch (error) {
      logger.error('Failed to check login attempts:', error);
      return false;
    }
  }

  public async recordFailedLogin(email: string, ipAddress: string): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (user) {
        const newAttempts = user.loginAttempts + 1;
        await prisma.user.update({
          where: { id: user.id },
          data: {
            loginAttempts: newAttempts,
          },
        });

        await this.logSecurityEvent({
          userId: user.id,
          eventType: 'LOGIN_FAILED',
          severity: SecuritySeverity.WARNING,
          message: `Failed login attempt: ${email}`,
          ipAddress,
          metadata: { email, attempts: newAttempts },
        });
      }
    } catch (error) {
      logger.error('Failed to record failed login:', error);
    }
  }

  public async recordSuccessfulLogin(userId: string, ipAddress: string): Promise<void> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          loginAttempts: 0,
          lastLoginAt: new Date(),
          lockedUntil: null,
        },
      });

      await this.logSecurityEvent({
        userId,
        eventType: 'LOGIN_SUCCESS',
        severity: SecuritySeverity.INFO,
        message: 'Successful login',
        ipAddress,
      });
    } catch (error) {
      logger.error('Failed to record successful login:', error);
    }
  }

  public validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < this.config.passwordMinLength) {
      errors.push(`Password must be at least ${this.config.passwordMinLength} characters long`);
    }

    if (this.config.passwordRequireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (this.config.passwordRequireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (this.config.passwordRequireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (this.config.passwordRequireSymbols && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  public async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  public async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  public generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  public generateJWT(payload: any, expiresIn: string = '1h'): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not configured');
    }
    return jwt.sign(payload, secret, { expiresIn });
  }

  public verifyJWT(token: string): any {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not configured');
    }
    return jwt.verify(token, secret);
  }

  public checkIPWhitelist(ipAddress: string): boolean {
    if (this.config.ipWhitelist.length === 0) {
      return true; // No whitelist configured
    }
    return this.config.ipWhitelist.includes(ipAddress);
  }

  public checkIPBlacklist(ipAddress: string): boolean {
    return this.config.ipBlacklist.includes(ipAddress);
  }

  public async validateSession(sessionId: string): Promise<boolean> {
    try {
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
      });

      if (!session || !session.isActive) {
        return false;
      }

      // Check if session has expired
      if (session.expiresAt < new Date()) {
        await prisma.session.update({
          where: { id: sessionId },
          data: { isActive: false },
        });
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Failed to validate session:', error);
      return false;
    }
  }

  public async createSession(userId: string, ipAddress: string, userAgent: string): Promise<string> {
    try {
      const sessionId = this.generateSecureToken();
      const expiresAt = new Date(Date.now() + this.config.sessionTimeout);

      await prisma.session.create({
        data: {
          id: sessionId,
          userId,
          token: this.generateSecureToken(),
          ipAddress,
          userAgent,
          expiresAt,
        },
      });

      return sessionId;
    } catch (error) {
      logger.error('Failed to create session:', error);
      throw error;
    }
  }

  public async invalidateSession(sessionId: string): Promise<void> {
    try {
      await prisma.session.update({
        where: { id: sessionId },
        data: { isActive: false },
      });
    } catch (error) {
      logger.error('Failed to invalidate session:', error);
    }
  }

  public async invalidateUserSessions(userId: string): Promise<void> {
    try {
      await prisma.session.updateMany({
        where: { userId },
        data: { isActive: false },
      });
    } catch (error) {
      logger.error('Failed to invalidate user sessions:', error);
    }
  }

  public async checkRateLimit(key: string, identifier: string, action: string): Promise<boolean> {
    try {
      const windowStart = new Date(Date.now() - 15 * 60 * 1000); // 15 minutes ago
      const windowEnd = new Date();

      const existingLimit = await prisma.rateLimit.findFirst({
        where: {
          key,
          identifier,
          action,
          windowStart: {
            gte: windowStart,
          },
          windowEnd: {
            lte: windowEnd,
          },
        },
      });

      if (existingLimit) {
        // Check if limit exceeded
        const maxRequests = 100; // Default limit
        if (existingLimit.count >= maxRequests) {
          return false;
        }

        // Increment count
        await prisma.rateLimit.update({
          where: { id: existingLimit.id },
          data: { count: existingLimit.count + 1 },
        });
      } else {
        // Create new rate limit record
        await prisma.rateLimit.create({
          data: {
            key,
            identifier,
            action,
            count: 1,
            windowStart,
            windowEnd,
          },
        });
      }

      return true;
    } catch (error) {
      logger.error('Failed to check rate limit:', error);
      return false;
    }
  }

  public async cleanupExpiredSessions(): Promise<void> {
    try {
      const result = await prisma.session.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      logger.info(`Cleaned up ${result.count} expired sessions`);
    } catch (error) {
      logger.error('Failed to cleanup expired sessions:', error);
    }
  }

  public async cleanupExpiredRateLimits(): Promise<void> {
    try {
      const result = await prisma.rateLimit.deleteMany({
        where: {
          windowEnd: {
            lt: new Date(),
          },
        },
      });

      logger.info(`Cleaned up ${result.count} expired rate limits`);
    } catch (error) {
      logger.error('Failed to cleanup expired rate limits:', error);
    }
  }

  public async getSecurityEvents(
    userId?: string,
    eventType?: string,
    severity?: SecuritySeverity,
    limit: number = 100
  ): Promise<any[]> {
    try {
      const events = await prisma.securityEvent.findMany({
        where: {
          userId,
          eventType,
          severity,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      });

      return events;
    } catch (error) {
      logger.error('Failed to get security events:', error);
      return [];
    }
  }

  public async getSecurityStats(): Promise<{
    totalEvents: number;
    eventsBySeverity: Record<string, number>;
    eventsByType: Record<string, number>;
    recentEvents: any[];
  }> {
    try {
      const [totalEvents, eventsBySeverity, eventsByType, recentEvents] = await Promise.all([
        prisma.securityEvent.count(),
        prisma.securityEvent.groupBy({
          by: ['severity'],
          _count: true,
        }),
        prisma.securityEvent.groupBy({
          by: ['eventType'],
          _count: true,
        }),
        prisma.securityEvent.findMany({
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
      ]);

      const severityStats = eventsBySeverity.reduce((acc, item) => {
        acc[item.severity] = item._count;
        return acc;
      }, {} as Record<string, number>);

      const typeStats = eventsByType.reduce((acc, item) => {
        acc[item.eventType] = item._count;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalEvents,
        eventsBySeverity: severityStats,
        eventsByType: typeStats,
        recentEvents,
      };
    } catch (error) {
      logger.error('Failed to get security stats:', error);
      return {
        totalEvents: 0,
        eventsBySeverity: {},
        eventsByType: {},
        recentEvents: [],
      };
    }
  }

  public getSecurityConfig(): SecurityConfig {
    return { ...this.config };
  }

  public async updateSecurityConfig(newConfig: Partial<SecurityConfig>): Promise<void> {
    try {
      this.config = { ...this.config, ...newConfig };

      // Save to database
      const configEntries = Object.entries(newConfig).map(([key, value]) => ({
        key: `security_${key}`,
        value: typeof value === 'object' ? JSON.stringify(value) : String(value),
        type: typeof value === 'boolean' ? 'boolean' : typeof value === 'number' ? 'number' : 'string',
      }));

      for (const entry of configEntries) {
        await prisma.systemConfig.upsert({
          where: { key: entry.key },
          update: { value: entry.value, type: entry.type },
          create: entry,
        });
      }

      logger.info('Security configuration updated', newConfig);
    } catch (error) {
      logger.error('Failed to update security configuration:', error);
      throw error;
    }
  }
}

export default SecurityService;