import '../config/environment';
import { db, pool } from './config';
import * as schema from './schema';
import { seedProvinces } from './province-seed';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import type { NewClass, NewTag, NewGym, NewTrainer, Gym, Trainer, Tag, Class } from '../types';

// --- Environment Safety Check ---
if (process.env.NODE_ENV === 'production') {
  console.error('❌ Refusing to run seed script in production environment.');
  process.exit(1);
}

// --- Mock Data ---
const MOCK_DATA = {
  images: [
    'https://via.placeholder.com/800x600.png/000000/FFFFFF?text=Muay+Thai+1',
    'https://via.placeholder.com/800x600.png/FF0000/FFFFFF?text=Muay+Thai+2',
    'https://via.placeholder.com/800x600.png/0000FF/FFFFFF?text=Muay+Thai+3',
  ],
  tags: [
    { name_th: 'เหมาะสำหรับผู้เริ่มต้น', name_en: 'Beginner Friendly', slug: 'beginner-friendly' },
    { name_th: 'สำหรับมือโปร', name_en: 'For Professionals', slug: 'for-professionals' },
    { name_th: 'บรรยากาศดี', name_en: 'Good Atmosphere', slug: 'good-atmosphere' },
    { name_th: 'อุปกรณ์ครบครัน', name_en: 'Fully Equipped', slug: 'fully-equipped' },
    { name_th: 'สอนภาษาอังกฤษ', name_en: 'English Speaking', slug: 'english-speaking' },
  ],
  classes: [
      { name_th: 'มวยไทยพื้นฐาน', name_en: 'Basic Muay Thai', description_th: 'เรียนรู้พื้นฐานมวยไทย', description_en: 'Learn the basics of Muay Thai' },
      { name_th: 'มวยไทยขั้นสูง', name_en: 'Advanced Muay Thai', description_th: 'สำหรับผู้มีประสบการณ์', description_en: 'For experienced practitioners' },
      { name_th: 'คาร์ดิโอ มวยไทย', name_en: 'Cardio Muay Thai', description_th: 'มวยไทยเพื่อการออกกำลังกาย', description_en: 'Muay Thai for fitness' },
  ],
  gymNames: {
    thai: ['ไทเกอร์มวยไทย', 'มาสเตอร์ทอดดี้ยิม', 'พีเคแสนชัยมวยไทยยิม', 'บัญชาเมฆยิม', 'แฟร์เท็กซ์'],
    english: ['Tiger Muay Thai', 'Master Toddy\'s', 'PK Saenchai Gym', 'Banchamek Gym', 'Fairtex Center'],
  },
  trainerNames: {
    first: { thai: ['สมบัติ', 'ประเสริฐ', 'วิชัย', 'สามารถ', 'เขาทราย'], english: ['Sombat', 'Prasert', 'Wichai', 'Samart', 'Khaosai'] },
    last: { thai: ['บัญชาเมฆ', 'พยัคฆ์อรุณ', 'แกแล็คซี่', 'ศิษย์ยอดธง', 'ทอดดี้'], english: ['Banchamek', 'Payakaroon', 'Galaxy', 'Sityodtong', 'Toddy'] }
  },
};

const getRandomElement = <T>(array: T[]): T => array[Math.floor(Math.random() * array.length)]!;
const getRandomElements = <T>(array: T[], count: number): T[] => [...array].sort(() => 0.5 - Math.random()).slice(0, count);

// --- Seeding Logic ---

async function seedCoreData() {
  console.log('👤 Seeding admin user...');
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@mymuaythai.dev';
  const existingAdmin = await db.query.adminUsers.findFirst({ where: eq(schema.adminUsers.email, adminEmail) });

  if (!existingAdmin) {
    const adminPassword = process.env.ADMIN_PASSWORD || 'password123';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await db.insert(schema.adminUsers).values({ email: adminEmail, password: hashedPassword, role: 'admin' });
    console.log(`✅ Admin user created: ${adminEmail}`);
  } else {
    console.log('✅ Admin user already exists.');
  }

  console.log('🏷️ Seeding tags and classes...');
  await db.insert(schema.tags).values(MOCK_DATA.tags).onConflictDoNothing();
  await db.insert(schema.classes).values(MOCK_DATA.classes).onConflictDoNothing();
  console.log('✅ Seeded tags and classes.');
}

async function seedDevSet(tags: Tag[], classes: Class[]) {
  console.log('\n🌱 Seeding development dataset...');
  
  const [bangkok] = await db.select().from(schema.provinces).where(eq(schema.provinces.name_en, 'Bangkok')).limit(1);
  if (!bangkok) throw new Error('Bangkok province not found.');

  const devGym: NewGym = { name_th: 'เดฟยิม', name_en: 'Dev Gym', province_id: bangkok.id };
  const [gym] = await db.insert(schema.gyms).values(devGym).returning();
  if (!gym) throw new Error('Failed to create dev gym.');

  const devTrainer: NewTrainer = { first_name_th: 'เทรนเนอร์', first_name_en: 'Trainer', is_freelance: false, gym_id: gym.id, province_id: bangkok.id };
  const [trainer] = await db.insert(schema.trainers).values(devTrainer).returning();
  if (!trainer) throw new Error('Failed to create dev trainer.');

  console.log('✅ Seeded 1 gym and 1 trainer.');

  await db.insert(schema.gymImages).values({ gym_id: gym.id, image_url: getRandomElement(MOCK_DATA.images) });
  await db.insert(schema.trainerImages).values({ trainer_id: trainer.id, image_url: getRandomElement(MOCK_DATA.images) });
  console.log('✅ Seeded sample images.');

  await db.insert(schema.gymTags).values({ gym_id: gym.id, tag_id: getRandomElement(tags).id });
  await db.insert(schema.trainerTags).values({ trainer_id: trainer.id, tag_id: getRandomElement(tags).id });
  await db.insert(schema.trainerClasses).values({ trainer_id: trainer.id, class_id: getRandomElement(classes).id });
  console.log('✅ Seeded relationships.');
}

async function seedMassiveSet(tags: Tag[], classes: Class[]) {
    console.log('\n🌱 Seeding massive dataset (50 gyms, 50 trainers)...');
    
    const provinces = await db.query.provinces.findMany();
    if (provinces.length === 0) throw new Error('Provinces must be seeded first.');

    const gymsData: NewGym[] = Array.from({ length: 50 }, (_, i) => ({
        name_th: `${getRandomElement(MOCK_DATA.gymNames.thai)} #${i + 1}`,
        name_en: `${getRandomElement(MOCK_DATA.gymNames.english)} #${i + 1}`,
        province_id: getRandomElement(provinces).id,
    }));
    const gyms = await db.insert(schema.gyms).values(gymsData).returning();

    const trainersData: NewTrainer[] = Array.from({ length: 50 }, () => {
        const isFreelance = Math.random() > 0.5;
        return {
            first_name_th: getRandomElement(MOCK_DATA.trainerNames.first.thai),
            last_name_th: getRandomElement(MOCK_DATA.trainerNames.last.thai),
            first_name_en: getRandomElement(MOCK_DATA.trainerNames.first.english),
            last_name_en: getRandomElement(MOCK_DATA.trainerNames.last.english),
            is_freelance: isFreelance,
            gym_id: isFreelance ? null : getRandomElement(gyms).id,
            province_id: getRandomElement(provinces).id,
        };
    });
    const trainers = await db.insert(schema.trainers).values(trainersData).returning();
    console.log(`✅ Seeded ${gyms.length} gyms and ${trainers.length} trainers.`);

    const gymImagesData = gyms.flatMap(g => getRandomElements(MOCK_DATA.images, 2).map(url => ({ gym_id: g.id, image_url: url })));
    const trainerImagesData = trainers.flatMap(t => getRandomElements(MOCK_DATA.images, 2).map(url => ({ trainer_id: t.id, image_url: url })));
    await db.insert(schema.gymImages).values(gymImagesData);
    await db.insert(schema.trainerImages).values(trainerImagesData);
    console.log(`✅ Seeded ${gymImagesData.length} gym images and ${trainerImagesData.length} trainer images.`);

    const gymTagsData = gyms.flatMap(gym => getRandomElements(tags, 2).map(tag => ({ gym_id: gym.id, tag_id: tag.id })));
    const trainerTagsData = trainers.flatMap(trainer => getRandomElements(tags, 2).map(tag => ({ trainer_id: trainer.id, tag_id: tag.id })));
    const trainerClassesData = trainers.flatMap(trainer => getRandomElements(classes, 2).map(cls => ({ trainer_id: trainer.id, class_id: cls.id })));
    await db.insert(schema.gymTags).values(gymTagsData).onConflictDoNothing();
    await db.insert(schema.trainerTags).values(trainerTagsData).onConflictDoNothing();
    await db.insert(schema.trainerClasses).values(trainerClassesData).onConflictDoNothing();
    console.log(`✅ Seeded ${gymTagsData.length + trainerTagsData.length + trainerClassesData.length} relationships.`);
}

async function main() {
  try {
    console.log('🚀 Starting database seeding process...');
    const isMassive = process.argv.includes('--massive');

    await seedProvinces();
    await seedCoreData();
    
    const tags = await db.query.tags.findMany();
    const classes = await db.query.classes.findMany();

    if (isMassive) {
      await seedMassiveSet(tags, classes);
    } else {
      await seedDevSet(tags, classes);
    }

    console.log('\n🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('\n❌ An error occurred during the seeding process:', error);
    process.exit(1);
  } finally {
    await pool.end().catch(console.error);
    console.log('🔒 Database connection pool closed.');
  }
}

main(); 