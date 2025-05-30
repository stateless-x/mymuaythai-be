import { pool } from '../config';

export const up = async (): Promise<void> => {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Running migration 001: Initial Schema...');
    
    // Enable UUID extension (safe to run multiple times)
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    // Create users table (only if it doesn't exist)
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
        email TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create provinces table
    await client.query(`
      CREATE TABLE IF NOT EXISTS provinces (
        id SERIAL PRIMARY KEY,
        name_th TEXT NOT NULL,
        name_en TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create gyms table
    await client.query(`
      CREATE TABLE IF NOT EXISTS gyms (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name_th TEXT NOT NULL,
        name_en TEXT NOT NULL,
        description_th TEXT,
        description_en TEXT,
        phone TEXT,
        email TEXT,
        province_id INTEGER REFERENCES provinces(id) ON DELETE SET NULL,
        map_url TEXT,
        youtube_url TEXT,
        line TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create gym_images table
    await client.query(`
      CREATE TABLE IF NOT EXISTS gym_images (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
        image_url TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create trainers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS trainers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        first_name_th TEXT NOT NULL,
        last_name_th TEXT NOT NULL,
        first_name_en TEXT NOT NULL,
        last_name_en TEXT NOT NULL,
        bio_th TEXT,
        bio_en TEXT,
        phone TEXT,
        email TEXT,
        line TEXT,
        is_freelance BOOLEAN DEFAULT false,
        gym_id UUID REFERENCES gyms(id) ON DELETE SET NULL,
        province_id INTEGER REFERENCES provinces(id) ON DELETE SET NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create classes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS classes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name_th TEXT NOT NULL,
        name_en TEXT NOT NULL,
        description_th TEXT,
        description_en TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create trainer_classes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS trainer_classes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        trainer_id UUID REFERENCES trainers(id) ON DELETE CASCADE,
        class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(trainer_id, class_id)
      )
    `);

    // Create tags table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tags (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name_th TEXT NOT NULL,
        name_en TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create gym_tags table
    await client.query(`
      CREATE TABLE IF NOT EXISTS gym_tags (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
        tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(gym_id, tag_id)
      )
    `);

    // Create trainer_tags table
    await client.query(`
      CREATE TABLE IF NOT EXISTS trainer_tags (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        trainer_id UUID REFERENCES trainers(id) ON DELETE CASCADE,
        tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(trainer_id, tag_id)
      )
    `);

    // Create migration history table
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        migration_name TEXT NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance (safe to create multiple times)
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_gyms_province_id ON gyms(province_id)',
      'CREATE INDEX IF NOT EXISTS idx_gyms_is_active ON gyms(is_active)',
      'CREATE INDEX IF NOT EXISTS idx_trainers_gym_id ON trainers(gym_id)',
      'CREATE INDEX IF NOT EXISTS idx_trainers_province_id ON trainers(province_id)',
      'CREATE INDEX IF NOT EXISTS idx_trainers_is_active ON trainers(is_active)',
      'CREATE INDEX IF NOT EXISTS idx_trainers_is_freelance ON trainers(is_freelance)',
      'CREATE INDEX IF NOT EXISTS idx_gym_images_gym_id ON gym_images(gym_id)',
      'CREATE INDEX IF NOT EXISTS idx_trainer_classes_trainer_id ON trainer_classes(trainer_id)',
      'CREATE INDEX IF NOT EXISTS idx_trainer_classes_class_id ON trainer_classes(class_id)',
      'CREATE INDEX IF NOT EXISTS idx_gym_tags_gym_id ON gym_tags(gym_id)',
      'CREATE INDEX IF NOT EXISTS idx_gym_tags_tag_id ON gym_tags(tag_id)',
      'CREATE INDEX IF NOT EXISTS idx_trainer_tags_trainer_id ON trainer_tags(trainer_id)',
      'CREATE INDEX IF NOT EXISTS idx_trainer_tags_tag_id ON trainer_tags(tag_id)'
    ];

    for (const indexQuery of indexes) {
      await client.query(indexQuery);
    }

    // Record this migration as completed
    await client.query(`
      INSERT INTO migrations (migration_name) 
      VALUES ('001_initial_schema') 
      ON CONFLICT (migration_name) DO NOTHING
    `);

    console.log('✅ Migration 001 completed successfully!');
  } catch (error) {
    console.error('❌ Migration 001 failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

export const down = async (): Promise<void> => {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Rolling back migration 001...');
    
    // Drop tables in reverse order of dependencies
    const dropQueries = [
      'DROP TABLE IF EXISTS trainer_tags CASCADE',
      'DROP TABLE IF EXISTS gym_tags CASCADE', 
      'DROP TABLE IF EXISTS trainer_classes CASCADE',
      'DROP TABLE IF EXISTS gym_images CASCADE',
      'DROP TABLE IF EXISTS trainers CASCADE',
      'DROP TABLE IF EXISTS gyms CASCADE',
      'DROP TABLE IF EXISTS tags CASCADE',
      'DROP TABLE IF EXISTS classes CASCADE',
      'DROP TABLE IF EXISTS provinces CASCADE',
      'DROP TABLE IF EXISTS users CASCADE'
    ];

    for (const query of dropQueries) {
      await client.query(query);
    }

    // Remove migration record
    await client.query(`DELETE FROM migrations WHERE migration_name = '001_initial_schema'`);

    console.log('✅ Migration 001 rollback completed!');
  } catch (error) {
    console.error('❌ Migration 001 rollback failed:', error);
    throw error;
  } finally {
    client.release();
  }
}; 