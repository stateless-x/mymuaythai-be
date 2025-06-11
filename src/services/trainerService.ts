import { db } from '../db/config';
import * as schema from '../db/schema';
import {
  Trainer,
  NewTrainer,
  CreateTrainerRequest,
  UpdateTrainerRequest,
  TrainerWithDetails,
  Province,
  Gym,
  Class,
  Tag,
  NewTrainerClass
} from '../types';
import { eq, ilike, and, or, desc, sql, count, SQL, inArray } from 'drizzle-orm';

// Helper function to map raw trainer data to TrainerWithDetails
function mapRawTrainerToTrainerWithDetails(
  rawTrainerData: any, 
  provinceData: Province | null, 
  gymData: Gym | null,
  classes: Class[] = [], 
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
    province_id: rawTrainerData.province_id,
    is_active: rawTrainerData.is_active,
    created_at: rawTrainerData.created_at,
    classes,
    tags
  };

  if (provinceData !== null) {
    result.province = provinceData;
  }

  if (gymData !== null) {
    result.primaryGym = gymData;
  }

  return result;
}

export async function getAllTrainers(page: number = 1, pageSize: number = 20, searchTerm?: string, provinceId?: number, gymId?: string, isFreelance?: boolean, includeInactive: boolean = false): Promise<{ trainers: TrainerWithDetails[], total: number }> {
  const offset = (page - 1) * pageSize;
  const whereConditions: (SQL<unknown> | undefined)[] = [];

  // Only filter by is_active if includeInactive is false (default behavior for public)
  if (!includeInactive) {
    whereConditions.push(eq(schema.trainers.is_active, true));
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
  
  if (searchTerm) {
    const searchPattern = `%${searchTerm.toLowerCase()}%`;
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
  }

  const validWhereConditions = whereConditions.filter(c => c !== undefined) as SQL<unknown>[];

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
    province_id: schema.trainers.province_id,
    is_active: schema.trainers.is_active,
    created_at: schema.trainers.created_at,
    provinceData: schema.provinces,
    gymData: schema.gyms
  })
  .from(schema.trainers)
  .leftJoin(schema.provinces, eq(schema.trainers.province_id, schema.provinces.id))
  .leftJoin(schema.gyms, eq(schema.trainers.gym_id, schema.gyms.id))
  .where(validWhereConditions.length > 0 ? and(...validWhereConditions) : undefined)
  .orderBy(desc(schema.trainers.created_at))
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

  const trainersWithDetailsList: TrainerWithDetails[] = trainersResult.map(t => 
    mapRawTrainerToTrainerWithDetails(
      t, 
      t.provinceData as Province | null, 
      t.gymData as Gym | null
    )
  );

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
    province_id: schema.trainers.province_id,
    is_active: schema.trainers.is_active,
    created_at: schema.trainers.created_at,
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
  
  // Get trainer's classes via trainerClasses junction table
  const trainerClassesRecords = await db.select({ class_id: schema.trainerClasses.class_id })
    .from(schema.trainerClasses)
    .where(eq(schema.trainerClasses.trainer_id, id));
  const classIds = trainerClassesRecords.map(tc => tc.class_id);
  const classes = classIds.length > 0 
    ? await db.select().from(schema.classes).where(inArray(schema.classes.id, classIds))
    : [];

  // Get trainer's tags via trainerTags junction table
  const trainerTagsRecords = await db.select({ tag_id: schema.trainerTags.tag_id })
    .from(schema.trainerTags)
    .where(eq(schema.trainerTags.trainer_id, id));
  const tagIds = trainerTagsRecords.map(tt => tt.tag_id);
  const tags = tagIds.length > 0 
    ? await db.select().from(schema.tags).where(inArray(schema.tags.id, tagIds))
    : [];

  return mapRawTrainerToTrainerWithDetails(
    rawTrainerData, 
    rawTrainerData.provinceData as Province | null,
    rawTrainerData.gymData as Gym | null,
    classes,
    tags
  );
}

export async function getTrainersByGym(gymId: string, page: number = 1, pageSize: number = 20, includeInactive: boolean = false): Promise<{ trainers: TrainerWithDetails[], total: number }> {
  return getAllTrainers(page, pageSize, undefined, undefined, gymId, undefined, includeInactive);
}

export async function getTrainersByProvince(provinceId: number, page: number = 1, pageSize: number = 20, includeInactive: boolean = false): Promise<{ trainers: TrainerWithDetails[], total: number }> {
  return getAllTrainers(page, pageSize, undefined, provinceId, undefined, undefined, includeInactive);
}

export async function getFreelanceTrainers(page: number = 1, pageSize: number = 20, includeInactive: boolean = false): Promise<{ trainers: TrainerWithDetails[], total: number }> {
  return getAllTrainers(page, pageSize, undefined, undefined, undefined, true, includeInactive);
}

export async function getTrainerClasses(trainerId: string): Promise<Class[]> {
  const trainerClassesRecords = await db.select({ class_id: schema.trainerClasses.class_id })
    .from(schema.trainerClasses)
    .where(eq(schema.trainerClasses.trainer_id, trainerId));
  
  const classIds = trainerClassesRecords.map(tc => tc.class_id);
  
  if (classIds.length === 0) {
    return [];
  }
  
  return db.select().from(schema.classes).where(inArray(schema.classes.id, classIds));
}

export async function createTrainer(trainerData: CreateTrainerRequest): Promise<Trainer> {
  const result = await db.insert(schema.trainers)
    .values(trainerData as NewTrainer)
    .returning();
  
  if (!result || result.length === 0) {
    throw new Error('Trainer creation failed, no data returned.');
  }
  
  return result[0]!;
}

export async function updateTrainer(id: string, trainerData: UpdateTrainerRequest): Promise<Trainer | null> {
  const result = await db.update(schema.trainers)
    .set(trainerData as Partial<NewTrainer>)
    .where(eq(schema.trainers.id, id))
    .returning();
  
  return result[0] || null;
}

export async function deleteTrainer(id: string): Promise<boolean> {
  const result = await db.update(schema.trainers)
    .set({ is_active: false })
    .where(eq(schema.trainers.id, id))
    .returning();
  
  return result.length > 0;
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

export async function searchTrainers(query: string, page: number = 1, pageSize: number = 20): Promise<{ trainers: TrainerWithDetails[], total: number }> {
  if (!query?.trim()) {
    return { trainers: [], total: 0 };
  }
  
  return getAllTrainers(page, pageSize, query.trim());
} 