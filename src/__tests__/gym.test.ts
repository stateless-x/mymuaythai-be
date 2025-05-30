import { GymService } from '../services/gymService';
import { resetDatabase } from '../db/reset';
import { disconnectDatabase } from '../db/config';

const gymService = new GymService();

// Simple test runner
class TestRunner {
  private tests: Array<{ name: string; fn: () => Promise<void> }> = [];
  private beforeAllFn?: () => Promise<void>;
  private afterAllFn?: () => Promise<void>;

  beforeAll(fn: () => Promise<void>) {
    this.beforeAllFn = fn;
  }

  afterAll(fn: () => Promise<void>) {
    this.afterAllFn = fn;
  }

  test(name: string, fn: () => Promise<void>) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log('🏃‍♂️ Running Gym Service Tests...\n');

    if (this.beforeAllFn) {
      console.log('🔧 Setting up tests...');
      await this.beforeAllFn();
      console.log('✅ Setup complete\n');
    }

    let passed = 0;
    let failed = 0;

    for (const test of this.tests) {
      try {
        await test.fn();
        console.log(`✅ ${test.name}`);
        passed++;
      } catch (error) {
        console.log(`❌ ${test.name}`);
        console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`);
        failed++;
      }
    }

    if (this.afterAllFn) {
      console.log('\n🧹 Cleaning up...');
      await this.afterAllFn();
      console.log('✅ Cleanup complete');
    }

    console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
    return { passed, failed };
  }
}

// Custom assertion functions
function expect(actual: any) {
  return {
    toBe: (expected: any) => {
      if (actual !== expected) {
        throw new Error(`Expected ${actual} to be ${expected}`);
      }
    },
    toBeDefined: () => {
      if (actual === undefined) {
        throw new Error(`Expected value to be defined`);
      }
    },
    toBeNull: () => {
      if (actual !== null) {
        throw new Error(`Expected ${actual} to be null`);
      }
    },
    toBeInstanceOf: (constructor: any) => {
      if (!(actual instanceof constructor)) {
        throw new Error(`Expected ${actual} to be instance of ${constructor.name}`);
      }
    },
    toBeGreaterThan: (expected: number) => {
      if (actual <= expected) {
        throw new Error(`Expected ${actual} to be greater than ${expected}`);
      }
    }
  };
}

// Create test runner instance
const runner = new TestRunner();

runner.beforeAll(async () => {
  // Reset database before running tests (don't disconnect the pool)
  await resetDatabase(false);
});

runner.test('should get all gyms', async () => {
  const gyms = await gymService.getAllGyms();
  expect(gyms).toBeInstanceOf(Array);
  expect(gyms.length).toBeGreaterThan(0);
});

runner.test('should get gym by ID', async () => {
  const gyms = await gymService.getAllGyms();
  const firstGym = gyms[0];
  
  if (firstGym) {
    const gym = await gymService.getGymById(firstGym.id);
    expect(gym).toBeDefined();
    expect(gym?.id).toBe(firstGym.id);
    expect(gym?.name_en).toBe(firstGym.name_en);
  }
});

runner.test('should return null for non-existent gym', async () => {
  const gym = await gymService.getGymById('550e8400-e29b-41d4-a716-446655440000');
  expect(gym).toBeNull();
});

runner.test('should get gyms by province', async () => {
  const gyms = await gymService.getGymsByProvince(1); // Bangkok
  expect(gyms).toBeInstanceOf(Array);
  gyms.forEach(gym => {
    expect(gym.province_id).toBe(1);
  });
});

runner.test('should search gyms', async () => {
  const results = await gymService.searchGyms('Lumpinee');
  expect(results).toBeInstanceOf(Array);
  expect(results.length).toBeGreaterThan(0);
  
  const gym = results[0];
  const hasMatch = gym?.name_en.toLowerCase().includes('lumpinee') ||
                   gym?.name_th.includes('ลุมพินี');
  if (!hasMatch) {
    throw new Error('Search results should contain Lumpinee gym');
  }
});

runner.test('should create new gym', async () => {
  const newGymData = {
    name_th: 'ยิมทดสอบ',
    name_en: 'Test Gym',
    description_th: 'ยิมสำหรับทดสอบ',
    description_en: 'Gym for testing',
    phone: '02-123-4567',
    email: 'test@testgym.com',
    province_id: 1,
    map_url: 'https://maps.google.com/testgym',
    youtube_url: 'https://youtube.com/@testgym',
    line: '@testgym'
  };

  const createdGym = await gymService.createGym(newGymData);
  expect(createdGym).toBeDefined();
  expect(createdGym.name_en).toBe(newGymData.name_en);
  expect(createdGym.name_th).toBe(newGymData.name_th);
  expect(createdGym.email).toBe(newGymData.email);
  expect(createdGym.is_active).toBe(true);
});

runner.test('should update gym', async () => {
  const gyms = await gymService.getAllGyms();
  const testGym = gyms.find(g => g.name_en === 'Test Gym');
  
  if (testGym) {
    const updateData = {
      name_en: 'Updated Test Gym',
      description_en: 'Updated description'
    };

    const updatedGym = await gymService.updateGym(testGym.id, updateData);
    expect(updatedGym).toBeDefined();
    expect(updatedGym?.name_en).toBe(updateData.name_en);
    expect(updatedGym?.description_en).toBe(updateData.description_en);
  }
});

runner.test('should delete gym (soft delete)', async () => {
  const gyms = await gymService.getAllGyms();
  const testGym = gyms.find(g => g.name_en === 'Updated Test Gym');
  
  if (testGym) {
    const deleted = await gymService.deleteGym(testGym.id);
    expect(deleted).toBe(true);

    // Verify gym is no longer in active gyms
    const gym = await gymService.getGymById(testGym.id);
    expect(gym).toBeNull();
  }
});

runner.test('should handle gym images', async () => {
  const gyms = await gymService.getAllGyms();
  const firstGym = gyms[0];
  
  if (firstGym) {
    // Get existing images
    const initialImages = await gymService.getGymImages(firstGym.id);
    expect(initialImages).toBeInstanceOf(Array);

    // Add new image
    const newImage = await gymService.addGymImage(firstGym.id, 'https://example.com/test-image.jpg');
    expect(newImage).toBeDefined();
    expect(newImage.gym_id).toBe(firstGym.id);
    expect(newImage.image_url).toBe('https://example.com/test-image.jpg');

    // Verify image was added
    const updatedImages = await gymService.getGymImages(firstGym.id);
    expect(updatedImages.length).toBe(initialImages.length + 1);

    // Remove the image
    const removed = await gymService.removeGymImage(newImage.id);
    expect(removed).toBe(true);

    // Verify image was removed
    const finalImages = await gymService.getGymImages(firstGym.id);
    expect(finalImages.length).toBe(initialImages.length);
  }
});

runner.afterAll(async () => {
  // Disconnect database after all tests
  await disconnectDatabase();
});

// Export runner for external execution
export { runner }; 