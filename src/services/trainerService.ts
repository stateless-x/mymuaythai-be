import { pool } from '../db/config';
import { Trainer, CreateTrainerRequest } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class TrainerService {
  async getAllTrainers(): Promise<Trainer[]> {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT t.*, 
               p.name_en as province_name,
               g.name_en as gym_name
        FROM trainers t 
        LEFT JOIN provinces p ON t.province_id = p.id 
        LEFT JOIN gyms g ON t.gym_id = g.id
        WHERE t.is_active = true 
        ORDER BY t.created_at DESC
      `);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async getTrainerById(id: string): Promise<Trainer | null> {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT t.*, 
               p.name_en as province_name,
               g.name_en as gym_name
        FROM trainers t 
        LEFT JOIN provinces p ON t.province_id = p.id 
        LEFT JOIN gyms g ON t.gym_id = g.id
        WHERE t.id = $1 AND t.is_active = true
      `, [id]);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  async getTrainersByGym(gymId: string): Promise<Trainer[]> {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT t.*, 
               p.name_en as province_name,
               g.name_en as gym_name
        FROM trainers t 
        LEFT JOIN provinces p ON t.province_id = p.id 
        LEFT JOIN gyms g ON t.gym_id = g.id
        WHERE t.gym_id = $1 AND t.is_active = true 
        ORDER BY t.created_at DESC
      `, [gymId]);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async getTrainersByProvince(provinceId: number): Promise<Trainer[]> {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT t.*, 
               p.name_en as province_name,
               g.name_en as gym_name
        FROM trainers t 
        LEFT JOIN provinces p ON t.province_id = p.id 
        LEFT JOIN gyms g ON t.gym_id = g.id
        WHERE t.province_id = $1 AND t.is_active = true 
        ORDER BY t.created_at DESC
      `, [provinceId]);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async getFreelanceTrainers(): Promise<Trainer[]> {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT t.*, 
               p.name_en as province_name
        FROM trainers t 
        LEFT JOIN provinces p ON t.province_id = p.id 
        WHERE t.is_freelance = true AND t.is_active = true 
        ORDER BY t.created_at DESC
      `);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async getTrainerClasses(trainerId: string): Promise<any[]> {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT c.* 
        FROM classes c
        JOIN trainer_classes tc ON c.id = tc.class_id
        WHERE tc.trainer_id = $1
        ORDER BY c.name_en
      `, [trainerId]);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async createTrainer(trainerData: CreateTrainerRequest): Promise<Trainer> {
    const client = await pool.connect();
    try {
      const id = uuidv4();
      const result = await client.query(`
        INSERT INTO trainers (
          id, first_name_th, last_name_th, first_name_en, last_name_en, 
          bio_th, bio_en, phone, email, line, is_freelance, gym_id, province_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
        RETURNING *
      `, [
        id, trainerData.first_name_th, trainerData.last_name_th,
        trainerData.first_name_en, trainerData.last_name_en,
        trainerData.bio_th, trainerData.bio_en, trainerData.phone,
        trainerData.email, trainerData.line, trainerData.is_freelance,
        trainerData.gym_id, trainerData.province_id
      ]);
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async updateTrainer(id: string, trainerData: Partial<CreateTrainerRequest>): Promise<Trainer | null> {
    const client = await pool.connect();
    try {
      const setClause = Object.keys(trainerData)
        .map((key, index) => `${key} = $${index + 2}`)
        .join(', ');
      
      const values = [id, ...Object.values(trainerData)];
      
      const result = await client.query(`
        UPDATE trainers SET ${setClause} 
        WHERE id = $1 AND is_active = true 
        RETURNING *
      `, values);
      
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  async deleteTrainer(id: string): Promise<boolean> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'UPDATE trainers SET is_active = false WHERE id = $1 AND is_active = true',
        [id]
      );
      return result.rowCount !== null && result.rowCount > 0;
    } finally {
      client.release();
    }
  }

  async addTrainerClass(trainerId: string, classId: string): Promise<boolean> {
    const client = await pool.connect();
    try {
      const id = uuidv4();
      await client.query(
        'INSERT INTO trainer_classes (id, trainer_id, class_id) VALUES ($1, $2, $3)',
        [id, trainerId, classId]
      );
      return true;
    } catch (error) {
      // Handle unique constraint violation gracefully
      return false;
    } finally {
      client.release();
    }
  }

  async removeTrainerClass(trainerId: string, classId: string): Promise<boolean> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'DELETE FROM trainer_classes WHERE trainer_id = $1 AND class_id = $2',
        [trainerId, classId]
      );
      return result.rowCount !== null && result.rowCount > 0;
    } finally {
      client.release();
    }
  }

  async searchTrainers(query: string): Promise<Trainer[]> {
    const client = await pool.connect();
    try {
      const searchQuery = `%${query.toLowerCase()}%`;
      const result = await client.query(`
        SELECT t.*, 
               p.name_en as province_name,
               g.name_en as gym_name
        FROM trainers t 
        LEFT JOIN provinces p ON t.province_id = p.id 
        LEFT JOIN gyms g ON t.gym_id = g.id
        WHERE t.is_active = true AND (
          LOWER(t.first_name_th) LIKE $1 OR 
          LOWER(t.last_name_th) LIKE $1 OR 
          LOWER(t.first_name_en) LIKE $1 OR 
          LOWER(t.last_name_en) LIKE $1 OR 
          LOWER(t.bio_th) LIKE $1 OR 
          LOWER(t.bio_en) LIKE $1 OR
          LOWER(p.name_th) LIKE $1 OR
          LOWER(p.name_en) LIKE $1 OR
          LOWER(g.name_th) LIKE $1 OR
          LOWER(g.name_en) LIKE $1
        )
        ORDER BY t.created_at DESC
      `, [searchQuery]);
      return result.rows;
    } finally {
      client.release();
    }
  }
} 