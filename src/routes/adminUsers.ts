import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as adminUserService from '../services/adminUserService';
import { AuthService } from '../services/authService';
import { authenticateToken, requireAuth, requireAdmin } from '../middleware/authMiddleware';
import { loginRateLimit, adminRateLimit, apiRateLimit } from '../middleware/rateLimiter';

interface CreateAdminUserBody {
  email: string;
  password: string;
  role: 'admin' | 'staff';
}

interface UpdateAdminUserBody {
  email?: string;
  password?: string;
  role?: 'admin' | 'staff';
  is_active?: boolean;
}

interface AuthLoginBody {
  email: string;
  password: string;
}

interface AdminUserParams {
  id: string;
}

export default async function adminUsersRoutes(fastify: FastifyInstance) {
  // Get all admin users (requires authentication)
  fastify.get('/admin-users', { preHandler: [authenticateToken, requireAuth] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const users = await adminUserService.getAllAdminUsers();
      reply.send({
        success: true,
        data: users,
      });
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({
        success: false,
        error: 'Internal server error',
      });
    }
  });

  // Get admin user by ID (requires authentication)
  fastify.get<{ Params: AdminUserParams }>('/admin-users/:id', { preHandler: [authenticateToken, requireAuth] }, async (request, reply) => {
    try {
      const { id } = request.params;
      const user = await adminUserService.getAdminUserById(id);
      
      if (!user) {
        reply.status(404).send({
          success: false,
          error: 'Admin user not found',
        });
        return;
      }

      reply.send({
        success: true,
        data: user,
      });
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({
        success: false,
        error: 'Internal server error',
      });
    }
  });

  // Create admin user (requires admin privileges)
  fastify.post<{ Body: CreateAdminUserBody }>('/admin-users', { preHandler: [authenticateToken, requireAdmin, adminRateLimit] }, async (request, reply) => {
    try {
      const userData = request.body;
      const newUser = await adminUserService.createAdminUser(userData);
      
      reply.status(201).send({
        success: true,
        data: newUser,
        message: 'Admin user created successfully',
      });
    } catch (error: any) {
      fastify.log.error(error);
      
      // Handle specific errors
      if (error.message.includes('Validation error')) {
        reply.status(400).send({
          success: false,
          error: error.message,
        });
        return;
      }
      
      if (error.message.includes('Email already exists')) {
        reply.status(409).send({
          success: false,
          error: 'Email already exists',
        });
        return;
      }
      
      if (error.message.includes('Maximum 3 users allowed')) {
        reply.status(400).send({
          success: false,
          error: 'Maximum 3 users allowed',
        });
        return;
      }
      
      reply.status(500).send({
        success: false,
        error: 'Internal server error',
      });
    }
  });

  // Update admin user (requires admin privileges)
  fastify.put<{ Params: AdminUserParams; Body: UpdateAdminUserBody }>('/admin-users/:id', { preHandler: [authenticateToken, requireAdmin] }, async (request, reply) => {
    try {
      const { id } = request.params;
      const userData = request.body;
      
      const updatedUser = await adminUserService.updateAdminUser(id, userData);
      
      if (!updatedUser) {
        reply.status(404).send({
          success: false,
          error: 'Admin user not found',
        });
        return;
      }

      reply.send({
        success: true,
        data: updatedUser,
        message: 'Admin user updated successfully',
      });
    } catch (error: any) {
      fastify.log.error(error);
      
      // Handle specific errors
      if (error.message.includes('Validation error')) {
        reply.status(400).send({
          success: false,
          error: error.message,
        });
        return;
      }
      
      if (error.message.includes('Email already exists')) {
        reply.status(409).send({
          success: false,
          error: 'Email already exists',
        });
        return;
      }
      
      if (error.message.includes('Maximum 3 users allowed')) {
        reply.status(400).send({
          success: false,
          error: 'Maximum 3 users allowed',
        });
        return;
      }
      
      reply.status(500).send({
        success: false,
        error: 'Internal server error',
      });
    }
  });

  // Delete admin user (requires admin privileges)
  fastify.delete<{ Params: AdminUserParams }>('/admin-users/:id', { preHandler: [authenticateToken, requireAdmin] }, async (request, reply) => {
    try {
      const { id } = request.params;
      const deleted = await adminUserService.deleteAdminUser(id);
      
      if (!deleted) {
        reply.status(404).send({
          success: false,
          error: 'Admin user not found',
        });
        return;
      }

      reply.send({
        success: true,
        message: 'Admin user deleted successfully',
      });
    } catch (error: any) {
      fastify.log.error(error);
      
      if (error.message.includes('Cannot delete the last admin user')) {
        reply.status(400).send({
          success: false,
          error: 'Cannot delete the last admin user',
        });
        return;
      }
      
      reply.status(500).send({
        success: false,
        error: 'Internal server error',
      });
    }
  });

  // Login endpoint (public - no authentication required)
  fastify.post<{ Body: AuthLoginBody }>('/admin-users/login', { 
    config: { compress: false },
    preHandler: loginRateLimit
  }, async (request, reply) => {
    try {
      const { email, password } = request.body;
      const user = await adminUserService.authenticateAdminUser(email, password);
      
      if (!user) {
        reply.status(401).send({
          success: false,
          error: 'Invalid email or password',
        });
        return;
      }

      // Generate JWT tokens
      const accessToken = AuthService.generateAccessToken(user);
      const refreshToken = AuthService.generateRefreshToken(user);

      const successResponse = {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            is_active: user.is_active,
          },
          accessToken,
          refreshToken,
          expiresAt: AuthService.getTokenExpiration(accessToken),
        },
        message: 'Login successful',
      };
      
      // Disable compression for this response to avoid stream issues
      reply.header('Content-Encoding', 'identity');
      reply.type('application/json');
      reply.send(successResponse);
    } catch (error: any) {
      fastify.log.error(error);
      
      // Handle specific errors
      if (error.message === 'Account is inactive') {
        reply.status(403).send({
          success: false,
          error: 'Account is inactive',
        });
        return;
      }
      
      reply.status(500).send({
        success: false,
        error: 'Internal server error',
      });
    }
  });

  // Get user stats (requires authentication)
  fastify.get('/admin-users/stats/count', { preHandler: [authenticateToken, requireAuth] }, async (request, reply) => {
    try {
      const adminCount = await adminUserService.getAdminCount();
      const totalCount = await adminUserService.getTotalUserCount();
      reply.send({
        success: true,
        data: { 
          adminCount: adminCount,
          totalCount: totalCount
        },
      });
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({
        success: false,
        error: 'Internal server error',
      });
    }
  });

  // Refresh token endpoint (public - no authentication required)
  fastify.post<{ Body: { refreshToken: string } }>('/admin-users/refresh', { 
    preHandler: apiRateLimit 
  }, async (request, reply) => {
    try {
      const { refreshToken } = request.body;
      
      if (!refreshToken) {
        reply.status(400).send({
          success: false,
          error: 'Refresh token is required',
        });
        return;
      }

      const tokenData = AuthService.verifyRefreshToken(refreshToken);
      
      if (!tokenData) {
        reply.status(401).send({
          success: false,
          error: 'Invalid refresh token',
        });
        return;
      }

      // Get user to generate new tokens
      const user = await adminUserService.getAdminUserById(tokenData.userId);
      
      if (!user || !user.is_active) {
        reply.status(401).send({
          success: false,
          error: 'User not found or inactive',
        });
        return;
      }

      // Generate new tokens
      const newAccessToken = AuthService.generateAccessToken(user);
      const newRefreshToken = AuthService.generateRefreshToken(user);

      reply.send({
        success: true,
        data: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          expiresAt: AuthService.getTokenExpiration(newAccessToken),
        },
        message: 'Tokens refreshed successfully',
      });
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({
        success: false,
        error: 'Internal server error',
      });
    }
  });

  // Logout endpoint (requires authentication) - Support both POST and GET
  const logoutHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authHeader = request.headers.authorization;
      const token = AuthService.extractTokenFromHeader(authHeader);
      
      if (token) {
        // Blacklist the current token
        AuthService.blacklistToken(token);
      }

      reply.send({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({
        success: false,
        error: 'Internal server error',
      });
    }
  };

  // Support both POST and GET for logout
  fastify.post('/admin-users/logout', { preHandler: [authenticateToken] }, logoutHandler);
  fastify.get('/admin-users/logout', { preHandler: [authenticateToken] }, logoutHandler);
} 