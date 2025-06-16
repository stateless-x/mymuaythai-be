import { db, pool } from './config';
import * as schema from './schema';
import { sql } from 'drizzle-orm';

async function cleanupAllData() {
  console.log('🧹 Starting database cleanup...');

  try {
    console.log('🗑️ Truncating all tables and restarting identity columns...');
    
    // Using TRUNCATE to delete all data and reset sequences for serial columns.
    // CASCADE will also truncate dependent tables.
    const tableNames = [
      'users',
      'provinces',
      'classes',
      'tags',
      'gyms',
      'trainers',
      'gym_images',
      'gym_tags',
      'trainer_classes',
      'trainer_tags',
    ].map(name => `"${name}"`).join(', ');

    await db.execute(sql.raw(`TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE;`));

    console.log('✅ Database cleanup completed successfully!');
    console.log('🎯 Database is now clean and ready for production deployment.');
    
  } catch (error) {
    console.error('❌ Error during database cleanup:', error);
    throw error;
  } finally {
    // Close the database connection pool
    if (pool && !(pool as any)._ended) {
      await pool.end();
      console.log('🔒 Database connection pool closed.');
    }
  }
}

async function dropAllIndexes() {
  console.log('🗑️ Dropping all performance indexes...');
  
  try {
    const indexNames = [
      'idx_gyms_province_id',
      'idx_gyms_is_active',
      'idx_gyms_created_at',
      'idx_gyms_name_search',
      'idx_trainers_gym_id',
      'idx_trainers_province_id',
      'idx_trainers_is_active',
      'idx_trainers_is_freelance',
      'idx_trainers_created_at',
      'idx_trainers_name_search',
      'idx_gym_tags_gym_id',
      'idx_gym_tags_tag_id',
      'idx_trainer_tags_trainer_id',
      'idx_trainer_tags_tag_id',
      'idx_trainer_classes_trainer_id',
      'idx_trainer_classes_class_id',
      'idx_gym_images_gym_id',
      'idx_gyms_active_province',
      'idx_trainers_active_gym',
      'idx_trainers_active_province',
      'idx_trainers_freelance_active'
    ];

    for (const indexName of indexNames) {
      try {
        await db.execute(sql.raw(`DROP INDEX IF EXISTS ${indexName};`));
        console.log(`  ✅ Dropped index: ${indexName}`);
      } catch (err) {
        console.log(`  ⚠️ Could not drop index ${indexName}:`, err);
      }
    }

    console.log('✅ All indexes dropped successfully!');
  } catch (error) {
    console.error('❌ Error dropping indexes:', error);
    throw error;
  }
}

async function fullCleanup() {
  console.log('🔥 Starting FULL database cleanup (data + indexes)...');
  
  try {
    await dropAllIndexes();
    await cleanupAllData();
    console.log('✅ Full cleanup completed successfully!');
  } catch (error) {
    console.error('❌ Full cleanup failed:', error);
    throw error;
  }
}

async function main() {
  try {
    const action = process.argv[2] || 'data';
    
    console.log(`Starting database cleanup (${action})...`);
    
    switch (action) {
      case 'full':
        await fullCleanup();
        break;
      case 'indexes':
        await dropAllIndexes();
        break;
      case 'data':
      default:
        await cleanupAllData();
        break;
    }
    
    console.log('✅ Database cleanup completed successfully');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Database cleanup failed:', error);
    process.exit(1);
  }
}

// Export for programmatic use
export { cleanupAllData as cleanup, dropAllIndexes, fullCleanup };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
} 