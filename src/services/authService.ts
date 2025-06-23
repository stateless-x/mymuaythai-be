import jwt from 'jsonwebtoken';
import { env } from '../config/environment';
import type { AdminUser } from './adminUserService';

// JWT payload interface
export interface JWTPayload {
  userId: string;
  email: string;
  role: 'admin' | 'staff';
  sessionId?: string; // Add session tracking
  iat?: number;
  exp?: number;
}

// Token configuration - Standard production values
const TOKEN_EXPIRY = '1h'; // 1 hour - standard for admin systems
const REFRESH_TOKEN_EXPIRY = '30d'; // 30 days - standard refresh token lifetime

// In-memory token blacklist (use Redis in production)
const tokenBlacklist = new Set<string>();

export class AuthService {
  private static readonly jwtSecret = env.JWT_SECRET;

  /**
   * Generate access token for authenticated user
   */
  static generateAccessToken(user: AdminUser): string {
    const sessionId = this.generateSessionId();
    const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId,
    };

    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: TOKEN_EXPIRY,
      issuer: 'mymuaythai-api',
      audience: 'mymuaythai-admin',
      jwtid: sessionId, // Add JWT ID for tracking
    });
  }

  /**
   * Generate refresh token
   */
  static generateRefreshToken(user: AdminUser): string {
    const sessionId = this.generateSessionId();
    const payload = {
      userId: user.id,
      type: 'refresh',
      sessionId,
    };

    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: REFRESH_TOKEN_EXPIRY,
      issuer: 'mymuaythai-api',
      audience: 'mymuaythai-admin',
      jwtid: sessionId,
    });
  }

  /**
   * Verify and decode access token
   */
  static verifyAccessToken(token: string): JWTPayload | null {
    try {
      // Check if token is blacklisted
      if (tokenBlacklist.has(token)) {
        return null;
      }

      const decoded = jwt.verify(token, this.jwtSecret, {
        issuer: 'mymuaythai-api',
        audience: 'mymuaythai-admin',
      }) as JWTPayload;

      return decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * Verify refresh token
   */
  static verifyRefreshToken(token: string): { userId: string; sessionId?: string } | null {
    try {
      // Check if token is blacklisted
      if (tokenBlacklist.has(token)) {
        return null;
      }

      const decoded = jwt.verify(token, this.jwtSecret, {
        issuer: 'mymuaythai-api',
        audience: 'mymuaythai-admin',
      }) as any;

      if (decoded.type !== 'refresh') {
        return null;
      }

      return { userId: decoded.userId, sessionId: decoded.sessionId };
    } catch (error) {
      return null;
    }
  }

  /**
   * Blacklist a token (for logout)
   */
  static blacklistToken(token: string): void {
    tokenBlacklist.add(token);
    
    // Clean up expired tokens periodically
    if (tokenBlacklist.size > 1000) {
      this.cleanupBlacklist();
    }
  }

  /**
   * Blacklist all user tokens (for force logout)
   */
  static blacklistUserTokens(userId: string): void {
    // In production, you'd query your token store/Redis
    // For now, we'll track sessions differently
    console.log(`Blacklisting all tokens for user: ${userId}`);
  }

  /**
   * Extract token from Authorization header
   */
  static extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1] || null;
  }

  /**
   * Check if token is expired (without verifying signature)
   */
  static isTokenExpired(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) {
        return true;
      }

      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  /**
   * Get token expiration time
   */
  static getTokenExpiration(token: string): Date | null {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) {
        return null;
      }

      return new Date(decoded.exp * 1000);
    } catch (error) {
      return null;
    }
  }

  /**
   * Get token time remaining in minutes
   */
  static getTokenTimeRemaining(token: string): number {
    const expiration = this.getTokenExpiration(token);
    if (!expiration) return 0;
    
    const now = new Date();
    const remainingMs = expiration.getTime() - now.getTime();
    return Math.max(0, Math.floor(remainingMs / (1000 * 60))); // minutes
  }

  /**
   * Generate unique session ID
   */
  private static generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean up expired tokens from blacklist
   */
  private static cleanupBlacklist(): void {
    // In production, implement proper cleanup logic
    // For now, just clear old entries
    if (tokenBlacklist.size > 2000) {
      tokenBlacklist.clear();
    }
  }
} 