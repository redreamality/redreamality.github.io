import jwt from 'jsonwebtoken';
import { createGitHubService, isValidGitHubToken, type GitHubAuthResult } from './github.js';

const JWT_SECRET = import.meta.env.JWT_SECRET || process.env.JWT_SECRET || 'github-auth-secret-key';

export interface GitHubAuthSession {
  success: boolean;
  token?: string;
  user?: {
    login: string;
    name: string;
    email: string;
    avatar_url: string;
  };
  error?: string;
}

export interface GitHubTokenPayload {
  githubToken: string;
  user: {
    login: string;
    name: string;
    email: string;
    avatar_url: string;
  };
  iat?: number;
  exp?: number;
}

/**
 * Authenticate user with GitHub Personal Access Token
 */
export async function authenticateWithGitHub(githubToken: string): Promise<GitHubAuthSession> {
  // Validate token format first
  if (!isValidGitHubToken(githubToken)) {
    return {
      success: false,
      error: 'Invalid GitHub token format'
    };
  }

  try {
    // Create GitHub service and validate token
    const githubService = createGitHubService(githubToken);
    const authResult: GitHubAuthResult = await githubService.validateToken();

    if (!authResult.success || !authResult.user) {
      return {
        success: false,
        error: authResult.error || 'GitHub authentication failed'
      };
    }

    // Generate JWT session token
    const sessionToken = generateGitHubSessionToken(githubToken, authResult.user);

    return {
      success: true,
      token: sessionToken,
      user: authResult.user
    };
  } catch (error) {
    console.error('GitHub authentication error:', error);
    return {
      success: false,
      error: 'Authentication failed. Please check your GitHub token.'
    };
  }
}

/**
 * Generate JWT session token containing GitHub token and user info
 */
export function generateGitHubSessionToken(githubToken: string, user: any): string {
  const payload: GitHubTokenPayload = {
    githubToken,
    user: {
      login: user.login,
      name: user.name,
      email: user.email,
      avatar_url: user.avatar_url,
    }
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '24h' // Session expires in 24 hours
  });
}

/**
 * Verify and decode GitHub session token
 */
export function verifyGitHubSessionToken(token: string): GitHubTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as GitHubTokenPayload;
    return decoded;
  } catch (error) {
    console.error('Error verifying GitHub session token:', error);
    return null;
  }
}

/**
 * Extract GitHub token from session token
 */
export function extractGitHubToken(sessionToken: string): string | null {
  const payload = verifyGitHubSessionToken(sessionToken);
  return payload?.githubToken || null;
}

/**
 * Check if request has valid GitHub authentication
 */
export function isGitHubAuthenticated(request: Request): boolean {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.substring(7);
  const payload = verifyGitHubSessionToken(token);
  
  return payload !== null && payload.githubToken && payload.user;
}

/**
 * Get GitHub service from authenticated request
 */
export function getGitHubServiceFromRequest(request: Request): ReturnType<typeof createGitHubService> | null {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const sessionToken = authHeader.substring(7);
  const githubToken = extractGitHubToken(sessionToken);
  
  if (!githubToken) {
    return null;
  }

  return createGitHubService(githubToken);
}

/**
 * Extract session token from cookies
 */
export function getGitHubSessionFromCookies(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);
  
  return cookies['github-session'] || null;
}

/**
 * Check GitHub authentication from cookies
 */
export function isGitHubAuthenticatedFromCookies(request: Request): boolean {
  const cookieHeader = request.headers.get('Cookie');
  const sessionToken = getGitHubSessionFromCookies(cookieHeader);
  
  if (!sessionToken) return false;
  
  const payload = verifyGitHubSessionToken(sessionToken);
  return payload !== null && payload.githubToken && payload.user;
}

/**
 * Get user info from session token
 */
export function getUserFromSession(sessionToken: string): GitHubTokenPayload['user'] | null {
  const payload = verifyGitHubSessionToken(sessionToken);
  return payload?.user || null;
}

/**
 * Refresh GitHub token validation
 */
export async function refreshGitHubAuth(sessionToken: string): Promise<GitHubAuthSession> {
  const githubToken = extractGitHubToken(sessionToken);
  
  if (!githubToken) {
    return {
      success: false,
      error: 'No GitHub token found in session'
    };
  }

  // Re-validate the GitHub token
  return await authenticateWithGitHub(githubToken);
}

/**
 * Create GitHub service from cookies
 */
export function getGitHubServiceFromCookies(request: Request): ReturnType<typeof createGitHubService> | null {
  const cookieHeader = request.headers.get('Cookie');
  const sessionToken = getGitHubSessionFromCookies(cookieHeader);
  
  if (!sessionToken) {
    return null;
  }

  const githubToken = extractGitHubToken(sessionToken);
  
  if (!githubToken) {
    return null;
  }

  return createGitHubService(githubToken);
}
