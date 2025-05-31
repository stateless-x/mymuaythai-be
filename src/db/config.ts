import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as schema from './schema';

dotenv.config(); // Load environment variables from .env file

if (!process.env.DB_HOST || !process.env.DB_PORT || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
  throw new Error('Missing required database environment variables');
}

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

export const db = drizzle(pool, { schema });

// No need for connectDatabase and disconnectDatabase with Drizzle's approach typically,
// as connections are managed per-query or via a long-lived pool.
// If explicit connection management is needed for scripts, it can be handled differently.

export async function checkDatabaseConnection(): Promise<void> {
  try {
    // Perform a simple query to check the connection
    await db.select({ count: schema.provinces.id }).from(schema.provinces).limit(1);
    console.log('Successfully connected to the database and performed a query.');
  } catch (error) {
    console.error('Failed to connect to the database or perform a query:', error);
    throw error; // Re-throw the error to indicate failure
  }
} 