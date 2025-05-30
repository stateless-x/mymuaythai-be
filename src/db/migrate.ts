import { MigrationRunner } from './migrationRunner';
import { connectDatabase } from './config';

export const runMigration = async (): Promise<void> => {
  try {
    await connectDatabase();
    const runner = new MigrationRunner();
    await runner.runMigrations();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}; 