import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, pool } from './config';

async function runDbMigrations() {
  console.log('Running database migrations...');
  try {
    // Ensure the pool is connected before migrating, though Drizzle typically handles this.
    // For scripts, explicit connection can be more robust.
    const client = await pool.connect();
    try {
      await migrate(db, { migrationsFolder: './src/db/migrations' });
      console.log('✅ Migrations completed successfully.');
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Error running migrations:', error);
    process.exit(1);
  } finally {
    // It's important to close the pool when the script is done to allow the process to exit.
    await pool.end();
    console.log('Database pool closed.');
  }
}

runDbMigrations(); 