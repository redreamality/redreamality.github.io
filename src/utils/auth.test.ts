import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  verifyAdminPassword,
  generateAdminToken,
  verifyToken,
  authenticateAdmin,
  isAuthenticated,
  getTokenFromCookies,
  isAuthenticatedFromCookies,
  type AuthResult,
  type TokenPayload
} from './auth';

// Mock bcrypt and jwt
vi.mock('bcryptjs');
vi.mock('jsonwebtoken');

const mockBcrypt = vi.mocked(bcrypt);
const mockJwt = vi.mocked(jwt);

describe('Auth Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variables
    delete process.env.ADMIN_PASSWORD;
    delete process.env.JWT_SECRET;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('verifyAdminPassword', () => {
    it('should return false when ADMIN_PASSWORD is not set', async () => {
      const result = await verifyAdminPassword('test-password');
      expect(result).toBe(false);
    });

    it('should verify hashed password correctly', async () => {
      process.env.ADMIN_PASSWORD = '$2b$10$hashedpassword';
      mockBcrypt.compare.mockResolvedValue(true);

      const result = await verifyAdminPassword('correct-password');
      
      expect(result).toBe(true);
      expect(mockBcrypt.compare).toHaveBeenCalledWith('correct-password', '$2b$10$hashedpassword');
    });

    it('should reject incorrect hashed password', async () => {
      process.env.ADMIN_PASSWORD = '$2b$10$hashedpassword';
      mockBcrypt.compare.mockResolvedValue(false);

      const result = await verifyAdminPassword('wrong-password');
      
      expect(result).toBe(false);
      expect(mockBcrypt.compare).toHaveBeenCalledWith('wrong-password', '$2b$10$hashedpassword');
    });

    it('should verify plain text password in development', async () => {
      process.env.ADMIN_PASSWORD = 'plain-password';

      const result = await verifyAdminPassword('plain-password');
      expect(result).toBe(true);
    });

    it('should reject incorrect plain text password', async () => {
      process.env.ADMIN_PASSWORD = 'plain-password';

      const result = await verifyAdminPassword('wrong-password');
      expect(result).toBe(false);
    });

    it('should handle bcrypt errors gracefully', async () => {
      process.env.ADMIN_PASSWORD = '$2b$10$hashedpassword';
      mockBcrypt.compare.mockRejectedValue(new Error('Bcrypt error'));

      const result = await verifyAdminPassword('test-password');
      expect(result).toBe(false);
    });
  });

  describe('generateAdminToken', () => {
    it('should generate a valid JWT token', () => {
      const mockToken = 'mock-jwt-token';
      mockJwt.sign.mockReturnValue(mockToken);

      const result = generateAdminToken();

      expect(result).toBe(mockToken);
      expect(mockJwt.sign).toHaveBeenCalledWith(
        { isAdmin: true },
        'your-secret-key',
        { expiresIn: '24h' }
      );
    });

    it('should use custom JWT_SECRET from environment', () => {
      process.env.JWT_SECRET = 'custom-secret';
      const mockToken = 'mock-jwt-token';
      mockJwt.sign.mockReturnValue(mockToken);

      generateAdminToken();

      expect(mockJwt.sign).toHaveBeenCalledWith(
        { isAdmin: true },
        'custom-secret',
        { expiresIn: '24h' }
      );
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', () => {
      const mockPayload: TokenPayload = { isAdmin: true, iat: 123, exp: 456 };
      mockJwt.verify.mockReturnValue(mockPayload);

      const result = verifyToken('valid-token');

      expect(result).toEqual(mockPayload);
      expect(mockJwt.verify).toHaveBeenCalledWith('valid-token', 'your-secret-key');
    });

    it('should return null for invalid token', () => {
      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = verifyToken('invalid-token');

      expect(result).toBeNull();
    });
  });

  describe('authenticateAdmin', () => {
    it('should authenticate with correct password', async () => {
      process.env.ADMIN_PASSWORD = 'correct-password';
      const mockToken = 'mock-jwt-token';
      mockJwt.sign.mockReturnValue(mockToken);

      const result = await authenticateAdmin('correct-password');

      expect(result).toEqual({
        success: true,
        token: mockToken
      });
    });

    it('should reject incorrect password', async () => {
      process.env.ADMIN_PASSWORD = 'correct-password';

      const result = await authenticateAdmin('wrong-password');

      expect(result).toEqual({
        success: false,
        error: 'Invalid password'
      });
    });
  });

  describe('isAuthenticated', () => {
    it('should return true for valid Bearer token', () => {
      const mockPayload: TokenPayload = { isAdmin: true };
      mockJwt.verify.mockReturnValue(mockPayload);

      const request = new Request('http://example.com', {
        headers: { Authorization: 'Bearer valid-token' }
      });

      const result = isAuthenticated(request);

      expect(result).toBe(true);
      expect(mockJwt.verify).toHaveBeenCalledWith('valid-token', 'your-secret-key');
    });

    it('should return false for missing Authorization header', () => {
      const request = new Request('http://example.com');

      const result = isAuthenticated(request);

      expect(result).toBe(false);
    });

    it('should return false for invalid Bearer format', () => {
      const request = new Request('http://example.com', {
        headers: { Authorization: 'Invalid format' }
      });

      const result = isAuthenticated(request);

      expect(result).toBe(false);
    });

    it('should return false for invalid token', () => {
      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const request = new Request('http://example.com', {
        headers: { Authorization: 'Bearer invalid-token' }
      });

      const result = isAuthenticated(request);

      expect(result).toBe(false);
    });

    it('should return false for non-admin token', () => {
      const mockPayload: TokenPayload = { isAdmin: false };
      mockJwt.verify.mockReturnValue(mockPayload);

      const request = new Request('http://example.com', {
        headers: { Authorization: 'Bearer non-admin-token' }
      });

      const result = isAuthenticated(request);

      expect(result).toBe(false);
    });
  });

  describe('getTokenFromCookies', () => {
    it('should extract token from cookies', () => {
      const cookieHeader = 'admin-token=abc123; other-cookie=value';

      const result = getTokenFromCookies(cookieHeader);

      expect(result).toBe('abc123');
    });

    it('should return null for missing cookie header', () => {
      const result = getTokenFromCookies(null);

      expect(result).toBeNull();
    });

    it('should return null when admin-token cookie is missing', () => {
      const cookieHeader = 'other-cookie=value; another=test';

      const result = getTokenFromCookies(cookieHeader);

      expect(result).toBeNull();
    });

    it('should handle cookies with spaces', () => {
      const cookieHeader = ' admin-token = abc123 ; other-cookie = value ';

      const result = getTokenFromCookies(cookieHeader);

      expect(result).toBe('abc123');
    });
  });

  describe('isAuthenticatedFromCookies', () => {
    it('should return true for valid cookie token', () => {
      const mockPayload: TokenPayload = { isAdmin: true };
      mockJwt.verify.mockClear();
      mockJwt.verify.mockReturnValueOnce(mockPayload);

      const request = new Request('http://example.com');
      // Manually set the cookie header using Headers API
      request.headers.set('Cookie', 'admin-token=valid-token');

      const result = isAuthenticatedFromCookies(request);

      expect(result).toBe(true);
      expect(mockJwt.verify).toHaveBeenCalledWith('valid-token', 'your-secret-key');
    });

    it('should return false for missing cookie', () => {
      const request = new Request('http://example.com');

      const result = isAuthenticatedFromCookies(request);

      expect(result).toBe(false);
    });

    it('should return false for invalid cookie token', () => {
      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const request = new Request('http://example.com', {
        headers: { Cookie: 'admin-token=invalid-token' }
      });

      const result = isAuthenticatedFromCookies(request);

      expect(result).toBe(false);
    });
  });
});
