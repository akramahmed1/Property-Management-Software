import SecurityService from '../../src/backend/src/services/securityService';

describe('SecurityService', () => {
  let securityService: SecurityService;

  beforeEach(() => {
    securityService = SecurityService.getInstance();
  });

  describe('Password Hashing', () => {
    it('should hash password correctly', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await securityService.hashPassword(password);
      
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(0);
    });

    it('should verify correct password', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await securityService.hashPassword(password);
      const isValid = await securityService.verifyPassword(password, hashedPassword);
      
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword123!';
      const hashedPassword = await securityService.hashPassword(password);
      const isValid = await securityService.verifyPassword(wrongPassword, hashedPassword);
      
      expect(isValid).toBe(false);
    });
  });

  describe('Password Strength Validation', () => {
    it('should validate strong password', () => {
      const password = 'StrongPassword123!';
      const result = securityService.validatePasswordStrength(password);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject weak password', () => {
      const password = 'weak';
      const result = securityService.validatePasswordStrength(password);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should require minimum length', () => {
      const password = 'Short1!';
      const result = securityService.validatePasswordStrength(password);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should require uppercase letter', () => {
      const password = 'lowercase123!';
      const result = securityService.validatePasswordStrength(password);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should require lowercase letter', () => {
      const password = 'UPPERCASE123!';
      const result = securityService.validatePasswordStrength(password);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should require number', () => {
      const password = 'NoNumbers!';
      const result = securityService.validatePasswordStrength(password);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });
  });

  describe('JWT Token Generation', () => {
    it('should generate valid token', () => {
      const payload = { userId: '123', email: 'test@example.com' };
      const token = securityService.generateToken(payload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should verify valid token', () => {
      const payload = { userId: '123', email: 'test@example.com' };
      const token = securityService.generateToken(payload);
      const decoded = securityService.verifyToken(token);
      
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
    });

    it('should reject invalid token', () => {
      const invalidToken = 'invalid.token.here';
      
      expect(() => {
        securityService.verifyToken(invalidToken);
      }).toThrow('Invalid token');
    });
  });

  describe('Refresh Token Generation', () => {
    it('should generate unique refresh tokens', () => {
      const token1 = securityService.generateRefreshToken();
      const token2 = securityService.generateRefreshToken();
      
      expect(token1).toBeDefined();
      expect(token2).toBeDefined();
      expect(token1).not.toBe(token2);
      expect(token1.length).toBe(128); // 64 bytes = 128 hex characters
    });
  });

  describe('Two-Factor Authentication', () => {
    it('should generate two-factor secret', () => {
      const secret = securityService.generateTwoFactorSecret();
      
      expect(secret).toBeDefined();
      expect(typeof secret).toBe('string');
      expect(secret.length).toBeGreaterThan(0);
    });

    it('should generate and verify two-factor code', () => {
      const secret = securityService.generateTwoFactorSecret();
      const code = securityService.generateTwoFactorCode(secret);
      
      expect(code).toBeDefined();
      expect(code.length).toBe(6);
      expect(/^\d{6}$/.test(code)).toBe(true);
      
      const isValid = securityService.verifyTwoFactorCode(secret, code);
      expect(isValid).toBe(true);
    });

    it('should reject invalid two-factor code', () => {
      const secret = securityService.generateTwoFactorSecret();
      const code = securityService.generateTwoFactorCode(secret);
      const wrongCode = '000000';
      
      const isValid = securityService.verifyTwoFactorCode(secret, wrongCode);
      expect(isValid).toBe(false);
    });
  });

  describe('Input Sanitization', () => {
    it('should sanitize string input', () => {
      const input = '<script>alert("xss")</script>Hello World';
      const sanitized = securityService.sanitizeInput(input);
      
      expect(sanitized).toBe('scriptalert("xss")/scriptHello World');
    });

    it('should sanitize object input', () => {
      const input = {
        name: '<script>alert("xss")</script>',
        email: 'test@example.com',
        description: 'Hello <b>World</b>'
      };
      const sanitized = securityService.sanitizeInput(input);
      
      expect(sanitized.name).toBe('scriptalert("xss")/script');
      expect(sanitized.email).toBe('test@example.com');
      expect(sanitized.description).toBe('Hello bWorld/b');
    });

    it('should sanitize array input', () => {
      const input = ['<script>alert("xss")</script>', 'normal text', '<b>bold</b>'];
      const sanitized = securityService.sanitizeInput(input);
      
      expect(sanitized[0]).toBe('scriptalert("xss")/script');
      expect(sanitized[1]).toBe('normal text');
      expect(sanitized[2]).toBe('bbold/b');
    });
  });

  describe('CSRF Protection', () => {
    it('should generate CSRF token', () => {
      const token = securityService.generateCSRFToken();
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBe(64);
    });

    it('should verify valid CSRF token', () => {
      const token = securityService.generateCSRFToken();
      const sessionToken = 'valid-session-token';
      
      const isValid = securityService.verifyCSRFToken(token, sessionToken);
      expect(isValid).toBe(true);
    });

    it('should reject invalid CSRF token', () => {
      const token = 'invalid-token';
      const sessionToken = 'valid-session-token';
      
      const isValid = securityService.verifyCSRFToken(token, sessionToken);
      expect(isValid).toBe(false);
    });
  });

  describe('Security Headers', () => {
    it('should return security headers', () => {
      const headers = securityService.getSecurityHeaders();
      
      expect(headers).toBeDefined();
      expect(headers['X-Content-Type-Options']).toBe('nosniff');
      expect(headers['X-Frame-Options']).toBe('DENY');
      expect(headers['X-XSS-Protection']).toBe('1; mode=block');
      expect(headers['Strict-Transport-Security']).toContain('max-age=31536000');
    });
  });

  describe('Password Reset Token', () => {
    it('should generate password reset token', () => {
      const token = securityService.generatePasswordResetToken();
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBe(64);
    });
  });
});
