import '../config/environment'; // Load environment variables first
import { db, pool } from './config';
import * as schema from './schema';
import type { NewProvince } from '../types';
import { sql, inArray } from 'drizzle-orm';

export const THAILAND_PROVINCES: NewProvince[] = (() => {
  // Official Thailand provinces list
  const OFFICIAL_PROVINCES: NewProvince[] = [
    { name_th: 'กรุงเทพมหานคร', name_en: 'Bangkok' },
    { name_th: 'กระบี่', name_en: 'Krabi' },
    { name_th: 'กาญจนบุรี', name_en: 'Kanchanaburi' },
    { name_th: 'กาฬสินธุ์', name_en: 'Kalasin' },
    { name_th: 'กำแพงเพชร', name_en: 'Kamphaeng Phet' },
    { name_th: 'ขอนแก่น', name_en: 'Khon Kaen' },
    { name_th: 'จันทบุรี', name_en: 'Chanthaburi' },
    { name_th: 'ฉะเชิงเทรา', name_en: 'Chachoengsao' },
    { name_th: 'ชัยนาท', name_en: 'Chai Nat' },
    { name_th: 'ชัยภูมิ', name_en: 'Chaiyaphum' },
    { name_th: 'ชุมพร', name_en: 'Chumphon' },
    { name_th: 'เชียงราย', name_en: 'Chiang Rai' },
    { name_th: 'เชียงใหม่', name_en: 'Chiang Mai' },
    { name_th: 'ตรัง', name_en: 'Trang' },
    { name_th: 'ตราด', name_en: 'Trat' },
    { name_th: 'ตาก', name_en: 'Tak' },
    { name_th: 'นครนายก', name_en: 'Nakhon Nayok' },
    { name_th: 'นครปฐม', name_en: 'Nakhon Pathom' },
    { name_th: 'นครพนม', name_en: 'Nakhon Phanom' },
    { name_th: 'นครราชสีมา', name_en: 'Nakhon Ratchasima' },
    { name_th: 'นครศรีธรรมราช', name_en: 'Nakhon Si Thammarat' },
    { name_th: 'นครสวรรค์', name_en: 'Nakhon Sawan' },
    { name_th: 'นนทบุรี', name_en: 'Nonthaburi' },
    { name_th: 'นราธิวาส', name_en: 'Narathiwat' },
    { name_th: 'น่าน', name_en: 'Nan' },
    { name_th: 'บึงกาฬ', name_en: 'Bueng Kan' },
    { name_th: 'บุรีรัมย์', name_en: 'Buriram' },
    { name_th: 'ปทุมธานี', name_en: 'Pathum Thani' },
    { name_th: 'ประจวบคีรีขันธ์', name_en: 'Prachuap Khiri Khan' },
    { name_th: 'ปราจีนบุรี', name_en: 'Prachin Buri' },
    { name_th: 'ปัตตานี', name_en: 'Pattani' },
    { name_th: 'พระนครศรีอยุธยา', name_en: 'Phra Nakhon Si Ayutthaya' },
    { name_th: 'พะเยา', name_en: 'Phayao' },
    { name_th: 'พังงา', name_en: 'Phang Nga' },
    { name_th: 'พัทลุง', name_en: 'Phatthalung' },
    { name_th: 'พิจิตร', name_en: 'Phichit' },
    { name_th: 'พิษณุโลก', name_en: 'Phitsanulok' },
    { name_th: 'เพชรบุรี', name_en: 'Phetchaburi' },
    { name_th: 'เพชรบูรณ์', name_en: 'Phetchabun' },
    { name_th: 'แพร่', name_en: 'Phrae' },
    { name_th: 'ภูเก็ต', name_en: 'Phuket' },
    { name_th: 'มหาสารคาม', name_en: 'Maha Sarakham' },
    { name_th: 'มุกดาหาร', name_en: 'Mukdahan' },
    { name_th: 'แม่ฮ่องสอน', name_en: 'Mae Hong Son' },
    { name_th: 'ยะลา', name_en: 'Yala' },
    { name_th: 'ยโสธร', name_en: 'Yasothon' },
    { name_th: 'ระนอง', name_en: 'Ranong' },
    { name_th: 'ระยอง', name_en: 'Rayong' },
    { name_th: 'ราชบุรี', name_en: 'Ratchaburi' },
    { name_th: 'ร้อยเอ็ด', name_en: 'Roi Et' },
    { name_th: 'ลพบุรี', name_en: 'Lopburi' },
    { name_th: 'ลำปาง', name_en: 'Lampang' },
    { name_th: 'ลำพูน', name_en: 'Lamphun' },
    { name_th: 'เลย', name_en: 'Loei' },
    { name_th: 'ศรีสะเกษ', name_en: 'Sisaket' },
    { name_th: 'สกลนคร', name_en: 'Sakon Nakhon' },
    { name_th: 'สงขลา', name_en: 'Songkhla' },
    { name_th: 'สตูล', name_en: 'Satun' },
    { name_th: 'สมุทรปราการ', name_en: 'Samut Prakan' },
    { name_th: 'สมุทรสงคราม', name_en: 'Samut Songkhram' },
    { name_th: 'สมุทรสาคร', name_en: 'Samut Sakhon' },
    { name_th: 'สระแก้ว', name_en: 'Sa Kaeo' },
    { name_th: 'สระบุรี', name_en: 'Saraburi' },
    { name_th: 'สิงห์บุรี', name_en: 'Sing Buri' },
    { name_th: 'สุโขทัย', name_en: 'Sukhothai' },
    { name_th: 'สุพรรณบุรี', name_en: 'Suphan Buri' },
    { name_th: 'สุราษฎร์ธานี', name_en: 'Surat Thani' },
    { name_th: 'สุรินทร์', name_en: 'Surin' },
    { name_th: 'หนองคาย', name_en: 'Nong Khai' },
    { name_th: 'หนองบัวลำภู', name_en: 'Nong Bua Lam Phu' },
    { name_th: 'อ่างทอง', name_en: 'Ang Thong' },
    { name_th: 'อำนาจเจริญ', name_en: 'Amnat Charoen' },
    { name_th: 'อุดรธานี', name_en: 'Udon Thani' },
    { name_th: 'อุตรดิตถ์', name_en: 'Uttaradit' },
    { name_th: 'อุทัยธานี', name_en: 'Uthai Thani' },
    { name_th: 'อุบลราชธานี', name_en: 'Ubon Ratchathani' },
    { name_th: 'ชลบุรี', name_en: 'Chon Buri' },
    { name_th: 'ชลบุรี', name_en: 'Chon Buri' }, // Duplicate - will be removed by deduplication
  ];

  // Remove duplicates based on name_en
  const seen = new Set<string>();
  return OFFICIAL_PROVINCES.filter(province => {
    if (seen.has(province.name_en)) {
      return false;
    }
    seen.add(province.name_en);
    return true;
  });
})();

export async function purgeDuplicateProvinces() {
  console.log('🗑️ Purging duplicate provinces from database...');
  
  try {
    // Get all provinces from database
    const allProvinces = await db.select().from(schema.provinces).orderBy(schema.provinces.id);
    console.log(`📊 Found ${allProvinces.length} total provinces in database.`);
    
    if (allProvinces.length === 0) {
      console.log('ℹ️ No provinces found in database.');
      return;
    }
    
    // Group provinces by name_en and keep track of duplicates
    const provinceGroups = new Map<string, (typeof allProvinces[0])[]>();
    const duplicateIds: number[] = [];
    
    for (const province of allProvinces) {
      const existing = provinceGroups.get(province.name_en);
      if (existing) {
        // This is a duplicate, add to duplicates list
        existing.push(province);
        duplicateIds.push(province.id);
      } else {
        // First occurrence, create new group
        provinceGroups.set(province.name_en, [province]);
      }
    }
    
    const uniqueProvinces = Array.from(provinceGroups.values()).map(group => group[0]!); // Keep first (lowest ID)
    const duplicateCount = allProvinces.length - uniqueProvinces.length;
    
    console.log(`🔍 Analysis results:`);
    console.log(`   Unique provinces: ${uniqueProvinces.length}`);
    console.log(`   Duplicate entries: ${duplicateCount}`);
    
    if (duplicateCount === 0) {
      console.log('✅ No duplicates found. Database is clean!');
      return allProvinces;
    }
    
    // Show some examples of duplicates
    console.log('\n📋 Duplicate provinces found:');
    for (const [name_en, group] of provinceGroups.entries()) {
      if (group.length > 1) {
        console.log(`   ${name_en}: IDs [${group.map(p => p.id).join(', ')}] - keeping ID ${group[0]!.id}`);
      }
    }
    
    // Delete duplicates (keep the one with lowest ID)
    if (duplicateIds.length > 0) {
      console.log(`\n🗑️ Deleting ${duplicateIds.length} duplicate entries...`);
      
      const deletedCount = await db.delete(schema.provinces)
        .where(inArray(schema.provinces.id, duplicateIds))
        .returning();
      
      console.log(`✅ Successfully deleted ${deletedCount.length} duplicate provinces.`);
    }
    
    // Verify final state
    const finalProvinces = await db.select().from(schema.provinces).orderBy(schema.provinces.id);
    console.log(`\n📊 Final database state:`);
    console.log(`   Total provinces: ${finalProvinces.length}`);
    console.log(`   All entries are now unique by name_en`);
    
    return finalProvinces;
    
  } catch (error) {
    console.error('❌ Error purging duplicate provinces:', error);
    throw error;
  }
}

export async function seedAllProvinces() {
  console.log('🌍 Seeding all provinces of Thailand...');
  console.log(`📋 Total unique provinces to seed: ${THAILAND_PROVINCES.length}`);
  
  try {
    // First, purge any existing duplicates
    await purgeDuplicateProvinces();
    
    // Check existing provinces after purge
    const existingProvinces = await db.select().from(schema.provinces);
    console.log(`ℹ️ Found ${existingProvinces.length} existing unique provinces.`);

    if (existingProvinces.length >= THAILAND_PROVINCES.length) {
      console.log(`✅ All ${THAILAND_PROVINCES.length} provinces already exist. No seeding needed.`);
      return existingProvinces;
    }

    // Find which provinces are missing by checking English names
    const existingNames = new Set(existingProvinces.map(p => p.name_en));
    const missingProvinces = THAILAND_PROVINCES.filter(
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
    
    console.log('\n📍 All provinces seeded successfully!');
    console.log(`   Total unique provinces: ${allProvinces.length}`);
    console.log('   ✓ Includes all major regions of Thailand');
    console.log('   ✓ Deduplicated using English names as unique identifiers');

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
    const args = process.argv.slice(2);
    
    if (args.includes('--purge-only')) {
      console.log('🚀 Running province duplicate purge only...');
      await purgeDuplicateProvinces();
      console.log('✅ Duplicate purge completed successfully');
    } else {
      console.log('🚀 Starting province seeding...');
      await seedAllProvinces();
      console.log('✅ Province seeding completed successfully');
    }
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Operation failed:', error);
    process.exit(1);
  }
}

// Export for programmatic use
export { seedAllProvinces as seedProvinces };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
} 