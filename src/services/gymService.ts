import { pool } from '../db/config';
import { Gym, CreateGymRequest, GymImage } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class GymService {
  async getAllGyms(): Promise<Gym[]> {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT g.*, p.name_en as province_name 
        FROM gyms g 
        LEFT JOIN provinces p ON g.province_id = p.id 
        WHERE g.is_active = true 
        ORDER BY g.created_at DESC
      `);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async getGymById(id: string): Promise<Gym | null> {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT g.*, p.name_en as province_name 
        FROM gyms g 
        LEFT JOIN provinces p ON g.province_id = p.id 
        WHERE g.id = $1 AND g.is_active = true
      `, [id]);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  async getGymImages(gymId: string): Promise<GymImage[]> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM gym_images WHERE gym_id = $1 ORDER BY created_at ASC',
        [gymId]
      );
      return result.rows;
    } finally {
      client.release();
    }
  }

  async getGymsByProvince(provinceId: number): Promise<Gym[]> {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT g.*, p.name_en as province_name 
        FROM gyms g 
        LEFT JOIN provinces p ON g.province_id = p.id 
        WHERE g.province_id = $1 AND g.is_active = true 
        ORDER BY g.created_at DESC
      `, [provinceId]);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async createGym(gymData: CreateGymRequest): Promise<Gym> {
    const client = await pool.connect();
    try {
      const id = uuidv4();
      const result = await client.query(`
        INSERT INTO gyms (
          id, name_th, name_en, description_th, description_en, 
          phone, email, province_id, map_url, youtube_url, line
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
        RETURNING *
      `, [
        id, gymData.name_th, gymData.name_en, gymData.description_th,
        gymData.description_en, gymData.phone, gymData.email,
        gymData.province_id, gymData.map_url, gymData.youtube_url, gymData.line
      ]);
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async updateGym(id: string, gymData: Partial<CreateGymRequest>): Promise<Gym | null> {
    const client = await pool.connect();
    try {
      const setClause = Object.keys(gymData)
        .map((key, index) => `${key} = $${index + 2}`)
        .join(', ');
      
      const values = [id, ...Object.values(gymData)];
      
      const result = await client.query(`
        UPDATE gyms SET ${setClause} 
        WHERE id = $1 AND is_active = true 
        RETURNING *
      `, values);
      
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  async deleteGym(id: string): Promise<boolean> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'UPDATE gyms SET is_active = false WHERE id = $1 AND is_active = true',
        [id]
      );
      return result.rowCount !== null && result.rowCount > 0;
    } finally {
      client.release();
    }
  }

  async addGymImage(gymId: string, imageUrl: string): Promise<GymImage> {
    const client = await pool.connect();
    try {
      const id = uuidv4();
      const result = await client.query(
        'INSERT INTO gym_images (id, gym_id, image_url) VALUES ($1, $2, $3) RETURNING *',
        [id, gymId, imageUrl]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async removeGymImage(imageId: string): Promise<boolean> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'DELETE FROM gym_images WHERE id = $1',
        [imageId]
      );
      return result.rowCount !== null && result.rowCount > 0;
    } finally {
      client.release();
    }
  }

  async searchGyms(query: string): Promise<Gym[]> {
    const client = await pool.connect();
    try {
      const searchQuery = `%${query.toLowerCase()}%`;
      const result = await client.query(`
        SELECT g.*, p.name_en as province_name 
        FROM gyms g 
        LEFT JOIN provinces p ON g.province_id = p.id 
        WHERE g.is_active = true AND (
          LOWER(g.name_th) LIKE $1 OR 
          LOWER(g.name_en) LIKE $1 OR 
          LOWER(g.description_th) LIKE $1 OR 
          LOWER(g.description_en) LIKE $1 OR
          LOWER(p.name_th) LIKE $1 OR
          LOWER(p.name_en) LIKE $1
        )
        ORDER BY g.created_at DESC
      `, [searchQuery]);
      return result.rows;
    } finally {
      client.release();
    }
  }
} 