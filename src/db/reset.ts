import { runMigration } from './migrate';
import { seedData } from './seed';
import { connectDatabase, disconnectDatabase } from './config';

export const resetDatabase = async (shouldDisconnect: boolean = true): Promise<void> => {
  try {
    console.log('🔄 Starting database reset...');
    
    // Test connection first
    await connectDatabase();
    
    // Run migration (this will drop and recreate all tables)
    await runMigration();
    
    // Seed the database with sample data
    await seedData();
    
    console.log('✅ Database reset completed successfully!');
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    throw error;
  } finally {
    if (shouldDisconnect) {
      await disconnectDatabase();
    }
  }
}; 