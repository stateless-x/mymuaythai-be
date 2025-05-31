import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { tagService } from '../services/tagService';
import { ApiResponse, PaginatedResponse, Tag, NewTag } from '../types';

export async function tagRoutes(fastify: FastifyInstance) {
  // Get all tags with pagination
  fastify.get('/tags', async (request: FastifyRequest<{
    Querystring: { 
      page?: string;
      pageSize?: string;
      stats?: string;
    }
  }>, reply: FastifyReply) => {
    try {
      const page = parseInt(request.query.page || '1');
      const pageSize = parseInt(request.query.pageSize || '20');
      const includeStats = request.query.stats === 'true';
      
      if (includeStats) {
        const tagsWithStats = await tagService.getAllTagsWithStats();
        const response: ApiResponse<typeof tagsWithStats> = {
          success: true,
          data: tagsWithStats,
          message: 'Tags with usage statistics retrieved successfully'
        };
        return reply.code(200).send(response);
      }
      
      const { tags, total } = await tagService.getAllTags(page, pageSize);
      const totalPages = Math.ceil(total / pageSize);
      
      const response: ApiResponse<PaginatedResponse<Tag>> = {
        success: true,
        data: {
          items: tags,
          total,
          page,
          pageSize,
          totalPages
        },
        message: 'Tags retrieved successfully'
      };
      return reply.code(200).send(response);
    } catch (error) {
      console.error('Error retrieving tags:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to retrieve tags'
      };
      return reply.code(500).send(response);
    }
  });

  // Get tag by ID
  fastify.get('/tags/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const tag = await tagService.getTagById(id);
      
      if (!tag) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Tag not found'
        };
        return reply.code(404).send(response);
      }

      const response: ApiResponse<typeof tag> = {
        success: true,
        data: tag,
        message: 'Tag retrieved successfully'
      };
      return reply.code(200).send(response);
    } catch (error) {
      console.error('Error retrieving tag:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to retrieve tag'
      };
      return reply.code(500).send(response);
    }
  });

  // Search tags
  fastify.get('/tags/search/:query', async (request: FastifyRequest<{
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
      
      const { tags, total } = await tagService.searchTags(query, page, pageSize);
      const totalPages = Math.ceil(total / pageSize);
      
      const response: ApiResponse<PaginatedResponse<Tag>> = {
        success: true,
        data: {
          items: tags,
          total,
          page,
          pageSize,
          totalPages
        },
        message: `Found ${total} tags matching "${query}"`
      };
      return reply.code(200).send(response);
    } catch (error) {
      console.error('Error searching tags:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to search tags'
      };
      return reply.code(500).send(response);
    }
  });

  // Get tag usage statistics
  fastify.get('/tags/:id/stats', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const stats = await tagService.getTagUsageStats(id);
      
      if (!stats) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Tag not found'
        };
        return reply.code(404).send(response);
      }

      const response: ApiResponse<typeof stats> = {
        success: true,
        data: stats,
        message: 'Tag usage statistics retrieved successfully'
      };
      return reply.code(200).send(response);
    } catch (error) {
      console.error('Error retrieving tag stats:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to retrieve tag usage statistics'
      };
      return reply.code(500).send(response);
    }
  });

  // Create new tag
  fastify.post('/tags', async (request: FastifyRequest<{ Body: NewTag }>, reply: FastifyReply) => {
    try {
      const tagData = request.body;
      const tag = await tagService.createTag(tagData);
      
      const response: ApiResponse<typeof tag> = {
        success: true,
        data: tag,
        message: 'Tag created successfully'
      };
      return reply.code(201).send(response);
    } catch (error) {
      console.error('Error creating tag:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to create tag'
      };
      return reply.code(500).send(response);
    }
  });

  // Update tag
  fastify.put('/tags/:id', async (request: FastifyRequest<{ 
    Params: { id: string }; 
    Body: Partial<NewTag> 
  }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const updateData = request.body;
      const tag = await tagService.updateTag(id, updateData);
      
      if (!tag) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Tag not found'
        };
        return reply.code(404).send(response);
      }

      const response: ApiResponse<typeof tag> = {
        success: true,
        data: tag,
        message: 'Tag updated successfully'
      };
      return reply.code(200).send(response);
    } catch (error) {
      console.error('Error updating tag:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to update tag'
      };
      return reply.code(500).send(response);
    }
  });

  // Delete tag
  fastify.delete('/tags/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const deleted = await tagService.deleteTag(id);
      
      if (!deleted) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Tag not found'
        };
        return reply.code(404).send(response);
      }

      const response: ApiResponse<null> = {
        success: true,
        message: 'Tag deleted successfully'
      };
      return reply.code(200).send(response);
    } catch (error) {
      console.error('Error deleting tag:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete tag';
      const response: ApiResponse<null> = {
        success: false,
        error: errorMessage
      };
      return reply.code(error instanceof Error && error.message.includes('currently used') ? 400 : 500).send(response);
    }
  });
} 