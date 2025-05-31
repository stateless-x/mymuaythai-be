import { db } from './config';
import * as schema from './schema';
// import { v4 as uuidv4 } from 'uuid'; // Not strictly needed if IDs are auto-generated

// Mock data arrays...
const mockGyms = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name_th: 'สยามไทยฟิตเนส',
    name_en: 'Siam Thai Fitness',
    description_th: 'ศูนย์ฝึกมวยไทยและฟิตเนสครบวงจร',
    description_en: 'Complete Muay Thai and fitness center',
    phone: '02-123-4567',
    email: 'info@siamthaifitness.com',
    province_id: 1, // Bangkok
    map_url: 'https://maps.google.com/?q=Siam+Thai+Fitness',
    youtube_url: 'https://youtube.com/siamthaifitness',
    line_id: '@siamthaifitness',
    is_active: true,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name_th: 'แชมป์มวยไทยจิม',
    name_en: 'Champion Muay Thai Gym',
    description_th: 'โรงยิมมวยไทยสำหรับนักสู้ระดับโลก',
    description_en: 'Muay Thai gym for world-class fighters',
    phone: '02-234-5678',
    email: 'contact@championmuaythai.com',
    province_id: 1, // Bangkok
    map_url: 'https://maps.google.com/?q=Champion+Muay+Thai+Gym',
    youtube_url: 'https://youtube.com/championmuaythai',
    line_id: '@championmuaythai',
    is_active: true,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    name_th: 'ราชดำเนินมวยไทย',
    name_en: 'Ratchadamnoen Muay Thai',
    description_th: 'โรงยิมมวยไทยแบบดั้งเดิม',
    description_en: 'Traditional Muay Thai gym',
    phone: '02-345-6789',
    email: 'info@ratchadamnoenmuaythai.com',
    province_id: 1, // Bangkok
    map_url: 'https://maps.google.com/?q=Ratchadamnoen+Muay+Thai',
    youtube_url: null,
    line_id: '@ratchadamnoenmt',
    is_active: true,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    name_th: 'เชียงใหม่มวยไทยคลับ',
    name_en: 'Chiang Mai Muay Thai Club',
    description_th: 'สโมสรมวยไทยในเมืองเชียงใหม่',
    description_en: 'Muay Thai club in Chiang Mai',
    phone: '053-123-456',
    email: 'info@chiangmaimuaythai.com',
    province_id: 2, // Chiang Mai
    map_url: 'https://maps.google.com/?q=Chiang+Mai+Muay+Thai+Club',
    youtube_url: 'https://youtube.com/chiangmaimuaythai',
    line_id: '@chiangmaimt',
    is_active: true,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    name_th: 'ภูเก็ตไฟท์คลับ',
    name_en: 'Phuket Fight Club',
    description_th: 'สโมสรมวยไทยในจังหวัดภูเก็ต',
    description_en: 'Muay Thai club in Phuket',
    phone: '076-123-456',
    email: 'contact@phuketfightclub.com',
    province_id: 3, // Phuket
    map_url: 'https://maps.google.com/?q=Phuket+Fight+Club',
    youtube_url: null,
    line_id: '@phuketfightclub',
    is_active: true,
  },
];

const mockTrainers = [
  {
    id: '550e8400-e29b-41d4-a716-446655440101',
    first_name_th: 'สมชาย',
    first_name_en: 'Somchai',
    last_name_th: 'เพชรดำ',
    last_name_en: 'Phetdam',
    bio_th: 'อาจารย์มวยไทยที่มีประสบการณ์มากกว่า 20 ปี',
    bio_en: 'Muay Thai instructor with over 20 years of experience',
    phone: '081-234-5678',
    email: 'somchai.phetdam@gmail.com',
    line_id: '@somchaiphetdam',
    is_freelance: false,
    gym_id: '550e8400-e29b-41d4-a716-446655440001',
    province_id: 1,
    is_active: true,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440102',
    first_name_th: 'นภา',
    first_name_en: 'Napa',
    last_name_th: 'ทองคำ',
    last_name_en: 'Thongkham',
    bio_th: 'อดีตนักสู้หญิงมืออาชีพ ปัจจุบันเป็นครูฝึก',
    bio_en: 'Former professional female fighter, now instructor',
    phone: '081-345-6789',
    email: 'napa.thongkham@gmail.com',
    line_id: '@napathongkham',
    is_freelance: true,
    gym_id: null,
    province_id: 1,
    is_active: true,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440103',
    first_name_th: 'วิชัย',
    first_name_en: 'Wichai',
    last_name_th: 'สีหามาตย์',
    last_name_en: 'Seehamat',
    bio_th: 'แชมป์มวยไทยอดีต ผู้เชี่ยวชาญด้านเทคนิคการชก',
    bio_en: 'Former Muay Thai champion, specialist in fighting techniques',
    phone: '081-456-7890',
    email: 'wichai.seehamat@gmail.com',
    line_id: '@wichaiseehamat',
    is_freelance: false,
    gym_id: '550e8400-e29b-41d4-a716-446655440002',
    province_id: 1,
    is_active: true,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440104',
    first_name_th: 'อรุณ',
    first_name_en: 'Arun',
    last_name_th: 'ช้างเผือก',
    last_name_en: 'Changphueak',
    bio_th: 'ครูฝึกมวยไทยในเชียงใหม่ มีประสบการณ์ 15 ปี',
    bio_en: 'Muay Thai instructor in Chiang Mai with 15 years experience',
    phone: '081-567-8901',
    email: 'arun.changphueak@gmail.com',
    line_id: '@arunchangphueak',
    is_freelance: false,
    gym_id: '550e8400-e29b-41d4-a716-446655440004',
    province_id: 2,
    is_active: true,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440105',
    first_name_th: 'มานะ',
    first_name_en: 'Mana',
    last_name_th: 'เกาะแก้ว',
    last_name_en: 'Kokaew',
    bio_th: 'ครูฝึกมวยไทยในภูเก็ต เชี่ยวชาญด้านการป้องกันตัว',
    bio_en: 'Muay Thai instructor in Phuket, specializing in self-defense',
    phone: '081-678-9012',
    email: 'mana.kokaew@gmail.com',
    line_id: '@manakokaew',
    is_freelance: false,
    gym_id: '550e8400-e29b-41d4-a716-446655440005',
    province_id: 3,
    is_active: true,
  },
];

const mockClasses = [
  {
    id: '650e8400-e29b-41d4-a716-446655440001',
    name_th: 'มวยไทยเบื้องต้น',
    name_en: 'Basic Muay Thai',
    description_th: 'คอร์สเรียนมวยไทยสำหรับผู้เริ่มต้น',
    description_en: 'Muay Thai course for beginners',
  },
  {
    id: '650e8400-e29b-41d4-a716-446655440002',
    name_th: 'มวยไทยระดับกลาง',
    name_en: 'Intermediate Muay Thai',
    description_th: 'คอร์สมวยไทยสำหรับผู้มีพื้นฐาน',
    description_en: 'Muay Thai course for those with basic knowledge',
  },
  {
    id: '650e8400-e29b-41d4-a716-446655440003',
    name_th: 'มวยไทยขั้นสูง',
    name_en: 'Advanced Muay Thai',
    description_th: 'คอร์สมวยไทยสำหรับผู้เชี่ยวชาญ',
    description_en: 'Muay Thai course for experts',
  },
  {
    id: '650e8400-e29b-41d4-a716-446655440004',
    name_th: 'การป้องกันตัว',
    name_en: 'Self Defense',
    description_th: 'คอร์สการป้องกันตัวด้วยมวยไทย',
    description_en: 'Self-defense course using Muay Thai',
  },
  {
    id: '650e8400-e29b-41d4-a716-446655440005',
    name_th: 'ฟิตเนสมวยไทย',
    name_en: 'Muay Thai Fitness',
    description_th: 'คอร์สออกกำลังกายด้วยมวยไทย',
    description_en: 'Fitness course using Muay Thai',
  },
];

const mockTags = [
  {
    id: '750e8400-e29b-41d4-a716-446655440001',
    name_th: 'ผู้เริ่มต้น',
    name_en: 'Beginner',
    description_th: 'เหมาะสำหรับผู้เริ่มต้นเรียนมวยไทย',
    description_en: 'Suitable for Muay Thai beginners',
  },
  {
    id: '750e8400-e29b-41d4-a716-446655440002',
    name_th: 'มืออาชีพ',
    name_en: 'Professional',
    description_th: 'สำหรับนักสู้มืออาชีพ',
    description_en: 'For professional fighters',
  },
  {
    id: '750e8400-e29b-41d4-a716-446655440003',
    name_th: 'ฟิตเนส',
    name_en: 'Fitness',
    description_th: 'เน้นการออกกำลังกายและสุขภาพ',
    description_en: 'Focus on exercise and health',
  },
  {
    id: '750e8400-e29b-41d4-a716-446655440004',
    name_th: 'การป้องกันตัว',
    name_en: 'Self Defense',
    description_th: 'เน้นทักษะการป้องกันตัว',
    description_en: 'Focus on self-defense skills',
  },
  {
    id: '750e8400-e29b-41d4-a716-446655440005',
    name_th: 'เด็ก',
    name_en: 'Kids',
    description_th: 'เหมาะสำหรับเด็กและเยาวชน',
    description_en: 'Suitable for children and youth',
  },
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Insert gyms (skip if already exists)
    console.log('📍 Seeding gyms...');
    await db.insert(schema.gyms).values(mockGyms).onConflictDoNothing();

    // Insert trainers (skip if already exists)
    console.log('🥊 Seeding trainers...');
    await db.insert(schema.trainers).values(mockTrainers).onConflictDoNothing();

    // Insert classes (skip if already exists)
    console.log('📚 Seeding classes...');
    await db.insert(schema.classes).values(mockClasses).onConflictDoNothing();

    // Insert tags (skip if already exists)
    console.log('🏷️ Seeding tags...');
    await db.insert(schema.tags).values(mockTags).onConflictDoNothing();

    // Insert gym-tag relationships (skip if already exists)
    console.log('🔗 Seeding gym-tag relationships...');
    await db.insert(schema.gymTags).values([
      { gym_id: '550e8400-e29b-41d4-a716-446655440001', tag_id: '750e8400-e29b-41d4-a716-446655440001' },
      { gym_id: '550e8400-e29b-41d4-a716-446655440001', tag_id: '750e8400-e29b-41d4-a716-446655440003' },
      { gym_id: '550e8400-e29b-41d4-a716-446655440002', tag_id: '750e8400-e29b-41d4-a716-446655440002' },
      { gym_id: '550e8400-e29b-41d4-a716-446655440003', tag_id: '750e8400-e29b-41d4-a716-446655440002' },
      { gym_id: '550e8400-e29b-41d4-a716-446655440004', tag_id: '750e8400-e29b-41d4-a716-446655440001' },
      { gym_id: '550e8400-e29b-41d4-a716-446655440004', tag_id: '750e8400-e29b-41d4-a716-446655440005' },
      { gym_id: '550e8400-e29b-41d4-a716-446655440005', tag_id: '750e8400-e29b-41d4-a716-446655440004' },
    ]).onConflictDoNothing();

    // Insert trainer-class relationships (skip if already exists)
    console.log('👨‍🏫 Seeding trainer-class relationships...');
    await db.insert(schema.trainerClasses).values([
      { trainer_id: '550e8400-e29b-41d4-a716-446655440101', class_id: '650e8400-e29b-41d4-a716-446655440001' },
      { trainer_id: '550e8400-e29b-41d4-a716-446655440101', class_id: '650e8400-e29b-41d4-a716-446655440002' },
      { trainer_id: '550e8400-e29b-41d4-a716-446655440102', class_id: '650e8400-e29b-41d4-a716-446655440004' },
      { trainer_id: '550e8400-e29b-41d4-a716-446655440102', class_id: '650e8400-e29b-41d4-a716-446655440005' },
      { trainer_id: '550e8400-e29b-41d4-a716-446655440103', class_id: '650e8400-e29b-41d4-a716-446655440002' },
      { trainer_id: '550e8400-e29b-41d4-a716-446655440103', class_id: '650e8400-e29b-41d4-a716-446655440003' },
      { trainer_id: '550e8400-e29b-41d4-a716-446655440104', class_id: '650e8400-e29b-41d4-a716-446655440001' },
      { trainer_id: '550e8400-e29b-41d4-a716-446655440104', class_id: '650e8400-e29b-41d4-a716-446655440005' },
      { trainer_id: '550e8400-e29b-41d4-a716-446655440105', class_id: '650e8400-e29b-41d4-a716-446655440004' },
    ]).onConflictDoNothing();

    console.log('✅ Database seeding completed successfully!');
    return true;
  } catch (error: any) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('Starting database seeding...');
    
    await seedDatabase();
    
    console.log('✅ Database seeding completed successfully');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
}

// Export for programmatic use
export { seedDatabase };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
} 