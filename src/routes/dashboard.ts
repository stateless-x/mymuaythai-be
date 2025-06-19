import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as dashboardService from '../services/dashboardService';
import { ApiResponse } from '../types';

export async function dashboardRoutes(fastify: FastifyInstance) {
  // Get dashboard statistics
  fastify.get('/dashboard/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const stats = await dashboardService.getDashboardStats();
      
      const response: ApiResponse<typeof stats> = {
        success: true,
        data: stats,
        message: 'Dashboard statistics retrieved successfully'
      };
      
      return reply.code(200).send(response);
    } catch (error) {
      console.error('Error in dashboard stats endpoint:', error);
      
      const response: ApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve dashboard statistics'
      };
      
      return reply.code(500).send(response);
    }
  });

  // Get trainer counts by province
  fastify.get('/dashboard/trainers-by-province', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const counts = await dashboardService.getTrainerCountsByProvince();
      
      const response: ApiResponse<typeof counts> = {
        success: true,
        data: counts,
        message: 'Trainer counts by province retrieved successfully'
      };
      
      return reply.code(200).send(response);
    } catch (error) {
      console.error('Error in trainers by province endpoint:', error);
      
      const response: ApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve trainer counts by province'
      };
      
      return reply.code(500).send(response);
    }
  });

  // Get gym counts by province
  fastify.get('/dashboard/gyms-by-province', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const counts = await dashboardService.getGymCountsByProvince();
      
      const response: ApiResponse<typeof counts> = {
        success: true,
        data: counts,
        message: 'Gym counts by province retrieved successfully'
      };
      
      return reply.code(200).send(response);
    } catch (error) {
      console.error('Error in gyms by province endpoint:', error);
      
      const response: ApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve gym counts by province'
      };
      
      return reply.code(500).send(response);
    }
  });
} 