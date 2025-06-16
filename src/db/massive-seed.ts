import { db, pool } from './config';
import * as schema from './schema';
import { sql } from 'drizzle-orm';

// Mock data generators - ensuring arrays have exactly 50 items
const gymNames = {
  thai: [
    'ไดมอนด์ มวยไทย', 'เสือเหลือง ยิม', 'นาคราช มวยไทย', 'สิงห์ทอง ยิม', 'ฟ้าแลบ มวยไทย',
    'ราชสีห์ ยิม', 'เพชรกิจ มวยไทย', 'อสูรกาย ยิม', 'นาคศิริ มวยไทย', 'พญาครุฑ ยิม',
    'ลิงหอนทอง ยิม', 'เสือดาว มวยไทย', 'ครุฑทอง ยิม', 'พญานาค มวยไทย', 'หนุมานทอง ยิม',
    'เสือครอบแครง ยิม', 'ตีนเหล็ก มวยไทย', 'หมัดเพชร ยิม', 'เขี้ยวเหล็ก มวยไทย', 'ปีกเหล็ก ยิม',
    'แสงรุ่งยิม', 'เจ้าสำโรง มวยไทย', 'ปลาอุโมงค์ ยิม', 'พงษ์พัฒน์ มวยไทย', 'เสี่ยงเพชร ยิม',
    'เสือป่า มวยไทย', 'ไฟป่า ยิม', 'เสือเผือก มวยไทย', 'ใหญ่เจริญ ยิม', 'นาบูสีม์ มวยไทย',
    'กิ่งแก้ว ยิม', 'สิงโตทอง มวยไทย', 'ไผ่ป่า ยิม', 'มงคลชัย มวยไทย', 'วรเดช ยิม',
    'ไม้หัก มวยไทย', 'ปากดาบ ยิม', 'ไร่ขาว มวยไทย', 'นาคอุบล ยิม', 'ไก่ป่า มวยไทย',
    'ขุนพล ยิม', 'แม่น้ำแคว มวยไทย', 'ราชพฤกษ์ ยิม', 'บ้านป่า มวยไทย', 'ไผ่งาม ยิม',
    'ไทยเจริญ มวยไทย', 'สยามไฟท์ ยิม', 'ไทยแลนด์ มวยไทย', 'กรุงไทย ยิม', 'สุโขทัย มวยไทย'
  ],
  english: [
    'Diamond Muay Thai', 'Golden Tiger Gym', 'Naga King Muay Thai', 'Lion Gold Gym', 'Lightning Muay Thai',
    'Royal Lion Gym', 'Diamond Action Muay Thai', 'Monster Gym', 'Naga Glory Muay Thai', 'Garuda Gym',
    'Golden Gibbon Gym', 'Leopard Muay Thai', 'Golden Garuda Gym', 'Serpent King Muay Thai', 'Golden Hanuman Gym',
    'Tiger Cage Gym', 'Iron Foot Muay Thai', 'Diamond Fist Gym', 'Iron Fang Muay Thai', 'Iron Wing Gym',
    'Dawn Light Gym', 'Samrong Master Muay Thai', 'Tunnel Fish Gym', 'Phongphat Muay Thai', 'Diamond Risk Gym',
    'Wild Tiger Muay Thai', 'Wildfire Gym', 'White Tiger Muay Thai', 'Big Prosperity Gym', 'Nabusim Muay Thai',
    'Crystal Branch Gym', 'Golden Lion Muay Thai', 'Bamboo Forest Gym', 'Sacred Victory Muay Thai', 'Powerful Gym',
    'Broken Wood Muay Thai', 'Sword Mouth Gym', 'White Field Muay Thai', 'Ubon Naga Gym', 'Wild Chicken Muay Thai',
    'Mighty Warrior Gym', 'River Kwai Muay Thai', 'Royal Tree Gym', 'Forest Home Muay Thai', 'Beautiful Bamboo Gym',
    'Thai Prosperity Muay Thai', 'Siam Fight Gym', 'Thailand Muay Thai', 'Krung Thai Gym', 'Sukhothai Muay Thai'
  ]
};

const trainerNames = {
  thai: {
    first: ['สมชาย', 'วิทยา', 'สมบัติ', 'ประยุทธ', 'อนุชา', 'สมศักดิ์', 'วิชัย', 'สมพง', 'อำนาจ', 'สุรชัย',
           'นพดล', 'ธีรพงษ์', 'เจริญ', 'สมควร', 'วรรณ', 'ศรีสุวรรณ', 'บุญชู', 'ดำรง', 'กิตติ', 'ประเสริฐ',
           'วิเชียร', 'สมหมาย', 'อาคม', 'ปรีชา', 'พิทักษ์', 'เอนก', 'สมยศ', 'กฤษดา', 'วีรพงษ์', 'นิรันดร์',
           'ขจร', 'ปราโมทย์', 'สมัชชา', 'สรรพศิษฏ์', 'นรินทร์', 'พิชัย', 'อุทัย', 'มานิตย์', 'ขนิษฐา', 'สิรินทร์',
           'ประยงค์', 'นิพนธ์', 'ดนูพงษ์', 'เดชา', 'สมชาติ', 'วิโรจน์', 'บุญมี', 'สมจิตต์', 'อรรถพร', 'นิธิพงษ์'],
    last: ['เจริญศรี', 'ดีมาก', 'สุขเสมอ', 'แก้วดี', 'ทองคำ', 'แสงดาว', 'ป่าป่น', 'ตาดี', 'ท้องฟ้า', 'ใสดี',
           'ป่าบิด', 'ใสใส', 'ดาบฟ้า', 'นาคทอง', 'เสือดำ', 'ใสเสีย', 'โพธิ์ป่า', 'แกล้วแก้ว', 'ปูพรหม', 'หินแปง',
           'เขี้ยวเหล็ก', 'แสงแสน', 'ขวัญเมือง', 'ดงพยอม', 'พ่อค้าไผ่', 'ประเสริฐ', 'ไผ่งาม', 'ลำใส', 'เสือโหด', 'นาคข้าว']
  },
  english: {
    first: ['Somchai', 'Wittaya', 'Sombat', 'Prayut', 'Anucha', 'Somsak', 'Wichai', 'Sompong', 'Amnaj', 'Surachai',
            'Noppadol', 'Thirapong', 'Charoen', 'Somkuan', 'Wan', 'Srisuwan', 'Boonchu', 'Damrong', 'Kitti', 'Prasert',
            'Wichian', 'Sommai', 'Akom', 'Preecha', 'Pitak', 'Anek', 'Somyot', 'Kritsada', 'Weerapong', 'Nirun',
            'Khajorn', 'Pramote', 'Samatcha', 'Sanpasit', 'Narin', 'Pichai', 'Uthai', 'Manit', 'Khanitha', 'Sirin',
            'Prayong', 'Nipon', 'Danupong', 'Decha', 'Somchat', 'Wiroj', 'Boonmee', 'Somjit', 'Arthaporn', 'Nithipong'],
    last: ['Charoensi', 'Deemak', 'Suksamo', 'Kaewdee', 'Thongkham', 'Saengdao', 'Papon', 'Tadee', 'Thongfa', 'Saidee',
           'Pabit', 'Saisai', 'Dabfa', 'Nakthong', 'Suedam', 'Saisia', 'Phopa', 'Klaewkaew', 'Puphrom', 'Hinpaeng',
           'Khiawlek', 'Saengsaen', 'Kwanmuang', 'Dongphayom', 'Phokhaipai', 'Prasert', 'Paingam', 'Lamsai', 'Suehoht', 'Nakkhao']
  }
};

const provinces = [
  { id: 1, name_th: 'กรุงเทพมหานคร', name_en: 'Bangkok' },
  { id: 2, name_th: 'เชียงใหม่', name_en: 'Chiang Mai' },
  { id: 3, name_th: 'ภูเก็ต', name_en: 'Phuket' },
  { id: 4, name_th: 'ระยอง', name_en: 'Rayong' },
  { id: 5, name_th: 'ชลบุรี', name_en: 'Chonburi' },
  { id: 6, name_th: 'นครศรีธรรมราช', name_en: 'Nakhon Si Thammarat' },
  { id: 7, name_th: 'ขอนแก่น', name_en: 'Khon Kaen' },
  { id: 8, name_th: 'สุรินทร์', name_en: 'Surin' },
  { id: 9, name_th: 'บุรีรัมย์', name_en: 'Buriram' },
  { id: 10, name_th: 'ลพบุรี', name_en: 'Lopburi' }
];

const descriptions = {
  thai: [
    'ศูนย์ฝึกมวยไทยแบบดั้งเดิม มีครูฝึกคุณภาพสูง',
    'ยิมมวยไทยสำหรับนักมวยทุกระดับ บรรยากาศดี',
    'ค่ายมวยไทยที่มีประวัติความเป็นมายาวนาน',
    'ศูนย์ฝึกมวยไทยครบครัน อุปกรณ์ทันสมัย',
    'ยิมมวยไทยสไตล์เก่า บรรยากาศอบอุ่น',
    'ค่ายมวยไทยระดับมืออาชีพ ครูผู้ฝึกมีประสบการณ์สูง',
    'ศูนย์ฝึกมวยไทยสำหรับคนทุกเพศทุกวัย',
    'ยิมมวยไทยที่เน้นการฝึกแบบดั้งเดิม',
    'ค่ายมวยไทยโบราณ มีแชมป์มากมาย',
    'ศูนย์ฝึกมวยไทยสมัยใหม่ อุปกรณ์ครบครัน'
  ],
  english: [
    'Traditional Muay Thai training center with high-quality instructors',
    'Muay Thai gym for fighters of all levels, great atmosphere',
    'Historic Muay Thai camp with long-standing tradition',
    'Complete Muay Thai training center with modern equipment',
    'Old-style Muay Thai gym with warm atmosphere',
    'Professional Muay Thai camp with experienced trainers',
    'Muay Thai training center for people of all ages and genders',
    'Muay Thai gym focusing on traditional training methods',
    'Ancient Muay Thai camp with many champions',
    'Modern Muay Thai training center with complete equipment'
  ]
};

const classNames = {
  thai: ['มวยไทยเบื้องต้น', 'มวยไทยขั้นสูง', 'มวยไทยเด็ก', 'มวยไทยคาร์ดิโอ', 'มวยไทยแข่งขัน', 'มวยไทยฟิตเนส', 'มวยไทยต่อสู้', 'มวยไทยป้องกันตัว'],
  english: ['Basic Muay Thai', 'Advanced Muay Thai', 'Kids Muay Thai', 'Cardio Muay Thai', 'Competition Muay Thai', 'Fitness Muay Thai', 'Combat Muay Thai', 'Self Defense Muay Thai']
};

const tags = {
  thai: ['เริ่มต้นใหม่', 'มืออาชีพ', 'บรรยากาศดี', 'อุปกรณ์ครบครัน', 'พูดอังกฤษได้', 'ราคาประหยัด', 'ใกล้รถไฟฟ้า', 'ที่จอดรถ', 'แอร์', 'ห้องแต่งตัว'],
  english: ['Beginner Friendly', 'Professional', 'Good Atmosphere', 'Fully Equipped', 'English Speaking', 'Budget Friendly', 'Near Metro', 'Parking Available', 'Air Conditioned', 'Changing Room']
};

function getRandomElement<T>(array: T[]): T {
  const index = Math.floor(Math.random() * array.length);
  return array[index]!;
}

function getRandomElements<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generatePhoneNumber(): string {
  const prefixes = ['08', '09', '06'];
  const prefix = getRandomElement(prefixes);
  const number = Math.floor(Math.random() * 90000000) + 10000000;
  return `${prefix}${number}`;
}

function generateEmail(name: string): string {
  const domains = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com'];
  const cleanName = name.toLowerCase().replace(/\s+/g, '');
  return `${cleanName}@${getRandomElement(domains)}`;
}

async function seedMassiveData() {
  console.log('🌱 Starting massive data seeding (50 gyms + 50 trainers)...');

  try {
    // Seed provinces first
    console.log('📍 Seeding provinces...');
    await db.insert(schema.provinces).values(provinces).onConflictDoNothing();

    // Seed classes
    console.log('📚 Seeding classes...');
    const classesData = classNames.thai.map((nameTh, index) => ({
      name_th: nameTh,
      name_en: classNames.english[index]!,
      description_th: `คอร์ส${nameTh}สำหรับผู้ที่สนใจ`,
      description_en: `${classNames.english[index]!} course for interested learners`
    }));
    await db.insert(schema.classes).values(classesData).onConflictDoNothing();

    // Seed tags
    console.log('🏷️ Seeding tags...');
    const tagsData = tags.thai.map((nameTh, index) => ({
      name_th: nameTh,
      name_en: tags.english[index]!
    }));
    await db.insert(schema.tags).values(tagsData).onConflictDoNothing();

    // Generate 50 unique gyms
    console.log('🏋️ Generating 50 unique gyms...');
    const gymsData = [];
    for (let i = 0; i < 50; i++) {
      const province = getRandomElement(provinces);
      const gymNameTh = gymNames.thai[i]!;
      const gymNameEn = gymNames.english[i]!;
      
      gymsData.push({
        name_th: gymNameTh,
        name_en: gymNameEn,
        description_th: getRandomElement(descriptions.thai),
        description_en: getRandomElement(descriptions.english),
        phone: generatePhoneNumber(),
        email: generateEmail(gymNameEn),
        province_id: province.id,
        map_url: `https://maps.google.com/?q=${encodeURIComponent(gymNameEn + ' ' + province.name_en)}`,
        youtube_url: Math.random() > 0.7 ? `https://youtube.com/@${gymNameEn.replace(/\s+/g, '').toLowerCase()}` : null,
        line_id: Math.random() > 0.5 ? `@${gymNameEn.replace(/\s+/g, '').toLowerCase()}` : null,
        is_active: Math.random() > 0.1, // 90% active
        created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000) // Random date within last year
      });
    }

    const insertedGyms = await db.insert(schema.gyms).values(gymsData).returning({ id: schema.gyms.id });
    console.log(`✅ Created ${insertedGyms.length} gyms`);

    // Generate 50 unique trainers
    console.log('👥 Generating 50 unique trainers...');
    const trainersData = [];
    for (let i = 0; i < 50; i++) {
      const firstNameTh = getRandomElement(trainerNames.thai.first);
      const lastNameTh = getRandomElement(trainerNames.thai.last);
      const firstNameEn = getRandomElement(trainerNames.english.first);
      const lastNameEn = getRandomElement(trainerNames.english.last);
      
      const isFreelance = Math.random() > 0.6; // 40% freelance
      const province = getRandomElement(provinces);
      
      trainersData.push({
        first_name_th: firstNameTh,
        last_name_th: lastNameTh,
        first_name_en: firstNameEn,
        last_name_en: lastNameEn,
        bio_th: `ครูมวยไทยมืออาชีพ มีประสบการณ์${Math.floor(Math.random() * 20) + 1}ปี เชี่ยวชาญในด้านการฝึกสอนมวยไทยแบบดั้งเดิม`,
        bio_en: `Professional Muay Thai trainer with ${Math.floor(Math.random() * 20) + 1} years of experience, specializing in traditional Muay Thai instruction`,
        phone: generatePhoneNumber(),
        email: generateEmail(`${firstNameEn} ${lastNameEn}`),
        line_id: Math.random() > 0.5 ? `${firstNameEn.toLowerCase()}${lastNameEn.toLowerCase()}` : null,
        is_freelance: isFreelance,
        gym_id: isFreelance ? null : getRandomElement(insertedGyms).id,
        province_id: province.id,
        exp_year: Math.floor(Math.random() * 25) + 1,
        is_active: Math.random() > 0.05, // 95% active
        created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
      });
    }

    const insertedTrainers = await db.insert(schema.trainers).values(trainersData).returning({ id: schema.trainers.id });
    console.log(`✅ Created ${insertedTrainers.length} trainers`);

    // Create gym-tag relationships
    console.log('🔗 Creating gym-tag relationships...');
    const gymTagsData = [];
    const allTags = await db.select({ id: schema.tags.id }).from(schema.tags);
    
    for (const gym of insertedGyms) {
      const randomTags = getRandomElements(allTags, Math.floor(Math.random() * 4) + 1);
      for (const tag of randomTags) {
        gymTagsData.push({
          gym_id: gym.id,
          tag_id: tag.id
        });
      }
    }
    await db.insert(schema.gymTags).values(gymTagsData).onConflictDoNothing();
    console.log(`✅ Created ${gymTagsData.length} gym-tag relationships`);

    // Create trainer-tag relationships
    console.log('🔗 Creating trainer-tag relationships...');
    const trainerTagsData = [];
    
    for (const trainer of insertedTrainers) {
      const randomTags = getRandomElements(allTags, Math.floor(Math.random() * 3) + 1);
      for (const tag of randomTags) {
        trainerTagsData.push({
          trainer_id: trainer.id,
          tag_id: tag.id
        });
      }
    }
    await db.insert(schema.trainerTags).values(trainerTagsData).onConflictDoNothing();
    console.log(`✅ Created ${trainerTagsData.length} trainer-tag relationships`);

    // Create trainer classes
    console.log('📖 Creating trainer classes...');
    const trainerClassesData = [];
    const allClasses = await db.select({ id: schema.classes.id }).from(schema.classes);
    
    for (const trainer of insertedTrainers) {
      const numberOfClasses = Math.floor(Math.random() * 3) + 1; // 1-3 classes per trainer
      const randomClasses = getRandomElements(allClasses, numberOfClasses);
      
      for (const classItem of randomClasses) {
        trainerClassesData.push({
          trainer_id: trainer.id,
          class_id: classItem.id,
          name_th: getRandomElement(classNames.thai),
          name_en: getRandomElement(classNames.english),
          description_th: 'คลาสฝึกสอนมวยไทยโดยครูมืออาชีพ',
          description_en: 'Professional Muay Thai training class',
          duration_minutes: [60, 90, 120][Math.floor(Math.random() * 3)],
          max_students: Math.floor(Math.random() * 15) + 5, // 5-20 students
          price: Math.floor(Math.random() * 1000) + 500, // 500-1500 THB
          is_active: Math.random() > 0.1,
          is_private_class: Math.random() > 0.7,
          created_at: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000)
        });
      }
    }
    await db.insert(schema.trainerClasses).values(trainerClassesData).onConflictDoNothing();
    console.log(`✅ Created ${trainerClassesData.length} trainer classes`);

    // Create some gym images
    console.log('🖼️ Creating gym images...');
    const gymImagesData = [];
    for (const gym of insertedGyms.slice(0, 30)) { // First 30 gyms get images
      const numberOfImages = Math.floor(Math.random() * 3) + 1; // 1-3 images per gym
      for (let i = 0; i < numberOfImages; i++) {
        gymImagesData.push({
          gym_id: gym.id,
          image_url: `https://picsum.photos/800/600?random=${Date.now()}-${Math.random()}`
        });
      }
    }
    await db.insert(schema.gymImages).values(gymImagesData).onConflictDoNothing();
    console.log(`✅ Created ${gymImagesData.length} gym images`);

    console.log('🎉 Massive data seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - 50 Gyms with realistic data`);
    console.log(`   - 50 Trainers with diverse backgrounds`);
    console.log(`   - ${gymTagsData.length} Gym-tag relationships`);
    console.log(`   - ${trainerTagsData.length} Trainer-tag relationships`);
    console.log(`   - ${trainerClassesData.length} Trainer classes`);
    console.log(`   - ${gymImagesData.length} Gym images`);
    console.log(`   - All data is unique and realistic!`);
    
  } catch (error) {
    console.error('❌ Error during massive seeding:', error);
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
    console.log('Starting massive database seeding...');
    
    await seedMassiveData();
    
    console.log('✅ Massive database seeding completed successfully');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Massive database seeding failed:', error);
    process.exit(1);
  }
}

// Export for programmatic use
export { seedMassiveData };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
} 