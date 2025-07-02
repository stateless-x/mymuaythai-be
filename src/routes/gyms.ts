import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as gymService from '../services/gymService';
import { createGymSchema, updateGymSchema, gymQuerySchema, gymByIdQuerySchema, formatZodError } from '../utils/validation';
import { ValidationError, NotFoundError } from '../utils/database';
import { UpdateGymRequest } from '../types';
import { z } from 'zod';
import { handleMultipleImageUpload, handleImageUpload } from '../services/imageService';
import type { MultipartFile } from '@fastify/multipart';

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
      const { page, pageSize, searchTerm, provinceId, includeInactive, sortField, sortBy, includeAssociatedTrainers } = gymQuerySchema.parse(request.query);
      
      // Build service parameters, filtering out undefined values to satisfy exactOptionalPropertyTypes
      const serviceParams: Parameters<typeof gymService.getAllGyms>[0] = {
        page,
        pageSize,
        sortField,
        sortBy,
      };
      
      if (searchTerm) serviceParams.searchTerm = searchTerm;
      if (provinceId) serviceParams.provinceId = provinceId;
      if (includeInactive === false) serviceParams.is_active = true;
      if (includeAssociatedTrainers !== undefined) serviceParams.includeAssociatedTrainers = includeAssociatedTrainers;
      
      const result = await gymService.getAllGyms(serviceParams);
      
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
      const { page, pageSize, searchTerm, includeInactive, sortField, sortBy } = gymQuerySchema.parse(request.query);
      
      if (!searchTerm) {
        throw new ValidationError('Search term is required');
      }
      
      // Build service parameters, filtering out undefined values to satisfy exactOptionalPropertyTypes
      const serviceParams: Parameters<typeof gymService.getAllGyms>[0] = {
        page,
        pageSize,
        searchTerm,
        sortField,
        sortBy,
      };
      
      // Fix includeInactive logic:
      // - includeInactive=true: don't filter by is_active (show both active and inactive)
      // - includeInactive=false: filter to show only active gyms (is_active=true)
      if (includeInactive === false) serviceParams.is_active = true;
      
      const result = await gymService.getAllGyms(serviceParams);
      
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
      const validatedData = createGymSchema.parse(request.body);
      
      const gym = await gymService.createGym(validatedData as any);
      
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

  // Delete gym (hard delete)
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

  // Upload and add gym images (multipart, up to 5 files)
  fastify.post('/gyms/:id/images', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    if (!id) {
      throw new ValidationError('Gym ID is required');
    }

    // Fetch gym to build folder name
    const gymData = await gymService.getGymById(id, true);
    if (!gymData) {
      throw new NotFoundError('Gym', id);
    }

    const nameSlug = (gymData.name_en || gymData.name_th || 'gym').toLowerCase().replace(/\s+/g, '-');
    const folderPath: string = `gyms/${nameSlug}-${id.slice(0, 3)}`;

    const existingImages = await gymService.getGymImages(id);
    const usedSeq = new Set<number>();
    for (const img of existingImages) {
      const match = img.image_url.match(/-(\d+)\.webp$/);
      if (match) usedSeq.add(parseInt(match[1], 10));
    }

    const uploadPromises: Promise<string>[] = [];
    let seqCounter = 1;
    // @ts-ignore
    for await (const part of request.parts()) {
      if (part.type === 'file') {
        // Ensure we don't exceed 5 images in total
        if (existingImages.length + uploadPromises.length >= 5) {
          throw new ValidationError('Exceeds maximum of 5 images per gym');
        }

        // Pick next available sequence number (fill gaps)
        while (usedSeq.has(seqCounter)) seqCounter++;
        const fileBase = `${nameSlug}-${seqCounter}`;
        uploadPromises.push(handleImageUpload(part, folderPath, fileBase));
        usedSeq.add(seqCounter);
        seqCounter++;
      } else {
        // drain non-file fields
        part.value;
      }
    }

    if (uploadPromises.length === 0) {
      throw new ValidationError('No image files were provided');
    }

    const cdnUrls = await Promise.all(uploadPromises);

    const images = await Promise.all(cdnUrls.map((url) => gymService.addGymImage(id, url)));

    const response: ApiResponse<typeof images> = {
      success: true,
      data: images,
      message: 'Images uploaded and saved successfully',
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