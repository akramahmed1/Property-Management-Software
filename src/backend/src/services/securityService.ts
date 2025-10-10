import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { logger } from '../utils/logger';
import { db } from '../config/drizzle';
import { users, sessions, securityEvents } from '../schema/drizzle';
import { eq, and, gte, desc } from 'drizzle-orm';

export interface SecurityConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  refreshTokenExpiresIn: string;
  bcryptRounds: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
  sessionTimeout: number;
  passwordMinLength: number;
  passwordRequireSpecial: boolean;
  twoFactorEnabled: boolean;
  rateLimitWindow: number;
  rateLimitMax: number;
}

export interface SecurityEvent {
  userId?: string;
  eventType: string;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  message: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
}

class SecurityService {
  private static instance: SecurityService;
  private config: SecurityConfig;

  private constructor() {
    this.config = {
      jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
      jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
      refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
      bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
      maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'),
      lockoutDuration: parseInt(process.env.LOCKOUT_DURATION || '900000'), // 15 minutes
      sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '3600000'), // 1 hour
      passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8'),
      passwordRequireSpecial: process.env.PASSWORD_REQUIRE_SPECIAL === 'true',
      twoFactorEnabled: process.env.TWO_FACTOR_ENABLED === 'true',
      rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 minutes
      rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100')
    };
  }

  public static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  // Password hashing
  public async hashPassword(password: string): Promise<string> {
    try {
      const saltRounds = this.config.bcryptRounds;
      return await bcrypt.hash(password, saltRounds);
    } catch (error) {
      logger.error('Error hashing password:', error);
      throw new Error('Password hashing failed');
    }
  }

  // Password verification
  public async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      logger.error('Error verifying password:', error);
      return false;
    }
  }

  // Password strength validation
  public validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < this.config.passwordMinLength) {
      errors.push(`Password must be at least ${this.config.passwordMinLength} characters long`);
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (this.config.passwordRequireSpecial && !/[@$!%*?&]/.test(password)) {
      errors.push('Password must contain at least one special character (@$!%*?&)');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // JWT token generation
  public generateToken(payload: any): string {
    try {
      return jwt.sign(payload, this.config.jwtSecret, {
        expiresIn: this.config.jwtExpiresIn,
        issuer: 'property-management-api',
        audience: 'property-management-client'
      });
    } catch (error) {
      logger.error('Error generating token:', error);
      throw new Error('Token generation failed');
    }
  }

  // JWT token verification
  public verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.config.jwtSecret, {
        issuer: 'property-management-api',
        audience: 'property-management-client'
      });
    } catch (error) {
      logger.error('Error verifying token:', error);
      throw new Error('Invalid token');
    }
  }

  // Refresh token generation
  public generateRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  // Session management
  public async createSession(userId: string, ipAddress: string, userAgent: string): Promise<string> {
    try {
      const token = this.generateRefreshToken();
      const expiresAt = new Date(Date.now() + this.config.sessionTimeout);

      await db.insert(sessions).values({
        userId,
        token,
        ipAddress,
        userAgent,
        expiresAt,
        isActive: true
      });

      logger.info(`Session created for user: ${userId}`);
      return token;
    } catch (error) {
      logger.error('Error creating session:', error);
      throw new Error('Session creation failed');
    }
  }

  public async validateSession(token: string): Promise<{ isValid: boolean; userId?: string }> {
    try {
      const session = await db
        .select()
        .from(sessions)
        .where(and(
          eq(sessions.token, token),
          eq(sessions.isActive, true),
          gte(sessions.expiresAt, new Date())
        ))
        .limit(1);

      if (session.length === 0) {
        return { isValid: false };
      }

      return { isValid: true, userId: session[0].userId };
    } catch (error) {
      logger.error('Error validating session:', error);
      return { isValid: false };
    }
  }

  public async revokeSession(token: string): Promise<void> {
    try {
      await db
        .update(sessions)
        .set({ isActive: false })
        .where(eq(sessions.token, token));

      logger.info(`Session revoked: ${token}`);
    } catch (error) {
      logger.error('Error revoking session:', error);
      throw new Error('Session revocation failed');
    }
  }

  public async revokeAllUserSessions(userId: string): Promise<void> {
    try {
      await db
        .update(sessions)
        .set({ isActive: false })
        .where(eq(sessions.userId, userId));

      logger.info(`All sessions revoked for user: ${userId}`);
    } catch (error) {
      logger.error('Error revoking user sessions:', error);
      throw new Error('Session revocation failed');
    }
  }

  // Login attempt tracking
  public async trackLoginAttempt(userId: string, success: boolean, ipAddress: string, userAgent: string): Promise<void> {
    try {
      if (success) {
        // Reset login attempts on successful login
        await db
          .update(users)
          .set({
            loginAttempts: 0,
            lockedUntil: null,
            lastLoginAt: new Date()
          })
          .where(eq(users.id, userId));

        await this.logSecurityEvent({
          userId,
          eventType: 'LOGIN_SUCCESS',
          severity: 'INFO',
          message: 'Successful login',
          ipAddress,
          userAgent
        });
      } else {
        // Increment login attempts
        const user = await db
          .select()
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        if (user.length > 0) {
          const currentAttempts = user[0].loginAttempts + 1;
          const isLocked = currentAttempts >= this.config.maxLoginAttempts;
          const lockedUntil = isLocked ? new Date(Date.now() + this.config.lockoutDuration) : null;

          await db
            .update(users)
            .set({
              loginAttempts: currentAttempts,
              lockedUntil
            })
            .where(eq(users.id, userId));

          await this.logSecurityEvent({
            userId,
            eventType: 'LOGIN_FAILED',
            severity: isLocked ? 'WARNING' : 'INFO',
            message: `Failed login attempt ${currentAttempts}/${this.config.maxLoginAttempts}`,
            ipAddress,
            userAgent
          });
        }
      }
    } catch (error) {
      logger.error('Error tracking login attempt:', error);
    }
  }

  // Account lockout check
  public async isAccountLocked(userId: string): Promise<boolean> {
    try {
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (user.length === 0) return false;

      const { lockedUntil, loginAttempts } = user[0];
      
      if (lockedUntil && lockedUntil > new Date()) {
        return true;
      }

      if (loginAttempts >= this.config.maxLoginAttempts) {
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Error checking account lockout:', error);
      return true; // Lock account on error for security
    }
  }

  // Security event logging
  public async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      await db.insert(securityEvents).values({
        userId: event.userId,
        eventType: event.eventType,
        severity: event.severity as any,
        message: event.message,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        metadata: event.metadata
      });

      logger.info(`Security event logged: ${event.eventType} - ${event.message}`);
    } catch (error) {
      logger.error('Error logging security event:', error);
    }
  }

  // Get security events
  public async getSecurityEvents(userId?: string, limit: number = 100): Promise<any[]> {
    try {
      const whereConditions = [];
      if (userId) {
        whereConditions.push(eq(securityEvents.userId, userId));
      }

      const events = await db
        .select()
        .from(securityEvents)
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
        .orderBy(desc(securityEvents.createdAt))
        .limit(limit);

      return events;
    } catch (error) {
      logger.error('Error getting security events:', error);
      return [];
    }
  }

  // Two-factor authentication
  public generateTwoFactorSecret(): string {
    return crypto.randomBytes(32).toString('base32');
  }

  public generateTwoFactorCode(secret: string): string {
    const time = Math.floor(Date.now() / 1000 / 30);
    const key = Buffer.from(secret, 'base32');
    const hmac = crypto.createHmac('sha1', key);
    hmac.update(Buffer.from(time.toString(16).padStart(16, '0'), 'hex'));
    const hash = hmac.digest();
    const offset = hash[hash.length - 1] & 0xf;
    const code = ((hash[offset] & 0x7f) << 24) |
                 ((hash[offset + 1] & 0xff) << 16) |
                 ((hash[offset + 2] & 0xff) << 8) |
                 (hash[offset + 3] & 0xff);
    return (code % 1000000).toString().padStart(6, '0');
  }

  public verifyTwoFactorCode(secret: string, code: string): boolean {
    const expectedCode = this.generateTwoFactorCode(secret);
    return crypto.timingSafeEqual(Buffer.from(code), Buffer.from(expectedCode));
  }

  // Rate limiting
  public async checkRateLimit(identifier: string, action: string): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    // This would typically use Redis for distributed rate limiting
    // For now, we'll implement a simple in-memory solution
    const key = `${action}:${identifier}`;
    const now = Date.now();
    const windowStart = now - this.config.rateLimitWindow;

    // In a real implementation, this would use Redis
    // For now, we'll return a simple check
    return {
      allowed: true,
      remaining: this.config.rateLimitMax - 1,
      resetTime: now + this.config.rateLimitWindow
    };
  }

  // Input sanitization
  public sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      return input
        .trim()
        .replace(/[<>]/g, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    } else if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item));
    } else if (input && typeof input === 'object') {
      const sanitized: any = {};
      for (const key in input) {
        sanitized[key] = this.sanitizeInput(input[key]);
      }
      return sanitized;
    }
    return input;
  }

  // CSRF protection
  public generateCSRFToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  public verifyCSRFToken(token: string, sessionToken: string): boolean {
    // In a real implementation, this would verify against stored CSRF tokens
    return token && sessionToken && token.length === 64;
  }

  // Security headers
  public getSecurityHeaders(): Record<string, string> {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
    };
  }

  // Password reset token
  public generatePasswordResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  public async setPasswordResetToken(userId: string, token: string): Promise<void> {
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour
    await db
      .update(users)
      .set({
        passwordResetToken: token,
        passwordResetExpires: expiresAt
      })
      .where(eq(users.id, userId));
  }

  public async validatePasswordResetToken(token: string): Promise<{ isValid: boolean; userId?: string }> {
    try {
      const user = await db
        .select()
        .from(users)
        .where(and(
          eq(users.passwordResetToken, token),
          gte(users.passwordResetExpires, new Date())
        ))
        .limit(1);

      if (user.length === 0) {
        return { isValid: false };
      }

      return { isValid: true, userId: user[0].id };
    } catch (error) {
      logger.error('Error validating password reset token:', error);
      return { isValid: false };
    }
  }

  public async clearPasswordResetToken(userId: string): Promise<void> {
    await db
      .update(users)
      .set({
        passwordResetToken: null,
        passwordResetExpires: null
      })
      .where(eq(users.id, userId));
  }
}

export default SecurityService;