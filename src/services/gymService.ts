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
import { eq, ilike, and, or, desc, sql, count, SQL, inArray, asc } from 'drizzle-orm';
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

export async function getAllGyms(params: {
  page?: number, 
  pageSize?: number, 
  searchTerm?: string, 
  provinceId?: number, 
  is_active?: boolean,
  sortField?: 'created_at' | 'updated_at',
  sortBy?: 'asc' | 'desc',
  includeAssociatedTrainers?: boolean
} = {}): Promise<{ gyms: GymWithDetails[], total: number }> {
  const {
    page = 1,
    pageSize = 10,
    searchTerm,
    provinceId,
    is_active,
    sortField = 'created_at',
    sortBy = 'desc',
    includeAssociatedTrainers = false
  } = params;
  
  const offset = (page - 1) * pageSize;
  const whereConditions: (SQL<unknown> | undefined)[] = [];

  if (is_active !== undefined) {
    whereConditions.push(eq(schema.gyms.is_active, is_active));
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

  const sortColumn = sortField === 'updated_at' 
    ? schema.gyms.updated_at
    : schema.gyms.created_at;

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
    .orderBy(sortBy === 'asc' ? asc(sortColumn) : desc(sortColumn))
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
   const gymsResult = await getAllGyms({ provinceId: provinceId, pageSize: 100 }); // Use getAllGyms
   return gymsResult.gyms;
}

export async function createGym(gymData: CreateGymRequest): Promise<GymWithDetails> {
  const validationResult = createGymSchema.safeParse(gymData);
  if (!validationResult.success) {
    throw new Error(formatZodError(validationResult.error));
  }

  const { tags: tagObjects, images: imageUrls, associatedTrainers: trainerIds, ...gymDetails } = validationResult.data;

  return await db.transaction(async (tx) => {
    const newGyms = await tx.insert(schema.gyms).values(gymDetails).returning();
    const newGym = newGyms[0];
    if (!newGym) {
      tx.rollback();
      throw new Error("Failed to create gym.");
    }

    let createdTags: Tag[] = [];
    if (tagObjects && tagObjects.length > 0) {
        const tagNames = tagObjects.map(t => t.name_en);
        const existingTags = await tx.select().from(schema.tags).where(inArray(schema.tags.name_en, tagNames));
        const existingTagNames = new Set(existingTags.map(t => t.name_en));
        const newTagObjects = tagObjects.filter(t => !existingTagNames.has(t.name_en));

        let newTags: Tag[] = [];
        if (newTagObjects.length > 0) {
            newTags = await tx.insert(schema.tags).values(newTagObjects.map(t => ({name_en: t.name_en, name_th: t.name_th || t.name_en}))).returning();
        }
        createdTags = [...existingTags, ...newTags];

        if (createdTags.length > 0) {
            await tx.insert(schema.gymTags).values(createdTags.map(tag => ({
                gym_id: newGym.id,
                tag_id: tag.id
            })));
        }
    }

    let createdImages: GymImage[] = [];
    if (imageUrls && imageUrls.length > 0) {
      createdImages = await tx.insert(schema.gymImages).values(imageUrls.map((img: any) => ({
        gym_id: newGym.id,
        image_url: img.image_url
      }))).returning();
    }
    
    let associatedTrainers: Trainer[] = [];
    if (trainerIds && trainerIds.length > 0) {
        await tx.update(schema.trainers).set({ gym_id: newGym.id }).where(inArray(schema.trainers.id, trainerIds));
        associatedTrainers = await tx.select().from(schema.trainers).where(inArray(schema.trainers.id, trainerIds));
    }

    const provinceData = newGym.province_id 
      ? await tx.query.provinces.findFirst({ where: eq(schema.provinces.id, newGym.province_id) })
      : null;

    return mapRawGymToGymWithDetails(newGym, provinceData || null, createdImages, createdTags, associatedTrainers);
  });
}

export async function updateGym(id: string, gymData: UpdateGymRequest): Promise<GymWithDetails | null> {
    const validationResult = updateGymSchema.safeParse(gymData);
    if (!validationResult.success) {
      throw new Error(formatZodError(validationResult.error));
    }
    
    const { tags: tagObjects, images: imageUrls, associatedTrainers: trainerIds, ...gymDetails } = validationResult.data;
  
    return await db.transaction(async (tx) => {
      const updatedGyms = Object.keys(gymDetails).length > 0
        ? await tx.update(schema.gyms).set({ ...gymDetails, updated_at: new Date() }).where(eq(schema.gyms.id, id)).returning()
        : await tx.select().from(schema.gyms).where(eq(schema.gyms.id, id));
  
      const updatedGym = updatedGyms[0];
      if (!updatedGym) {
        return null;
      }
  
      let finalTags: Tag[] = [];
      if (tagObjects) {
        await tx.delete(schema.gymTags).where(eq(schema.gymTags.gym_id, id));
  
        if (tagObjects.length > 0) {
          const tagNames = tagObjects.map(t => t.name_en);
          const existingTags = await tx.select().from(schema.tags).where(inArray(schema.tags.name_en, tagNames));
          const existingTagNames = new Set(existingTags.map(t => t.name_en));
          const newTagObjects = tagObjects.filter(t => !existingTagNames.has(t.name_en));

          let newTags: Tag[] = [];
          if (newTagObjects.length > 0) {
              newTags = await tx.insert(schema.tags).values(newTagObjects.map(t => ({name_en: t.name_en, name_th: t.name_th || t.name_en}))).returning();
          }
          finalTags = [...existingTags, ...newTags];
  
          if (finalTags.length > 0) {
            await tx.insert(schema.gymTags).values(finalTags.map(tag => ({
              gym_id: id,
              tag_id: tag.id
            })));
          }
        }
      } else {
          const gymTagsRecords = await tx.select({ tag_id: schema.gymTags.tag_id }).from(schema.gymTags).where(eq(schema.gymTags.gym_id, id));
          const tagIds = gymTagsRecords.map(gt => gt.tag_id);
          if (tagIds.length > 0) {
              finalTags = await tx.select().from(schema.tags).where(inArray(schema.tags.id, tagIds));
          }
      }
  
      let finalImages: GymImage[] = [];
      if (imageUrls) {
        await tx.delete(schema.gymImages).where(eq(schema.gymImages.gym_id, id));
        if (imageUrls.length > 0) {
          finalImages = await tx.insert(schema.gymImages).values(imageUrls.map((img: any) => ({
            gym_id: id,
            image_url: img.image_url
          }))).returning();
        }
      } else {
          finalImages = await tx.select().from(schema.gymImages).where(eq(schema.gymImages.gym_id, id));
      }
      
      let finalTrainers: Trainer[] = [];
      if (trainerIds) {
          // Dissociate all trainers currently with the gym
          await tx.update(schema.trainers).set({ gym_id: null }).where(eq(schema.trainers.gym_id, id));
          // Associate the new list of trainers
          if (trainerIds.length > 0) {
            await tx.update(schema.trainers).set({ gym_id: id }).where(inArray(schema.trainers.id, trainerIds));
          }
          finalTrainers = await tx.select().from(schema.trainers).where(eq(schema.trainers.gym_id, id));
      } else {
          finalTrainers = await tx.select().from(schema.trainers).where(eq(schema.trainers.gym_id, id));
      }
  
      const provinceData = updatedGym.province_id 
        ? await tx.query.provinces.findFirst({ where: eq(schema.provinces.id, updatedGym.province_id) })
        : null;
        
      return mapRawGymToGymWithDetails(updatedGym, provinceData || null, finalImages, finalTags, finalTrainers);
    });
}
  
export async function deleteGym(id: string): Promise<boolean> {
  const result = await db.update(schema.gyms)
    .set({ is_active: false, updated_at: new Date() })
    .where(eq(schema.gyms.id, id));
  
  return result.rowCount > 0;
}

export async function addGymImage(gymId: string, imageUrl: string): Promise<GymImage> {
    const newImage: NewGymImage = { gym_id: gymId, image_url: imageUrl };
    const result = await db.insert(schema.gymImages).values(newImage).returning();
    return result[0];
}

export async function removeGymImage(imageId: string): Promise<boolean> {
    const result = await db.delete(schema.gymImages).where(eq(schema.gymImages.id, imageId));
    return result.rowCount > 0;
} 