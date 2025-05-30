import { Pool, PoolConfig } from 'pg';

// Database configuration
const dbConfig: PoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'muaythai_dev',
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'admin',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Create the database connection pool
export const pool = new Pool(dbConfig);

// Track if pool is ended
let isPoolEnded = false;

// Test database connection
export const connectDatabase = async (): Promise<void> => {
  try {
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    client.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
};

// Close database connection
export const disconnectDatabase = async (): Promise<void> => {
  try {
    if (!isPoolEnded) {
      await pool.end();
      isPoolEnded = true;
      console.log('✅ Database disconnected successfully');
    }
  } catch (error) {
    console.error('❌ Database disconnection failed:', error);
    throw error;
  }
};

// Reset pool state (for testing)
export const resetPoolState = (): void => {
  isPoolEnded = false;
}; 