import { runMigration } from '../src/db/migrate';
import { disconnectDatabase } from '../src/db/config';

async function main() {
  try {
    console.log('🚀 Running database migration...');
    await runMigration();
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await disconnectDatabase();
  }
}

main(); 