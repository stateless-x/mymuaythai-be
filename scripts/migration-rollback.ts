import { MigrationRunner } from '../src/db/migrationRunner';
import { connectDatabase, disconnectDatabase } from '../src/db/config';

async function main() {
  try {
    await connectDatabase();
    const runner = new MigrationRunner();
    await runner.rollbackLastMigration();
  } catch (error) {
    console.error('❌ Failed to rollback migration:', error);
    process.exit(1);
  } finally {
    await disconnectDatabase();
  }
}

main(); 