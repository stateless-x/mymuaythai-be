import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ProvinceService } from '../services/provinceService';
import type { ApiResponse } from '../types';

const provinceService = new ProvinceService();

export async function provinceRoutes(fastify: FastifyInstance) {
  // Get all provinces (default: sorted by English name)
  fastify.get('/provinces', async (request: FastifyRequest<{
    Querystring: { 
      sort?: 'en' | 'th';
      region?: 'central' | 'eastern' | 'northern' | 'northeastern' | 'southern' | 'western';
      stats?: 'true' | 'false';
    }
  }>, reply: FastifyReply) => {
    try {
      const { sort = 'en', region, stats } = request.query;
      
      let provinces;
      
      if (stats === 'true') {
        // Get provinces with gym counts for statistics
        provinces = await provinceService.getProvincesWithGymCounts();
      } else if (region) {
        // Filter by region
        provinces = await provinceService.getProvincesByRegion(region);
      } else if (sort === 'th') {
        // Sort by Thai name
        provinces = await provinceService.getAllProvincesThaiSort();
      } else {
        // Default: sort by English name
        provinces = await provinceService.getAllProvinces();
      }
      
      const response: ApiResponse<typeof provinces> = {
        success: true,
        data: provinces,
        message: `Retrieved ${provinces.length} provinces successfully`
      };
      return reply.code(200).send(response);
    } catch (error) {
      console.error('Error retrieving provinces:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to retrieve provinces'
      };
      return reply.code(500).send(response);
    }
  });

  // Get province by ID
  fastify.get('/provinces/:id', async (request: FastifyRequest<{ 
    Params: { id: string } 
  }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const provinceId = parseInt(id);
      
      if (isNaN(provinceId)) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Invalid province ID. Must be a number.'
        };
        return reply.code(400).send(response);
      }
      
      const province = await provinceService.getProvinceById(provinceId);
      
      if (!province) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Province not found'
        };
        return reply.code(404).send(response);
      }

      const response: ApiResponse<typeof province> = {
        success: true,
        data: province,
        message: 'Province retrieved successfully'
      };
      return reply.code(200).send(response);
    } catch (error) {
      console.error('Error retrieving province by ID:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to retrieve province'
      };
      return reply.code(500).send(response);
    }
  });

  // Search provinces
  fastify.get('/provinces/search/:query', async (request: FastifyRequest<{ 
    Params: { query: string } 
  }>, reply: FastifyReply) => {
    try {
      const { query } = request.params;
      
      if (!query || query.trim().length < 1) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Search query must be at least 1 character long'
        };
        return reply.code(400).send(response);
      }
      
      const provinces = await provinceService.searchProvinces(query.trim());
      
      const response: ApiResponse<typeof provinces> = {
        success: true,
        data: provinces,
        message: `Found ${provinces.length} provinces matching "${query}"`
      };
      return reply.code(200).send(response);
    } catch (error) {
      console.error('Error searching provinces:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to search provinces'
      };
      return reply.code(500).send(response);
    }
  });

  // Get provinces by region
  fastify.get('/provinces/region/:region', async (request: FastifyRequest<{ 
    Params: { region: 'central' | 'eastern' | 'northern' | 'northeastern' | 'southern' | 'western' } 
  }>, reply: FastifyReply) => {
    try {
      const { region } = request.params;
      
      const validRegions = ['central', 'eastern', 'northern', 'northeastern', 'southern', 'western'];
      if (!validRegions.includes(region)) {
        const response: ApiResponse<null> = {
          success: false,
          error: `Invalid region. Must be one of: ${validRegions.join(', ')}`
        };
        return reply.code(400).send(response);
      }
      
      const provinces = await provinceService.getProvincesByRegion(region);
      
      const response: ApiResponse<typeof provinces> = {
        success: true,
        data: provinces,
        message: `Retrieved ${provinces.length} provinces from ${region} region`
      };
      return reply.code(200).send(response);
    } catch (error) {
      console.error('Error retrieving provinces by region:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to retrieve provinces by region'
      };
      return reply.code(500).send(response);
    }
  });

  // Get province statistics
  fastify.get('/provinces/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const totalCount = await provinceService.getProvinceCount();
      const provincesWithGymCounts = await provinceService.getProvincesWithGymCounts();
      
      const stats = {
        total_provinces: totalCount,
        provinces_with_gyms: provincesWithGymCounts.filter(p => p.gym_count > 0).length,
        provinces_without_gyms: provincesWithGymCounts.filter(p => p.gym_count === 0).length,
        total_gyms: provincesWithGymCounts.reduce((sum, p) => sum + p.gym_count, 0),
        regions: {
          central: 23,
          eastern: 7,
          northern: 9,
          northeastern: 20,
          southern: 15,
          western: 2
        }
      };
      
      const response: ApiResponse<typeof stats> = {
        success: true,
        data: stats,
        message: 'Province statistics retrieved successfully'
      };
      return reply.code(200).send(response);
    } catch (error) {
      console.error('Error retrieving province statistics:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to retrieve province statistics'
      };
      return reply.code(500).send(response);
    }
  });
} 