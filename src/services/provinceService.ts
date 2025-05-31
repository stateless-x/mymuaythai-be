import { db } from '../db/config';
import * as schema from '../db/schema';
import type { Province } from '../types';
import { eq, asc, ilike, or } from 'drizzle-orm';

export class ProvinceService {
  /**
   * Get all provinces sorted alphabetically by English name
   */
  async getAllProvinces(): Promise<Province[]> {
    const provinces = await db.select()
      .from(schema.provinces)
      .orderBy(asc(schema.provinces.name_en));
    
    return provinces;
  }

  /**
   * Get provinces sorted by Thai name
   */
  async getAllProvincesThaiSort(): Promise<Province[]> {
    const provinces = await db.select()
      .from(schema.provinces)
      .orderBy(asc(schema.provinces.name_th));
    
    return provinces;
  }

  /**
   * Get a specific province by ID
   */
  async getProvinceById(id: number): Promise<Province | null> {
    const provinces = await db.select()
      .from(schema.provinces)
      .where(eq(schema.provinces.id, id))
      .limit(1);
    
    return provinces.length > 0 ? provinces[0]! : null;
  }

  /**
   * Get provinces by region (based on common geographical divisions)
   */
  async getProvincesByRegion(region: 'central' | 'eastern' | 'northern' | 'northeastern' | 'southern' | 'western'): Promise<Province[]> {
    // Define regional groupings based on common geographical divisions
    const regionalIds = {
      central: Array.from({ length: 23 }, (_, i) => i + 1), // IDs 1-23
      eastern: Array.from({ length: 7 }, (_, i) => i + 24), // IDs 24-30  
      northern: Array.from({ length: 9 }, (_, i) => i + 31), // IDs 31-39
      northeastern: Array.from({ length: 20 }, (_, i) => i + 40), // IDs 40-59
      southern: Array.from({ length: 15 }, (_, i) => i + 60), // IDs 60-74
      western: Array.from({ length: 2 }, (_, i) => i + 75), // IDs 75-76
    };
    
    const targetIds = regionalIds[region] || [];
    
    if (targetIds.length === 0) {
      return [];
    }
    
    const provinces = await db.select()
      .from(schema.provinces)
      .where(
        or(
          ...targetIds.map(id => eq(schema.provinces.id, id))
        )
      )
      .orderBy(asc(schema.provinces.name_en));
    
    return provinces;
  }

  /**
   * Search provinces by name (both Thai and English)
   */
  async searchProvinces(searchTerm: string): Promise<Province[]> {
    const searchPattern = `%${searchTerm.toLowerCase()}%`;
    
    const provinces = await db.select()
      .from(schema.provinces)
      .where(
        or(
          ilike(schema.provinces.name_en, searchPattern),
          ilike(schema.provinces.name_th, `%${searchTerm}%`)
        )
      )
      .orderBy(asc(schema.provinces.name_en));
    
    return provinces;
  }

  /**
   * Get total count of provinces
   */
  async getProvinceCount(): Promise<number> {
    const result = await db.select()
      .from(schema.provinces);
    
    return result.length;
  }

  /**
   * Get provinces with gym counts (for statistics)
   */
  async getProvincesWithGymCounts(): Promise<Array<Province & { gym_count: number }>> {
    const result = await db.select({
      id: schema.provinces.id,
      name_th: schema.provinces.name_th,
      name_en: schema.provinces.name_en,
      gym_count: schema.gyms.id, // This will be aggregated
    })
    .from(schema.provinces)
    .leftJoin(schema.gyms, eq(schema.provinces.id, schema.gyms.province_id))
    .orderBy(asc(schema.provinces.name_en));

    // Group by province and count gyms
    const grouped = result.reduce((acc, row) => {
      const existing = acc.find(p => p.id === row.id);
      if (existing) {
        if (row.gym_count) existing.gym_count++;
      } else {
        acc.push({
          id: row.id,
          name_th: row.name_th,
          name_en: row.name_en,
          gym_count: row.gym_count ? 1 : 0
        });
      }
      return acc;
    }, [] as Array<Province & { gym_count: number }>);

    return grouped;
  }
} 