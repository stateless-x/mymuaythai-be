import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as trainerSelectionService from '../services/trainerSelectionService';
import { ApiResponse, PaginatedResponse } from '../types';
import { z } from 'zod';

// Validation schemas for selection endpoints
const selectionQuerySchema = z.object({
  page: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().min(1)).optional(),
  pageSize: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().min(1).max(100)).optional(),
  searchTerm: z.string().optional(),
  provinceId: z.string().transform((val) => parseInt(val, 10)).pipe(z.number()).optional(),
  excludeIds: z.string().optional(), // Comma-separated IDs
  sortBy: z.enum(['name', 'experience', 'recent']).optional()
});

const quickSearchSchema = z.object({
  q: z.string().min(1),
  limit: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().min(1).max(50)).optional()
});

export async function trainerSelectionRoutes(fastify: FastifyInstance) {
  // Get available trainers for selection
  fastify.get('/selection/trainers/available', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = selectionQuerySchema.parse(request.query);
      
      const filters: trainerSelectionService.SelectionFilters = {
        ...(query.searchTerm && { searchTerm: query.searchTerm }),
        ...(query.provinceId && { provinceId: query.provinceId }),
        ...(query.excludeIds && { excludeTrainerIds: query.excludeIds.split(',').filter(Boolean) })
      };
      
      const options: trainerSelectionService.SelectionOptions = {
        page: query.page || 1,
        pageSize: query.pageSize || 50,
        sortBy: query.sortBy || 'name'
      };
      
      const { trainers, total } = await trainerSelectionService.getAvailableTrainersForSelection(filters, options);
      const totalPages = Math.ceil(total / options.pageSize!);
      
      const response: ApiResponse<PaginatedResponse<trainerSelectionService.TrainerForSelection>> = {
        success: true,
        data: {
          items: trainers,
          total,
          page: options.page!,
          pageSize: options.pageSize!,
          totalPages
        },
        message: 'Available trainers for selection retrieved successfully'
      };
      
      return reply.code(200).send(response);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const response: ApiResponse<null> = {
          success: false,
          error: `Query validation failed: ${error.issues.map(i => i.message).join(', ')}`
        };
        return reply.code(400).send(response);
      }
      
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to retrieve available trainers for selection'
      };
      return reply.code(500).send(response);
    }
  });

  // Get trainers currently assigned to a gym
  fastify.get('/selection/trainers/gym/:gymId', async (request: FastifyRequest<{ 
    Params: { gymId: string };
  }>, reply: FastifyReply) => {
    try {
      const { gymId } = request.params;
      
      if (!gymId) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Gym ID is required'
        };
        return reply.code(400).send(response);
      }
      
      const trainers = await trainerSelectionService.getGymTrainers(gymId);
      
      const response: ApiResponse<trainerSelectionService.TrainerForSelection[]> = {
        success: true,
        data: trainers,
        message: 'Gym trainers retrieved successfully'
      };
      
      return reply.code(200).send(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to retrieve gym trainers'
      };
      return reply.code(500).send(response);
    }
  });

  // Quick search for trainer selection
  fastify.get('/selection/trainers/search', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = quickSearchSchema.parse(request.query);
      
      const trainers = await trainerSelectionService.searchTrainersForSelection(query.q, query.limit || 10);
      
      const response: ApiResponse<trainerSelectionService.TrainerForSelection[]> = {
        success: true,
        data: trainers,
        message: 'Trainer search results retrieved successfully'
      };
      
      return reply.code(200).send(response);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const response: ApiResponse<null> = {
          success: false,
          error: `Query validation failed: ${error.issues.map(i => i.message).join(', ')}`
        };
        return reply.code(400).send(response);
      }
      
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to search trainers'
      };
      return reply.code(500).send(response);
    }
  });
} 