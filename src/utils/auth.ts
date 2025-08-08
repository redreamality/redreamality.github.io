import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Get admin password from environment variables
const ADMIN_PASSWORD = import.meta.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;
const JWT_SECRET = import.meta.env.JWT_SECRET || process.env.JWT_SECRET || 'your-secret-key';

export interface AuthResult {
  success: boolean;
  token?: string;
  error?: string;
}

export interface TokenPayload {
  isAdmin: boolean;
  iat?: number;
  exp?: number;
}

/**
 * Verify admin password
 */
export async function verifyAdminPassword(password: string): Promise<boolean> {
  if (!ADMIN_PASSWORD) {
    console.error('ADMIN_PASSWORD environment variable is not set');
    return false;
  }
  
  try {
    // For development, allow plain text comparison
    // In production, you should hash the password in GitHub secrets
    if (ADMIN_PASSWORD.startsWith('$2')) {
      // Hashed password
      return await bcrypt.compare(password, ADMIN_PASSWORD);
    } else {
      // Plain text password (development only)
      return password === ADMIN_PASSWORD;
    }
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
}

/**
 * Generate JWT token for admin
 */
export function generateAdminToken(): string {
  const payload: TokenPayload = {
    isAdmin: true
  };
  
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: '24h' 
  });
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

/**
 * Authenticate admin user
 */
export async function authenticateAdmin(password: string): Promise<AuthResult> {
  const isValid = await verifyAdminPassword(password);
  
  if (!isValid) {
    return {
      success: false,
      error: 'Invalid password'
    };
  }
  
  const token = generateAdminToken();
  
  return {
    success: true,
    token
  };
}

/**
 * Check if request has valid admin token
 */
export function isAuthenticated(request: Request): boolean {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  
  const token = authHeader.substring(7);
  const payload = verifyToken(token);
  
  return payload !== null && payload.isAdmin === true;
}

/**
 * Extract token from cookies
 */
export function getTokenFromCookies(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);
  
  return cookies['admin-token'] || null;
}

/**
 * Check authentication from cookies
 */
export function isAuthenticatedFromCookies(request: Request): boolean {
  const cookieHeader = request.headers.get('Cookie');
  const token = getTokenFromCookies(cookieHeader);
  
  if (!token) return false;
  
  const payload = verifyToken(token);
  return payload !== null && payload.isAdmin === true;
}
