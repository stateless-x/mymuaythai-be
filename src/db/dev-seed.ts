import { db, pool } from './config';
import * as schema from './schema';
import type { NewProvince, NewClass, NewTag, NewUser } from '../types';

export async function seedDevData() {
  console.log('🌱 Starting development data setup...');

  try {
    console.log('🏗️ Setting up essential data for development...');

    // 1. Seed Essential Provinces (key cities for development)
    console.log('🌍 Seeding essential provinces...');
    const provincesData: NewProvince[] = [
      { name_th: 'กรุงเทพมหานคร', name_en: 'Bangkok' },
      { name_th: 'เชียงใหม่', name_en: 'Chiang Mai' },
      { name_th: 'ภูเก็ต', name_en: 'Phuket' },
      { name_th: 'ชลบุรี', name_en: 'Chon Buri' },
      { name_th: 'สุราษฎร์ธานี', name_en: 'Surat Thani' },
    ];
    const insertedProvinces = await db.insert(schema.provinces).values(provincesData).returning();
    console.log(`✅ Seeded ${insertedProvinces.length} essential provinces.`);

    // 2. Seed Development Users
    console.log('👤 Seeding development users...');
    const usersData: NewUser[] = [
      { email: 'admin@mymuaythai.dev', role: 'admin' },
      { email: 'dev@mymuaythai.dev', role: 'user' },
      { email: 'test@mymuaythai.dev', role: 'user' },
    ];
    const insertedUsers = await db.insert(schema.users).values(usersData).returning();
    console.log(`✅ Seeded ${insertedUsers.length} development users.`);

    // 3. Seed Essential Classes
    console.log('🥊 Seeding essential classes...');
    const classesData: NewClass[] = [
      { name_th: 'มวยไทยพื้นฐาน', name_en: 'Basic Muay Thai', description_th: 'เรียนรู้พื้นฐานมวยไทย', description_en: 'Learn the basics of Muay Thai' },
      { name_th: 'มวยไทยขั้นสูง', name_en: 'Advanced Muay Thai', description_th: 'สำหรับผู้มีประสบการณ์', description_en: 'For experienced practitioners' },
      { name_th: 'มวยไทยสำหรับเด็ก', name_en: 'Muay Thai for Kids', description_th: 'สอนมวยไทยให้เด็กๆ', description_en: 'Muay Thai classes for children' },
      { name_th: 'คาร์ดิโอ มวยไทย', name_en: 'Cardio Muay Thai', description_th: 'มวยไทยเพื่อการออกกำลังกาย', description_en: 'Muay Thai for fitness' },
    ];
    const insertedClasses = await db.insert(schema.classes).values(classesData).returning();
    console.log(`✅ Seeded ${insertedClasses.length} essential classes.`);

    // 4. Seed Essential Tags
    console.log('🏷️ Seeding essential tags...');
    const tagsData: NewTag[] = [
      { name_th: 'เหมาะสำหรับผู้เริ่มต้น', name_en: 'Beginner Friendly' },
      { name_th: 'สำหรับมือโปร', name_en: 'For Professionals' },
      { name_th: 'บรรยากาศดี', name_en: 'Good Atmosphere' },
      { name_th: 'อุปกรณ์ครบครัน', name_en: 'Fully Equipped' },
      { name_th: 'สอนภาษาอังกฤษ', name_en: 'English Speaking' },
    ];
    const insertedTags = await db.insert(schema.tags).values(tagsData).returning();
    console.log(`✅ Seeded ${insertedTags.length} essential tags.`);

    console.log('🎉 Development data setup completed successfully!');
    console.log('💡 You can now create gyms and trainers using the API or additional seed scripts.');
    
  } catch (error) {
    console.error('❌ Error setting up development data:', error);
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
  seedDevData()
    .then(() => {
      console.log('🎉 Development setup script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Development setup script failed:', error);
      process.exit(1);
    });
} 