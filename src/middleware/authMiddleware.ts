import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services/authService';
import { getAdminUserById } from '../services/adminUserService';

// Extend FastifyRequest to include user property
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      userId: string;
      email: string;
      role: 'admin' | 'staff';
    };
  }
}

/**
 * Authentication middleware to verify JWT tokens
 */
export async function authenticateToken(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const authHeader = request.headers.authorization;
    const token = AuthService.extractTokenFromHeader(authHeader);

    if (!token) {
      return reply.status(401).send({
        error: 'Access token required',
        message: 'Please provide a valid access token',
      });
    }

    const payload = AuthService.verifyAccessToken(token);
    
    if (!payload) {
      return reply.status(401).send({
        error: 'Invalid token',
        message: 'The provided token is invalid or expired',
      });
    }

    // Verify user still exists and is active
    const user = await getAdminUserById(payload.userId);
    
    if (!user || !user.is_active) {
      return reply.status(401).send({
        error: 'User not found or inactive',
        message: 'The user associated with this token is no longer active',
      });
    }

    // Attach user info to request
    request.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };
  } catch (error) {
    return reply.status(500).send({
      error: 'Authentication error',
      message: 'An error occurred during authentication',
    });
  }
}

/**
 * Authorization middleware to check user roles
 */
export function requireRole(...allowedRoles: Array<'admin' | 'staff'>) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!request.user) {
      return reply.status(401).send({
        error: 'Authentication required',
        message: 'Please authenticate first',
      });
    }

    if (!allowedRoles.includes(request.user.role)) {
      return reply.status(403).send({
        error: 'Insufficient permissions',
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
      });
    }
  };
}

/**
 * Admin-only middleware
 */
export const requireAdmin = requireRole('admin');

/**
 * Admin or Staff middleware
 */
export const requireAuth = requireRole('admin', 'staff'); 