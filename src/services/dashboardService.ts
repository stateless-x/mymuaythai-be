import { db } from '../db/config';
import * as schema from '../db/schema';
import { eq, and, sql, count } from 'drizzle-orm';

export interface ProvinceStats {
  provinceId: number;
  provinceName: string;
  trainerCount: number;
  gymCount: number;
}

export interface DashboardStats {
  totalTrainers: number
  activeTrainers: number
  inactiveTrainers: number
  freelancers: number
  staffTrainers: number
  unassignedTrainers: number
  totalGyms: number
  activeGyms: number
  inactiveGyms: number
  topProvincesByTrainers: Array<{ provinceId: number; provinceName: string; trainerCount: number }>
  topProvincesByGyms: Array<{ provinceId: number; provinceName: string; gymCount: number }>
}

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    // Get trainer statistics with a single query
    const trainerStats = await db
      .select({
        total: count(),
        active: sql<number>`SUM(CASE WHEN ${schema.trainers.is_active} = true THEN 1 ELSE 0 END)`,
        inactive: sql<number>`SUM(CASE WHEN ${schema.trainers.is_active} = false THEN 1 ELSE 0 END)`,
        freelancers: sql<number>`SUM(CASE WHEN ${schema.trainers.is_freelance} = true AND ${schema.trainers.is_active} = true THEN 1 ELSE 0 END)`,
        staffTrainers: sql<number>`SUM(CASE WHEN ${schema.trainers.is_freelance} = false AND ${schema.trainers.is_active} = true THEN 1 ELSE 0 END)`,
        unassigned: sql<number>`SUM(CASE WHEN ${schema.trainers.gym_id} IS NULL AND ${schema.trainers.is_freelance} = false AND ${schema.trainers.is_active} = true THEN 1 ELSE 0 END)`
      })
      .from(schema.trainers);

    // Get gym statistics with a single query
    const gymStats = await db
      .select({
        total: count(),
        active: sql<number>`SUM(CASE WHEN ${schema.gyms.is_active} = true THEN 1 ELSE 0 END)`,
        inactive: sql<number>`SUM(CASE WHEN ${schema.gyms.is_active} = false THEN 1 ELSE 0 END)`
      })
      .from(schema.gyms);

    // Get top 5 provinces by trainer count and gym count in parallel
    const [topTrainerProvinces, topGymProvinces] = await Promise.all([
      getTop5TrainersByProvince(),
      getTop5GymsByProvince()
    ]);

    const trainerData = trainerStats[0];
    const gymData = gymStats[0];

    if (!trainerData || !gymData) {
      throw new Error('Failed to retrieve statistics data');
    }

    return {
      totalTrainers: Number(trainerData.total),
      activeTrainers: Number(trainerData.active),
      inactiveTrainers: Number(trainerData.inactive),
      freelancers: Number(trainerData.freelancers),
      staffTrainers: Number(trainerData.staffTrainers),
      unassignedTrainers: Number(trainerData.unassigned),
      totalGyms: Number(gymData.total),
      activeGyms: Number(gymData.active),
      inactiveGyms: Number(gymData.inactive),
      topProvincesByTrainers: topTrainerProvinces,
      topProvincesByGyms: topGymProvinces
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw new Error('Failed to fetch dashboard statistics');
  }
}

export async function getTop5TrainersByProvince(): Promise<Array<{ provinceId: number; provinceName: string; trainerCount: number }>> {
  try {
    const result = await db
      .select({
        provinceId: schema.provinces.id,
        provinceName: schema.provinces.name_th,
        trainerCount: count(schema.trainers.id)
      })
      .from(schema.trainers)
      .leftJoin(schema.provinces, eq(schema.trainers.province_id, schema.provinces.id))
      .where(eq(schema.trainers.is_active, true))
      .groupBy(schema.provinces.id, schema.provinces.name_th)
      .orderBy(sql`${count(schema.trainers.id)} DESC`)
      .limit(5);

    return result.map(row => ({
      provinceId: row.provinceId || 0,
      provinceName: row.provinceName || 'ไม่ระบุจังหวัด',
      trainerCount: Number(row.trainerCount)
    }));
  } catch (error) {
    console.error('Error fetching top 5 trainer counts by province:', error);
    throw new Error('Failed to fetch top 5 trainer counts by province');
  }
}

export async function getTop5GymsByProvince(): Promise<Array<{ provinceId: number; provinceName: string; gymCount: number }>> {
  try {
    const result = await db
      .select({
        provinceId: schema.provinces.id,
        provinceName: schema.provinces.name_th,
        gymCount: count(schema.gyms.id)
      })
      .from(schema.gyms)
      .leftJoin(schema.provinces, eq(schema.gyms.province_id, schema.provinces.id))
      .where(eq(schema.gyms.is_active, true))
      .groupBy(schema.provinces.id, schema.provinces.name_th)
      .orderBy(sql`${count(schema.gyms.id)} DESC`)
      .limit(5);

    return result.map(row => ({
      provinceId: row.provinceId || 0,
      provinceName: row.provinceName || 'ไม่ระบุจังหวัด',
      gymCount: Number(row.gymCount)
    }));
  } catch (error) {
    console.error('Error fetching top 5 gym counts by province:', error);
    throw new Error('Failed to fetch top 5 gym counts by province');
  }
}

// Keep the original functions for backwards compatibility and flexibility
export async function getTrainerCountsByProvince(): Promise<Array<{ provinceId: number; provinceName: string; trainerCount: number }>> {
  try {
    const result = await db
      .select({
        provinceId: schema.provinces.id,
        provinceName: schema.provinces.name_th,
        trainerCount: count(schema.trainers.id)
      })
      .from(schema.trainers)
      .leftJoin(schema.provinces, eq(schema.trainers.province_id, schema.provinces.id))
      .where(eq(schema.trainers.is_active, true))
      .groupBy(schema.provinces.id, schema.provinces.name_th)
      .orderBy(sql`${count(schema.trainers.id)} DESC`);

    return result.map(row => ({
      provinceId: row.provinceId || 0,
      provinceName: row.provinceName || 'ไม่ระบุจังหวัด',
      trainerCount: Number(row.trainerCount)
    }));
  } catch (error) {
    console.error('Error fetching trainer counts by province:', error);
    throw new Error('Failed to fetch trainer counts by province');
  }
}

export async function getGymCountsByProvince(): Promise<Array<{ provinceId: number; provinceName: string; gymCount: number }>> {
  try {
    const result = await db
      .select({
        provinceId: schema.provinces.id,
        provinceName: schema.provinces.name_th,
        gymCount: count(schema.gyms.id)
      })
      .from(schema.gyms)
      .leftJoin(schema.provinces, eq(schema.gyms.province_id, schema.provinces.id))
      .where(eq(schema.gyms.is_active, true))
      .groupBy(schema.provinces.id, schema.provinces.name_th)
      .orderBy(sql`${count(schema.gyms.id)} DESC`);

    return result.map(row => ({
      provinceId: row.provinceId || 0,
      provinceName: row.provinceName || 'ไม่ระบุจังหวัด',
      gymCount: Number(row.gymCount)
    }));
  } catch (error) {
    console.error('Error fetching gym counts by province:', error);
    throw new Error('Failed to fetch gym counts by province');
  }
} 