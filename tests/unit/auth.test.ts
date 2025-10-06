import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import AuthService from '../../src/backend/src/services/authService';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn()
    },
    auditLog: {
      create: jest.fn()
    },
    session: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn()
    },
    twoFactorAuth: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn()
    }
  }))
}));

// Mock bcrypt
jest.mock('bcryptjs');

// Mock Redis
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn()
  }));
});

describe('AuthService', () => {
  let authService: AuthService;
  let mockPrisma: any;

  beforeEach(() => {
    authService = AuthService.getInstance();
    mockPrisma = new PrismaClient();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        phone: '+1234567890'
      };

      const hashedPassword = 'hashed-password';
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-id',
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        role: 'AGENT',
        isActive: true,
        createdAt: new Date()
      });

      const result = await authService.register(userData, '127.0.0.1', 'test-agent');

      expect(result).toBeDefined();
      expect(result.email).toBe(userData.email);
      expect(result.name).toBe(userData.name);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
          phone: userData.phone,
          role: 'AGENT',
          isActive: true,
          lastLoginAt: expect.any(Date)
        }),
        select: expect.any(Object)
      });
    });

    it('should throw error if user already exists', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'existing-user-id',
        email: userData.email
      });

      await expect(
        authService.register(userData, '127.0.0.1', 'test-agent')
      ).rejects.toThrow('User with this email already exists');
    });

    it('should throw error for invalid email format', async () => {
      const userData = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'password123'
      };

      await expect(
        authService.register(userData, '127.0.0.1', 'test-agent')
      ).rejects.toThrow('Invalid email format');
    });

    it('should throw error for weak password', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: '123'
      };

      await expect(
        authService.register(userData, '127.0.0.1', 'test-agent')
      ).rejects.toThrow('Password must be at least 8 characters long');
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const credentials = {
        email: 'john@example.com',
        password: 'password123'
      };

      const user = {
        id: 'user-id',
        email: credentials.email,
        password: 'hashed-password',
        isActive: true,
        twoFactorEnabled: false,
        twoFactorAuth: null,
        sessions: []
      };

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.session.create.mockResolvedValue({
        id: 'session-id',
        expiresAt: new Date()
      });

      const result = await authService.login(credentials, '127.0.0.1', 'test-agent');

      expect(result).toBeDefined();
      expect(result.user.email).toBe(credentials.email);
      expect(result.tokens).toBeDefined();
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
    });

    it('should throw error for invalid credentials', async () => {
      const credentials = {
        email: 'john@example.com',
        password: 'wrong-password'
      };

      const user = {
        id: 'user-id',
        email: credentials.email,
        password: 'hashed-password',
        isActive: true,
        twoFactorEnabled: false,
        twoFactorAuth: null,
        sessions: []
      };

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      mockPrisma.user.findUnique.mockResolvedValue(user);

      await expect(
        authService.login(credentials, '127.0.0.1', 'test-agent')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw error for deactivated account', async () => {
      const credentials = {
        email: 'john@example.com',
        password: 'password123'
      };

      const user = {
        id: 'user-id',
        email: credentials.email,
        password: 'hashed-password',
        isActive: false,
        twoFactorEnabled: false,
        twoFactorAuth: null,
        sessions: []
      };

      mockPrisma.user.findUnique.mockResolvedValue(user);

      await expect(
        authService.login(credentials, '127.0.0.1', 'test-agent')
      ).rejects.toThrow('Account is deactivated');
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const userId = 'user-id';
      const currentPassword = 'old-password';
      const newPassword = 'new-password';

      const user = {
        id: userId,
        password: 'hashed-old-password'
      };

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-new-password');

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.user.update.mockResolvedValue({ id: userId });
      mockPrisma.session.updateMany.mockResolvedValue({ count: 1 });

      const result = await authService.changePassword(userId, currentPassword, newPassword);

      expect(result.success).toBe(true);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { password: 'hashed-new-password' }
  });
});

    it('should throw error for incorrect current password', async () => {
      const userId = 'user-id';
      const currentPassword = 'wrong-password';
      const newPassword = 'new-password';

      const user = {
        id: userId,
        password: 'hashed-old-password'
      };

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      mockPrisma.user.findUnique.mockResolvedValue(user);

      await expect(
        authService.changePassword(userId, currentPassword, newPassword)
      ).rejects.toThrow('Current password is incorrect');
    });
  });
});