import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as adminUserService from '../services/adminUserService';

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
  // Get all admin users
  fastify.get('/admin-users', async (request: FastifyRequest, reply: FastifyReply) => {
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

  // Get admin user by ID
  fastify.get<{ Params: AdminUserParams }>('/admin-users/:id', async (request, reply) => {
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

  // Create admin user
  fastify.post<{ Body: CreateAdminUserBody }>('/admin-users', async (request, reply) => {
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

  // Update admin user
  fastify.put<{ Params: AdminUserParams; Body: UpdateAdminUserBody }>('/admin-users/:id', async (request, reply) => {
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

  // Delete admin user
  fastify.delete<{ Params: AdminUserParams }>('/admin-users/:id', async (request, reply) => {
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

  // Login endpoint
  fastify.post<{ Body: AuthLoginBody }>('/admin-users/login', async (request, reply) => {
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

      reply.send({
        success: true,
        data: user,
        message: 'Login successful',
      });
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({
        success: false,
        error: 'Internal server error',
      });
    }
  });

  // Get user stats
  fastify.get('/admin-users/stats/count', async (request, reply) => {
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
} 