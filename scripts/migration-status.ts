import { MigrationRunner } from '../src/db/migrationRunner';
import { connectDatabase, disconnectDatabase } from '../src/db/config';

async function main() {
  try {
    await connectDatabase();
    const runner = new MigrationRunner();
    await runner.getMigrationStatus();
  } catch (error) {
    console.error('❌ Failed to get migration status:', error);
    process.exit(1);
  } finally {
    await disconnectDatabase();
  }
}

main(); 