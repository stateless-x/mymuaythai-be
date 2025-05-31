import { db, pool } from './config';
import * as schema from './schema';

export async function cleanupAllData() {
  console.log('🧹 Starting database cleanup...');

  try {
    console.log('🗑️ Deleting all data from tables (respecting foreign key constraints)...');
    
    // Order of deletion matters due to foreign key constraints
    // Start with junction tables and tables that reference others
    
    console.log('   - Clearing trainer tags...');
    await db.delete(schema.trainerTags);
    
    console.log('   - Clearing trainer classes...');
    await db.delete(schema.trainerClasses);
    
    console.log('   - Clearing gym tags...');
    await db.delete(schema.gymTags);
    
    console.log('   - Clearing gym images...');
    await db.delete(schema.gymImages);
    
    // Then clear main entity tables
    console.log('   - Clearing trainers...');
    await db.delete(schema.trainers);
    
    console.log('   - Clearing gyms...');
    await db.delete(schema.gyms);
    
    console.log('   - Clearing tags...');
    await db.delete(schema.tags);
    
    console.log('   - Clearing classes...');
    await db.delete(schema.classes);
    
    console.log('   - Clearing provinces...');
    await db.delete(schema.provinces);
    
    console.log('   - Clearing users...');
    await db.delete(schema.users);

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

// Allow script to be run directly
if (require.main === module) {
  cleanupAllData()
    .then(() => {
      console.log('🎉 Cleanup script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Cleanup script failed:', error);
      process.exit(1);
    });
} 