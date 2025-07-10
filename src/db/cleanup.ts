import { db, pool } from './config';
import * as schema from './schema';
import { sql } from 'drizzle-orm';

/**
 * Deletes data from all tables except 'provinces' and 'admin_users'.
 * Ideal for resetting development data without losing essential lookup tables and admin accounts.
 */
async function cleanupMockData() {
  console.log('🧹 Starting mock data cleanup...');

  try {
    console.log('🗑️ Truncating mock data tables and restarting identity columns...');
    
    // List of tables to truncate. Excludes 'provinces' and 'admin_users'.
    const tableNames = [
      'gym_tags',
      'trainer_tags',
      'trainer_classes',
      'gym_images',
      'trainer_images',
      'trainers',
      'gyms',
      'tags',
      'classes',
      'users', // Assuming 'users' are general users, not admins.
    ].map(name => `"${name}"`).join(', ');

    await db.execute(sql.raw(`TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE;`));

    console.log('✅ Mock data cleanup completed successfully!');
    console.log('🎯 Database is now clean and ready for development seeding.');
    
  } catch (error) {
    console.error('❌ Error during mock data cleanup:', error);
    throw error;
  }
}


/**
 * Performs a full database cleanup, dropping all data from all tables.
 * This is a destructive operation.
 */
async function fullCleanup() {
  console.log('🔥 Starting FULL database cleanup...');

  try {
    console.log('🗑️ Truncating all tables and restarting identity columns...');
    
    const tableNames = [
      'users',
      'admin_users',
      'provinces',
      'classes',
      'tags',
      'gyms',
      'trainers',
      'gym_images',
      'trainer_images',
      'gym_tags',
      'trainer_classes',
      'trainer_tags',
    ].map(name => `"${name}"`).join(', ');

    await db.execute(sql.raw(`TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE;`));

    console.log('✅ Full database cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during full database cleanup:', error);
    throw error;
  }
}

async function main() {
  try {
    const action = process.argv.includes('--full') ? 'full' : 'default';
    
    console.log(`🎬 Starting database cleanup (mode: ${action})...`);
    
    if (action === 'full') {
      await fullCleanup();
    } else {
      await cleanupMockData();
    }
    
    console.log('✅ Database cleanup completed successfully');
  } catch (error: any) {
    console.error('❌ Database cleanup failed:', error);
    process.exit(1);
  } finally {
    if (pool && !(pool as any)._ended) {
      await pool.end();
      console.log('🔒 Database connection pool closed.');
    }
    process.exit(0);
  }
}

// Export for programmatic use
export { cleanupMockData, fullCleanup };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
} 