import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Environment validation with better error messages
const requiredEnvVars = {
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_NAME: process.env.DB_NAME,
};

const missingVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key, _]) => key);

if (missingVars.length > 0) {
  throw new Error(
    `Missing required database environment variables: ${missingVars.join(', ')}\n` +
    'Please create a .env file based on env.example and set all required values.'
  );
}

// Validate DB_PORT is a number
const dbPort = parseInt(process.env.DB_PORT!, 10);
if (isNaN(dbPort)) {
  throw new Error('DB_PORT must be a valid number');
}

export const pool = new Pool({
  host: process.env.DB_HOST!,
  port: dbPort,
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  database: process.env.DB_NAME!,
  // Add connection pool configuration
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
});

export const db = drizzle(pool, { schema });

// No need for connectDatabase and disconnectDatabase with Drizzle's approach typically,
// as connections are managed per-query or via a long-lived pool.
// If explicit connection management is needed for scripts, it can be handled differently.

export async function checkDatabaseConnection(): Promise<void> {
  try {
    // Perform a simple query to check the connection
    await db.select({ count: schema.provinces.id }).from(schema.provinces).limit(1);
    console.log('✅ Successfully connected to the database and performed a query.');
  } catch (error) {
    console.error('❌ Failed to connect to the database or perform a query:', error);
    throw error;
  }
} 