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
  {
    id: '550e8400-e29b-41d4-a716-446655440006',
    name_th: 'พัทยามวยไทย',
    name_en: 'Pattaya Muay Thai',
    description_th: 'ยิมมวยไทยริมทะเลในพัทยา',
    description_en: 'Seaside Muay Thai gym in Pattaya',
    phone: '038-123-456',
    email: 'info@pattayamuaythai.com',
    province_id: 4, // Chon Buri
    map_url: 'https://maps.google.com/?q=Pattaya+Muay+Thai',
    youtube_url: null,
    line_id: '@pattayamt',
    is_active: true,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440007',
    name_th: 'เกาะสมุยไฟท์เตอร์',
    name_en: 'Koh Samui Fighters',
    description_th: 'ฝึกมวยไทยบนเกาะสวรรค์',
    description_en: 'Train Muay Thai on a paradise island',
    phone: '077-987-654',
    email: 'info@samuifighters.com',
    province_id: 5, // Surat Thani
    map_url: 'https://maps.google.com/?q=Koh+Samui+Fighters',
    youtube_url: 'https://youtube.com/samuifighters',
    line_id: '@samuifight',
    is_active: true,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440008',
    name_th: 'ลานนามวยไทย',
    name_en: 'Lanna Muay Thai',
    description_th: 'สัมผัสวัฒนธรรมล้านนากับมวยไทย',
    description_en: 'Experience Lanna culture with Muay Thai',
    phone: '053-456-789',
    email: 'lanna.muaythai@email.com',
    province_id: 2, // Chiang Mai
    map_url: 'https://maps.google.com/?q=Lanna+Muay+Thai',
    youtube_url: null,
    line_id: '@lannamt',
    is_active: true,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440009',
    name_th: 'ไทเกอร์มวยไทย',
    name_en: 'Tiger Muay Thai',
    description_th: 'ยิมมวยไทยชื่อดังในภูเก็ต',
    description_en: 'Famous Muay Thai gym in Phuket',
    phone: '076-367-007',
    email: 'info@tigermuaythai.com',
    province_id: 3, // Phuket
    map_url: 'https://maps.google.com/?q=Tiger+Muay+Thai',
    youtube_url: 'https://youtube.com/tigermuaythai',
    line_id: '@tigermt',
    is_active: true,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440010',
    name_th: 'บางกอกไฟท์แล็บ',
    name_en: 'Bangkok Fight Lab',
    description_th: 'ศูนย์รวมศิลปะการต่อสู้ใจกลางกรุง',
    description_en: 'Martial arts center in the heart of Bangkok',
    phone: '02-999-8888',
    email: 'info@bangkokfightlab.com',
    province_id: 1, // Bangkok
    map_url: 'https://maps.google.com/?q=Bangkok+Fight+Lab',
    youtube_url: 'https://youtube.com/bangkokfightlab',
    line_id: '@bkfightlab',
    is_active: false,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440011',
    name_th: 'อีเกิ้ลมวยไทย',
    name_en: 'Eagle Muay Thai',
    description_th: 'ยิมบรรยากาศเป็นกันเอง',
    description_en: 'Friendly atmosphere gym',
    phone: '088-111-2222',
    email: 'eagle.muaythai@web.com',
    province_id: 2, // Chiang Mai
    map_url: 'https://maps.google.com/?q=Eagle+Muay+Thai',
    youtube_url: null,
    line_id: '@eaglegym',
    is_active: true,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440012',
    name_th: 'สินบิมวยไทย',
    name_en: 'Sinbi Muay Thai',
    description_th: 'ค่ายมวยไทยที่มีชื่อเสียง',
    description_en: 'A reputable Muay Thai camp',
    phone: '076-222-333',
    email: 'contact@sinbimuaythai.com',
    province_id: 3, // Phuket
    map_url: 'https://maps.google.com/?q=Sinbi+Muay+Thai',
    youtube_url: null,
    line_id: '@sinbigym',
    is_active: true,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440013',
    name_th: 'แฟร์เท็กซ์ เทรนนิ่งเซ็นเตอร์',
    name_en: 'Fairtex Training Center',
    description_th: 'ศูนย์ฝึกซ้อมมาตรฐานโลก',
    description_en: 'World-class training center',
    phone: '038-248-192',
    email: 'info@fairtex-pattaya.com',
    province_id: 4, // Chonburi
    map_url: 'https://maps.google.com/?q=Fairtex+Pattaya',
    youtube_url: 'https://youtube.com/fairtex',
    line_id: '@fairtex',
    is_active: true,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440014',
    name_th: 'ยอดมวยยิม',
    name_en: 'Yodmuay Gym',
    description_th: 'สร้างแชมป์เปี้ยนรุ่นต่อไป',
    description_en: 'Building the next generation of champions',
    phone: '02-444-5555',
    email: 'yodmuay@gym.com',
    province_id: 1, // Bangkok
    map_url: null,
    youtube_url: null,
    line_id: null,
    is_active: true,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440015',
    name_th: 'เกาะพะงันยิม',
    name_en: 'Koh Phangan Gym',
    description_th: 'ฝึกมวยไทยพร้อมชมวิวพระอาทิตย์ตก',
    description_en: 'Train muay thai with a sunset view',
    phone: '077-888-999',
    email: 'info@phangangym.com',
    province_id: 5, // Surat Thani
    map_url: 'https://maps.google.com/?q=Koh+Phangan+Gym',
    youtube_url: null,
    line_id: '@phangangym',
    is_active: true,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440016',
    name_th: 'กระบี่มวยไทย',
    name_en: 'Krabi Muay Thai',
    description_th: 'ค่ายมวยไทยท่ามกลางธรรมชาติ',
    description_en: 'Muay Thai camp surrounded by nature',
    phone: '075-123-789',
    email: 'krabimuaythai@info.com',
    province_id: 3, // Phuket
    map_url: 'https://maps.google.com/?q=Krabi+Muay+Thai',
    youtube_url: 'https://youtube.com/krabimt',
    line_id: '@krabimt',
    is_active: true,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440017',
    name_th: 'หัวหินบ็อกซิ่ง',
    name_en: 'Hua Hin Boxing',
    description_th: 'เรียนมวยไทยในเมืองตากอากาศ',
    description_en: 'Learn Muay Thai in a resort town',
    phone: '032-555-123',
    email: 'huahinboxing@club.com',
    province_id: 4, // Chonburi
    map_url: 'https://maps.google.com/?q=Hua+Hin+Boxing',
    youtube_url: null,
    line_id: '@huahinbox',
    is_active: true,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440018',
    name_th: 'อีสานไฟท์เตอร์',
    name_en: 'Isaan Fighters',
    description_th: 'ค่ายมวยแดนอีสาน',
    description_en: 'Muay Thai camp from the Isaan region',
    phone: '044-888-777',
    email: 'isaan.fighters@mail.com',
    province_id: 1, // Bangkok
    map_url: null,
    youtube_url: null,
    line_id: null,
    is_active: true,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440019',
    name_th: 'อารีน่ามวยไทย',
    name_en: 'Arena Muay Thai',
    description_th: 'ยิมขนาดใหญ่พร้อมเวทีมาตรฐาน',
    description_en: 'Large gym with a standard ring',
    phone: '02-777-6666',
    email: 'arena.mt@info.com',
    province_id: 1, // Bangkok
    map_url: 'https://maps.google.com/?q=Arena+Muay+Thai',
    youtube_url: 'https://youtube.com/arenamt',
    line_id: '@arenamuaythai',
    is_active: true,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440020',
    name_th: 'เดอะร็อคยิม',
    name_en: 'The Rock Gym',
    description_th: 'แข็งแกร่งดั่งหินผา',
    description_en: 'As strong as a rock',
    phone: '081-999-9999',
    email: 'therock@gym.com',
    province_id: 4, // Chonburi
    map_url: null,
    youtube_url: null,
    line_id: '@therock',
    is_active: false,
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
  {
    id: '550e8400-e29b-41d4-a716-446655440106',
    first_name_th: 'ก้อง',
    first_name_en: 'Kong',
    last_name_th: 'ไกล',
    last_name_en: 'Grai',
    bio_th: 'ครูฝึกเชี่ยวชาญการใช้ศอก',
    bio_en: 'Instructor specializing in elbow techniques',
    phone: '082-111-2222',
    email: 'kong.grai@example.com',
    line_id: '@konggrai',
    is_freelance: false,
    gym_id: '550e8400-e29b-41d4-a716-446655440006', // Pattaya Muay Thai
    province_id: 4,
    is_active: true,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440107',
    first_name_th: 'ฟ้า',
    first_name_en: 'Fah',
    last_name_th: 'ใส',
    last_name_en: 'Sai',
    bio_th: 'ครูฝึกหญิง สอนคาร์ดิโอมวยไทย',
    bio_en: 'Female instructor teaching cardio muay thai',
    phone: '083-222-3333',
    email: 'fah.sai@example.com',
    line_id: '@fahsai',
    is_freelance: true,
    gym_id: null,
    province_id: 5,
    is_active: true,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440108',
    first_name_th: 'พายุ',
    first_name_en: 'Payu',
    last_name_th: 'เหล็กไหล',
    last_name_en: 'Leklai',
    bio_th: 'ครูฝึกสายโหด เน้นความแข็งแกร่ง',
    bio_en: 'A tough instructor focusing on strength',
    phone: '084-333-4444',
    email: 'payu.leklai@example.com',
    line_id: '@payu',
    is_freelance: false,
    gym_id: '550e8400-e29b-41d4-a716-446655440008', // Lanna Muay Thai
    province_id: 2,
    is_active: true,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440109',
    first_name_th: 'ใจดี',
    first_name_en: 'Jaidee',
    last_name_th: 'มีสุข',
    last_name_en: 'Meesuk',
    bio_th: 'ครูฝึกใจดี เหมาะสำหรับผู้เริ่มต้น',
    bio_en: 'A kind instructor, great for beginners',
    phone: '085-444-5555',
    email: 'jaidee.meesuk@example.com',
    line_id: '@jaidee',
    is_freelance: true,
    gym_id: null,
    province_id: 3,
    is_active: true,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440110',
    first_name_th: 'สิงห์',
    first_name_en: 'Singh',
    last_name_th: 'เดช',
    last_name_en: 'Dech',
    bio_th: 'อดีตแชมป์เวทีลุมพินี',
    bio_en: 'Former Lumpinee stadium champion',
    phone: '086-555-6666',
    email: 'singh.dech@example.com',
    line_id: '@singh',
    is_freelance: false,
    gym_id: '550e8400-e29b-41d4-a716-446655440010', // Bangkok Fight Lab
    province_id: 1,
    is_active: false,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440111',
    first_name_th: 'เพชร',
    first_name_en: 'Petch',
    last_name_th: 'งาม',
    last_name_en: 'Ngam',
    bio_th: 'เชี่ยวชาญมวยไทยโบราณ',
    bio_en: 'Specializes in ancient Muay Thai (Boran)',
    phone: '087-666-7777',
    email: 'petch.ngam@example.com',
    line_id: '@petchngam',
    is_freelance: true,
    gym_id: null,
    province_id: 2,
    is_active: true,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440112',
    first_name_th: 'ทราย',
    first_name_en: 'Sai',
    last_name_th: 'แก้ว',
    last_name_en: 'Kaew',
    bio_th: 'นักมวยหญิงดาวรุ่ง',
    bio_en: 'Up and coming female boxer',
    phone: '088-777-8888',
    email: 'sai.kaew@example.com',
    line_id: '@saikaew',
    is_freelance: false,
    gym_id: '550e8400-e29b-41d4-a716-446655440012', // Sinbi Muay Thai
    province_id: 3,
    is_active: true,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440113',
    first_name_th: 'เอก',
    first_name_en: 'Eak',
    last_name_th: 'ชัย',
    last_name_en: 'Chai',
    bio_th: 'ครูมวยชาวใต้',
    bio_en: 'A Muay Thai master from the south',
    phone: '089-888-9999',
    email: 'eak.chai@example.com',
    line_id: '@eakchai',
    is_freelance: false,
    gym_id: '550e8400-e29b-41d4-a716-446655440013', // Fairtex
    province_id: 4,
    is_active: true,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440114',
    first_name_th: 'แสน',
    first_name_en: 'Saen',
    last_name_th: 'สุข',
    last_name_en: 'Suk',
    bio_th: 'ครูมวยอารมณ์ดี',
    bio_en: 'A good-humored trainer',
    phone: '091-222-3333',
    email: 'saen.suk@example.com',
    line_id: '@saensuk',
    is_freelance: false,
    gym_id: '550e8400-e29b-41d4-a716-446655440014', // Yodmuay
    province_id: 1,
    is_active: true,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440115',
    first_name_th: 'มังกร',
    first_name_en: 'Mangkorn',
    last_name_th: 'ไฟ',
    last_name_en: 'Fai',
    bio_th: 'ดุดันเหมือนมังกร',
    bio_en: 'Fierce like a dragon',
    phone: '092-333-4444',
    email: 'mangkorn.fai@example.com',
    line_id: '@mangkornfai',
    is_freelance: false,
    gym_id: '550e8400-e29b-41d4-a716-446655440015', // Koh Phangan
    province_id: 5,
    is_active: true,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440116',
    first_name_th: 'แสง',
    first_name_en: 'Saeng',
    last_name_th: 'จันทร์',
    last_name_en: 'Jan',
    bio_th: 'รวดเร็วว่องไวดั่งแสง',
    bio_en: 'As fast as light',
    phone: '093-444-5555',
    email: 'saeng.jan@example.com',
    line_id: '@saengjan',
    is_freelance: true,
    gym_id: null,
    province_id: 1,
    is_active: true,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440117',
    first_name_th: 'ดาว',
    first_name_en: 'Dao',
    last_name_th: 'เหนือ',
    last_name_en: 'Nuea',
    bio_th: 'ครูมวยจากภาคเหนือ',
    bio_en: 'Trainer from the northern region',
    phone: '094-555-6666',
    email: 'dao.nuea@example.com',
    line_id: '@daonuea',
    is_freelance: false,
    gym_id: '550e8400-e29b-41d4-a716-446655440004', // Chiang Mai Club
    province_id: 2,
    is_active: true,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440118',
    first_name_th: 'ขุน',
    first_name_en: 'Khun',
    last_name_th: 'ศึก',
    last_name_en: 'Suek',
    bio_th: 'นักสู้ผ่านศึกโชกโชน',
    bio_en: 'A seasoned warrior',
    phone: '095-666-7777',
    email: 'khun.suek@example.com',
    line_id: '@khunsuek',
    is_freelance: false,
    gym_id: '550e8400-e29b-41d4-a716-446655440003', // Ratchadamnoen
    province_id: 1,
    is_active: true,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440119',
    first_name_th: 'พลอย',
    first_name_en: 'Ploy',
    last_name_th: 'สวย',
    last_name_en: 'Suay',
    bio_th: 'สวยงามแต่แข็งแกร่ง',
    bio_en: 'Beautiful but strong',
    phone: '096-777-8888',
    email: 'ploy.suay@example.com',
    line_id: '@ploysuay',
    is_freelance: true,
    gym_id: null,
    province_id: 3,
    is_active: true,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440120',
    first_name_th: 'ทอง',
    first_name_en: 'Thong',
    last_name_th: 'ดี',
    last_name_en: 'Dee',
    bio_th: 'ครูมวยอาวุโส',
    bio_en: 'A senior Muay Thai master',
    phone: '097-888-9999',
    email: 'thong.dee@example.com',
    line_id: '@thongdee',
    is_freelance: false,
    gym_id: '550e8400-e29b-41d4-a716-446655440001', // Siam Thai Fitness
    province_id: 1,
    is_active: false,
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
      { gym_id: '550e8400-e29b-41d4-a716-446655440009', tag_id: '750e8400-e29b-41d4-a716-446655440002' }, // Tiger
      { gym_id: '550e8400-e29b-41d4-a716-446655440013', tag_id: '750e8400-e29b-41d4-a716-446655440002' }, // Fairtex
      { gym_id: '550e8400-e29b-41d4-a716-446655440007', tag_id: '750e8400-e29b-41d4-a716-446655440001' }, // Samui
      { gym_id: '550e8400-e29b-41d4-a716-446655440011', tag_id: '750e8400-e29b-41d4-a716-446655440001' }, // Eagle
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
      { trainer_id: '550e8400-e29b-41d4-a716-446655440106', class_id: '650e8400-e29b-41d4-a716-446655440002' }, // Kong
      { trainer_id: '550e8400-e29b-41d4-a716-446655440107', class_id: '650e8400-e29b-41d4-a716-446655440005' }, // Fah
      { trainer_id: '550e8400-e29b-41d4-a716-446655440108', class_id: '650e8400-e29b-41d4-a716-446655440003' }, // Payu
      { trainer_id: '550e8400-e29b-41d4-a716-446655440112', class_id: '650e8400-e29b-41d4-a716-446655440001' }, // Sai
      { trainer_id: '550e8400-e29b-41d4-a716-446655440118', class_id: '650e8400-e29b-41d4-a716-446655440003' }, // Khun
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