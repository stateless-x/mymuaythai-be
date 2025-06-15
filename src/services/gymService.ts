import { db } from '../db/config';
import * as schema from '../db/schema';
import {
  Gym,
  NewGym,
  CreateGymRequest,
  UpdateGymRequest,
  GymWithDetails,
  Province,
  GymImage,
  NewGymImage,
  Tag,
  Trainer
} from '../types';
import { eq, ilike, and, or, desc, sql, count, SQL, inArray } from 'drizzle-orm';
import { createGymSchema, updateGymSchema, formatZodError } from '../utils/validation';
import { z } from 'zod';

// Helper type for base Gym selected with province
type GymWithProvince = Omit<Gym, 'province_id'> & { // province_id is still there from Gym, but we replace its meaning with the object
    province: Province | null; // Province can be null if leftJoin finds no match
};

// Helper function to map raw gym data to GymWithDetails
function mapRawGymToGymWithDetails(rawGymData: any, provinceData: Province | null, images: GymImage[] = [], tags: Tag[] = [], associatedTrainers: Trainer[] = []): GymWithDetails {
  const result: GymWithDetails = {
      id: rawGymData.id,
      name_th: rawGymData.name_th,
      name_en: rawGymData.name_en,
      description_th: rawGymData.description_th,
      description_en: rawGymData.description_en,
      phone: rawGymData.phone,
      email: rawGymData.email,
      map_url: rawGymData.map_url,
      youtube_url: rawGymData.youtube_url,
      line_id: rawGymData.line_id,
      is_active: rawGymData.is_active,
      created_at: rawGymData.created_at,
      updated_at: rawGymData.updated_at,
      province: provinceData,
      images,
      tags,
      associatedTrainers,
  };

  return result;
}

export async function getAllGyms(page: number = 1, pageSize: number = 10, searchTerm?: string, provinceId?: number, includeInactive: boolean = false, includeAssociatedTrainers: boolean = false): Promise<{ gyms: GymWithDetails[], total: number }> {
  const offset = (page - 1) * pageSize;
  const whereConditions: (SQL<unknown> | undefined)[] = [];

  // Only filter by is_active if includeInactive is false (default behavior for public)
  if (!includeInactive) {
    whereConditions.push(eq(schema.gyms.is_active, true));
  }

  if (provinceId) {
    whereConditions.push(eq(schema.gyms.province_id, provinceId));
  }
  
  if (searchTerm) {
      const searchPattern = `%${searchTerm.toLowerCase()}%`;
      whereConditions.push(
          or(
              ilike(schema.gyms.name_th, searchPattern),
              ilike(schema.gyms.name_en, searchPattern),
              ilike(schema.gyms.description_th, searchPattern),
              ilike(schema.gyms.description_en, searchPattern),
              ilike(schema.provinces.name_th, searchPattern),
              ilike(schema.provinces.name_en, searchPattern)
          )
      );
  }

  const validWhereConditions = whereConditions.filter(c => c !== undefined) as SQL<unknown>[];

  const gymsQuery = db.select({
      id: schema.gyms.id,
      name_th: schema.gyms.name_th,
      name_en: schema.gyms.name_en,
      description_th: schema.gyms.description_th,
      description_en: schema.gyms.description_en,
      phone: schema.gyms.phone,
      email: schema.gyms.email,
      province_id: schema.gyms.province_id,
      map_url: schema.gyms.map_url,
      youtube_url: schema.gyms.youtube_url,
      line_id: schema.gyms.line_id,
      is_active: schema.gyms.is_active,
      created_at: schema.gyms.created_at,
      updated_at: schema.gyms.updated_at,
      provinceData: schema.provinces 
    })
    .from(schema.gyms)
    .leftJoin(schema.provinces, eq(schema.gyms.province_id, schema.provinces.id))
    .where(validWhereConditions.length > 0 ? and(...validWhereConditions) : undefined)
    .orderBy(desc(schema.gyms.created_at))
    .limit(pageSize)
    .offset(offset);

  const gymsResult = await gymsQuery;

  const totalQuery = db.select({ value: count() })
    .from(schema.gyms)
    .leftJoin(schema.provinces, eq(schema.gyms.province_id, schema.provinces.id))
    .where(validWhereConditions.length > 0 ? and(...validWhereConditions) : undefined);
  
  const totalResult = await totalQuery;
  const total = totalResult[0]?.value ?? 0;

  // Optimized: Batch fetch all related data instead of individual queries
  const gymIds = gymsResult.map(g => g.id);
  
  // Batch fetch images for all gyms
  const allImages = gymIds.length > 0 ? 
    await db.select().from(schema.gymImages).where(inArray(schema.gymImages.gym_id, gymIds)) : [];
  
  // Batch fetch gym-tag associations
  const allGymTags = gymIds.length > 0 ?
    await db.select({ gym_id: schema.gymTags.gym_id, tag_id: schema.gymTags.tag_id })
      .from(schema.gymTags).where(inArray(schema.gymTags.gym_id, gymIds)) : [];
  
  // Batch fetch tags
  const tagIds = [...new Set(allGymTags.map(gt => gt.tag_id))];
  const allTags = tagIds.length > 0 ? 
    await db.select().from(schema.tags).where(inArray(schema.tags.id, tagIds)) : [];
  
  // Batch fetch associated trainers if needed
  const allTrainers = (includeAssociatedTrainers && gymIds.length > 0) ?
    await db.select().from(schema.trainers).where(inArray(schema.trainers.gym_id, gymIds)) : [];

  // Create lookup maps for efficient access
  const imagesByGym = new Map<string, GymImage[]>();
  allImages.forEach(img => {
    if (!imagesByGym.has(img.gym_id)) {
      imagesByGym.set(img.gym_id, []);
    }
    imagesByGym.get(img.gym_id)!.push(img);
  });

  const tagsByGym = new Map<string, Tag[]>();
  const tagsMap = new Map(allTags.map(tag => [tag.id, tag]));
  allGymTags.forEach(gt => {
    if (!tagsByGym.has(gt.gym_id)) {
      tagsByGym.set(gt.gym_id, []);
    }
    const tag = tagsMap.get(gt.tag_id);
    if (tag) {
      tagsByGym.get(gt.gym_id)!.push(tag);
    }
  });

  const trainersByGym = new Map<string, Trainer[]>();
  allTrainers.forEach(trainer => {
    if (!trainersByGym.has(trainer.gym_id!)) {
      trainersByGym.set(trainer.gym_id!, []);
    }
    trainersByGym.get(trainer.gym_id!)!.push(trainer);
  });

  // Map results using preloaded data
  const gymsWithDetailsList: GymWithDetails[] = gymsResult.map(g => {
    const images = imagesByGym.get(g.id) || [];
    const tags = tagsByGym.get(g.id) || [];
    const associatedTrainers = trainersByGym.get(g.id) || [];
    
    return mapRawGymToGymWithDetails(g, g.provinceData as Province | null, images, tags, associatedTrainers);
  });

  return { gyms: gymsWithDetailsList, total };
}

export async function getGymById(id: string, includeInactive: boolean = false): Promise<GymWithDetails | null> {
  const whereConditions: (SQL<unknown> | undefined)[] = [eq(schema.gyms.id, id)];
  
  // Only filter by is_active if includeInactive is false (default behavior for public)
  if (!includeInactive) {
    whereConditions.push(eq(schema.gyms.is_active, true));
  }

  const validWhereConditions = whereConditions.filter(c => c !== undefined) as SQL<unknown>[];

  const gymsResult = await db.select({
      id: schema.gyms.id,
      name_th: schema.gyms.name_th,
      name_en: schema.gyms.name_en,
      description_th: schema.gyms.description_th,
      description_en: schema.gyms.description_en,
      phone: schema.gyms.phone,
      email: schema.gyms.email,
      province_id: schema.gyms.province_id,
      map_url: schema.gyms.map_url,
      youtube_url: schema.gyms.youtube_url,
      line_id: schema.gyms.line_id,
      is_active: schema.gyms.is_active,
      created_at: schema.gyms.created_at,
      updated_at: schema.gyms.updated_at,
      provinceData: schema.provinces 
    })
    .from(schema.gyms)
    .leftJoin(schema.provinces, eq(schema.gyms.province_id, schema.provinces.id))
    .where(and(...validWhereConditions));

  if (gymsResult.length === 0) {
    return null;
  }
  const rawGymData = gymsResult[0]!; 
  
  const images = await db.select().from(schema.gymImages).where(eq(schema.gymImages.gym_id, id));
  
  const gymTagsRecords = await db.select({ tag_id: schema.gymTags.tag_id }).from(schema.gymTags).where(eq(schema.gymTags.gym_id, id));
  const tagIds = gymTagsRecords.map(gt => gt.tag_id);
  const tags = tagIds.length > 0 
    ? await db.select().from(schema.tags).where(inArray(schema.tags.id, tagIds))
    : [];

  const associatedTrainers = await db.select().from(schema.trainers).where(eq(schema.trainers.gym_id, id));

  return mapRawGymToGymWithDetails(rawGymData, rawGymData.provinceData as Province | null, images, tags, associatedTrainers);
}

export async function getGymImages(gymId: string): Promise<GymImage[]> {
  return db.select().from(schema.gymImages).where(eq(schema.gymImages.gym_id, gymId));
}

export async function getGymsByProvince(provinceId: number): Promise<GymWithDetails[]> {
   const gymsResult = await db.select({
      id: schema.gyms.id,
      name_th: schema.gyms.name_th,
      name_en: schema.gyms.name_en,
      description_th: schema.gyms.description_th,
      description_en: schema.gyms.description_en,
      phone: schema.gyms.phone,
      email: schema.gyms.email,
      province_id: schema.gyms.province_id,
      map_url: schema.gyms.map_url,
      youtube_url: schema.gyms.youtube_url,
      line_id: schema.gyms.line_id,
      is_active: schema.gyms.is_active,
      created_at: schema.gyms.created_at,
      updated_at: schema.gyms.updated_at,
      provinceData: schema.provinces
    })
    .from(schema.gyms)
    .leftJoin(schema.provinces, eq(schema.gyms.province_id, schema.provinces.id))
    .where(and(eq(schema.gyms.province_id, provinceId), eq(schema.gyms.is_active, true)))
    .orderBy(desc(schema.gyms.created_at));

    // Fetch additional details for each gym
    return Promise.all(
      gymsResult.map(async (g) => {
        // Fetch images for this gym
        const images = await db.select().from(schema.gymImages).where(eq(schema.gymImages.gym_id, g.id));
        
        // Fetch tags for this gym
        const gymTagsRecords = await db.select({ tag_id: schema.gymTags.tag_id }).from(schema.gymTags).where(eq(schema.gymTags.gym_id, g.id));
        const tagIds = gymTagsRecords.map(gt => gt.tag_id);
        const tags = tagIds.length > 0 
          ? await db.select().from(schema.tags).where(inArray(schema.tags.id, tagIds))
          : [];

        // Fetch associated trainers for this gym
        const associatedTrainers = await db.select().from(schema.trainers).where(eq(schema.trainers.gym_id, g.id));

        return mapRawGymToGymWithDetails(g, g.provinceData as Province | null, images, tags, associatedTrainers);
      })
    );
}

export async function createGym(gymData: CreateGymRequest): Promise<GymWithDetails> {
  try {
    const validatedData = createGymSchema.parse(gymData);
    
    // Extract tags and associatedTrainers from validated data if present
    const { tags, associatedTrainers, ...gymFields } = validatedData as any;
    
    const result = await db.transaction(async (tx) => {
      // Create the gym
      const newGym = await tx.insert(schema.gyms)
        .values(gymFields as NewGym)
        .returning();
      
      if (!newGym || newGym.length === 0) {
        throw new Error('Gym creation failed, no data returned.');
      }
      
      const createdGym = newGym[0]!;
      
      // Fetch province data if province_id exists
      let provinceData: Province | null = null;
      if (createdGym.province_id) {
        const province = await tx.select().from(schema.provinces).where(eq(schema.provinces.id, createdGym.province_id));
        provinceData = province[0] || null;
      }
      
      // Create tag associations if tags are provided
      let gymTags: Tag[] = [];
      if (tags && tags.length > 0) {
        const gymTagsToInsert = tags.map((tag: any) => ({
          gym_id: createdGym.id,
          tag_id: tag.id,
        }));
        
        await tx.insert(schema.gymTags)
          .values(gymTagsToInsert);
        
        gymTags = tags;
      }
      
      // Handle associatedTrainers - update trainers' gym_id to establish bidirectional relationship
      let associatedTrainersData: Trainer[] = [];
      if (associatedTrainers && associatedTrainers.length > 0) {
        // Update trainers to associate them with this gym
        await tx.update(schema.trainers)
          .set({ gym_id: createdGym.id, updated_at: new Date() })
          .where(inArray(schema.trainers.id, associatedTrainers));
        
        // Fetch the updated trainer data
        associatedTrainersData = await tx.select()
          .from(schema.trainers)
          .where(inArray(schema.trainers.id, associatedTrainers));
      }
      
      // Fetch images (will be empty for new gym)
      const images = await tx.select().from(schema.gymImages).where(eq(schema.gymImages.gym_id, createdGym.id));
      
      return mapRawGymToGymWithDetails(createdGym, provinceData, images, gymTags, associatedTrainersData);
    });
    
    return result;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation failed: ${formatZodError(error)}`);
    }
    throw error;
  }
}

export async function updateGym(id: string, gymData: UpdateGymRequest): Promise<GymWithDetails | null> {
  try {
    const validatedData = updateGymSchema.parse(gymData);
    
    // Extract tags and associatedTrainers from validated data if present
    const { tags, associatedTrainers, ...gymFields } = validatedData as any;
    
    const result = await db.transaction(async (tx) => {
      let updatedGym: Gym[] = [];
      
      // Update the main gym fields only if there are fields to update
      if (Object.keys(gymFields).length > 0) {
        updatedGym = await tx.update(schema.gyms)
          .set({
            ...gymFields as Partial<NewGym>,
            updated_at: new Date(),
          })
          .where(eq(schema.gyms.id, id))
          .returning();
        
        if (!updatedGym || updatedGym.length === 0) {
          return null;
        }
      } else {
        // If no gym fields to update, just fetch the current gym
        const currentGym = await tx.select()
          .from(schema.gyms)
          .where(eq(schema.gyms.id, id));
        
        if (!currentGym || currentGym.length === 0) {
          return null;
        }
        updatedGym = currentGym;
      }
      
      const gym = updatedGym[0]!;
      
      // Fetch province data if province_id exists
      let provinceData: Province | null = null;
      if (gym.province_id) {
        const province = await tx.select().from(schema.provinces).where(eq(schema.provinces.id, gym.province_id));
        provinceData = province[0] || null;
      }
      
      // Handle tags update if provided
      if (tags) {
        // First, delete existing gym tag associations
        await tx.delete(schema.gymTags)
          .where(eq(schema.gymTags.gym_id, id));
        
        // Then, insert new tag associations
        if (tags.length > 0) {
          const gymTagsToInsert = tags.map((tag: any) => ({
            gym_id: id,
            tag_id: tag.id,
          }));
          
          await tx.insert(schema.gymTags)
            .values(gymTagsToInsert);
        }
      }
      
      // Handle associatedTrainers update if provided
      if (associatedTrainers !== undefined) {
        // First, get current trainers associated with this gym
        const currentTrainers = await tx.select().from(schema.trainers).where(eq(schema.trainers.gym_id, id));
        
        // First, remove gym association from trainers currently associated with this gym
        await tx.update(schema.trainers)
          .set({ gym_id: null, updated_at: new Date() })
          .where(eq(schema.trainers.gym_id, id));
        
        // Then, associate new trainers with this gym
        if (associatedTrainers.length > 0) {
          await tx.update(schema.trainers)
            .set({ gym_id: id, updated_at: new Date() })
            .where(inArray(schema.trainers.id, associatedTrainers));
          
          // Verify the update
          const updatedTrainers = await tx.select().from(schema.trainers).where(eq(schema.trainers.gym_id, id));
        }
      }
      
      // Fetch current tags
      const gymTagsRecords = await tx.select({ tag_id: schema.gymTags.tag_id }).from(schema.gymTags).where(eq(schema.gymTags.gym_id, id));
      const tagIds = gymTagsRecords.map(gt => gt.tag_id);
      const currentTags = tagIds.length > 0 
        ? await tx.select().from(schema.tags).where(inArray(schema.tags.id, tagIds))
        : [];
      
      // Fetch images
      const images = await tx.select().from(schema.gymImages).where(eq(schema.gymImages.gym_id, id));
      
      // Fetch associated trainers
      const associatedTrainersData = await tx.select().from(schema.trainers).where(eq(schema.trainers.gym_id, id));
      
      return mapRawGymToGymWithDetails(gym, provinceData, images, currentTags, associatedTrainersData);
    });
    
    return result;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation failed: ${formatZodError(error)}`);
    }
    throw error;
  }
}

export async function deleteGym(id: string): Promise<boolean> {
  try {
    // Start a transaction to ensure data consistency
    const result = await db.transaction(async (tx) => {
      // First, delete all related gym images
      await tx.delete(schema.gymImages)
        .where(eq(schema.gymImages.gym_id, id));
      
      // Delete all gym tags associations
      await tx.delete(schema.gymTags)
        .where(eq(schema.gymTags.gym_id, id));
      
      // Update trainers to remove gym association (set gym_id to null)
      await tx.update(schema.trainers)
        .set({ gym_id: null })
        .where(eq(schema.trainers.gym_id, id));
      
      // Finally, delete the gym itself
      const deletedGym = await tx.delete(schema.gyms)
        .where(eq(schema.gyms.id, id))
        .returning();
      
      return deletedGym;
    });
    
    return result.length > 0;
  } catch (error) {
    console.error('Error deleting gym:', error);
    return false;
  }
}

export async function addGymImage(gymId: string, imageUrl: string): Promise<GymImage> {
  const result = await db.insert(schema.gymImages)
    .values({ gym_id: gymId, image_url: imageUrl } as NewGymImage)
    .returning();
  
  if (!result || result.length === 0) {
    throw new Error('Image addition failed, no data returned.');
  }
  
  return result[0]!;
}

export async function removeGymImage(imageId: string): Promise<boolean> {
  const result = await db.delete(schema.gymImages)
    .where(eq(schema.gymImages.id, imageId))
    .returning();
  
  return result.length > 0;
}

export async function searchGyms(searchTerm: string, page: number = 1, pageSize: number = 10): Promise<{ gyms: GymWithDetails[], total: number }> {
  if (!searchTerm?.trim()) {
    return { gyms: [], total: 0 };
  }

  return getAllGyms(page, pageSize, searchTerm.trim());
} 