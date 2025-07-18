import { db } from '../db/config';
import * as schema from '../db/schema';
import {
  Trainer,
  NewTrainer,
  CreateTrainerRequest,
  UpdateTrainerRequest,
  TrainerWithDetails,
  TrainerClassWithDetails,
  Province,
  Gym,
  Class,
  Tag,
  NewTrainerClass,
  TrainerImage
} from '../types';
import { eq, ilike, and, or, desc, sql, count, SQL, inArray, asc } from 'drizzle-orm';
import { deleteImageFromBunny } from './imageService';

// Helper function to map raw trainer data to TrainerWithDetails
function mapRawTrainerToTrainerWithDetails(
  rawTrainerData: any, 
  provinceData: Province | null, 
  gymData: Gym | null,
  classes: TrainerClassWithDetails[] = [],
  tags: Tag[] = [],
  images: TrainerImage[] = []
): TrainerWithDetails {
  const result: TrainerWithDetails = {
    id: rawTrainerData.id,
    first_name_th: rawTrainerData.first_name_th,
    last_name_th: rawTrainerData.last_name_th,
    first_name_en: rawTrainerData.first_name_en,
    last_name_en: rawTrainerData.last_name_en,
    bio_th: rawTrainerData.bio_th,
    bio_en: rawTrainerData.bio_en,
    phone: rawTrainerData.phone,
    email: rawTrainerData.email,
    line_id: rawTrainerData.line_id,
    is_freelance: rawTrainerData.is_freelance,
    gym_id: rawTrainerData.gym_id,
    exp_year: rawTrainerData.exp_year,
    is_active: rawTrainerData.is_active,
    created_at: rawTrainerData.created_at,
    updated_at: rawTrainerData.updated_at,
    province: provinceData,
    classes,
    tags,
    images,
  };

  if (gymData !== null) {
    result.primaryGym = gymData;
  }

  return result;
}

export async function getAllTrainers(
  page: number = 1, 
  pageSize: number = 20, 
  searchTerm?: string, 
  provinceId?: number, 
  gymId?: string, 
  isFreelance?: boolean, 
  isActive?: boolean,
  sortField: 'created_at' | 'updated_at' = 'updated_at',
  sortBy: 'asc' | 'desc' = 'desc',
  includeClasses: boolean = false, 
  includeTags: boolean = false,
  unassignedOnly: boolean = false
): Promise<{ trainers: TrainerWithDetails[], total: number }> {
  const offset = (page - 1) * pageSize;
  const whereConditions: (SQL<unknown> | undefined)[] = [];

  if (isActive !== undefined) {
    whereConditions.push(eq(schema.trainers.is_active, isActive));
  }

  if (provinceId) {
    whereConditions.push(eq(schema.trainers.province_id, provinceId));
  }
  
  if (gymId) {
    whereConditions.push(eq(schema.trainers.gym_id, gymId));
  }

  if (isFreelance !== undefined) {
    whereConditions.push(eq(schema.trainers.is_freelance, isFreelance));
  }

  // Optimized: Handle unassigned trainers filtering at database level
  if (unassignedOnly) {
    whereConditions.push(eq(schema.trainers.is_freelance, false));
    whereConditions.push(sql`${schema.trainers.gym_id} IS NULL`);
  }
  
  if (searchTerm) {
    const searchPattern = `%${searchTerm.toLowerCase()}%`;
    const exactPattern = searchTerm.toLowerCase();
    
    // Simplified search implementation without complex relevance scoring to avoid SQL errors with special characters
    
    whereConditions.push(
      or(
        ilike(schema.trainers.first_name_th, searchPattern),
        ilike(schema.trainers.last_name_th, searchPattern),
        ilike(schema.trainers.first_name_en, searchPattern),
        ilike(schema.trainers.last_name_en, searchPattern),
        ilike(schema.trainers.bio_th, searchPattern),
        ilike(schema.trainers.bio_en, searchPattern),
        ilike(schema.provinces.name_th, searchPattern),
        ilike(schema.provinces.name_en, searchPattern),
        ilike(schema.gyms.name_th, searchPattern),
        ilike(schema.gyms.name_en, searchPattern)
      )
    );
    
    // Removed problematic relevance scoring from where conditions to fix search errors
  }

  const validWhereConditions = whereConditions.filter(c => c !== undefined) as SQL<unknown>[];

  const sortColumn = sortField === 'updated_at' 
    ? schema.trainers.updated_at 
    : schema.trainers.created_at;
  
  const sortDirection = sortBy === 'asc' ? asc : desc;

  const trainersQuery = db.select({
    id: schema.trainers.id,
    first_name_th: schema.trainers.first_name_th,
    last_name_th: schema.trainers.last_name_th,
    first_name_en: schema.trainers.first_name_en,
    last_name_en: schema.trainers.last_name_en,
    bio_th: schema.trainers.bio_th,
    bio_en: schema.trainers.bio_en,
    phone: schema.trainers.phone,
    email: schema.trainers.email,
    line_id: schema.trainers.line_id,
    is_freelance: schema.trainers.is_freelance,
    gym_id: schema.trainers.gym_id,
    exp_year: schema.trainers.exp_year,
    is_active: schema.trainers.is_active,
    created_at: schema.trainers.created_at,
    updated_at: schema.trainers.updated_at,
    provinceData: schema.provinces,
    gymData: schema.gyms,
    // Skip relevance score in select for now to avoid SQL template issues with special characters
    // The ordering is handled in the orderBy clause below
    
  })
  .from(schema.trainers)
  .leftJoin(schema.provinces, eq(schema.trainers.province_id, schema.provinces.id))
  .leftJoin(schema.gyms, eq(schema.trainers.gym_id, schema.gyms.id))
  .where(validWhereConditions.length > 0 ? and(...validWhereConditions) : undefined)
  .orderBy(
    // When searching, use a simple relevance scoring based on name matches
    ...(searchTerm ? [
      desc(sql`
        CASE 
          WHEN LOWER(${schema.trainers.first_name_th}) LIKE ${`%${searchTerm.toLowerCase()}%`} OR
               LOWER(${schema.trainers.last_name_th}) LIKE ${`%${searchTerm.toLowerCase()}%`} THEN 3
          WHEN LOWER(${schema.trainers.first_name_en}) LIKE ${`%${searchTerm.toLowerCase()}%`} OR
               LOWER(${schema.trainers.last_name_en}) LIKE ${`%${searchTerm.toLowerCase()}%`} THEN 2
          WHEN LOWER(${schema.trainers.bio_th}) LIKE ${`%${searchTerm.toLowerCase()}%`} OR
               LOWER(${schema.trainers.bio_en}) LIKE ${`%${searchTerm.toLowerCase()}%`} THEN 1
          ELSE 0
        END
      `)
    ] : []),
    sortDirection(sortColumn)
  )
  .limit(pageSize)
  .offset(offset);

  const trainersResult = await trainersQuery;

  const totalQuery = db.select({ value: count() })
    .from(schema.trainers)
    .leftJoin(schema.provinces, eq(schema.trainers.province_id, schema.provinces.id))
    .leftJoin(schema.gyms, eq(schema.trainers.gym_id, schema.gyms.id))
    .where(validWhereConditions.length > 0 ? and(...validWhereConditions) : undefined);
  
  const totalResult = await totalQuery;
  const total = totalResult[0]?.value ?? 0;

  // Optimized: Only fetch classes and tags when needed and for specific use cases
  const trainersWithDetailsList: TrainerWithDetails[] = [];
  
  for (const trainer of trainersResult) {
    let classes: TrainerClassWithDetails[] = [];
    let tags: Tag[] = [];
    
    // Only load classes if explicitly requested (for admin views)
    if (includeClasses) {
      // Get trainer's detailed class info (including both standard and private classes)
      const trainerClassesDetailed = await db.select()
        .from(schema.trainerClasses)
        .leftJoin(schema.classes, eq(schema.trainerClasses.class_id, schema.classes.id))
        .where(eq(schema.trainerClasses.trainer_id, trainer.id));

      classes = trainerClassesDetailed.map(tc => ({
        id: tc.trainer_classes.id,
        trainer_id: tc.trainer_classes.trainer_id,
        class_id: tc.trainer_classes.class_id,
        name_th: tc.trainer_classes.name_th || tc.classes?.name_th || null,
        name_en: tc.trainer_classes.name_en || tc.classes?.name_en || null,
        description_th: tc.trainer_classes.description_th || tc.classes?.description_th || null,
        description_en: tc.trainer_classes.description_en || tc.classes?.description_en || null,
        duration_minutes: tc.trainer_classes.duration_minutes,
        max_students: tc.trainer_classes.max_students,
        price: tc.trainer_classes.price,
        is_active: tc.trainer_classes.is_active,
        is_private_class: tc.trainer_classes.is_private_class,
        created_at: tc.trainer_classes.created_at,
        updated_at: tc.trainer_classes.updated_at,
        class: tc.classes || null
      }));
    }
    
    // Only load tags if explicitly requested
    if (includeTags) {
      // Get trainer's tags via trainerTags junction table
      const trainerTagsRecords = await db.select({ tag_id: schema.trainerTags.tag_id })
        .from(schema.trainerTags)
        .where(eq(schema.trainerTags.trainer_id, trainer.id));
      const tagIds = trainerTagsRecords.map(tt => tt.tag_id);
      tags = tagIds.length > 0 
        ? await db.select().from(schema.tags).where(inArray(schema.tags.id, tagIds))
        : [];
    }
    
    const trainerWithDetails = mapRawTrainerToTrainerWithDetails(
      trainer, 
      trainer.provinceData as Province | null, 
      trainer.gymData as Gym | null,
      classes,
      tags,
      []
    );
    
    trainersWithDetailsList.push(trainerWithDetails);
  }

  return { trainers: trainersWithDetailsList, total };
}

export async function getTrainerById(id: string, includeInactive: boolean = false): Promise<TrainerWithDetails | null> {
  const whereConditions: (SQL<unknown> | undefined)[] = [eq(schema.trainers.id, id)];
  
  // Only filter by is_active if includeInactive is false (default behavior for public)
  if (!includeInactive) {
    whereConditions.push(eq(schema.trainers.is_active, true));
  }

  const validWhereConditions = whereConditions.filter(c => c !== undefined) as SQL<unknown>[];

  const trainersResult = await db.select({
    id: schema.trainers.id,
    first_name_th: schema.trainers.first_name_th,
    last_name_th: schema.trainers.last_name_th,
    first_name_en: schema.trainers.first_name_en,
    last_name_en: schema.trainers.last_name_en,
    bio_th: schema.trainers.bio_th,
    bio_en: schema.trainers.bio_en,
    phone: schema.trainers.phone,
    email: schema.trainers.email,
    line_id: schema.trainers.line_id,
    is_freelance: schema.trainers.is_freelance,
    gym_id: schema.trainers.gym_id,
    exp_year: schema.trainers.exp_year,
    is_active: schema.trainers.is_active,
    created_at: schema.trainers.created_at,
    updated_at: schema.trainers.updated_at,
    provinceData: schema.provinces,
    gymData: schema.gyms
  })
  .from(schema.trainers)
  .leftJoin(schema.provinces, eq(schema.trainers.province_id, schema.provinces.id))
  .leftJoin(schema.gyms, eq(schema.trainers.gym_id, schema.gyms.id))
  .where(and(...validWhereConditions));

  if (trainersResult.length === 0) {
    return null;
  }
  const rawTrainerData = trainersResult[0]!;

  // Get trainer's tags via trainerTags junction table
  const trainerTagsRecords = await db.select({ tag_id: schema.trainerTags.tag_id })
    .from(schema.trainerTags)
    .where(eq(schema.trainerTags.trainer_id, id));
  const tagIds = trainerTagsRecords.map(tt => tt.tag_id);
  const tags = tagIds.length > 0 
    ? await db.select().from(schema.tags).where(inArray(schema.tags.id, tagIds))
    : [];

  // Get trainer's detailed class info (including both standard and private classes)
  const trainerClassesDetailed = await db.select()
    .from(schema.trainerClasses)
    .leftJoin(schema.classes, eq(schema.trainerClasses.class_id, schema.classes.id))
    .where(eq(schema.trainerClasses.trainer_id, id));

  const classes: TrainerClassWithDetails[] = trainerClassesDetailed.map(tc => ({
    id: tc.trainer_classes.id,
    trainer_id: tc.trainer_classes.trainer_id,
    class_id: tc.trainer_classes.class_id,
    name_th: tc.trainer_classes.name_th || tc.classes?.name_th || null,
    name_en: tc.trainer_classes.name_en || tc.classes?.name_en || null,
    description_th: tc.trainer_classes.description_th || tc.classes?.description_th || null,
    description_en: tc.trainer_classes.description_en || tc.classes?.description_en || null,
    duration_minutes: tc.trainer_classes.duration_minutes,
    max_students: tc.trainer_classes.max_students,
    price: tc.trainer_classes.price,
    is_active: tc.trainer_classes.is_active,
    is_private_class: tc.trainer_classes.is_private_class,
    created_at: tc.trainer_classes.created_at,
    updated_at: tc.trainer_classes.updated_at,
    class: tc.classes || null
  }));

  // Fetch trainer images (up to 5 but fetch all)
  const images = await db.select().from(schema.trainerImages).where(eq(schema.trainerImages.trainer_id, id));

  return mapRawTrainerToTrainerWithDetails(
    rawTrainerData, 
    rawTrainerData.provinceData as Province | null,
    rawTrainerData.gymData as Gym | null,
    classes,
    tags,
    images
  );
}

export async function getTrainersByGym(gymId: string, page: number = 1, pageSize: number = 20, includeInactive: boolean = false, includeClasses: boolean = false): Promise<{ trainers: TrainerWithDetails[], total: number }> {
  return getAllTrainers(page, pageSize, undefined, undefined, gymId, undefined, !includeInactive ? true : undefined, 'updated_at', 'desc', includeClasses, false, false);
}

export async function getTrainersByProvince(provinceId: number, page: number = 1, pageSize: number = 20, includeInactive: boolean = false, includeClasses: boolean = false): Promise<{ trainers: TrainerWithDetails[], total: number }> {
  return getAllTrainers(page, pageSize, undefined, provinceId, undefined, undefined, !includeInactive ? true : undefined, 'updated_at', 'desc', includeClasses, false, false);
}

export async function getFreelanceTrainers(page: number = 1, pageSize: number = 20, includeInactive: boolean = false, includeClasses: boolean = false): Promise<{ trainers: TrainerWithDetails[], total: number }> {
  return getAllTrainers(page, pageSize, undefined, undefined, undefined, true, !includeInactive ? true : undefined, 'updated_at', 'desc', includeClasses, false, false);
}

export async function getTrainerClasses(trainerId: string): Promise<Class[]> {
  const trainerClassesRecords = await db.select({ class_id: schema.trainerClasses.class_id })
    .from(schema.trainerClasses)
    .where(eq(schema.trainerClasses.trainer_id, trainerId));
  
  const classIds = trainerClassesRecords.map(tc => tc.class_id).filter(id => id !== null) as string[];
  
  if (classIds.length === 0) {
    return [];
  }
  
  return db.select().from(schema.classes).where(inArray(schema.classes.id, classIds));
}

export async function createTrainer(trainerData: CreateTrainerRequest): Promise<TrainerWithDetails> {
  try {
    // Extract tags and classes from trainer data if present
    const { tags, classes, ...trainerFields } = trainerData as any;
    
    const result = await db.transaction(async (tx) => {
      // Create the trainer
      const newTrainer = await tx.insert(schema.trainers)
        .values(trainerFields as NewTrainer)
        .returning();
      
      if (!newTrainer || newTrainer.length === 0) {
        throw new Error('Trainer creation failed, no data returned.');
      }
      
      const createdTrainer = newTrainer[0]!;
      
      // Fetch province data if province_id exists
      let provinceData: Province | null = null;
      if (createdTrainer.province_id) {
        const province = await tx.select().from(schema.provinces).where(eq(schema.provinces.id, createdTrainer.province_id));
        provinceData = province[0] || null;
      }
      
      // Fetch gym data if gym_id exists
      let gymData: Gym | null = null;
      if (createdTrainer.gym_id) {
        const gym = await tx.select().from(schema.gyms).where(eq(schema.gyms.id, createdTrainer.gym_id));
        gymData = gym[0] || null;
        
        // Note: The bidirectional relationship is maintained through the database FK constraint
        // and the gym service updates. When a gym updates its associatedTrainers, it sets
        // trainers' gym_id. Here we just ensure consistency is maintained.
      }
      
      // Create tag associations if tags are provided
      let trainerTags: Tag[] = [];
      if (tags && tags.length > 0) {
        const trainerTagsToInsert = tags.map((tag: any) => ({
          trainer_id: createdTrainer.id,
          tag_id: tag.id,
        }));
        
        await tx.insert(schema.trainerTags)
          .values(trainerTagsToInsert);
        
        trainerTags = tags;
      }
      
      // Create trainer classes if classes are provided
      let trainerClasses: TrainerClassWithDetails[] = [];
      if (classes && classes.length > 0) {
        for (const classData of classes) {
          const trainerClassToInsert = {
            trainer_id: createdTrainer.id,
            class_id: null, // Private class
            name_th: classData.name_th,
            name_en: classData.name_en,
            description_th: classData.description_th,
            description_en: classData.description_en,
            duration_minutes: classData.duration_minutes,
            max_students: classData.max_students,
            price: classData.price,
            is_private_class: classData.is_private_class,
            is_active: classData.is_active,
          };
          
          const result = await tx.insert(schema.trainerClasses)
            .values(trainerClassToInsert)
            .returning();
          
          if (result[0]) {
            trainerClasses.push({
              id: result[0].id,
              trainer_id: result[0].trainer_id,
              class_id: result[0].class_id,
              name_th: result[0].name_th,
              name_en: result[0].name_en,
              description_th: result[0].description_th,
              description_en: result[0].description_en,
              duration_minutes: result[0].duration_minutes,
              max_students: result[0].max_students,
              price: result[0].price,
              is_active: result[0].is_active,
              is_private_class: result[0].is_private_class,
              created_at: result[0].created_at,
              updated_at: result[0].updated_at,
              class: null
            });
          }
        }
      }
      
      return mapRawTrainerToTrainerWithDetails(createdTrainer, provinceData, gymData, trainerClasses, trainerTags, []);
    });
    
    return result;
  } catch (error) {
    console.error('Error creating trainer:', error);
    throw new Error('Trainer creation failed.');
  }
}

export async function updateTrainer(id: string, trainerData: UpdateTrainerRequest): Promise<TrainerWithDetails | null> {
  try {
    // Extract tags and classes from trainer data if present
    const { tags, classes, ...trainerFields } = trainerData as any;
    
    delete (trainerFields as Partial<Trainer>).created_at;
    delete (trainerFields as Partial<Trainer>).updated_at;
    
    const result = await db.transaction(async (tx) => {
      let updatedTrainer: Trainer[] = [];
      
      // Always update the updated_at timestamp when any trainer data is modified
      if (Object.keys(trainerFields).length > 0) {
        // Update main trainer fields along with updated_at
        updatedTrainer = await tx.update(schema.trainers)
          .set({
            ...trainerFields as Partial<NewTrainer>,
            updated_at: new Date(),
          })
          .where(eq(schema.trainers.id, id))
          .returning();
        
        if (!updatedTrainer || updatedTrainer.length === 0) {
          return null;
        }
      } else {
        // Even if no main trainer fields to update, still update updated_at if tags or classes are being updated
        const hasTagsOrClassesUpdate = tags !== undefined || classes !== undefined;
        
        if (hasTagsOrClassesUpdate) {
          // Update only the updated_at timestamp
          updatedTrainer = await tx.update(schema.trainers)
            .set({ updated_at: new Date() })
            .where(eq(schema.trainers.id, id))
            .returning();
          
          if (!updatedTrainer || updatedTrainer.length === 0) {
            return null;
          }
        } else {
          // If truly nothing to update, just fetch the current trainer
          const currentTrainer = await tx.select()
            .from(schema.trainers)
            .where(eq(schema.trainers.id, id));
          
          if (!currentTrainer || currentTrainer.length === 0) {
            return null;
          }
          updatedTrainer = currentTrainer;
        }
      }
      
      const trainer = updatedTrainer[0]!;
      
      // Fetch province data if province_id exists
      let provinceData: Province | null = null;
      if (trainer.province_id) {
        const province = await tx.select().from(schema.provinces).where(eq(schema.provinces.id, trainer.province_id));
        provinceData = province[0] || null;
      }
      
      // Fetch gym data if gym_id exists
      let gymData: Gym | null = null;
      if (trainer.gym_id) {
        const gym = await tx.select().from(schema.gyms).where(eq(schema.gyms.id, trainer.gym_id));
        gymData = gym[0] || null;
        
        // Note: The bidirectional relationship is maintained primarily through the gym service
        // When a gym updates its associatedTrainers, it manages the trainers' gym_id
        // Individual trainer updates just update their own gym_id field
      }
      
      // Handle tags update if provided
      if (tags) {
        // First, delete existing trainer tag associations
        await tx.delete(schema.trainerTags)
          .where(eq(schema.trainerTags.trainer_id, id));
        
        // Then, insert new tag associations
        if (tags.length > 0) {
          const trainerTagsToInsert = tags.map((tag: any) => ({
            trainer_id: id,
            tag_id: tag.id,
          }));
          
          await tx.insert(schema.trainerTags)
            .values(trainerTagsToInsert);
        }
      }
      
      // Handle classes update if provided
      if (classes) {
        // First, delete existing trainer classes (private classes only)
        await tx.delete(schema.trainerClasses)
          .where(eq(schema.trainerClasses.trainer_id, id));
        
        // Then, insert new trainer classes
        if (classes.length > 0) {
          for (const classData of classes) {
            const trainerClassToInsert = {
              trainer_id: id,
              class_id: null, // Private class
              name_th: classData.name_th,
              name_en: classData.name_en,
              description_th: classData.description_th,
              description_en: classData.description_en,
              duration_minutes: classData.duration_minutes,
              max_students: classData.max_students,
              price: classData.price,
              is_private_class: classData.is_private_class,
              is_active: classData.is_active,
            };
            
            await tx.insert(schema.trainerClasses)
              .values(trainerClassToInsert);
          }
        }
      }
      
      // Fetch current tags
      const trainerTagsRecords = await tx.select({ tag_id: schema.trainerTags.tag_id })
        .from(schema.trainerTags)
        .where(eq(schema.trainerTags.trainer_id, id));
      const tagIds = trainerTagsRecords.map(tt => tt.tag_id);
      const currentTags = tagIds.length > 0 
        ? await tx.select().from(schema.tags).where(inArray(schema.tags.id, tagIds))
        : [];
      
      // Get combined classes (both standard and private)
      const trainerClassesDetailed = await tx.select()
        .from(schema.trainerClasses)
        .leftJoin(schema.classes, eq(schema.trainerClasses.class_id, schema.classes.id))
        .where(eq(schema.trainerClasses.trainer_id, id));

      const currentClasses: TrainerClassWithDetails[] = trainerClassesDetailed.map(tc => ({
        id: tc.trainer_classes.id,
        trainer_id: tc.trainer_classes.trainer_id,
        class_id: tc.trainer_classes.class_id,
        name_th: tc.trainer_classes.name_th || tc.classes?.name_th || null,
        name_en: tc.trainer_classes.name_en || tc.classes?.name_en || null,
        description_th: tc.trainer_classes.description_th || tc.classes?.description_th || null,
        description_en: tc.trainer_classes.description_en || tc.classes?.description_en || null,
        duration_minutes: tc.trainer_classes.duration_minutes,
        max_students: tc.trainer_classes.max_students,
        price: tc.trainer_classes.price,
        is_active: tc.trainer_classes.is_active,
        is_private_class: tc.trainer_classes.is_private_class,
        created_at: tc.trainer_classes.created_at,
        updated_at: tc.trainer_classes.updated_at,
        class: tc.classes || null
      }));
      
      const currentImages = await tx.select()
        .from(schema.trainerImages)
        .where(eq(schema.trainerImages.trainer_id, id));
      return mapRawTrainerToTrainerWithDetails(trainer, provinceData, gymData, currentClasses, currentTags, currentImages);
    });
    
    return result;
  } catch (error) {
    console.error('Error updating trainer:', error);
    throw new Error('Trainer update failed.');
  }
}

export async function deleteTrainer(id: string): Promise<boolean> {
  try {
    // First, fetch all images to delete them from Bunny
    const imagesToDelete = await db.select()
      .from(schema.trainerImages)
      .where(eq(schema.trainerImages.trainer_id, id));

    const result = await db.transaction(async (tx) => {
      // Delete associations first to avoid foreign key constraint violations
      await tx.delete(schema.trainerImages)
        .where(eq(schema.trainerImages.trainer_id, id));
        
      await tx.delete(schema.trainerTags)
        .where(eq(schema.trainerTags.trainer_id, id));
        
      await tx.delete(schema.trainerClasses)
        .where(eq(schema.trainerClasses.trainer_id, id));

      // Then delete the trainer itself
      const deletedTrainer = await tx.delete(schema.trainers)
        .where(eq(schema.trainers.id, id))
        .returning();
      
      return deletedTrainer.length > 0;
    });
    
    // If transaction was successful, delete images from Bunny
    if (result) {
      const deletePromises = imagesToDelete.map(image => {
        if (image.image_url) {
          return deleteImageFromBunny(image.image_url);
        }
        return Promise.resolve();
      });
      await Promise.all(deletePromises).catch(err => {
        // Log errors but don't fail the whole operation since DB part is done
        console.error("One or more images failed to delete from BunnyCDN:", err);
      });
    }
    return result;
  } catch (error) {
    console.error(`Failed to delete trainer with id ${id}:`, error);
    return false;
  }
}

export async function addTrainerClass(trainerId: string, classId: string): Promise<boolean> {
  try {
    const newTrainerClass: NewTrainerClass = {
      trainer_id: trainerId,
      class_id: classId
    };
    
    const result = await db.insert(schema.trainerClasses)
      .values(newTrainerClass)
      .returning();
    
    return result.length > 0;
  } catch (error) {
    console.error('Error adding trainer class:', error);
    return false;
  }
}

export async function removeTrainerClass(trainerId: string, classId: string): Promise<boolean> {
  const result = await db.delete(schema.trainerClasses)
    .where(and(
      eq(schema.trainerClasses.trainer_id, trainerId),
      eq(schema.trainerClasses.class_id, classId)
    ))
    .returning();
  
  return result.length > 0;
}

export async function searchTrainers(query: string, page: number = 1, pageSize: number = 20, includeClasses: boolean = false, includeInactive: boolean = false, isFreelance?: boolean): Promise<{ trainers: TrainerWithDetails[], total: number }> {
  if (!query?.trim()) {
    return { trainers: [], total: 0 };
  }
  
  return getAllTrainers(page, pageSize, query.trim(), undefined, undefined, isFreelance, !includeInactive ? true : undefined, 'updated_at', 'desc', includeClasses, false, false);
}

// Add a new function specifically for getting unassigned trainers
export async function getUnassignedTrainers(page: number = 1, pageSize: number = 20, includeInactive: boolean = false, includeClasses: boolean = false): Promise<{ trainers: TrainerWithDetails[], total: number }> {
  return getAllTrainers(page, pageSize, undefined, undefined, undefined, undefined, !includeInactive ? true : undefined, 'updated_at', 'desc', includeClasses, false, true);
}

export async function getTrainerImages(trainerId: string): Promise<TrainerImage[]> {
  return db.select().from(schema.trainerImages).where(eq(schema.trainerImages.trainer_id, trainerId));
}

export async function addTrainerImage(trainerId: string, imageUrl: string, imageId: string): Promise<TrainerImage> {
  const result = await db.insert(schema.trainerImages).values({
    id: imageId,
    trainer_id: trainerId,
    image_url: imageUrl,
  }).returning();
  return result[0]!;
}

export async function removeTrainerImage(imageId: string): Promise<boolean> {
  // Fetch image URL
  const imageRow = await db.select().from(schema.trainerImages).where(eq(schema.trainerImages.id, imageId));
  const imageUrl = imageRow[0]?.image_url;

  const result = await db.delete(schema.trainerImages).where(eq(schema.trainerImages.id, imageId));

  if (imageUrl) {
    deleteImageFromBunny(imageUrl).catch((err) => console.error('Failed to delete trainer image from Bunny:', err));
  }

  return (result.rowCount ?? 0) > 0;
} 