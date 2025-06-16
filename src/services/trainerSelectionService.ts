import { db } from '../db/config';
import * as schema from '../db/schema';
import { eq, and, sql, ilike, or, desc, asc, SQL, inArray } from 'drizzle-orm';

// Lightweight trainer type for selection
export interface TrainerForSelection {
  id: string;
  first_name_th: string;
  last_name_th: string | null;
  first_name_en: string;
  last_name_en: string | null;
  email: string | null;
  phone: string | null;
  exp_year: number | null;
  province: {
    id: number;
    name_th: string;
    name_en: string;
  } | null;
}

export interface SelectionFilters {
  searchTerm?: string;
  provinceId?: number;
  excludeTrainerIds?: string[]; // Exclude already selected trainers
}

export interface SelectionOptions {
  page?: number;
  pageSize?: number;
  sortBy?: 'name' | 'experience' | 'recent';
}

/**
 * Get trainers available for gym assignment
 * Focused solely on selection use case
 */
export async function getAvailableTrainersForSelection(
  filters: SelectionFilters = {},
  options: SelectionOptions = {}
): Promise<{ trainers: TrainerForSelection[], total: number }> {
  const { searchTerm, provinceId, excludeTrainerIds = [] } = filters;
  const { page = 1, pageSize = 50, sortBy = 'name' } = options;
  
  const offset = (page - 1) * pageSize;
  const whereConditions: SQL<unknown>[] = [
    eq(schema.trainers.is_active, true), // Only active trainers
    eq(schema.trainers.is_freelance, false), // Only non-freelance
    sql`${schema.trainers.gym_id} IS NULL` // Only unassigned
  ];

  // Add search filter
  if (searchTerm) {
    const searchPattern = `%${searchTerm.toLowerCase()}%`;
    whereConditions.push(
      or(
        ilike(schema.trainers.first_name_th, searchPattern),
        ilike(schema.trainers.last_name_th, searchPattern),
        ilike(schema.trainers.first_name_en, searchPattern),
        ilike(schema.trainers.last_name_en, searchPattern),
        ilike(schema.provinces.name_th, searchPattern)
      )!
    );
  }

  // Add province filter
  if (provinceId) {
    whereConditions.push(eq(schema.trainers.province_id, provinceId));
  }

  // Exclude already selected trainers
  if (excludeTrainerIds.length > 0) {
    whereConditions.push(sql`${schema.trainers.id} NOT IN (${sql.join(excludeTrainerIds.map(id => sql`${id}`), sql`, `)})`);
  }

  // Simple sorting logic
  let orderBy;
  switch (sortBy) {
    case 'experience':
      orderBy = desc(schema.trainers.exp_year);
      break;
    case 'recent':
      orderBy = desc(schema.trainers.created_at);
      break;
    default: // 'name'
      orderBy = asc(schema.trainers.first_name_th);
  }

  // Lightweight query - only essential fields
  const trainersQuery = db.select({
    id: schema.trainers.id,
    first_name_th: schema.trainers.first_name_th,
    last_name_th: schema.trainers.last_name_th,
    first_name_en: schema.trainers.first_name_en,
    last_name_en: schema.trainers.last_name_en,
    email: schema.trainers.email,
    phone: schema.trainers.phone,
    exp_year: schema.trainers.exp_year,
    province: schema.provinces
  })
  .from(schema.trainers)
  .leftJoin(schema.provinces, eq(schema.trainers.province_id, schema.provinces.id))
  .where(and(...whereConditions))
  .orderBy(orderBy)
  .limit(pageSize)
  .offset(offset);

  const trainersResult = await trainersQuery;

  // Get total count
  const totalQuery = db.select({ count: sql<number>`count(*)` })
    .from(schema.trainers)
    .leftJoin(schema.provinces, eq(schema.trainers.province_id, schema.provinces.id))
    .where(and(...whereConditions));
  
  const totalResult = await totalQuery;
  const total = Number(totalResult[0]?.count || 0);

  const trainers: TrainerForSelection[] = trainersResult.map(row => ({
    id: row.id,
    first_name_th: row.first_name_th,
    last_name_th: row.last_name_th,
    first_name_en: row.first_name_en,
    last_name_en: row.last_name_en,
    email: row.email,
    phone: row.phone,
    exp_year: row.exp_year,
    province: row.province
  }));

  return { trainers, total };
}

/**
 * Get trainers currently assigned to a specific gym
 */
export async function getGymTrainers(gymId: string): Promise<TrainerForSelection[]> {
  const trainersResult = await db.select({
    id: schema.trainers.id,
    first_name_th: schema.trainers.first_name_th,
    last_name_th: schema.trainers.last_name_th,
    first_name_en: schema.trainers.first_name_en,
    last_name_en: schema.trainers.last_name_en,
    email: schema.trainers.email,
    phone: schema.trainers.phone,
    exp_year: schema.trainers.exp_year,
    province: schema.provinces
  })
  .from(schema.trainers)
  .leftJoin(schema.provinces, eq(schema.trainers.province_id, schema.provinces.id))
  .where(and(
    eq(schema.trainers.gym_id, gymId),
    eq(schema.trainers.is_active, true)
  ))
  .orderBy(asc(schema.trainers.first_name_th));

  return trainersResult.map(row => ({
    id: row.id,
    first_name_th: row.first_name_th,
    last_name_th: row.last_name_th,
    first_name_en: row.first_name_en,
    last_name_en: row.last_name_en,
    email: row.email,
    phone: row.phone,
    exp_year: row.exp_year,
    province: row.province
  }));
}

/**
 * Quick search for trainer selection (with debouncing in mind)
 */
export async function searchTrainersForSelection(
  searchTerm: string,
  limit: number = 10
): Promise<TrainerForSelection[]> {
  if (!searchTerm.trim()) {
    return [];
  }

  const searchPattern = `%${searchTerm.toLowerCase()}%`;
  
  const trainersResult = await db.select({
    id: schema.trainers.id,
    first_name_th: schema.trainers.first_name_th,
    last_name_th: schema.trainers.last_name_th,
    first_name_en: schema.trainers.first_name_en,
    last_name_en: schema.trainers.last_name_en,
    email: schema.trainers.email,
    phone: schema.trainers.phone,
    exp_year: schema.trainers.exp_year,
    province: schema.provinces
  })
  .from(schema.trainers)
  .leftJoin(schema.provinces, eq(schema.trainers.province_id, schema.provinces.id))
  .where(and(
    eq(schema.trainers.is_active, true),
    eq(schema.trainers.is_freelance, false),
    sql`${schema.trainers.gym_id} IS NULL`,
    or(
      ilike(schema.trainers.first_name_th, searchPattern),
      ilike(schema.trainers.last_name_th, searchPattern),
      ilike(schema.trainers.first_name_en, searchPattern),
      ilike(schema.trainers.last_name_en, searchPattern)
    )!
  ))
  .orderBy(asc(schema.trainers.first_name_th))
  .limit(limit);

  return trainersResult.map(row => ({
    id: row.id,
    first_name_th: row.first_name_th,
    last_name_th: row.last_name_th,
    first_name_en: row.first_name_en,
    last_name_en: row.last_name_en,
    email: row.email,
    phone: row.phone,
    exp_year: row.exp_year,
    province: row.province
  }));
} 