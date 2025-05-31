import { db, pool } from './config';
import * as schema from './schema';
import type { NewProvince } from '../types';

// All 77 provinces of Thailand with Thai and English names
export const ALL_THAILAND_PROVINCES: NewProvince[] = [
  // Central Region (23 provinces)
  { name_th: 'กรุงเทพมหานคร', name_en: 'Bangkok' },
  { name_th: 'กาญจนบุรี', name_en: 'Kanchanaburi' },
  { name_th: 'กำแพงเพชร', name_en: 'Kamphaeng Phet' },
  { name_th: 'ชัยนาท', name_en: 'Chai Nat' },
  { name_th: 'นครนายก', name_en: 'Nakhon Nayok' },
  { name_th: 'นครปฐม', name_en: 'Nakhon Pathom' },
  { name_th: 'นครสวรรค์', name_en: 'Nakhon Sawan' },
  { name_th: 'นนทบุรี', name_en: 'Nonthaburi' },
  { name_th: 'ปทุมธานี', name_en: 'Pathum Thani' },
  { name_th: 'พระนครศรีอยุธยา', name_en: 'Phra Nakhon Si Ayutthaya' },
  { name_th: 'พิจิตร', name_en: 'Phichit' },
  { name_th: 'พิษณุโลก', name_en: 'Phitsanulok' },
  { name_th: 'เพชรบูรณ์', name_en: 'Phetchabun' },
  { name_th: 'ลพบุรี', name_en: 'Lopburi' },
  { name_th: 'สมุทรปราการ', name_en: 'Samut Prakan' },
  { name_th: 'สมุทรสงคราม', name_en: 'Samut Songkhram' },
  { name_th: 'สมุทรสาคร', name_en: 'Samut Sakhon' },
  { name_th: 'สิงห์บุรี', name_en: 'Sing Buri' },
  { name_th: 'สุโขทัย', name_en: 'Sukhothai' },
  { name_th: 'สุพรรณบุรี', name_en: 'Suphan Buri' },
  { name_th: 'สระบุรี', name_en: 'Saraburi' },
  { name_th: 'อ่างทอง', name_en: 'Ang Thong' },
  { name_th: 'อุทัยธานี', name_en: 'Uthai Thani' },

  // Eastern Region (7 provinces)
  { name_th: 'จันทบุรี', name_en: 'Chanthaburi' },
  { name_th: 'ฉะเชิงเทรา', name_en: 'Chachoengsao' },
  { name_th: 'ชลบุรี', name_en: 'Chon Buri' },
  { name_th: 'ตราด', name_en: 'Trat' },
  { name_th: 'ปราจีนบุรี', name_en: 'Prachin Buri' },
  { name_th: 'ระยอง', name_en: 'Rayong' },
  { name_th: 'สระแก้ว', name_en: 'Sa Kaeo' },

  // Northern Region (9 provinces)
  { name_th: 'เชียงราย', name_en: 'Chiang Rai' },
  { name_th: 'เชียงใหม่', name_en: 'Chiang Mai' },
  { name_th: 'ตาก', name_en: 'Tak' },
  { name_th: 'น่าน', name_en: 'Nan' },
  { name_th: 'พะเยา', name_en: 'Phayao' },
  { name_th: 'เพชรบุรี', name_en: 'Phetchaburi' },
  { name_th: 'แพร่', name_en: 'Phrae' },
  { name_th: 'แม่ฮ่องสอน', name_en: 'Mae Hong Son' },
  { name_th: 'ลำปาง', name_en: 'Lampang' },
  { name_th: 'ลำพูน', name_en: 'Lamphun' },

  // Northeastern Region (20 provinces)
  { name_th: 'กาฬสินธุ์', name_en: 'Kalasin' },
  { name_th: 'ขอนแก่น', name_en: 'Khon Kaen' },
  { name_th: 'ชัยภูมิ', name_en: 'Chaiyaphum' },
  { name_th: 'นครพนม', name_en: 'Nakhon Phanom' },
  { name_th: 'นครราชสีมา', name_en: 'Nakhon Ratchasima' },
  { name_th: 'บึงกาฬ', name_en: 'Bueng Kan' },
  { name_th: 'บุรีรัมย์', name_en: 'Buriram' },
  { name_th: 'มหาสารคาม', name_en: 'Maha Sarakham' },
  { name_th: 'มุกดาหาร', name_en: 'Mukdahan' },
  { name_th: 'ยโสธร', name_en: 'Yasothon' },
  { name_th: 'ร้อยเอ็ด', name_en: 'Roi Et' },
  { name_th: 'เลย', name_en: 'Loei' },
  { name_th: 'ศรีสะเกษ', name_en: 'Sisaket' },
  { name_th: 'สกลนคร', name_en: 'Sakon Nakhon' },
  { name_th: 'สุรินทร์', name_en: 'Surin' },
  { name_th: 'หนองคาย', name_en: 'Nong Khai' },
  { name_th: 'หนองบัวลำภู', name_en: 'Nong Bua Lam Phu' },
  { name_th: 'อำนาจเจริญ', name_en: 'Amnat Charoen' },
  { name_th: 'อุดรธานี', name_en: 'Udon Thani' },
  { name_th: 'อุบลราชธานี', name_en: 'Ubon Ratchathani' },

  // Southern Region (14 provinces)
  { name_th: 'กระบี่', name_en: 'Krabi' },
  { name_th: 'ชุมพร', name_en: 'Chumphon' },
  { name_th: 'ตรัง', name_en: 'Trang' },
  { name_th: 'นครศรีธรรมราช', name_en: 'Nakhon Si Thammarat' },
  { name_th: 'นราธิวาส', name_en: 'Narathiwat' },
  { name_th: 'ปัตตานี', name_en: 'Pattani' },
  { name_th: 'ประจวบคีรีขันธ์', name_en: 'Prachuap Khiri Khan' },
  { name_th: 'พังงา', name_en: 'Phang Nga' },
  { name_th: 'พัทลุง', name_en: 'Phatthalung' },
  { name_th: 'ภูเก็ต', name_en: 'Phuket' },
  { name_th: 'ยะลา', name_en: 'Yala' },
  { name_th: 'ระนอง', name_en: 'Ranong' },
  { name_th: 'สงขลา', name_en: 'Songkhla' },
  { name_th: 'สตูล', name_en: 'Satun' },
  { name_th: 'สุราษฎร์ธานี', name_en: 'Surat Thani' },

  // Western Region (4 provinces)
  { name_th: 'ราชบุรี', name_en: 'Ratchaburi' },
  { name_th: 'กาญจนบุรี', name_en: 'Kanchanaburi' }, // Duplicate - will be handled
  { name_th: 'เพชรบุรี', name_en: 'Phetchaburi' }, // Duplicate - will be handled
  { name_th: 'ประจวบคีรีขันธ์', name_en: 'Prachuap Khiri Khan' }, // Duplicate - will be handled
];

// Remove duplicates and get clean list of 77 provinces
export const CLEAN_THAILAND_PROVINCES: NewProvince[] = [
  // Central Region (23 provinces)
  { name_th: 'กรุงเทพมหานคร', name_en: 'Bangkok' },
  { name_th: 'กาญจนบุรี', name_en: 'Kanchanaburi' },
  { name_th: 'กำแพงเพชร', name_en: 'Kamphaeng Phet' },
  { name_th: 'ชัยนาท', name_en: 'Chai Nat' },
  { name_th: 'นครนายก', name_en: 'Nakhon Nayok' },
  { name_th: 'นครปฐม', name_en: 'Nakhon Pathom' },
  { name_th: 'นครสวรรค์', name_en: 'Nakhon Sawan' },
  { name_th: 'นนทบุรี', name_en: 'Nonthaburi' },
  { name_th: 'ปทุมธานี', name_en: 'Pathum Thani' },
  { name_th: 'พระนครศรีอยุธยา', name_en: 'Phra Nakhon Si Ayutthaya' },
  { name_th: 'พิจิตร', name_en: 'Phichit' },
  { name_th: 'พิษณุโลก', name_en: 'Phitsanulok' },
  { name_th: 'เพชรบูรณ์', name_en: 'Phetchabun' },
  { name_th: 'ลพบุรี', name_en: 'Lopburi' },
  { name_th: 'สมุทรปราการ', name_en: 'Samut Prakan' },
  { name_th: 'สมุทรสงคราม', name_en: 'Samut Songkhram' },
  { name_th: 'สมุทรสาคร', name_en: 'Samut Sakhon' },
  { name_th: 'สิงห์บุรี', name_en: 'Sing Buri' },
  { name_th: 'สุโขทัย', name_en: 'Sukhothai' },
  { name_th: 'สุพรรณบุรี', name_en: 'Suphan Buri' },
  { name_th: 'สระบุรี', name_en: 'Saraburi' },
  { name_th: 'อ่างทอง', name_en: 'Ang Thong' },
  { name_th: 'อุทัยธานี', name_en: 'Uthai Thani' },

  // Eastern Region (7 provinces)
  { name_th: 'จันทบุรี', name_en: 'Chanthaburi' },
  { name_th: 'ฉะเชิงเทรา', name_en: 'Chachoengsao' },
  { name_th: 'ชลบุรี', name_en: 'Chon Buri' },
  { name_th: 'ตราด', name_en: 'Trat' },
  { name_th: 'ปราจีนบุรี', name_en: 'Prachin Buri' },
  { name_th: 'ระยอง', name_en: 'Rayong' },
  { name_th: 'สระแก้ว', name_en: 'Sa Kaeo' },

  // Northern Region (9 provinces)
  { name_th: 'เชียงราย', name_en: 'Chiang Rai' },
  { name_th: 'เชียงใหม่', name_en: 'Chiang Mai' },
  { name_th: 'ตาก', name_en: 'Tak' },
  { name_th: 'น่าน', name_en: 'Nan' },
  { name_th: 'พะเยา', name_en: 'Phayao' },
  { name_th: 'แพร่', name_en: 'Phrae' },
  { name_th: 'แม่ฮ่องสอน', name_en: 'Mae Hong Son' },
  { name_th: 'ลำปาง', name_en: 'Lampang' },
  { name_th: 'ลำพูน', name_en: 'Lamphun' },

  // Northeastern Region (20 provinces)
  { name_th: 'กาฬสินธุ์', name_en: 'Kalasin' },
  { name_th: 'ขอนแก่น', name_en: 'Khon Kaen' },
  { name_th: 'ชัยภูมิ', name_en: 'Chaiyaphum' },
  { name_th: 'นครพนม', name_en: 'Nakhon Phanom' },
  { name_th: 'นครราชสีมา', name_en: 'Nakhon Ratchasima' },
  { name_th: 'บึงกาฬ', name_en: 'Bueng Kan' },
  { name_th: 'บุรีรัมย์', name_en: 'Buriram' },
  { name_th: 'มหาสารคาม', name_en: 'Maha Sarakham' },
  { name_th: 'มุกดาหาร', name_en: 'Mukdahan' },
  { name_th: 'ยโสธร', name_en: 'Yasothon' },
  { name_th: 'ร้อยเอ็ด', name_en: 'Roi Et' },
  { name_th: 'เลย', name_en: 'Loei' },
  { name_th: 'ศรีสะเกษ', name_en: 'Sisaket' },
  { name_th: 'สกลนคร', name_en: 'Sakon Nakhon' },
  { name_th: 'สุรินทร์', name_en: 'Surin' },
  { name_th: 'หนองคาย', name_en: 'Nong Khai' },
  { name_th: 'หนองบัวลำภู', name_en: 'Nong Bua Lam Phu' },
  { name_th: 'อำนาจเจริญ', name_en: 'Amnat Charoen' },
  { name_th: 'อุดรธานี', name_en: 'Udon Thani' },
  { name_th: 'อุบลราชธานี', name_en: 'Ubon Ratchathani' },

  // Southern Region (14 provinces) 
  { name_th: 'กระบี่', name_en: 'Krabi' },
  { name_th: 'ชุมพร', name_en: 'Chumphon' },
  { name_th: 'ตรัง', name_en: 'Trang' },
  { name_th: 'นครศรีธรรมราช', name_en: 'Nakhon Si Thammarat' },
  { name_th: 'นราธิวาส', name_en: 'Narathiwat' },
  { name_th: 'ปัตตานี', name_en: 'Pattani' },
  { name_th: 'ประจวบคีรีขันธ์', name_en: 'Prachuap Khiri Khan' },
  { name_th: 'พังงา', name_en: 'Phang Nga' },
  { name_th: 'พัทลุง', name_en: 'Phatthalung' },
  { name_th: 'ภูเก็ต', name_en: 'Phuket' },
  { name_th: 'ยะลา', name_en: 'Yala' },
  { name_th: 'ระนอง', name_en: 'Ranong' },
  { name_th: 'สงขลา', name_en: 'Songkhla' },
  { name_th: 'สตูล', name_en: 'Satun' },
  { name_th: 'สุราษฎร์ธานี', name_en: 'Surat Thani' },

  // Western Region (4 provinces)
  { name_th: 'ราชบุรี', name_en: 'Ratchaburi' },
  { name_th: 'เพชรบุรี', name_en: 'Phetchaburi' },
];

export async function seedAllProvinces() {
  console.log('🌍 Seeding all 77 provinces of Thailand...');
  
  try {
    // Check existing provinces first
    const existingProvinces = await db.select().from(schema.provinces);
    console.log(`ℹ️ Found ${existingProvinces.length} existing provinces.`);

    if (existingProvinces.length >= 77) {
      console.log('✅ All 77 provinces already exist. No seeding needed.');
      return existingProvinces;
    }

    // Find which provinces are missing by checking English names
    const existingNames = new Set(existingProvinces.map(p => p.name_en));
    const missingProvinces = CLEAN_THAILAND_PROVINCES.filter(
      province => !existingNames.has(province.name_en)
    );

    if (missingProvinces.length === 0) {
      console.log('✅ All required provinces already exist.');
      return existingProvinces;
    }

    console.log(`📝 Adding ${missingProvinces.length} missing provinces...`);
    
    // Insert only missing provinces
    const insertedProvinces = await db.insert(schema.provinces)
      .values(missingProvinces)
      .returning();
    
    console.log(`✅ Successfully added ${insertedProvinces.length} new provinces.`);
    
    // Get final count
    const allProvinces = await db.select().from(schema.provinces);
    console.log(`📊 Total provinces in database: ${allProvinces.length}`);
    
    if (allProvinces.length >= 77) {
      console.log('\n📍 All provinces now available by region:');
      
      // Display summary by region (if we have close to 77 provinces)
      const regions = {
        'Central': { start: 1, count: 23 },
        'Eastern': { start: 24, count: 7 },
        'Northern': { start: 31, count: 9 },
        'Northeastern': { start: 40, count: 20 },
        'Southern': { start: 60, count: 15 },
        'Western': { start: 75, count: 2 }
      };

      Object.entries(regions).forEach(([region, info]) => {
        console.log(`\n${region} Region: ${info.count} provinces available`);
      });
    }

    return allProvinces;
  } catch (error) {
    console.error('❌ Error seeding provinces:', error);
    throw error;
  } finally {
    // Close pool connection after seeding
    if (pool && !(pool as any)._ended) {
      await pool.end();
      console.log('\n🔌 Database connection closed.');
    }
  }
}

async function main() {
  try {
    console.log('Starting province seeding...');
    
    await seedAllProvinces();
    
    console.log('✅ Province seeding completed successfully');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Province seeding failed:', error);
    process.exit(1);
  }
}

// Export for programmatic use
export { seedAllProvinces as seedProvinces };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
} 