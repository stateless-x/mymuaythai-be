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

export class TrainerService {
  private mapRawTrainerToTrainerWithDetails(
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

  async getAllTrainers(page: number = 1, pageSize: number = 20, searchTerm?: string, provinceId?: number, gymId?: string, isFreelance?: boolean): Promise<{ trainers: TrainerWithDetails[], total: number }> {
    const offset = (page - 1) * pageSize;
    let whereConditions: (SQL<unknown> | undefined)[] = [eq(schema.trainers.is_active, true)];

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
    .where(and(...validWhereConditions))
    .orderBy(desc(schema.trainers.created_at))
    .limit(pageSize)
    .offset(offset);

    const trainersResult = await trainersQuery;

    const totalQuery = db.select({ value: count() })
      .from(schema.trainers)
      .leftJoin(schema.provinces, eq(schema.trainers.province_id, schema.provinces.id))
      .leftJoin(schema.gyms, eq(schema.trainers.gym_id, schema.gyms.id))
      .where(and(...validWhereConditions));
    
    const totalResult = await totalQuery;
    const total = totalResult[0]?.value ?? 0;

    const trainersWithDetailsList: TrainerWithDetails[] = trainersResult.map(t => 
      this.mapRawTrainerToTrainerWithDetails(
        t, 
        t.provinceData as Province | null, 
        t.gymData as Gym | null
      )
    );

    return { trainers: trainersWithDetailsList, total };
  }

  async getTrainerById(id: string): Promise<TrainerWithDetails | null> {
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
    .where(and(eq(schema.trainers.id, id), eq(schema.trainers.is_active, true)));

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

    return this.mapRawTrainerToTrainerWithDetails(
      rawTrainerData, 
      rawTrainerData.provinceData as Province | null,
      rawTrainerData.gymData as Gym | null,
      classes,
      tags
    );
  }

  async getTrainersByGym(gymId: string, page: number = 1, pageSize: number = 20): Promise<{ trainers: TrainerWithDetails[], total: number }> {
    return this.getAllTrainers(page, pageSize, undefined, undefined, gymId);
  }

  async getTrainersByProvince(provinceId: number, page: number = 1, pageSize: number = 20): Promise<{ trainers: TrainerWithDetails[], total: number }> {
    return this.getAllTrainers(page, pageSize, undefined, provinceId);
  }

  async getFreelanceTrainers(page: number = 1, pageSize: number = 20): Promise<{ trainers: TrainerWithDetails[], total: number }> {
    return this.getAllTrainers(page, pageSize, undefined, undefined, undefined, true);
  }

  async getTrainerClasses(trainerId: string): Promise<Class[]> {
    const trainerClassesRecords = await db.select({ class_id: schema.trainerClasses.class_id })
      .from(schema.trainerClasses)
      .where(eq(schema.trainerClasses.trainer_id, trainerId));
    const classIds = trainerClassesRecords.map(tc => tc.class_id);
    
    if (classIds.length === 0) {
      return [];
    }

    return db.select().from(schema.classes).where(inArray(schema.classes.id, classIds)).orderBy(schema.classes.name_en);
  }

  async createTrainer(trainerData: CreateTrainerRequest): Promise<Trainer> {
    const result = await db.insert(schema.trainers)
      .values(trainerData as NewTrainer)
      .returning();
    if (!result || result.length === 0) throw new Error('Trainer creation failed, no data returned.');
    return result[0]!;
  }

  async updateTrainer(id: string, trainerData: UpdateTrainerRequest): Promise<Trainer | null> {
    if (Object.keys(trainerData).length === 0) {
      const currentTrainer = await this.getTrainerById(id);
      return currentTrainer ? currentTrainer as Trainer : null;
    }
    
    const result = await db.update(schema.trainers)
      .set(trainerData)
      .where(and(eq(schema.trainers.id, id), eq(schema.trainers.is_active, true)))
      .returning();
    return result.length > 0 ? result[0]! : null;
  }

  async deleteTrainer(id: string): Promise<boolean> {
    const result = await db.update(schema.trainers)
      .set({ is_active: false })
      .where(and(eq(schema.trainers.id, id), eq(schema.trainers.is_active, true)))
      .returning({ id: schema.trainers.id });
    return result.length > 0;
  }

  async addTrainerClass(trainerId: string, classId: string): Promise<boolean> {
    try {
      const newTrainerClassData: NewTrainerClass = {
        trainer_id: trainerId,
        class_id: classId,
      };
      const result = await db.insert(schema.trainerClasses)
        .values(newTrainerClassData)
        .returning();
      return result.length > 0;
    } catch (error) {
      // Handle unique constraint violation gracefully
      return false;
    }
  }

  async removeTrainerClass(trainerId: string, classId: string): Promise<boolean> {
    const result = await db.delete(schema.trainerClasses)
      .where(and(
        eq(schema.trainerClasses.trainer_id, trainerId),
        eq(schema.trainerClasses.class_id, classId)
      ))
      .returning({ id: schema.trainerClasses.id });
    return result.length > 0;
  }

  async searchTrainers(query: string, page: number = 1, pageSize: number = 20): Promise<{ trainers: TrainerWithDetails[], total: number }> {
    return this.getAllTrainers(page, pageSize, query);
  }
} 