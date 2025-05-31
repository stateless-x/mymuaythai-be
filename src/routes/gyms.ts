import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { GymService } from '../services/gymService';
import { CreateGymRequest, ApiResponse, PaginatedResponse, GymWithDetails } from '../types';

const gymService = new GymService();

export async function gymRoutes(fastify: FastifyInstance) {
  // Get all gyms with pagination
  fastify.get('/gyms', async (request: FastifyRequest<{
    Querystring: { 
      page?: string;
      pageSize?: string;
      search?: string;
      provinceId?: string;
    }
  }>, reply: FastifyReply) => {
    try {
      const page = parseInt(request.query.page || '1');
      const pageSize = parseInt(request.query.pageSize || '20');
      const searchTerm = request.query.search;
      const provinceId = request.query.provinceId ? parseInt(request.query.provinceId) : undefined;

      const { gyms, total } = await gymService.getAllGyms(page, pageSize, searchTerm, provinceId);
      const totalPages = Math.ceil(total / pageSize);
      
      const response: ApiResponse<PaginatedResponse<GymWithDetails>> = {
        success: true,
        data: {
          items: gyms,
          total,
          page,
          pageSize,
          totalPages
        },
        message: 'Gyms retrieved successfully'
      };
      return reply.code(200).send(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to retrieve gyms'
      };
      return reply.code(500).send(response);
    }
  });

  // Get gym by ID
  fastify.get('/gyms/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const gym = await gymService.getGymById(id);
      
      if (!gym) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Gym not found'
        };
        return reply.code(404).send(response);
      }

      const response: ApiResponse<typeof gym> = {
        success: true,
        data: gym,
        message: 'Gym retrieved successfully'
      };
      return reply.code(200).send(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to retrieve gym'
      };
      return reply.code(500).send(response);
    }
  });

  // Get gym images
  fastify.get('/gyms/:id/images', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const images = await gymService.getGymImages(id);
      
      const response: ApiResponse<typeof images> = {
        success: true,
        data: images,
        message: 'Gym images retrieved successfully'
      };
      return reply.code(200).send(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to retrieve gym images'
      };
      return reply.code(500).send(response);
    }
  });

  // Get gyms by province
  fastify.get('/gyms/province/:provinceId', async (request: FastifyRequest<{ Params: { provinceId: string } }>, reply: FastifyReply) => {
    try {
      const { provinceId } = request.params;
      const gyms = await gymService.getGymsByProvince(parseInt(provinceId));
      
      const response: ApiResponse<typeof gyms> = {
        success: true,
        data: gyms,
        message: 'Gyms retrieved successfully'
      };
      return reply.code(200).send(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to retrieve gyms by province'
      };
      return reply.code(500).send(response);
    }
  });

  // Search gyms
  fastify.get('/gyms/search/:query', async (request: FastifyRequest<{ 
    Params: { query: string };
    Querystring: { 
      page?: string;
      pageSize?: string;
    }
  }>, reply: FastifyReply) => {
    try {
      const { query } = request.params;
      const page = parseInt(request.query.page || '1');
      const pageSize = parseInt(request.query.pageSize || '20');
      
      const { gyms, total } = await gymService.searchGyms(query, page, pageSize);
      const totalPages = Math.ceil(total / pageSize);
      
      const response: ApiResponse<PaginatedResponse<GymWithDetails>> = {
        success: true,
        data: {
          items: gyms,
          total,
          page,
          pageSize,
          totalPages
        },
        message: 'Search results retrieved successfully'
      };
      return reply.code(200).send(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to search gyms'
      };
      return reply.code(500).send(response);
    }
  });

  // Create new gym
  fastify.post('/gyms', async (request: FastifyRequest<{ Body: CreateGymRequest }>, reply: FastifyReply) => {
    try {
      const gymData = request.body;
      const gym = await gymService.createGym(gymData);
      
      const response: ApiResponse<typeof gym> = {
        success: true,
        data: gym,
        message: 'Gym created successfully'
      };
      return reply.code(201).send(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to create gym'
      };
      return reply.code(500).send(response);
    }
  });

  // Update gym
  fastify.put('/gyms/:id', async (request: FastifyRequest<{ Params: { id: string }; Body: Partial<CreateGymRequest> }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const gymData = request.body;
      const gym = await gymService.updateGym(id, gymData);
      
      if (!gym) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Gym not found'
        };
        return reply.code(404).send(response);
      }

      const response: ApiResponse<typeof gym> = {
        success: true,
        data: gym,
        message: 'Gym updated successfully'
      };
      return reply.code(200).send(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to update gym'
      };
      return reply.code(500).send(response);
    }
  });

  // Delete gym (soft delete)
  fastify.delete('/gyms/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const deleted = await gymService.deleteGym(id);
      
      if (!deleted) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Gym not found'
        };
        return reply.code(404).send(response);
      }

      const response: ApiResponse<null> = {
        success: true,
        message: 'Gym deleted successfully'
      };
      return reply.code(200).send(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to delete gym'
      };
      return reply.code(500).send(response);
    }
  });

  // Add gym image
  fastify.post('/gyms/:id/images', async (request: FastifyRequest<{ Params: { id: string }; Body: { image_url: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const { image_url } = request.body;
      const image = await gymService.addGymImage(id, image_url);
      
      const response: ApiResponse<typeof image> = {
        success: true,
        data: image,
        message: 'Gym image added successfully'
      };
      return reply.code(201).send(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to add gym image'
      };
      return reply.code(500).send(response);
    }
  });

  // Remove gym image
  fastify.delete('/gyms/images/:imageId', async (request: FastifyRequest<{ Params: { imageId: string } }>, reply: FastifyReply) => {
    try {
      const { imageId } = request.params;
      const deleted = await gymService.removeGymImage(imageId);
      
      if (!deleted) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Image not found'
        };
        return reply.code(404).send(response);
      }

      const response: ApiResponse<null> = {
        success: true,
        message: 'Gym image removed successfully'
      };
      return reply.code(200).send(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to remove gym image'
      };
      return reply.code(500).send(response);
    }
  });
} 