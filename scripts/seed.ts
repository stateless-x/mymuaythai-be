import { seedData } from '../src/db/seed';
import { disconnectDatabase } from '../src/db/config';

async function main() {
  try {
    console.log('🌱 Starting database seeding...');
    await seedData();
    console.log('✅ Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await disconnectDatabase();
  }
}

main(); 