import { db, pool } from './config';
import * as schema from './schema';
// import { v4 as uuidv4 } from 'uuid'; // Not strictly needed if IDs are auto-generated
import { sql } from 'drizzle-orm';
import type { NewProvince, NewClass, NewTag, NewGym, NewGymImage, NewTrainer, NewUser, NewTrainerClass, NewTrainerTag, NewGymTag } from '../types';

export async function seedData() {
  console.log('🌱 Starting to seed data with new ERD-aligned schema...');

  try {
    console.log('🗑️ Clearing existing data from ERD-aligned tables...');
    // Order of deletion matters due to foreign key constraints
    // Start with tables that are referenced by others, or junction tables first

    await db.delete(schema.trainerTags);
    await db.delete(schema.trainerClasses);
    await db.delete(schema.gymTags);
    await db.delete(schema.gymImages);
    // await db.delete(schema.gymClassTypes); // This table is removed in the new schema
    // await db.delete(schema.gymTrainers); // This table is removed in the new schema

    // Then tables that are referenced
    await db.delete(schema.trainers); // Trainers might reference gyms or provinces
    await db.delete(schema.gyms);     // Gyms reference provinces
    await db.delete(schema.tags);
    await db.delete(schema.classes);  // Renamed from classTypes
    await db.delete(schema.provinces);
    await db.delete(schema.users); // Clearing users for a full fresh seed

    console.log('✅ Data cleared.');

    // 1. Seed Provinces
    console.log('🌍 Seeding Provinces...');
    const provincesData: NewProvince[] = [
      { name_th: 'กรุงเทพมหานคร', name_en: 'Bangkok' },
      { name_th: 'เชียงใหม่', name_en: 'Chiang Mai' },
      { name_th: 'ภูเก็ต', name_en: 'Phuket' },
      { name_th: 'ชลบุรี', name_en: 'Chon Buri' },
      { name_th: 'สุราษฎร์ธานี', name_en: 'Surat Thani' },
    ];
    const insertedProvinces = await db.insert(schema.provinces).values(provincesData).returning();
    console.log(`✅ Seeded ${insertedProvinces.length} provinces.`);
    const bangkok = insertedProvinces.find(p => p.name_en === 'Bangkok');
    const chiangMai = insertedProvinces.find(p => p.name_en === 'Chiang Mai');

    if (!bangkok || !chiangMai) {
        console.error('🚨 Could not find Bangkok or Chiang Mai after seeding provinces.');
        await pool.end();
        return;
    }

    // 2. Seed Users (example) - Remove hardcoded IDs, let UUID auto-generate
    console.log('👤 Seeding Users...');
    const usersData: NewUser[] = [
      { email: 'admin@mymuaythai.com', role: 'admin' }, // No id field - let it auto-generate
      { email: 'user@mymuaythai.com', role: 'user' },
    ];
    const insertedUsers = await db.insert(schema.users).values(usersData).returning();
    console.log(`✅ Seeded ${insertedUsers.length} users.`);
    // const adminUser = insertedUsers.find(u => u.email === 'admin@mymuaythai.com');

    // 3. Seed Classes (formerly ClassTypes) - Remove hardcoded IDs
    console.log('🥊 Seeding Classes...');
    const classesData: NewClass[] = [
      { name_th: 'มวยไทยพื้นฐาน', name_en: 'Basic Muay Thai', description_th: 'เรียนรู้พื้นฐานมวยไทย', description_en: 'Learn the basics of Muay Thai' },
      { name_th: 'มวยไทยขั้นสูง', name_en: 'Advanced Muay Thai', description_th: 'สำหรับผู้มีประสบการณ์', description_en: 'For experienced practitioners' },
      { name_th: 'มวยไทยสำหรับเด็ก', name_en: 'Muay Thai for Kids', description_th: 'สอนมวยไทยให้เด็กๆ', description_en: 'Muay Thai classes for children' },
      { name_th: 'คาร์ดิโอ มวยไทย', name_en: 'Cardio Muay Thai', description_th: 'มวยไทยเพื่อการออกกำลังกาย', description_en: 'Muay Thai for fitness' },
    ];
    const insertedClasses = await db.insert(schema.classes).values(classesData).returning();
    console.log(`✅ Seeded ${insertedClasses.length} classes.`);
    const basicMuayThai = insertedClasses.find(c => c.name_en === 'Basic Muay Thai');
    const advancedMuayThai = insertedClasses.find(c => c.name_en === 'Advanced Muay Thai');

    if (!basicMuayThai || !advancedMuayThai) {
        console.error('🚨 Could not find basic or advanced Muay Thai class after seeding.');
        await pool.end();
        return;
    }

    // 4. Seed Tags
    console.log('🏷️ Seeding Tags...');
    const tagsData: NewTag[] = [
      { name_th: 'เหมาะสำหรับผู้เริ่มต้น', name_en: 'Beginner Friendly' },
      { name_th: 'สำหรับมือโปร', name_en: 'For Professionals' },
      { name_th: 'บรรยากาศดี', name_en: 'Good Atmosphere' },
      { name_th: 'อุปกรณ์ครบครัน', name_en: 'Fully Equipped' },
      { name_th: 'สอนภาษาอังกฤษ', name_en: 'English Speaking' },
    ];
    const insertedTags = await db.insert(schema.tags).values(tagsData).returning();
    console.log(`✅ Seeded ${insertedTags.length} tags.`);
    const beginnerTag = insertedTags.find(t => t.name_en === 'Beginner Friendly');
    const englishSpeakingTag = insertedTags.find(t => t.name_en === 'English Speaking');

    if (!beginnerTag || !englishSpeakingTag) {
        console.error('🚨 Could not find beginner or english speaking tag after seeding.');
        await pool.end();
        return;
    }


    // 5. Seed Gyms
    console.log('️🏋️ Seeding Gyms...');
    const gymsData: NewGym[] = [
      {
        name_th: 'ยอดมวยยิม กรุงเทพ',
        name_en: 'Yodmuay Gym Bangkok',
        description_th: 'ยิมมวยไทยบรรยากาศดี สอนโดยครูมวยประสบการณ์สูง ใจกลางกรุงเทพ',
        description_en: 'Authentic Muay Thai gym with experienced trainers in central Bangkok.',
        phone: '0812345678',
        email: 'info@yodmuaygym-bkk.com',
        province_id: bangkok.id,
        map_url: 'https://maps.app.goo.gl/yodmuaybkk',
        youtube_url: 'https://youtube.com/yodmuaybkk',
        line_id: '@yodmuaybkk',
        // created_at will default
        // is_active will default to true
      },
      {
        name_th: 'ลานนามวยไทย เชียงใหม่',
        name_en: 'Lanna Muay Thai Chiang Mai',
        description_th: 'เรียนมวยไทยท่ามกลางธรรมชาติที่เชียงใหม่ สงบและเข้มข้น',
        description_en: 'Learn Muay Thai in the beautiful surroundings of Chiang Mai. Serene and intense.',
        phone: '0987654321',
        email: 'info@lannamuaythai-cm.com',
        province_id: chiangMai.id,
        map_url: 'https://maps.app.goo.gl/lannacm',
        line_id: '@lannacm',
      },
    ];
    const insertedGyms = await db.insert(schema.gyms).values(gymsData).returning();
    console.log(`✅ Seeded ${insertedGyms.length} gyms.`);
    const yodmuayGym = insertedGyms.find(g => g.name_en === 'Yodmuay Gym Bangkok');
    const lannaGym = insertedGyms.find(g => g.name_en === 'Lanna Muay Thai Chiang Mai');

    if (!yodmuayGym || !lannaGym) {
        console.error('🚨 Could not find Yodmuay Gym or Lanna Gym after seeding.');
        await pool.end();
        return;
    }
    
    // 6. Seed Gym Images
    console.log('📸 Seeding Gym Images...');
    const gymImagesData: NewGymImage[] = [
        { gym_id: yodmuayGym.id, image_url: 'https://picsum.photos/seed/yodmuaybkk1/800/600' },
        { gym_id: yodmuayGym.id, image_url: 'https://picsum.photos/seed/yodmuaybkk2/800/600' },
        { gym_id: lannaGym.id, image_url: 'https://picsum.photos/seed/lannacm1/800/600' },
    ];
    const insertedGymImages = await db.insert(schema.gymImages).values(gymImagesData).returning();
    console.log(`✅ Seeded ${insertedGymImages.length} gym images.`);

    // 7. Seed Trainers
    console.log('🏆 Seeding Trainers...');
    const trainersData: NewTrainer[] = [
      {
        first_name_th: 'ยอด', last_name_th: 'ศึกษาสงวน',
        first_name_en: 'Yod', last_name_en: 'Suksasuan',
        bio_th: 'อดีตแชมป์หลายสมัย ประสบการณ์สอนกว่า 20 ปี เน้นเทคนิคและพละกำลัง',
        bio_en: 'Former champion with over 20 years of teaching experience. Focus on technique and power.',
        phone: '0811112222',
        email: 'yod.s@example.com',
        line_id: 'kruyodmuaythai',
        is_freelance: false,
        gym_id: yodmuayGym.id, // Affiliated with Yodmuay Gym
        province_id: bangkok.id, // Based in Bangkok
        // profile_image_url: 'https://picsum.photos/seed/kruyod/300/300' // profile_image_url not in ERD for trainers
      },
      {
        first_name_th: 'แก้ว', last_name_th: 'ใจดี',
        first_name_en: 'Kaew', last_name_en: 'Jaidee',
        bio_th: 'เชี่ยวชาญมวยไทยโบราณและเทคนิคการป้องกันตัว สอนสนุกเป็นกันเอง',
        bio_en: 'Specializes in ancient Muay Thai and self-defense techniques. Fun and friendly teaching style.',
        phone: '0822223333',
        email: 'kaew.j@example.com',
        is_freelance: true, // Freelance trainer
        province_id: chiangMai.id, // Based in Chiang Mai, but freelance
        // gym_id is null for freelance
      },
    ];
    const insertedTrainers = await db.insert(schema.trainers).values(trainersData).returning();
    console.log(`✅ Seeded ${insertedTrainers.length} trainers.`);
    const kruYod = insertedTrainers.find(t => t.email === 'yod.s@example.com');
    const kruKaew = insertedTrainers.find(t => t.email === 'kaew.j@example.com');

    if (!kruYod || !kruKaew) {
        console.error('🚨 Could not find Kru Yod or Kru Kaew after seeding.');
        await pool.end();
        return;
    }

    // 8. Link Gyms with Tags (GymTags)
    console.log('🔗 Linking Gyms with Tags...');
    const gymTagsData: NewGymTag[] = [
        { gym_id: yodmuayGym.id, tag_id: beginnerTag.id },
        { gym_id: yodmuayGym.id, tag_id: englishSpeakingTag.id },
        { gym_id: lannaGym.id, tag_id: beginnerTag.id },
    ];
    await db.insert(schema.gymTags).values(gymTagsData);
    console.log(`✅ Linked ${gymTagsData.length} gym-tag relationships.`);

    // 9. Link Trainers with Classes (TrainerClasses)
    console.log('🔗 Linking Trainers with Classes...');
    const trainerClassesData: NewTrainerClass[] = [
        { trainer_id: kruYod.id, class_id: basicMuayThai.id },
        { trainer_id: kruYod.id, class_id: advancedMuayThai.id },
        { trainer_id: kruKaew.id, class_id: basicMuayThai.id }, // Kru Kaew also teaches basic
    ];
    await db.insert(schema.trainerClasses).values(trainerClassesData);
    console.log(`✅ Linked ${trainerClassesData.length} trainer-class relationships.`);

    // 10. Link Trainers with Tags (TrainerTags) - Example: Specializations
    console.log('🔗 Linking Trainers with Tags...');
    const professionalTag = insertedTags.find(t => t.name_en === 'For Professionals');
    if(professionalTag) {
        const trainerTagsData: NewTrainerTag[] = [
            { trainer_id: kruYod.id, tag_id: professionalTag.id }, // Kru Yod is for pros
            { trainer_id: kruKaew.id, tag_id: beginnerTag.id },    // Kru Kaew is beginner friendly
        ];
        await db.insert(schema.trainerTags).values(trainerTagsData);
        console.log(`✅ Linked ${trainerTagsData.length} trainer-tag relationships.`);
    }
    
    console.log('🎉 Seed data completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    // Ensure pool is closed even on error, but after logging
    await pool.end();
    console.log('Database pool closed after error in seeding.');
    process.exit(1); // Exit with error code
  } finally {
    // This block might be redundant if errors are handled and exit, 
    // but good for ensuring pool closure if no explicit exit occurs in catch.
    if (pool && !(pool as any)._ended) { // Check if pool exists and not already ended
        await pool.end();
        console.log('Database pool closed after seeding operation completed.');
    }
  }
}

if (require.main === module) {
  seedData();
} 