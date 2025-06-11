import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as gymService from '../services/gymService';
import { createGymSchema, updateGymSchema, gymQuerySchema, gymByIdQuerySchema, formatZodError } from '../utils/validation';
import { ValidationError, NotFoundError } from '../utils/database';
import { UpdateGymRequest } from '../types';
import { z } from 'zod';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export async function gymRoutes(fastify: FastifyInstance) {
  // Get all gyms with pagination and filtering
  fastify.get('/gyms', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Validate query parameters
      const { page, pageSize, search, provinceId, includeInactive } = gymQuerySchema.parse(request.query);
      
      const result = await gymService.getAllGyms(page, pageSize, search, provinceId, includeInactive);
      
      const response: ApiResponse<typeof result.gyms> = {
        success: true,
        data: result.gyms,
        pagination: {
          page,
          pageSize,
          total: result.total,
          totalPages: Math.ceil(result.total / pageSize),
        },
      };
      
      return reply.code(200).send(response);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(`Query validation failed: ${formatZodError(error)}`);
      }
      throw error;
    }
  });

  // Get gym by ID
  fastify.get('/gyms/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      
      if (!id) {
        throw new ValidationError('Gym ID is required');
      }

      // Parse query parameters
      const { includeInactive } = gymByIdQuerySchema.parse(request.query);
      
      const gym = await gymService.getGymById(id, includeInactive);
      
      if (!gym) {
        throw new NotFoundError('Gym', id);
      }

      const response: ApiResponse<typeof gym> = {
        success: true,
        data: gym,
      };
      
      return reply.code(200).send(response);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(`Query validation failed: ${formatZodError(error)}`);
      }
      throw error;
    }
  });

  // Get gym images
  fastify.get('/gyms/:id/images', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    const images = await gymService.getGymImages(id);
    
    const response: ApiResponse<typeof images> = {
      success: true,
      data: images,
    };
    return reply.code(200).send(response);
  });

  // Get gyms by province
  fastify.get('/provinces/:provinceId/gyms', async (request: FastifyRequest<{ Params: { provinceId: string } }>, reply: FastifyReply) => {
    const provinceId = parseInt(request.params.provinceId);
    
    if (isNaN(provinceId) || provinceId < 1) {
      throw new ValidationError('Valid province ID is required');
    }
    
    const gyms = await gymService.getGymsByProvince(provinceId);
    
    const response: ApiResponse<typeof gyms> = {
      success: true,
      data: gyms,
    };
    
    return reply.code(200).send(response);
  });

  // Search gyms
  fastify.get('/gyms/search', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { page, pageSize, search } = gymQuerySchema.parse(request.query);
      
      if (!search) {
        throw new ValidationError('Search term is required');
      }
      
      const result = await gymService.searchGyms(search, page, pageSize);
      
      const response: ApiResponse<typeof result.gyms> = {
        success: true,
        data: result.gyms,
        pagination: {
          page,
          pageSize,
          total: result.total,
          totalPages: Math.ceil(result.total / pageSize),
        },
      };
      
      return reply.code(200).send(response);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(`Query validation failed: ${formatZodError(error)}`);
      }
      throw error;
    }
  });

  // Create new gym
  fastify.post('/gyms', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Validate request body
      const gymData = createGymSchema.parse(request.body);
      
      const gym = await gymService.createGym(gymData);
      
      const response: ApiResponse<typeof gym> = {
        success: true,
        data: gym,
        message: 'Gym created successfully',
      };
      
      return reply.code(201).send(response);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(`Validation failed: ${formatZodError(error)}`);
      }
      throw error;
    }
  });

  // Update gym
  fastify.put('/gyms/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      
      if (!id) {
        throw new ValidationError('Gym ID is required');
      }
      
      // Validate request body
      const gymData = updateGymSchema.parse(request.body);
      
      const gym = await gymService.updateGym(id, gymData as UpdateGymRequest);
      
      if (!gym) {
        throw new NotFoundError('Gym', id);
      }

      const response: ApiResponse<typeof gym> = {
        success: true,
        data: gym,
        message: 'Gym updated successfully',
      };
      
      return reply.code(200).send(response);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(`Validation failed: ${formatZodError(error)}`);
      }
      throw error;
    }
  });

  // Delete gym (soft delete)
  fastify.delete('/gyms/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    
    if (!id) {
      throw new ValidationError('Gym ID is required');
    }
    
    const deleted = await gymService.deleteGym(id);
    
    if (!deleted) {
      throw new NotFoundError('Gym', id);
    }

    const response: ApiResponse<null> = {
      success: true,
      message: 'Gym deleted successfully',
    };
    
    return reply.code(200).send(response);
  });

  // Add gym image
  fastify.post('/gyms/:id/images', async (request: FastifyRequest<{ 
    Params: { id: string }, 
    Body: { image_url: string } 
  }>, reply: FastifyReply) => {
    const { id } = request.params;
    const { image_url } = request.body;
    
    if (!id) {
      throw new ValidationError('Gym ID is required');
    }
    
    if (!image_url || typeof image_url !== 'string') {
      throw new ValidationError('Valid image URL is required');
    }
    
    // Validate URL format
    try {
      new globalThis.URL(image_url);
    } catch {
      throw new ValidationError('Invalid image URL format');
    }
    
    const image = await gymService.addGymImage(id, image_url);
    
    const response: ApiResponse<typeof image> = {
      success: true,
      data: image,
      message: 'Image added successfully',
    };
    
    return reply.code(201).send(response);
  });

  // Remove gym image
  fastify.delete('/gyms/images/:imageId', async (request: FastifyRequest<{ Params: { imageId: string } }>, reply: FastifyReply) => {
    const { imageId } = request.params;
    
    if (!imageId) {
      throw new ValidationError('Image ID is required');
    }
    
    const deleted = await gymService.removeGymImage(imageId);
    
    if (!deleted) {
      throw new NotFoundError('Image', imageId);
    }

    const response: ApiResponse<null> = {
      success: true,
      message: 'Image removed successfully',
    };
    
    return reply.code(200).send(response);
  });
} 