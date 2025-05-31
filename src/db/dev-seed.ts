import { db, pool } from './config';
import * as schema from './schema';
import type { NewProvince, NewClass, NewTag, NewUser, NewGym, NewTrainer } from '../types';

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
    const insertedProvinces = await db.insert(schema.provinces).values(provincesData).onConflictDoNothing().returning();
    console.log(`✅ Seeded ${insertedProvinces.length} essential provinces.`);

    // 2. Seed Development Users
    console.log('👤 Seeding development users...');
    const usersData: NewUser[] = [
      { email: 'admin@mymuaythai.dev', role: 'admin' },
      { email: 'dev@mymuaythai.dev', role: 'user' },
      { email: 'test@mymuaythai.dev', role: 'user' },
    ];
    const insertedUsers = await db.insert(schema.users).values(usersData).onConflictDoNothing().returning();
    console.log(`✅ Seeded ${insertedUsers.length} development users.`);

    // 3. Seed Essential Classes
    console.log('🥊 Seeding essential classes...');
    const classesData: NewClass[] = [
      { name_th: 'มวยไทยพื้นฐาน', name_en: 'Basic Muay Thai', description_th: 'เรียนรู้พื้นฐานมวยไทย', description_en: 'Learn the basics of Muay Thai' },
      { name_th: 'มวยไทยขั้นสูง', name_en: 'Advanced Muay Thai', description_th: 'สำหรับผู้มีประสบการณ์', description_en: 'For experienced practitioners' },
      { name_th: 'มวยไทยสำหรับเด็ก', name_en: 'Muay Thai for Kids', description_th: 'สอนมวยไทยให้เด็กๆ', description_en: 'Muay Thai classes for children' },
      { name_th: 'คาร์ดิโอ มวยไทย', name_en: 'Cardio Muay Thai', description_th: 'มวยไทยเพื่อการออกกำลังกาย', description_en: 'Muay Thai for fitness' },
    ];
    const insertedClasses = await db.insert(schema.classes).values(classesData).onConflictDoNothing().returning();
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
    const insertedTags = await db.insert(schema.tags).values(tagsData).onConflictDoNothing().returning();
    console.log(`✅ Seeded ${insertedTags.length} essential tags.`);

    // 5. Seed Sample Gyms
    console.log('🏟️ Seeding sample gyms...');
    const gymsData: NewGym[] = [
      {
        name_th: 'เดฟ มวยไทย ยิม',
        name_en: 'Dev Muay Thai Gym',
        description_th: 'ยิมมวยไทยสำหรับการพัฒนาระบบ',
        description_en: 'Muay Thai gym for development testing',
        phone: '02-xxx-xxxx',
        email: 'contact@devmuaythaigym.com',
        province_id: 1, // Bangkok
        map_url: 'https://maps.google.com/?q=Dev+Muay+Thai+Gym',
        youtube_url: 'https://youtube.com/devmuaythaigym',
        line_id: '@devmuaythaigym',
        is_active: true,
      },
      {
        name_th: 'เทสต์ ไฟท์ คลับ',
        name_en: 'Test Fight Club',
        description_th: 'สโมสรมวยไทยสำหรับทดสอบระบบ',
        description_en: 'Muay Thai club for system testing',
        phone: '02-yyy-yyyy',
        email: 'info@testfightclub.com',
        province_id: 2, // Chiang Mai
        map_url: 'https://maps.google.com/?q=Test+Fight+Club',
        youtube_url: null,
        line_id: '@testfightclub',
        is_active: true,
      },
    ];
    const insertedGyms = await db.insert(schema.gyms).values(gymsData).onConflictDoNothing().returning();
    console.log(`✅ Seeded ${insertedGyms.length} sample gyms.`);

    // 6. Seed Sample Trainers
    console.log('👨‍🏫 Seeding sample trainers...');
    const trainersData: NewTrainer[] = [
      {
        first_name_th: 'เดฟ',
        first_name_en: 'Dev',
        last_name_th: 'ครูมวย',
        last_name_en: 'Trainer',
        bio_th: 'ครูมวยไทยสำหรับการพัฒนาระบบ',
        bio_en: 'Muay Thai trainer for development testing',
        phone: '081-xxx-xxxx',
        email: 'dev.trainer@example.com',
        line_id: '@devtrainer',
        is_freelance: false,
        gym_id: insertedGyms[0]?.id || null,
        province_id: 1,
        is_active: true,
      },
      {
        first_name_th: 'เทสต์',
        first_name_en: 'Test',
        last_name_th: 'อาจารย์',
        last_name_en: 'Instructor',
        bio_th: 'อาจารย์มวยไทยสำหรับทดสอบระบบ',
        bio_en: 'Muay Thai instructor for system testing',
        phone: '081-yyy-yyyy',
        email: 'test.instructor@example.com',
        line_id: '@testinstructor',
        is_freelance: true,
        gym_id: null,
        province_id: 2,
        is_active: true,
      },
    ];
    const insertedTrainers = await db.insert(schema.trainers).values(trainersData).onConflictDoNothing().returning();
    console.log(`✅ Seeded ${insertedTrainers.length} sample trainers.`);

    // 7. Create relationships
    console.log('🔗 Creating sample relationships...');
    
    // Only create relationships if we have the necessary data
    if (insertedGyms.length >= 2 && insertedTags.length >= 3) {
      // Gym-Tag relationships
      await db.insert(schema.gymTags).values([
        { gym_id: insertedGyms[0]!.id, tag_id: insertedTags[0]!.id },
        { gym_id: insertedGyms[0]!.id, tag_id: insertedTags[2]!.id },
        { gym_id: insertedGyms[1]!.id, tag_id: insertedTags[1]!.id },
      ]).onConflictDoNothing();
    }

    if (insertedTrainers.length >= 2 && insertedClasses.length >= 4) {
      // Trainer-Class relationships
      await db.insert(schema.trainerClasses).values([
        { trainer_id: insertedTrainers[0]!.id, class_id: insertedClasses[0]!.id },
        { trainer_id: insertedTrainers[0]!.id, class_id: insertedClasses[3]!.id },
        { trainer_id: insertedTrainers[1]!.id, class_id: insertedClasses[1]!.id },
      ]).onConflictDoNothing();
    }

    console.log('✅ Sample relationships created successfully.');

    console.log('🎉 Development data setup completed successfully!');
    console.log('💡 You now have sample gyms, trainers, and all necessary data for development.');
    
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

async function main() {
  try {
    console.log('Starting development seeding...');
    
    await seedDevData();
    
    console.log('✅ Development seeding completed successfully');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Development seeding failed:', error);
    process.exit(1);
  }
}

// Export for programmatic use
export { seedDevData as runDevSeed };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
} 