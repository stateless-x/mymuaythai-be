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

async function main() {
  try {
    console.log('Starting database cleanup...');
    
    // Drop all data but keep structure
    await cleanupAllData();
    
    console.log('✅ Database cleanup completed successfully');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Database cleanup failed:', error);
    process.exit(1);
  }
}

// Export for programmatic use
export { cleanupAllData as cleanup };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
} 