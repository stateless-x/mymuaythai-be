import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as trainerService from '../services/trainerService';
import { CreateTrainerRequest, ApiResponse, PaginatedResponse, TrainerWithDetails } from '../types';
import { trainerQuerySchema, trainerByIdQuerySchema, formatZodError } from '../utils/validation';
import { ValidationError, NotFoundError } from '../utils/database';
import { z } from 'zod';

export async function trainerRoutes(fastify: FastifyInstance) {
  // Get all trainers with pagination
  fastify.get('/trainers', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Validate query parameters
      const { page, pageSize, search, provinceId, gymId, isFreelance, includeInactive, includeClasses, unassignedOnly } = trainerQuerySchema.parse(request.query);

      const { trainers, total } = await trainerService.getAllTrainers(
        page, 
        pageSize, 
        search, 
        provinceId, 
        gymId, 
        isFreelance, 
        includeInactive ? undefined : true, // includeInactive=false means only active (isActive=true), includeInactive=true means all (isActive=undefined)
        'created_at', // sortField
        'desc', // sortBy  
        includeClasses, 
        unassignedOnly
      );
      const totalPages = Math.ceil(total / pageSize);
      
      const response: ApiResponse<PaginatedResponse<TrainerWithDetails>> = {
        success: true,
        data: {
          items: trainers,
          total,
          page,
          pageSize,
          totalPages
        },
        message: 'Trainers retrieved successfully'
      };
      return reply.code(200).send(response);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(`Query validation failed: ${formatZodError(error)}`);
      }
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to retrieve trainers'
      };
      return reply.code(500).send(response);
    }
  });

  // Get trainer by ID
  fastify.get('/trainers/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      
      if (!id) {
        throw new ValidationError('Trainer ID is required');
      }

      // Parse query parameters
      const { includeInactive } = trainerByIdQuerySchema.parse(request.query);
      
      const trainer = await trainerService.getTrainerById(id, includeInactive);
      
      if (!trainer) {
        throw new NotFoundError('Trainer', id);
      }

      const response: ApiResponse<typeof trainer> = {
        success: true,
        data: trainer,
        message: 'Trainer retrieved successfully'
      };
      return reply.code(200).send(response);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(`Query validation failed: ${formatZodError(error)}`);
      }
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to retrieve trainer'
      };
      return reply.code(500).send(response);
    }
  });

  // Get trainers by gym with pagination
  fastify.get('/trainers/gym/:gymId', async (request: FastifyRequest<{ 
    Params: { gymId: string };
  }>, reply: FastifyReply) => {
    try {
      const { gymId } = request.params;
      // Validate query parameters
      const { page, pageSize, includeInactive, includeClasses } = trainerQuerySchema.parse(request.query);
      
      const { trainers, total } = await trainerService.getTrainersByGym(gymId, page, pageSize, includeInactive, includeClasses);
      const totalPages = Math.ceil(total / pageSize);
      
      const response: ApiResponse<PaginatedResponse<TrainerWithDetails>> = {
        success: true,
        data: {
          items: trainers,
          total,
          page,
          pageSize,
          totalPages
        },
        message: 'Trainers retrieved successfully'
      };
      return reply.code(200).send(response);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(`Query validation failed: ${formatZodError(error)}`);
      }
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to retrieve trainers by gym'
      };
      return reply.code(500).send(response);
    }
  });

  // Get trainers by province with pagination
  fastify.get('/trainers/province/:provinceId', async (request: FastifyRequest<{ 
    Params: { provinceId: string };
  }>, reply: FastifyReply) => {
    try {
      const { provinceId } = request.params;
      // Validate query parameters
      const { page, pageSize, includeInactive, includeClasses } = trainerQuerySchema.parse(request.query);
      
      const { trainers, total } = await trainerService.getTrainersByProvince(parseInt(provinceId), page, pageSize, includeInactive, includeClasses);
      const totalPages = Math.ceil(total / pageSize);
      
      const response: ApiResponse<PaginatedResponse<TrainerWithDetails>> = {
        success: true,
        data: {
          items: trainers,
          total,
          page,
          pageSize,
          totalPages
        },
        message: 'Trainers retrieved successfully'
      };
      return reply.code(200).send(response);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(`Query validation failed: ${formatZodError(error)}`);
      }
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to retrieve trainers by province'
      };
      return reply.code(500).send(response);
    }
  });

  // Get freelance trainers with pagination
  fastify.get('/trainers/freelance', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Validate query parameters
      const { page, pageSize, includeInactive, includeClasses } = trainerQuerySchema.parse(request.query);
      
      const { trainers, total } = await trainerService.getFreelanceTrainers(page, pageSize, includeInactive, includeClasses);
      const totalPages = Math.ceil(total / pageSize);
      
      const response: ApiResponse<PaginatedResponse<TrainerWithDetails>> = {
        success: true,
        data: {
          items: trainers,
          total,
          page,
          pageSize,
          totalPages
        },
        message: 'Freelance trainers retrieved successfully'
      };
      return reply.code(200).send(response);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(`Query validation failed: ${formatZodError(error)}`);
      }
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to retrieve freelance trainers'
      };
      return reply.code(500).send(response);
    }
  });

  // Get trainer's classes
  fastify.get('/trainers/:id/classes', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const classes = await trainerService.getTrainerClasses(id);
      
      const response: ApiResponse<typeof classes> = {
        success: true,
        data: classes,
        message: 'Trainer classes retrieved successfully'
      };
      return reply.code(200).send(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to retrieve trainer classes'
      };
      return reply.code(500).send(response);
    }
  });

  // Search trainers with pagination
  fastify.get('/trainers/search/:query', async (request: FastifyRequest<{ 
    Params: { query: string };
  }>, reply: FastifyReply) => {
    try {
      const { query } = request.params;
      // Validate query parameters
      const { page, pageSize, includeInactive, includeClasses, isFreelance } = trainerQuerySchema.parse(request.query);
      
      const { trainers, total } = await trainerService.searchTrainers(query, page, pageSize, includeClasses, includeInactive, isFreelance);
      const totalPages = Math.ceil(total / pageSize);
      
      const response: ApiResponse<PaginatedResponse<TrainerWithDetails>> = {
        success: true,
        data: {
          items: trainers,
          total,
          page,
          pageSize,
          totalPages
        },
        message: 'Trainers search completed successfully'
      };
      return reply.code(200).send(response);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(`Query validation failed: ${formatZodError(error)}`);
      }
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to search trainers'
      };
      return reply.code(500).send(response);
    }
  });

  // Create new trainer
  fastify.post('/trainers', async (request: FastifyRequest<{ Body: CreateTrainerRequest }>, reply: FastifyReply) => {
    try {
      const trainerData = request.body;
      const trainer = await trainerService.createTrainer(trainerData);
      
      const response: ApiResponse<typeof trainer> = {
        success: true,
        data: trainer,
        message: 'Trainer created successfully'
      };
      return reply.code(201).send(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to create trainer'
      };
      return reply.code(500).send(response);
    }
  });

  // Update trainer
  fastify.put('/trainers/:id', async (request: FastifyRequest<{ 
    Params: { id: string };
    Body: Partial<CreateTrainerRequest>;
  }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const updateData = request.body;
      
      const trainer = await trainerService.updateTrainer(id, updateData);
      
      if (!trainer) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Trainer not found'
        };
        return reply.code(404).send(response);
      }

      const response: ApiResponse<typeof trainer> = {
        success: true,
        data: trainer,
        message: 'Trainer updated successfully'
      };
      return reply.code(200).send(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to update trainer'
      };
      return reply.code(500).send(response);
    }
  });

  // Delete trainer (soft delete)
  fastify.delete('/trainers/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const deleted = await trainerService.deleteTrainer(id);
      
      if (!deleted) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Trainer not found'
        };
        return reply.code(404).send(response);
      }

      const response: ApiResponse<null> = {
        success: true,
        message: 'Trainer deleted successfully'
      };
      return reply.code(200).send(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to delete trainer'
      };
      return reply.code(500).send(response);
    }
  });

  // Add class to trainer
  fastify.post('/trainers/:id/classes', async (request: FastifyRequest<{ 
    Params: { id: string };
    Body: { class_id: string };
  }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const { class_id } = request.body;
      
      const success = await trainerService.addTrainerClass(id, class_id);
      
      if (!success) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Failed to add class to trainer'
        };
        return reply.code(400).send(response);
      }

      const response: ApiResponse<null> = {
        success: true,
        message: 'Class added to trainer successfully'
      };
      return reply.code(201).send(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to add class to trainer'
      };
      return reply.code(500).send(response);
    }
  });

  // Remove class from trainer
  fastify.delete('/trainers/:id/classes/:classId', async (request: FastifyRequest<{ 
    Params: { id: string; classId: string };
  }>, reply: FastifyReply) => {
    try {
      const { id, classId } = request.params;
      
      const success = await trainerService.removeTrainerClass(id, classId);
      
      if (!success) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Failed to remove class from trainer'
        };
        return reply.code(400).send(response);
      }

      const response: ApiResponse<null> = {
        success: true,
        message: 'Class removed from trainer successfully'
      };
      return reply.code(200).send(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to remove class from trainer'
      };
      return reply.code(500).send(response);
    }
  });

  // Get unassigned trainers (not freelance but no gym assigned)
  fastify.get('/trainers/unassigned', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Validate query parameters
      const { page, pageSize, includeInactive, includeClasses } = trainerQuerySchema.parse(request.query);
      
      const { trainers, total } = await trainerService.getUnassignedTrainers(page, pageSize, includeInactive, includeClasses);
      const totalPages = Math.ceil(total / pageSize);
      
      const response: ApiResponse<PaginatedResponse<TrainerWithDetails>> = {
        success: true,
        data: {
          items: trainers,
          total,
          page,
          pageSize,
          totalPages
        },
        message: 'Unassigned trainers retrieved successfully'
      };
      return reply.code(200).send(response);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(`Query validation failed: ${formatZodError(error)}`);
      }
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to retrieve unassigned trainers'
      };
      return reply.code(500).send(response);
    }
  });
} 