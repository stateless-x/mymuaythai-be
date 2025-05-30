import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { TrainerService } from '../services/trainerService';
import { CreateTrainerRequest, ApiResponse } from '../types';

const trainerService = new TrainerService();

export async function trainerRoutes(fastify: FastifyInstance) {
  // Get all trainers
  fastify.get('/trainers', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const trainers = await trainerService.getAllTrainers();
      const response: ApiResponse<typeof trainers> = {
        success: true,
        data: trainers,
        message: 'Trainers retrieved successfully'
      };
      return reply.code(200).send(response);
    } catch (error) {
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
      const trainer = await trainerService.getTrainerById(id);
      
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
        message: 'Trainer retrieved successfully'
      };
      return reply.code(200).send(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to retrieve trainer'
      };
      return reply.code(500).send(response);
    }
  });

  // Get trainers by gym
  fastify.get('/trainers/gym/:gymId', async (request: FastifyRequest<{ Params: { gymId: string } }>, reply: FastifyReply) => {
    try {
      const { gymId } = request.params;
      const trainers = await trainerService.getTrainersByGym(gymId);
      
      const response: ApiResponse<typeof trainers> = {
        success: true,
        data: trainers,
        message: 'Trainers retrieved successfully'
      };
      return reply.code(200).send(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to retrieve trainers by gym'
      };
      return reply.code(500).send(response);
    }
  });

  // Get trainers by province
  fastify.get('/trainers/province/:provinceId', async (request: FastifyRequest<{ Params: { provinceId: string } }>, reply: FastifyReply) => {
    try {
      const { provinceId } = request.params;
      const trainers = await trainerService.getTrainersByProvince(parseInt(provinceId));
      
      const response: ApiResponse<typeof trainers> = {
        success: true,
        data: trainers,
        message: 'Trainers retrieved successfully'
      };
      return reply.code(200).send(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to retrieve trainers by province'
      };
      return reply.code(500).send(response);
    }
  });

  // Get freelance trainers
  fastify.get('/trainers/freelance', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const trainers = await trainerService.getFreelanceTrainers();
      
      const response: ApiResponse<typeof trainers> = {
        success: true,
        data: trainers,
        message: 'Freelance trainers retrieved successfully'
      };
      return reply.code(200).send(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to retrieve freelance trainers'
      };
      return reply.code(500).send(response);
    }
  });

  // Get trainer classes
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

  // Search trainers
  fastify.get('/trainers/search/:query', async (request: FastifyRequest<{ Params: { query: string } }>, reply: FastifyReply) => {
    try {
      const { query } = request.params;
      const trainers = await trainerService.searchTrainers(query);
      
      const response: ApiResponse<typeof trainers> = {
        success: true,
        data: trainers,
        message: 'Search results retrieved successfully'
      };
      return reply.code(200).send(response);
    } catch (error) {
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
  fastify.put('/trainers/:id', async (request: FastifyRequest<{ Params: { id: string }; Body: Partial<CreateTrainerRequest> }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const trainerData = request.body;
      const trainer = await trainerService.updateTrainer(id, trainerData);
      
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
  fastify.post('/trainers/:id/classes', async (request: FastifyRequest<{ Params: { id: string }; Body: { class_id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const { class_id } = request.body;
      const added = await trainerService.addTrainerClass(id, class_id);
      
      if (!added) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Failed to add class or class already assigned'
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
  fastify.delete('/trainers/:id/classes/:classId', async (request: FastifyRequest<{ Params: { id: string; classId: string } }>, reply: FastifyReply) => {
    try {
      const { id, classId } = request.params;
      const removed = await trainerService.removeTrainerClass(id, classId);
      
      if (!removed) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Class assignment not found'
        };
        return reply.code(404).send(response);
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
} 