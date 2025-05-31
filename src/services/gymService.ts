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
import { eq, ilike, and, or, desc, sql, count, SQL } from 'drizzle-orm';

// Helper type for base Gym selected with province
type GymWithProvince = Omit<Gym, 'province_id'> & { // province_id is still there from Gym, but we replace its meaning with the object
    province: Province | null; // Province can be null if leftJoin finds no match
};

export class GymService {
  private mapRawGymToGymWithDetails(rawGymData: any, provinceData: Province | null, images: GymImage[] = [], tags: Tag[] = [], associatedTrainers: Trainer[] = []): GymWithDetails {
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
        images,
        tags,
        associatedTrainers,
    };

    if (provinceData !== null) {
        result.province = provinceData;
    }
    // If provinceData is null, result.province remains undefined, matching province?: Province | null;

    return result;
}

  async getAllGyms(page: number = 1, pageSize: number = 10, searchTerm?: string, provinceId?: number): Promise<{ gyms: GymWithDetails[], total: number }> {
    const offset = (page - 1) * pageSize;
    let whereConditions: (SQL<unknown> | undefined)[] = [eq(schema.gyms.is_active, true)];

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
        provinceData: schema.provinces 
      })
      .from(schema.gyms)
      .leftJoin(schema.provinces, eq(schema.gyms.province_id, schema.provinces.id))
      .where(and(...validWhereConditions))
      .orderBy(desc(schema.gyms.created_at))
      .limit(pageSize)
      .offset(offset);

    const gymsResult = await gymsQuery;

    const totalQuery = db.select({ value: count() })
      .from(schema.gyms)
      .leftJoin(schema.provinces, eq(schema.gyms.province_id, schema.provinces.id))
      .where(and(...validWhereConditions));
    
    const totalResult = await totalQuery;
    const total = totalResult[0]?.value ?? 0;

    const gymsWithDetailsList: GymWithDetails[] = gymsResult.map(g => 
        this.mapRawGymToGymWithDetails(g, g.provinceData as Province | null)
    );

    return { gyms: gymsWithDetailsList, total };
  }

  async getGymById(id: string): Promise<GymWithDetails | null> {
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
        provinceData: schema.provinces 
      })
      .from(schema.gyms)
      .leftJoin(schema.provinces, eq(schema.gyms.province_id, schema.provinces.id))
      .where(and(eq(schema.gyms.id, id), eq(schema.gyms.is_active, true)));

    if (gymsResult.length === 0) {
      return null;
    }
    const rawGymData = gymsResult[0]!; 
    
    const images = await db.select().from(schema.gymImages).where(eq(schema.gymImages.gym_id, id));
    
    const gymTagsRecords = await db.select({ tag_id: schema.gymTags.tag_id }).from(schema.gymTags).where(eq(schema.gymTags.gym_id, id));
    const tagIds = gymTagsRecords.map(gt => gt.tag_id);
    const tags = tagIds.length > 0 
      ? await db.select().from(schema.tags).where(sql`${schema.tags.id} IN ${tagIds}`)
      : [];

    const associatedTrainers = await db.select().from(schema.trainers).where(eq(schema.trainers.gym_id, id));

    return this.mapRawGymToGymWithDetails(rawGymData, rawGymData.provinceData as Province | null, images, tags, associatedTrainers);
  }

  async getGymImages(gymId: string): Promise<GymImage[]> {
    return db.select().from(schema.gymImages).where(eq(schema.gymImages.gym_id, gymId));
  }

  async getGymsByProvince(provinceId: number): Promise<GymWithDetails[]> {
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
        provinceData: schema.provinces
      })
      .from(schema.gyms)
      .leftJoin(schema.provinces, eq(schema.gyms.province_id, schema.provinces.id))
      .where(and(eq(schema.gyms.province_id, provinceId), eq(schema.gyms.is_active, true)))
      .orderBy(desc(schema.gyms.created_at));

      return gymsResult.map(g => 
        this.mapRawGymToGymWithDetails(g, g.provinceData as Province | null)
      );
  }

  async createGym(gymData: CreateGymRequest): Promise<Gym> {
    const result = await db.insert(schema.gyms)
      .values(gymData as NewGym) 
      .returning(); 
    if (!result || result.length === 0) throw new Error('Gym creation failed, no data returned.');
    return result[0]!;
  }

  async updateGym(id: string, gymData: UpdateGymRequest): Promise<Gym | null> {
    if (Object.keys(gymData).length === 0) {
      const currentGym = await this.getGymById(id); 
      return currentGym ? this.mapRawGymToGymWithDetails(currentGym, currentGym.province || null) as Gym : null;
    }
    
    const result = await db.update(schema.gyms)
      .set(gymData) 
      .where(and(eq(schema.gyms.id, id), eq(schema.gyms.is_active, true)))
      .returning();
    return result.length > 0 ? result[0]! : null;
  }

  async deleteGym(id: string): Promise<boolean> {
    const result = await db.update(schema.gyms)
      .set({ is_active: false }) 
      .where(and(eq(schema.gyms.id, id), eq(schema.gyms.is_active, true)))
      .returning({ id: schema.gyms.id }); 
    return result.length > 0;
  }

  async addGymImage(gymId: string, imageUrl: string): Promise<GymImage> {
    const newImageData: NewGymImage = {
        gym_id: gymId, 
        image_url: imageUrl,
    };
    const result = await db.insert(schema.gymImages)
      .values(newImageData)
      .returning();
    if (!result || result.length === 0) throw new Error('Gym image creation failed.');
    return result[0]!;
  }

  async removeGymImage(imageId: string): Promise<boolean> {
    const result = await db.delete(schema.gymImages)
      .where(eq(schema.gymImages.id, imageId))
      .returning({ id: schema.gymImages.id });
    return result.length > 0;
  }

  async searchGyms(searchTerm: string, page: number = 1, pageSize: number = 10): Promise<{ gyms: GymWithDetails[], total: number }> {
    const offset = (page - 1) * pageSize;
    const searchPattern = `%${searchTerm.toLowerCase()}%`;

    const whereConditions: (SQL<unknown> | undefined)[] = [
        eq(schema.gyms.is_active, true),
        or(
            ilike(schema.gyms.name_th, searchPattern),
            ilike(schema.gyms.name_en, searchPattern),
            ilike(schema.gyms.description_th, searchPattern),
            ilike(schema.gyms.description_en, searchPattern),
            ilike(schema.provinces.name_th, searchPattern),
            ilike(schema.provinces.name_en, searchPattern)
        )
    ];
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
        provinceData: schema.provinces
    })
    .from(schema.gyms)
    .leftJoin(schema.provinces, eq(schema.gyms.province_id, schema.provinces.id))
    .where(and(...validWhereConditions))
    .orderBy(desc(schema.gyms.created_at))
    .limit(pageSize)
    .offset(offset);

    const gymsResult = await gymsQuery;

    const totalQuery = db.select({ value: count() })
      .from(schema.gyms)
      .leftJoin(schema.provinces, eq(schema.gyms.province_id, schema.provinces.id))
      .where(and(...validWhereConditions));
      
    const totalResult = await totalQuery;
    const total = totalResult[0]?.value ?? 0;

    const gymsWithDetailsList: GymWithDetails[] = gymsResult.map(g => 
        this.mapRawGymToGymWithDetails(g, g.provinceData as Province | null)
    );

    return { gyms: gymsWithDetailsList, total };
  }
} 