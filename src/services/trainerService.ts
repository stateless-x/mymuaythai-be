import { db } from '../db/config';
import * as schema from '../db/schema';
import {
  Trainer,
  NewTrainer,
  CreateTrainerRequest,
  UpdateTrainerRequest,
  TrainerWithDetails,
  TrainerClassWithDetails,
  CreateTrainerClassRequest,
  UpdateTrainerClassRequest,
  Province,
  Gym,
  Class,
  Tag,
  NewTrainerClass
} from '../types';
import { eq, ilike, and, or, desc, sql, count, SQL, inArray, asc } from 'drizzle-orm';

// Helper function to map raw trainer data to TrainerWithDetails
function mapRawTrainerToTrainerWithDetails(
  rawTrainerData: any, 
  provinceData: Province | null, 
  gymData: Gym | null,
  classes: TrainerClassWithDetails[] = [],
  tags: Tag[] = []
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
    tags
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
    
    // Create relevance-based ordering using CASE WHEN for scoring
    // Higher scores for exact matches, lower scores for partial matches
    const relevanceScore = sql`
      CASE 
        -- Exact matches in names get highest priority (score 100)
        WHEN LOWER(${schema.trainers.first_name_th}) = ${exactPattern} THEN 100
        WHEN LOWER(${schema.trainers.last_name_th}) = ${exactPattern} THEN 100
        WHEN LOWER(${schema.trainers.first_name_en}) = ${exactPattern} THEN 100
        WHEN LOWER(${schema.trainers.last_name_en}) = ${exactPattern} THEN 100
        
        -- Names starting with search term get high priority (score 80)
        WHEN LOWER(${schema.trainers.first_name_th}) LIKE ${exactPattern + '%'} THEN 80
        WHEN LOWER(${schema.trainers.last_name_th}) LIKE ${exactPattern + '%'} THEN 80
        WHEN LOWER(${schema.trainers.first_name_en}) LIKE ${exactPattern + '%'} THEN 80
        WHEN LOWER(${schema.trainers.last_name_en}) LIKE ${exactPattern + '%'} THEN 80
        
        -- Names containing search term get medium priority (score 60)
        WHEN LOWER(${schema.trainers.first_name_th}) LIKE ${searchPattern} THEN 60
        WHEN LOWER(${schema.trainers.last_name_th}) LIKE ${searchPattern} THEN 60
        WHEN LOWER(${schema.trainers.first_name_en}) LIKE ${searchPattern} THEN 60
        WHEN LOWER(${schema.trainers.last_name_en}) LIKE ${searchPattern} THEN 60
        
        -- Bio matches get lower priority (score 40)
        WHEN LOWER(${schema.trainers.bio_th}) LIKE ${searchPattern} THEN 40
        WHEN LOWER(${schema.trainers.bio_en}) LIKE ${searchPattern} THEN 40
        
        -- Province/gym matches get lowest priority (score 20)
        WHEN LOWER(${schema.provinces.name_th}) LIKE ${searchPattern} THEN 20
        WHEN LOWER(${schema.provinces.name_en}) LIKE ${searchPattern} THEN 20
        WHEN LOWER(${schema.gyms.name_th}) LIKE ${searchPattern} THEN 20
        WHEN LOWER(${schema.gyms.name_en}) LIKE ${searchPattern} THEN 20
        
        ELSE 0
      END
    `;
    
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
    
    // Store relevance score for ordering
    whereConditions.push(sql`${relevanceScore} > 0`);
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
    // Add relevance score to select when searching
    ...(searchTerm ? {
      relevance: sql`
        CASE 
          -- Exact matches in names get highest priority (score 100)
          WHEN LOWER(${schema.trainers.first_name_th}) = ${searchTerm.toLowerCase()} THEN 100
          WHEN LOWER(${schema.trainers.last_name_th}) = ${searchTerm.toLowerCase()} THEN 100
          WHEN LOWER(${schema.trainers.first_name_en}) = ${searchTerm.toLowerCase()} THEN 100
          WHEN LOWER(${schema.trainers.last_name_en}) = ${searchTerm.toLowerCase()} THEN 100
          
          -- Names starting with search term get high priority (score 80)
          WHEN LOWER(${schema.trainers.first_name_th}) LIKE ${searchTerm.toLowerCase() + '%'} THEN 80
          WHEN LOWER(${schema.trainers.last_name_th}) LIKE ${searchTerm.toLowerCase() + '%'} THEN 80
          WHEN LOWER(${schema.trainers.first_name_en}) LIKE ${searchTerm.toLowerCase() + '%'} THEN 80
          WHEN LOWER(${schema.trainers.last_name_en}) LIKE ${searchTerm.toLowerCase() + '%'} THEN 80
          
          -- Names containing search term get medium priority (score 60)
          WHEN LOWER(${schema.trainers.first_name_th}) LIKE ${'%' + searchTerm.toLowerCase() + '%'} THEN 60
          WHEN LOWER(${schema.trainers.last_name_th}) LIKE ${'%' + searchTerm.toLowerCase() + '%'} THEN 60
          WHEN LOWER(${schema.trainers.first_name_en}) LIKE ${'%' + searchTerm.toLowerCase() + '%'} THEN 60
          WHEN LOWER(${schema.trainers.last_name_en}) LIKE ${'%' + searchTerm.toLowerCase() + '%'} THEN 60
          
          -- Bio matches get lower priority (score 40)
          WHEN LOWER(${schema.trainers.bio_th}) LIKE ${'%' + searchTerm.toLowerCase() + '%'} THEN 40
          WHEN LOWER(${schema.trainers.bio_en}) LIKE ${'%' + searchTerm.toLowerCase() + '%'} THEN 40
          
          -- Province/gym matches get lowest priority (score 20)
          WHEN LOWER(${schema.provinces.name_th}) LIKE ${'%' + searchTerm.toLowerCase() + '%'} THEN 20
          WHEN LOWER(${schema.provinces.name_en}) LIKE ${'%' + searchTerm.toLowerCase() + '%'} THEN 20
          WHEN LOWER(${schema.gyms.name_th}) LIKE ${'%' + searchTerm.toLowerCase() + '%'} THEN 20
          WHEN LOWER(${schema.gyms.name_en}) LIKE ${'%' + searchTerm.toLowerCase() + '%'} THEN 20
          
          ELSE 0
        END
      `
    } : {})
  })
  .from(schema.trainers)
  .leftJoin(schema.provinces, eq(schema.trainers.province_id, schema.provinces.id))
  .leftJoin(schema.gyms, eq(schema.trainers.gym_id, schema.gyms.id))
  .where(validWhereConditions.length > 0 ? and(...validWhereConditions) : undefined)
  .orderBy(
    ...(searchTerm ? [desc(sql`relevance`)] : []),
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

  // Optimized: Only fetch classes when needed and for specific use cases
  const trainersWithDetailsList: TrainerWithDetails[] = [];
  
  for (const trainer of trainersResult) {
    let classes: TrainerClassWithDetails[] = [];
    
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
    
    const trainerWithDetails = mapRawTrainerToTrainerWithDetails(
      trainer, 
      trainer.provinceData as Province | null, 
      trainer.gymData as Gym | null,
      classes,
      [] // Empty tags array for list view - can be extended later if needed
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

  return mapRawTrainerToTrainerWithDetails(
    rawTrainerData, 
    rawTrainerData.provinceData as Province | null,
    rawTrainerData.gymData as Gym | null,
    classes,
    tags
  );
}

export async function getTrainersByGym(gymId: string, page: number = 1, pageSize: number = 20, includeInactive: boolean = false, includeClasses: boolean = false): Promise<{ trainers: TrainerWithDetails[], total: number }> {
  return getAllTrainers(page, pageSize, undefined, undefined, gymId, undefined, !includeInactive ? true : undefined, 'updated_at', 'desc', includeClasses, false);
}

export async function getTrainersByProvince(provinceId: number, page: number = 1, pageSize: number = 20, includeInactive: boolean = false, includeClasses: boolean = false): Promise<{ trainers: TrainerWithDetails[], total: number }> {
  return getAllTrainers(page, pageSize, undefined, provinceId, undefined, undefined, !includeInactive ? true : undefined, 'updated_at', 'desc', includeClasses, false);
}

export async function getFreelanceTrainers(page: number = 1, pageSize: number = 20, includeInactive: boolean = false, includeClasses: boolean = false): Promise<{ trainers: TrainerWithDetails[], total: number }> {
  return getAllTrainers(page, pageSize, undefined, undefined, undefined, true, !includeInactive ? true : undefined, 'updated_at', 'desc', includeClasses, false);
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
            name_th: classData.name.th,
            name_en: classData.name.en,
            description_th: classData.description.th,
            description_en: classData.description.en,
            duration_minutes: classData.duration,
            max_students: classData.maxStudents,
            price: Math.round(classData.price * 100), // Convert to smallest currency unit (satang)
            is_private_class: classData.isPrivateClass !== false,
            is_active: classData.isActive !== false,
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
      
      return mapRawTrainerToTrainerWithDetails(createdTrainer, provinceData, gymData, trainerClasses, trainerTags);
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
    
    const result = await db.transaction(async (tx) => {
      let updatedTrainer: Trainer[] = [];
      
      // Update the main trainer fields only if there are fields to update
      if (Object.keys(trainerFields).length > 0) {
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
        // If no trainer fields to update, just fetch the current trainer
        const currentTrainer = await tx.select()
          .from(schema.trainers)
          .where(eq(schema.trainers.id, id));
        
        if (!currentTrainer || currentTrainer.length === 0) {
          return null;
        }
        updatedTrainer = currentTrainer;
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
          .where(and(
            eq(schema.trainerClasses.trainer_id, id),
            eq(schema.trainerClasses.is_private_class, true)
          ));
        
        // Then, insert new trainer classes
        if (classes.length > 0) {
          for (const classData of classes) {
            const trainerClassToInsert = {
              trainer_id: id,
              class_id: null, // Private class
              name_th: classData.name.th,
              name_en: classData.name.en,
              description_th: classData.description.th,
              description_en: classData.description.en,
              duration_minutes: classData.duration,
              max_students: classData.maxStudents,
              price: Math.round(classData.price * 100), // Convert to smallest currency unit (satang)
              is_private_class: classData.isPrivateClass !== false,
              is_active: classData.isActive !== false,
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
      
      return mapRawTrainerToTrainerWithDetails(trainer, provinceData, gymData, currentClasses, currentTags);
    });
    
    return result;
  } catch (error) {
    console.error('Error updating trainer:', error);
    throw new Error('Trainer update failed.');
  }
}

export async function deleteTrainer(id: string): Promise<boolean> {
  try {
    const result = await db.transaction(async (tx) => {
      // Delete associations first to avoid foreign key constraint violations
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
  
  return getAllTrainers(page, pageSize, query.trim(), undefined, undefined, isFreelance, !includeInactive ? true : undefined, 'updated_at', 'desc', includeClasses, false);
}

// Add a new function specifically for getting unassigned trainers
export async function getUnassignedTrainers(page: number = 1, pageSize: number = 20, includeInactive: boolean = false, includeClasses: boolean = false): Promise<{ trainers: TrainerWithDetails[], total: number }> {
  return getAllTrainers(page, pageSize, undefined, undefined, undefined, undefined, !includeInactive ? true : undefined, 'updated_at', 'desc', includeClasses, true);
}

// --- Trainer Class Management Functions ---

export async function createTrainerClass(trainerClassData: CreateTrainerClassRequest): Promise<TrainerClassWithDetails | null> {
  try {
    const result = await db.insert(schema.trainerClasses)
      .values({
        trainer_id: trainerClassData.trainer_id,
        class_id: trainerClassData.class_id || null,
        name_th: trainerClassData.name_th || null,
        name_en: trainerClassData.name_en || null,
        description_th: trainerClassData.description_th || null,
        description_en: trainerClassData.description_en || null,
        duration_minutes: trainerClassData.duration_minutes || null,
        max_students: trainerClassData.max_students || null,
        price: trainerClassData.price || null,
        is_private_class: trainerClassData.is_private_class || false,
      })
      .returning();

    if (!result || result.length === 0) {
      return null;
    }

    const createdTrainerClass = result[0]!;

    // Fetch associated class if class_id exists
    let associatedClass: Class | null = null;
    if (createdTrainerClass.class_id) {
      const classResult = await db.select()
        .from(schema.classes)
        .where(eq(schema.classes.id, createdTrainerClass.class_id));
      associatedClass = classResult[0] || null;
    }

    return {
      id: createdTrainerClass.id,
      trainer_id: createdTrainerClass.trainer_id,
      class_id: createdTrainerClass.class_id,
      name_th: createdTrainerClass.name_th,
      name_en: createdTrainerClass.name_en,
      description_th: createdTrainerClass.description_th,
      description_en: createdTrainerClass.description_en,
      duration_minutes: createdTrainerClass.duration_minutes,
      max_students: createdTrainerClass.max_students,
      price: createdTrainerClass.price,
      is_active: createdTrainerClass.is_active,
      is_private_class: createdTrainerClass.is_private_class,
      created_at: createdTrainerClass.created_at,
      updated_at: createdTrainerClass.updated_at,
      class: associatedClass
    };
  } catch (error) {
    console.error('Error creating trainer class:', error);
    return null;
  }
}

export async function updateTrainerClass(id: string, trainerClassData: UpdateTrainerClassRequest): Promise<TrainerClassWithDetails | null> {
  try {
    const result = await db.update(schema.trainerClasses)
      .set({
        ...trainerClassData,
        updated_at: new Date(),
      })
      .where(eq(schema.trainerClasses.id, id))
      .returning();

    if (!result || result.length === 0) {
      return null;
    }

    const updatedTrainerClass = result[0]!;

    // Fetch associated class if class_id exists
    let associatedClass: Class | null = null;
    if (updatedTrainerClass.class_id) {
      const classResult = await db.select()
        .from(schema.classes)
        .where(eq(schema.classes.id, updatedTrainerClass.class_id));
      associatedClass = classResult[0] || null;
    }

    return {
      id: updatedTrainerClass.id,
      trainer_id: updatedTrainerClass.trainer_id,
      class_id: updatedTrainerClass.class_id,
      name_th: updatedTrainerClass.name_th,
      name_en: updatedTrainerClass.name_en,
      description_th: updatedTrainerClass.description_th,
      description_en: updatedTrainerClass.description_en,
      duration_minutes: updatedTrainerClass.duration_minutes,
      max_students: updatedTrainerClass.max_students,
      price: updatedTrainerClass.price,
      is_active: updatedTrainerClass.is_active,
      is_private_class: updatedTrainerClass.is_private_class,
      created_at: updatedTrainerClass.created_at,
      updated_at: updatedTrainerClass.updated_at,
      class: associatedClass
    };
  } catch (error) {
    console.error('Error updating trainer class:', error);
    return null;
  }
}

export async function deleteTrainerClass(id: string): Promise<boolean> {
  try {
    const result = await db.update(schema.trainerClasses)
      .set({ is_active: false })
      .where(eq(schema.trainerClasses.id, id))
      .returning();
    
    return result.length > 0;
  } catch (error) {
    console.error('Error deleting trainer class:', error);
    return false;
  }
}

export async function getTrainerClassById(id: string): Promise<TrainerClassWithDetails | null> {
  try {
    const result = await db.select()
      .from(schema.trainerClasses)
      .leftJoin(schema.classes, eq(schema.trainerClasses.class_id, schema.classes.id))
      .where(eq(schema.trainerClasses.id, id));

    if (!result || result.length === 0) {
      return null;
    }

    const trainerClassData = result[0]!;

    return {
      id: trainerClassData.trainer_classes.id,
      trainer_id: trainerClassData.trainer_classes.trainer_id,
      class_id: trainerClassData.trainer_classes.class_id,
      name_th: trainerClassData.trainer_classes.name_th,
      name_en: trainerClassData.trainer_classes.name_en,
      description_th: trainerClassData.trainer_classes.description_th,
      description_en: trainerClassData.trainer_classes.description_en,
      duration_minutes: trainerClassData.trainer_classes.duration_minutes,
      max_students: trainerClassData.trainer_classes.max_students,
      price: trainerClassData.trainer_classes.price,
      is_active: trainerClassData.trainer_classes.is_active,
      is_private_class: trainerClassData.trainer_classes.is_private_class,
      created_at: trainerClassData.trainer_classes.created_at,
      updated_at: trainerClassData.trainer_classes.updated_at,
      class: trainerClassData.classes || null
    };
  } catch (error) {
    console.error('Error getting trainer class:', error);
    return null;
  }
} 