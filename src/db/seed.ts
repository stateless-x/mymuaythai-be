import { pool } from './config';
import { v4 as uuidv4 } from 'uuid';

export const seedData = async (): Promise<void> => {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Starting database seeding...');

    // Seed provinces (Thailand provinces)
    console.log('📍 Seeding provinces...');
    const provinceInsert = `
      INSERT INTO provinces (name_th, name_en) VALUES
      ('กรุงเทพมหานคร', 'Bangkok'),
      ('เชียงใหม่', 'Chiang Mai'),
      ('ภูเก็ต', 'Phuket'),
      ('ระยอง', 'Rayong'),
      ('ชลบุรี', 'Chonburi'),
      ('นนทบุรี', 'Nonthaburi'),
      ('เชียงราย', 'Chiang Rai'),
      ('ขอนแก่น', 'Khon Kaen'),
      ('อุบลราชธานี', 'Ubon Ratchathani'),
      ('นครราชสีมา', 'Nakhon Ratchasima')
      ON CONFLICT DO NOTHING
      RETURNING id, name_en;
    `;
    await client.query(provinceInsert);

    // Seed users
    console.log('👤 Seeding users...');
    const userInsert = `
      INSERT INTO users (role, email) VALUES
      ('admin', 'admin@mymuaythai.com'),
      ('user', 'user1@example.com'),
      ('user', 'user2@example.com')
      ON CONFLICT (email) DO NOTHING;
    `;
    await client.query(userInsert);

    // Seed classes
    console.log('🥊 Seeding classes...');
    const classIds = {
      basicMuayThai: uuidv4(),
      advancedMuayThai: uuidv4(),
      boxing: uuidv4(),
      kickboxing: uuidv4(),
      fitness: uuidv4(),
    };

    const classInsert = `
      INSERT INTO classes (id, name_th, name_en, description_th, description_en) VALUES
      ('${classIds.basicMuayThai}', 'มวยไทยพื้นฐาน', 'Basic Muay Thai', 'เรียนรู้พื้นฐานมวยไทยสำหรับผู้เริ่มต้น', 'Learn fundamental Muay Thai for beginners'),
      ('${classIds.advancedMuayThai}', 'มวยไทยขั้นสูง', 'Advanced Muay Thai', 'มวยไทยระดับสูงสำหรับนักสู้ที่มีประสบการณ์', 'Advanced Muay Thai for experienced fighters'),
      ('${classIds.boxing}', 'มวยสากล', 'Boxing', 'มวยสากลแบบดั้งเดิม', 'Traditional boxing training'),
      ('${classIds.kickboxing}', 'คิกบ็อกซิ่ง', 'Kickboxing', 'การฝึกคิกบ็อกซิ่งแบบสมัยใหม่', 'Modern kickboxing training'),
      ('${classIds.fitness}', 'ฟิตเนสมวยไทย', 'Muay Thai Fitness', 'ออกกำลังกายด้วยท่าทางมวยไทย', 'Fitness training with Muay Thai movements')
      ON CONFLICT (id) DO NOTHING;
    `;
    await client.query(classInsert);

    // Seed tags
    console.log('🏷️ Seeding tags...');
    const tagIds = {
      beginnerFriendly: uuidv4(),
      competition: uuidv4(),
      airConditioned: uuidv4(),
      equipment: uuidv4(),
      parking: uuidv4(),
      shower: uuidv4(),
      professional: uuidv4(),
      traditional: uuidv4(),
    };

    const tagInsert = `
      INSERT INTO tags (id, name_th, name_en) VALUES
      ('${tagIds.beginnerFriendly}', 'เหมาะสำหรับผู้เริ่มต้น', 'Beginner Friendly'),
      ('${tagIds.competition}', 'เตรียมตัวแข่งขัน', 'Competition Training'),
      ('${tagIds.airConditioned}', 'ห้องแอร์', 'Air Conditioned'),
      ('${tagIds.equipment}', 'อุปกรณ์ครบครัน', 'Full Equipment'),
      ('${tagIds.parking}', 'ที่จอดรถ', 'Parking Available'),
      ('${tagIds.shower}', 'ห้องอาบน้ำ', 'Shower Facilities'),
      ('${tagIds.professional}', 'ระดับมืออาชีพ', 'Professional Level'),
      ('${tagIds.traditional}', 'แบบดั้งเดิม', 'Traditional Style')
      ON CONFLICT (id) DO NOTHING;
    `;
    await client.query(tagInsert);

    // Seed gyms
    console.log('🏟️ Seeding gyms...');
    const gymIds = {
      lumpineeGym: uuidv4(),
      fairtexGym: uuidv4(),
      tigerMuayThai: uuidv4(),
      yokkaoGym: uuidv4(),
      sitjaopho: uuidv4(),
    };

    const gymInsert = `
      INSERT INTO gyms (id, name_th, name_en, description_th, description_en, phone, email, province_id, map_url, youtube_url, line, is_active) VALUES
      ('${gymIds.lumpineeGym}', 'ลุมพินีมวยไทยยิม', 'Lumpinee Muay Thai Gym', 'ค่ายมวยไทยชื่อดังระดับโลก', 'World famous Muay Thai training camp', '02-123-4567', 'info@lumpineegym.com', 1, 'https://maps.google.com/lumpinee', 'https://youtube.com/@lumpineegym', '@lumpineegym', true),
      ('${gymIds.fairtexGym}', 'แฟร์เท็กซ์ยิม', 'Fairtex Gym', 'ค่ายมวยไทยสำหรับนักสู้มืออาชีพ', 'Professional Muay Thai camp for fighters', '02-234-5678', 'contact@fairtex.com', 1, 'https://maps.google.com/fairtex', 'https://youtube.com/@fairtex', '@fairtexgym', true),
      ('${gymIds.tigerMuayThai}', 'ไทเกอร์มวยไทย', 'Tiger Muay Thai', 'ค่ายมวยไทยที่ภูเก็ต', 'Muay Thai camp in Phuket', '076-123-456', 'info@tigermuaythai.com', 3, 'https://maps.google.com/tiger', 'https://youtube.com/@tigermuaythai', '@tigermuaythai', true),
      ('${gymIds.yokkaoGym}', 'ยกเก้ายิม', 'Yokkao Gym', 'ค่ายมวยไทยแบบดั้งเดิม', 'Traditional Muay Thai training camp', '053-123-789', 'info@yokkao.com', 2, 'https://maps.google.com/yokkao', 'https://youtube.com/@yokkao', '@yokkao', true),
      ('${gymIds.sitjaopho}', 'สิตแจ่วโพธิ์ยิม', 'Sitjaopho Gym', 'ค่ายมวยไทยสำหรับทุกระดับ', 'Muay Thai gym for all levels', '02-345-6789', 'info@sitjaopho.com', 1, 'https://maps.google.com/sitjaopho', 'https://youtube.com/@sitjaopho', '@sitjaopho', true)
      ON CONFLICT (id) DO NOTHING;
    `;
    await client.query(gymInsert);

    // Seed gym images
    console.log('📸 Seeding gym images...');
    const gymImageInsert = `
      INSERT INTO gym_images (gym_id, image_url) VALUES
      ('${gymIds.lumpineeGym}', 'https://example.com/images/lumpinee1.jpg'),
      ('${gymIds.lumpineeGym}', 'https://example.com/images/lumpinee2.jpg'),
      ('${gymIds.fairtexGym}', 'https://example.com/images/fairtex1.jpg'),
      ('${gymIds.tigerMuayThai}', 'https://example.com/images/tiger1.jpg'),
      ('${gymIds.yokkaoGym}', 'https://example.com/images/yokkao1.jpg'),
      ('${gymIds.sitjaopho}', 'https://example.com/images/sitjaopho1.jpg');
    `;
    await client.query(gymImageInsert);

    // Seed trainers
    console.log('👨‍🏫 Seeding trainers...');
    const trainerIds = {
      somchai: uuidv4(),
      niran: uuidv4(),
      kamon: uuidv4(),
      siriporn: uuidv4(),
      thaksin: uuidv4(),
    };

    const trainerInsert = `
      INSERT INTO trainers (id, first_name_th, last_name_th, first_name_en, last_name_en, bio_th, bio_en, phone, email, line, is_freelance, gym_id, province_id, is_active) VALUES
      ('${trainerIds.somchai}', 'สมชาย', 'กิตติชัย', 'Somchai', 'Kittichai', 'อดีตแชมป์ลุมพินี มีประสบการณ์สอน 15 ปี', 'Former Lumpinee champion with 15 years teaching experience', '081-234-5678', 'somchai@lumpineegym.com', '@somchai_trainer', false, '${gymIds.lumpineeGym}', 1, true),
      ('${trainerIds.niran}', 'นิรันดร์', 'ศรีสุข', 'Niran', 'Srisuk', 'โค้ชมวยไทยระดับชาติ', 'National level Muay Thai coach', '082-345-6789', 'niran@fairtex.com', '@niran_coach', false, '${gymIds.fairtexGym}', 1, true),
      ('${trainerIds.kamon}', 'กมล', 'วีรชัย', 'Kamon', 'Weerachai', 'ครูมวยไทยประสบการณ์สูง', 'Experienced Muay Thai instructor', '076-456-789', 'kamon@tigermuaythai.com', '@kamon_tiger', false, '${gymIds.tigerMuayThai}', 3, true),
      ('${trainerIds.siriporn}', 'ศิริพร', 'มงคล', 'Siriporn', 'Mongkol', 'ครูสอนมวยไทยสำหรับผู้หญิง', 'Female Muay Thai instructor specialist', '081-567-890', 'siriporn@example.com', '@siriporn_mt', true, null, 2, true),
      ('${trainerIds.thaksin}', 'ทักษิณ', 'เพชรรัตน์', 'Thaksin', 'Phetrat', 'อดีตนักสู้มืออาชีพ ปัจจุบันเป็นครู', 'Former professional fighter turned instructor', '053-678-901', 'thaksin@yokkao.com', '@thaksin_yokkao', false, '${gymIds.yokkaoGym}', 2, true)
      ON CONFLICT (id) DO NOTHING;
    `;
    await client.query(trainerInsert);

    // Seed trainer-class relationships
    console.log('🔗 Seeding trainer-class relationships...');
    const trainerClassInsert = `
      INSERT INTO trainer_classes (trainer_id, class_id) VALUES
      ('${trainerIds.somchai}', '${classIds.basicMuayThai}'),
      ('${trainerIds.somchai}', '${classIds.advancedMuayThai}'),
      ('${trainerIds.niran}', '${classIds.advancedMuayThai}'),
      ('${trainerIds.niran}', '${classIds.boxing}'),
      ('${trainerIds.kamon}', '${classIds.basicMuayThai}'),
      ('${trainerIds.kamon}', '${classIds.kickboxing}'),
      ('${trainerIds.siriporn}', '${classIds.basicMuayThai}'),
      ('${trainerIds.siriporn}', '${classIds.fitness}'),
      ('${trainerIds.thaksin}', '${classIds.advancedMuayThai}'),
      ('${trainerIds.thaksin}', '${classIds.boxing}')
      ON CONFLICT (trainer_id, class_id) DO NOTHING;
    `;
    await client.query(trainerClassInsert);

    // Seed gym tags
    console.log('🏷️ Seeding gym tags...');
    const gymTagInsert = `
      INSERT INTO gym_tags (gym_id, tag_id) VALUES
      ('${gymIds.lumpineeGym}', '${tagIds.professional}'),
      ('${gymIds.lumpineeGym}', '${tagIds.traditional}'),
      ('${gymIds.lumpineeGym}', '${tagIds.equipment}'),
      ('${gymIds.fairtexGym}', '${tagIds.professional}'),
      ('${gymIds.fairtexGym}', '${tagIds.competition}'),
      ('${gymIds.fairtexGym}', '${tagIds.airConditioned}'),
      ('${gymIds.tigerMuayThai}', '${tagIds.beginnerFriendly}'),
      ('${gymIds.tigerMuayThai}', '${tagIds.parking}'),
      ('${gymIds.tigerMuayThai}', '${tagIds.shower}'),
      ('${gymIds.yokkaoGym}', '${tagIds.traditional}'),
      ('${gymIds.yokkaoGym}', '${tagIds.equipment}'),
      ('${gymIds.sitjaopho}', '${tagIds.beginnerFriendly}'),
      ('${gymIds.sitjaopho}', '${tagIds.airConditioned}')
      ON CONFLICT (gym_id, tag_id) DO NOTHING;
    `;
    await client.query(gymTagInsert);

    // Seed trainer tags
    console.log('👨‍🏫 Seeding trainer tags...');
    const trainerTagInsert = `
      INSERT INTO trainer_tags (trainer_id, tag_id) VALUES
      ('${trainerIds.somchai}', '${tagIds.professional}'),
      ('${trainerIds.somchai}', '${tagIds.competition}'),
      ('${trainerIds.niran}', '${tagIds.professional}'),
      ('${trainerIds.niran}', '${tagIds.competition}'),
      ('${trainerIds.kamon}', '${tagIds.beginnerFriendly}'),
      ('${trainerIds.siriporn}', '${tagIds.beginnerFriendly}'),
      ('${trainerIds.thaksin}', '${tagIds.traditional}'),
      ('${trainerIds.thaksin}', '${tagIds.professional}')
      ON CONFLICT (trainer_id, tag_id) DO NOTHING;
    `;
    await client.query(trainerTagInsert);

    console.log('✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    client.release();
  }
}; 