import { PrismaClient, User, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { logger } from '../utils/logger';
import { Redis } from 'ioredis';

const prisma = new PrismaClient();

// Redis client for session management
let redis: Redis;
try {
  redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
} catch (error) {
  logger.warn('Redis connection failed, session management disabled:', error);
}

export interface LoginCredentials {
  email: string;
  password: string;
  twoFactorCode?: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface UserSession {
  userId: string;
  email: string;
  role: UserRole;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
  lastActivity: Date;
}

export class AuthService {
  private static instance: AuthService;
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
  private readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret';
  private readonly JWT_EXPIRES_IN = '15m';
  private readonly REFRESH_TOKEN_EXPIRES_IN = '7d';
  private readonly SESSION_PREFIX = 'session:';
  private readonly RATE_LIMIT_PREFIX = 'rate_limit:';
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Register a new user with validation and security checks
   */
  async register(data: RegisterData, ipAddress: string, userAgent: string) {
    try {
      // Validate input
      if (!data.name || !data.email || !data.password) {
        throw new Error('Name, email, and password are required');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        throw new Error('Invalid email format');
      }

      // Validate password strength
      if (data.password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email }
      });

      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(data.password, saltRounds);

      // Create user
      const user = await prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: hashedPassword,
          phone: data.phone,
          role: data.role || UserRole.AGENT,
          isActive: true,
          lastLoginAt: new Date()
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true
        }
      });

      // Log registration
      logger.info(`User registered: ${user.email} from IP ${ipAddress}`);

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'USER_REGISTER',
          entity: 'User',
          entityId: user.id,
          newData: {
            email: user.email,
            role: user.role
          },
          ipAddress,
          userAgent
        }
      });

      return user;
    } catch (error) {
      logger.error('Error registering user:', error);
      throw error;
    }
  }

  /**
   * Authenticate user with rate limiting and security checks
   */
  async login(credentials: LoginCredentials, ipAddress: string, userAgent: string) {
    try {
      const { email, password, twoFactorCode, rememberMe = false } = credentials;

      // Check rate limiting
      await this.checkRateLimit(email, ipAddress);

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          twoFactorAuth: true,
          sessions: {
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
            take: 5
          }
        }
      });

      if (!user) {
        await this.recordFailedAttempt(email, ipAddress);
        throw new Error('Invalid credentials');
      }

      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        await this.recordFailedAttempt(email, ipAddress);
        throw new Error('Invalid credentials');
      }

      // Check if 2FA is enabled
      if (user.twoFactorEnabled && user.twoFactorAuth) {
        if (!twoFactorCode) {
          throw new Error('Two-factor authentication code required');
        }

        const isValidCode = speakeasy.totp.verify({
          secret: user.twoFactorAuth.secret,
          encoding: 'base32',
          token: twoFactorCode,
          window: 2
        });

        if (!isValidCode) {
          await this.recordFailedAttempt(email, ipAddress);
          throw new Error('Invalid two-factor authentication code');
        }
      }

      // Generate tokens
      const tokens = await this.generateTokens(user.id, user.email, user.role);

      // Create session
      const session = await this.createSession(user.id, ipAddress, userAgent, rememberMe);

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });

      // Log successful login
      logger.info(`User logged in: ${user.email} from IP ${ipAddress}`);

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'USER_LOGIN',
          entity: 'User',
          entityId: user.id,
          newData: {
            ipAddress,
            userAgent,
            sessionId: session.id
          },
          ipAddress,
          userAgent
        }
      });

      // Clear failed attempts
      await this.clearFailedAttempts(email, ipAddress);

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isActive: user.isActive,
          twoFactorEnabled: user.twoFactorEnabled,
          lastLoginAt: user.lastLoginAt
        },
        tokens,
        session: {
          id: session.id,
          expiresAt: session.expiresAt
        }
      };
    } catch (error) {
      logger.error('Error during login:', error);
      throw error;
    }
  }

  /**
   * Logout user and invalidate session
   */
  async logout(userId: string, sessionId: string, ipAddress: string) {
    try {
      // Invalidate session
      await prisma.session.update({
        where: { id: sessionId },
        data: { isActive: false }
      });

      // Remove from Redis cache
      if (redis) {
        await redis.del(`${this.SESSION_PREFIX}${sessionId}`);
      }

      // Log logout
      logger.info(`User logged out: ${userId} from IP ${ipAddress}`);

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'USER_LOGOUT',
          entity: 'User',
          entityId: userId,
          ipAddress
        }
      });

      return { success: true };
    } catch (error) {
      logger.error('Error during logout:', error);
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string, ipAddress: string) {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, this.JWT_REFRESH_SECRET) as any;
      
      // Check if session exists and is active
      const session = await prisma.session.findUnique({
        where: { id: decoded.sessionId },
        include: { user: true }
      });

      if (!session || !session.isActive || session.expiresAt < new Date()) {
        throw new Error('Invalid or expired refresh token');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(session.userId, session.user.email, session.user.role);

      // Update session
      await prisma.session.update({
        where: { id: session.id },
        data: { lastActivity: new Date() }
      });

      return {
        user: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          phone: session.user.phone,
          role: session.user.role,
          isActive: session.user.isActive
        },
        tokens
      };
    } catch (error) {
      logger.error('Error refreshing token:', error);
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Setup two-factor authentication
   */
  async setupTwoFactor(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Generate secret
      const secret = speakeasy.generateSecret({
        name: `Property Management (${user.email})`,
        issuer: 'Property Management Software'
      });

      // Generate QR code
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

      // Save secret temporarily (not enabled yet)
      await prisma.twoFactorAuth.upsert({
        where: { userId },
        update: { secret: secret.base32 },
        create: {
          userId,
          secret: secret.base32,
          enabled: false,
          backupCodes: []
        }
      });

      return {
        secret: secret.base32,
        qrCodeUrl,
        backupCodes: this.generateBackupCodes()
      };
    } catch (error) {
      logger.error('Error setting up 2FA:', error);
      throw error;
    }
  }

  /**
   * Verify and enable two-factor authentication
   */
  async verifyTwoFactor(userId: string, token: string, backupCodes: string[]) {
    try {
      const twoFactorAuth = await prisma.twoFactorAuth.findUnique({
        where: { userId }
      });

      if (!twoFactorAuth) {
        throw new Error('2FA setup not found');
      }

      // Verify token
      const isValid = speakeasy.totp.verify({
        secret: twoFactorAuth.secret,
        encoding: 'base32',
        token,
        window: 2
      });

      if (!isValid) {
        throw new Error('Invalid verification code');
      }

      // Enable 2FA
      await prisma.twoFactorAuth.update({
        where: { userId },
        data: {
          enabled: true,
          backupCodes: backupCodes.map(code => await bcrypt.hash(code, 10))
        }
      });

      await prisma.user.update({
        where: { id: userId },
        data: { twoFactorEnabled: true }
      });

      logger.info(`2FA enabled for user: ${userId}`);

      return { success: true };
    } catch (error) {
      logger.error('Error verifying 2FA:', error);
      throw error;
    }
  }

  /**
   * Disable two-factor authentication
   */
  async disableTwoFactor(userId: string, password: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new Error('Invalid password');
      }

      // Disable 2FA
      await prisma.twoFactorAuth.update({
        where: { userId },
        data: {
          enabled: false,
          backupCodes: []
        }
      });

      await prisma.user.update({
        where: { id: userId },
        data: { twoFactorEnabled: false }
      });

      logger.info(`2FA disabled for user: ${userId}`);

      return { success: true };
    } catch (error) {
      logger.error('Error disabling 2FA:', error);
      throw error;
    }
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Validate new password
      if (newPassword.length < 8) {
        throw new Error('New password must be at least 8 characters long');
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword }
      });

      // Invalidate all sessions
      await prisma.session.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false }
      });

      logger.info(`Password changed for user: ${userId}`);

      return { success: true };
    } catch (error) {
      logger.error('Error changing password:', error);
      throw error;
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string, ipAddress: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        // Don't reveal if user exists
        return { success: true, message: 'If the email exists, a reset link has been sent' };
      }

      // Generate reset token
      const resetToken = jwt.sign(
        { userId: user.id, email: user.email },
        this.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Store reset token in Redis
      if (redis) {
        await redis.setex(`reset_token:${resetToken}`, 3600, user.id);
      }

      // TODO: Send email with reset link
      logger.info(`Password reset requested for: ${email} from IP ${ipAddress}`);

      return { success: true, message: 'If the email exists, a reset link has been sent' };
    } catch (error) {
      logger.error('Error requesting password reset:', error);
      throw error;
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string, ipAddress: string) {
    try {
      // Verify token
      const decoded = jwt.verify(token, this.JWT_SECRET) as any;
      
      // Check if token exists in Redis
      if (redis) {
        const storedUserId = await redis.get(`reset_token:${token}`);
        if (!storedUserId || storedUserId !== decoded.userId) {
          throw new Error('Invalid or expired reset token');
        }
      }

      // Validate new password
      if (newPassword.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update password
      await prisma.user.update({
        where: { id: decoded.userId },
        data: { password: hashedPassword }
      });

      // Invalidate all sessions
      await prisma.session.updateMany({
        where: { userId: decoded.userId, isActive: true },
        data: { isActive: false }
      });

      // Remove reset token
      if (redis) {
        await redis.del(`reset_token:${token}`);
      }

      logger.info(`Password reset completed for user: ${decoded.userId} from IP ${ipAddress}`);

      return { success: true };
    } catch (error) {
      logger.error('Error resetting password:', error);
      throw error;
    }
  }

  /**
   * Get user sessions
   */
  async getUserSessions(userId: string) {
    try {
      const sessions = await prisma.session.findMany({
        where: { userId, isActive: true },
        orderBy: { lastActivity: 'desc' }
      });

      return sessions.map(session => ({
        id: session.id,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        createdAt: session.createdAt,
        lastActivity: session.lastActivity,
        expiresAt: session.expiresAt
      }));
    } catch (error) {
      logger.error('Error fetching user sessions:', error);
      throw error;
    }
  }

  /**
   * Revoke session
   */
  async revokeSession(userId: string, sessionId: string) {
    try {
      await prisma.session.update({
        where: { id: sessionId, userId },
        data: { isActive: false }
      });

      // Remove from Redis cache
      if (redis) {
        await redis.del(`${this.SESSION_PREFIX}${sessionId}`);
      }

      logger.info(`Session revoked: ${sessionId} for user ${userId}`);

      return { success: true };
    } catch (error) {
      logger.error('Error revoking session:', error);
      throw error;
    }
  }

  /**
   * Generate JWT tokens
   */
  private async generateTokens(userId: string, email: string, role: UserRole): Promise<AuthTokens> {
    const accessToken = jwt.sign(
      { userId, email, role },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      { userId, email, role },
      this.JWT_REFRESH_SECRET,
      { expiresIn: this.REFRESH_TOKEN_EXPIRES_IN }
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60 // 15 minutes in seconds
    };
  }

  /**
   * Create user session
   */
  private async createSession(userId: string, ipAddress: string, userAgent: string, rememberMe: boolean) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (rememberMe ? 30 : 7)); // 30 days or 7 days

    const session = await prisma.session.create({
      data: {
        userId,
        ipAddress,
        userAgent,
        expiresAt,
        isActive: true
      }
    });

    // Store session in Redis
    if (redis) {
      const sessionData: UserSession = {
        userId,
        email: '', // Will be filled by the caller
        role: UserRole.AGENT, // Will be filled by the caller
        ipAddress,
        userAgent,
        createdAt: session.createdAt,
        lastActivity: session.lastActivity
      };
      await redis.setex(`${this.SESSION_PREFIX}${session.id}`, 7 * 24 * 60 * 60, JSON.stringify(sessionData));
    }

    return session;
  }

  /**
   * Check rate limiting for login attempts
   */
  private async checkRateLimit(email: string, ipAddress: string) {
    if (!redis) return;

    const emailKey = `${this.RATE_LIMIT_PREFIX}email:${email}`;
    const ipKey = `${this.RATE_LIMIT_PREFIX}ip:${ipAddress}`;

    const [emailAttempts, ipAttempts] = await Promise.all([
      redis.get(emailKey),
      redis.get(ipKey)
    ]);

    if (parseInt(emailAttempts || '0') >= this.MAX_LOGIN_ATTEMPTS) {
      throw new Error('Too many login attempts for this email. Please try again later.');
    }

    if (parseInt(ipAttempts || '0') >= this.MAX_LOGIN_ATTEMPTS) {
      throw new Error('Too many login attempts from this IP. Please try again later.');
    }
  }

  /**
   * Record failed login attempt
   */
  private async recordFailedAttempt(email: string, ipAddress: string) {
    if (!redis) return;

    const emailKey = `${this.RATE_LIMIT_PREFIX}email:${email}`;
    const ipKey = `${this.RATE_LIMIT_PREFIX}ip:${ipAddress}`;

    await Promise.all([
      redis.incr(emailKey),
      redis.incr(ipKey)
    ]);

    await Promise.all([
      redis.expire(emailKey, this.LOCKOUT_DURATION / 1000),
      redis.expire(ipKey, this.LOCKOUT_DURATION / 1000)
    ]);
  }

  /**
   * Clear failed attempts
   */
  private async clearFailedAttempts(email: string, ipAddress: string) {
    if (!redis) return;

    const emailKey = `${this.RATE_LIMIT_PREFIX}email:${email}`;
    const ipKey = `${this.RATE_LIMIT_PREFIX}ip:${ipAddress}`;

    await Promise.all([
      redis.del(emailKey),
      redis.del(ipKey)
    ]);
  }

  /**
   * Generate backup codes for 2FA
   */
  private generateBackupCodes(): string[] {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      codes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
    }
    return codes;
  }
}

export default AuthService;
