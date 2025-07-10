import '../config/environment';
import { db, pool } from './config';
import * as schema from './schema';
import * as adminUserService from '../services/adminUserService';
import { seedProvinces } from './province-seed';

// These are the essential tags and classes required for the application to function.
// They are hardcoded to ensure consistency across all production-like environments.
const PROD_TAGS = [
    { name_th: 'เหมาะสำหรับผู้เริ่มต้น', name_en: 'Beginner Friendly', slug: 'beginner-friendly' },
    { name_th: 'สำหรับมือโปร', name_en: 'For Professionals', slug: 'for-professionals' },
    { name_th: 'บรรยากาศดี', name_en: 'Good Atmosphere', slug: 'good-atmosphere' },
    { name_th: 'อุปกรณ์ครบครัน', name_en: 'Fully Equipped', slug: 'fully-equipped' },
    { name_th: 'ใช้ภาษาอังกฤษ', name_en: 'English Speaking', slug: 'english-speaking' },
];

const PROD_CLASSES = [
    { name_th: 'มวยไทยพื้นฐาน', name_en: 'Basic Muay Thai', description_th: 'เรียนรู้พื้นฐานมวยไทย', description_en: 'Learn the basics of Muay Thai' },
    { name_th: 'มวยไทยขั้นสูง', name_en: 'Advanced Muay Thai', description_th: 'สำหรับผู้มีประสบการณ์', description_en: 'For experienced practitioners' },
    { name_th: 'คาร์ดิโอ', name_en: 'Cardio', description_th: 'มวยไทยเพื่อการออกกำลังกาย', description_en: 'Muay Thai for fitness' },
];

async function seedProdData() {
  console.log('🌱 Seeding essential production data...');

  // 1. Seed Provinces
  await seedProvinces();

  // 2. Seed Admin Users
  console.log('👤 Seeding admin users...');
  
  // Enhanced logging to debug environment variables in production
  console.log(`[SEEDING] Attempting to use ADMIN_EMAIL: ${process.env.ADMIN_EMAIL}`);
  console.log(`[SEEDING] ADMIN_PASSWORD found: ${!!process.env.ADMIN_PASSWORD}`);
  console.log(`[SEEDING] Attempting to use DEV_EMAIL: ${process.env.DEV_EMAIL}`);
  console.log(`[SEEDING] DEV_PASSWORD found: ${!!process.env.DEV_PASSWORD}`);

  const adminsToSeed = [
    {
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
      role: 'admin' as const
    },
    {
      email: process.env.DEV_EMAIL,
      password: process.env.DEV_PASSWORD,
      role: 'admin' as const
    }
  ];

  for (const admin of adminsToSeed) {
    if (!admin.email || !admin.password) {
      console.warn(`⚠️  Skipping an admin user due to missing credentials. Check ADMIN_EMAIL, ADMIN_PASSWORD, DEV_EMAIL, DEV_PASSWORD environment variables.`);
      continue;
    }
    
    try {
      const existingAdmin = await adminUserService.getAdminUserByEmail(admin.email);
      if (!existingAdmin) {
        await adminUserService.createAdminUser({
          email: admin.email,
          password: admin.password,
          role: admin.role,
        });
        console.log(`✅ Admin user created: ${admin.email}`);
      } else {
        console.log(`✅ Admin user already exists: ${admin.email}`);
      }
    } catch (error: any) {
      if (error.message.includes('Maximum 3 users allowed')) {
        console.warn(`⚠️  Could not create admin user '${admin.email}': maximum user limit reached.`);
      } else {
        console.error(`❌ Error creating admin user '${admin.email}':`, error);
      }
    }
  }

  // 3. Seed Tags and Classes
  console.log('🏷️ Seeding essential tags and classes...');
  await db.insert(schema.tags).values(PROD_TAGS).onConflictDoNothing();
  await db.insert(schema.classes).values(PROD_CLASSES).onConflictDoNothing();
  console.log('✅ Essential tags and classes seeded.');
}

async function main() {
  try {
    console.log('🚀 Starting PRODUCTION database seeding process...');
    console.warn('⚠️  This script is intended for production-like environments.');
    console.warn('⚠️  It will only seed essential data and will NOT create mock gyms or trainers.');

    await seedProdData();

    console.log('\n🎉 Production seeding completed successfully!');
  } catch (error) {
    console.error('\n❌ An error occurred during the production seeding process:', error);
    process.exit(1);
  }
}

main(); 