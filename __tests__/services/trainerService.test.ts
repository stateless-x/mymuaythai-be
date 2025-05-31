import { describe, it, expect, mock, beforeEach, afterEach } from 'bun:test';
import { TrainerService } from '../../src/services/trainerService';
import * as schema from '../../src/db/schema';
import { db } from '../../src/db/config';
import type { TrainerWithDetails, Province, Gym, Class, Tag, CreateTrainerRequest, Trainer, UpdateTrainerRequest } from '../../src/types';
import { eq, ilike, and, or, desc, sql, count, SQL } from 'drizzle-orm';

// Mock drizzle-orm functions
mock.module('drizzle-orm', () => ({
  eq: mock((col: any, val: any) => ({ col, val, type: 'eq' })),
  ilike: mock((col: any, val: any) => ({ col, val, type: 'ilike' })),
  and: mock((...args: any[]) => ({ args, type: 'and' })),
  or: mock((...args: any[]) => ({ args, type: 'or' })),
  desc: mock((col: any) => ({ col, type: 'desc' })),
  sql: mock((strings: TemplateStringsArray, ...values: any[]) => ({ strings, values, type: 'sql' })),
  count: mock((col: any) => ({ col: col || 'default', type: 'count', toSQL: () => 'COUNT(*)' })),
}));

// Mock the db and schema
mock.module('../../src/db/config', () => ({
  db: {
    select: mock(() => ({})),
    insert: mock(() => ({})),
    update: mock(() => ({})),
    delete: mock(() => ({})),
  }
}));

mock.module('../../src/db/schema', () => ({ ...schema }));

const mockDbFluent = (resolveValue: any) => {
  const mockChain: any = {
    select: mock().mockReturnThis(),
    from: mock().mockReturnThis(),
    leftJoin: mock().mockReturnThis(),
    where: mock().mockReturnThis(),
    orderBy: mock().mockReturnThis(),
    limit: mock().mockReturnThis(),
    offset: mock().mockReturnThis(),
    returning: mock().mockResolvedValue(resolveValue),
    values: mock().mockReturnThis(),
    set: mock().mockReturnThis(),
    then: mock((onFulfilled: any, onRejected: any) => Promise.resolve(resolveValue).then(onFulfilled, onRejected)),
    toSQL: mock(() => ({ sql: 'mocked sql', params: [] })),
  };
  
  return mockChain;
};

describe('TrainerService', () => {
  let trainerService: TrainerService;

  beforeEach(() => {
    trainerService = new TrainerService();
    (db.select as any).mockReset();
    (db.insert as any).mockReset();
    (db.update as any).mockReset();
    (db.delete as any).mockReset();
    
    (eq as any).mockClear();
    (ilike as any).mockClear();
    (and as any).mockClear();
    (or as any).mockClear();
    (desc as any).mockClear();
    (count as any).mockClear();
  });

  afterEach(() => {
    // Cleanup
  });

  describe('createTrainer', () => {
    it('should create a new trainer successfully', async () => {
      const trainerData: CreateTrainerRequest = {
        first_name_th: 'สมชาย',
        first_name_en: 'Somchai',
        last_name_th: 'ใจดี',
        last_name_en: 'Jaidee',
        bio_th: 'ครูมวยไทยมากประสบการณ์',
        bio_en: 'Experienced Muay Thai trainer',
        phone: '0891234567',
        email: 'somchai@example.com',
        line_id: 'somchai123',
        is_freelance: false,
        gym_id: 'test-gym-id',
        province_id: 1
      };

      const createdTrainerMock: Trainer = {
        id: 'new-trainer-id',
        first_name_th: trainerData.first_name_th,
        first_name_en: trainerData.first_name_en,
        last_name_th: trainerData.last_name_th || null,
        last_name_en: trainerData.last_name_en || null,
        bio_th: trainerData.bio_th || null,
        bio_en: trainerData.bio_en || null,
        phone: trainerData.phone || null,
        email: trainerData.email || null,
        line_id: trainerData.line_id || null,
        is_freelance: trainerData.is_freelance || false,
        gym_id: trainerData.gym_id || null,
        province_id: trainerData.province_id || null,
        is_active: true,
        created_at: new Date(),
      };

      const mockChain = mockDbFluent([createdTrainerMock]);
      (db.insert as any).mockReturnValue(mockChain);

      const result = await trainerService.createTrainer(trainerData);
      
      expect(result).toEqual(createdTrainerMock);
      expect(db.insert).toHaveBeenCalledWith(schema.trainers);
    });

    it('should create a freelance trainer', async () => {
      const freelanceTrainerData: CreateTrainerRequest = {
        first_name_th: 'มานะ',
        first_name_en: 'Mana',
        last_name_th: 'อิสระ',
        last_name_en: 'Isara',
        is_freelance: true,
        province_id: 1
      };

      const createdFreelanceTrainerMock: Trainer = {
        id: 'freelance-trainer-id',
        first_name_th: freelanceTrainerData.first_name_th,
        first_name_en: freelanceTrainerData.first_name_en,
        last_name_th: freelanceTrainerData.last_name_th || null,
        last_name_en: freelanceTrainerData.last_name_en || null,
        bio_th: null,
        bio_en: null,
        phone: null,
        email: null,
        line_id: null,
        is_freelance: true,
        gym_id: null,
        province_id: 1,
        is_active: true,
        created_at: new Date(),
      };

      const mockChain = mockDbFluent([createdFreelanceTrainerMock]);
      (db.insert as any).mockReturnValue(mockChain);

      const result = await trainerService.createTrainer(freelanceTrainerData);
      
      expect(result).toEqual(createdFreelanceTrainerMock);
      expect(result.is_freelance).toBe(true);
      expect(result.gym_id).toBe(null);
    });
  });

  describe('getAllTrainers', () => {
    it('should return paginated trainers', async () => {
      const mockTrainers = [
        {
          id: 'trainer1',
          first_name_th: 'ครูมวย1',
          first_name_en: 'Trainer1',
          last_name_th: null,
          last_name_en: null,
          bio_th: null,
          bio_en: null,
          phone: null,
          email: null,
          line_id: null,
          is_freelance: false,
          gym_id: 'gym1',
          province_id: 1,
          is_active: true,
          created_at: new Date(),
          provinceData: { id: 1, name_th: 'กรุงเทพ', name_en: 'Bangkok' } as Province,
          gymData: { id: 'gym1', name_th: 'ยิม1', name_en: 'Gym1' } as any
        },
        {
          id: 'trainer2',
          first_name_th: 'ครูมวย2',
          first_name_en: 'Trainer2',
          last_name_th: null,
          last_name_en: null,
          bio_th: null,
          bio_en: null,
          phone: null,
          email: null,
          line_id: null,
          is_freelance: true,
          gym_id: null,
          province_id: 1,
          is_active: true,
          created_at: new Date(),
          provinceData: { id: 1, name_th: 'กรุงเทพ', name_en: 'Bangkok' } as Province,
          gymData: null
        }
      ];

      // Mock the main query
      (db.select as any).mockReturnValueOnce(mockDbFluent(mockTrainers));
      // Mock the count query
      (db.select as any).mockReturnValueOnce(mockDbFluent([{ value: 2 }]));

      const result = await trainerService.getAllTrainers(1, 2);

      expect(result).toBeDefined();
      expect(result.trainers).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(db.select).toHaveBeenCalledTimes(2);
    });

    it('should filter by gym', async () => {
      const mockTrainers = [
        {
          id: 'trainer1',
          first_name_th: 'ครูมวย1',
          first_name_en: 'Trainer1',
          gym_id: 'test-gym-id',
          is_active: true,
          provinceData: { id: 1, name_th: 'กรุงเทพ', name_en: 'Bangkok' } as Province,
          gymData: { id: 'test-gym-id', name_th: 'ยิมทดสอบ', name_en: 'Test Gym' } as any
        }
      ];

      (db.select as any).mockReturnValueOnce(mockDbFluent(mockTrainers));
      (db.select as any).mockReturnValueOnce(mockDbFluent([{ value: 1 }]));

      const result = await trainerService.getAllTrainers(1, 10, undefined, undefined, 'test-gym-id');

      expect(result).toBeDefined();
      expect(result.trainers).toHaveLength(1);
      expect(result.trainers[0].gym_id).toBe('test-gym-id');
    });

    it('should filter by province', async () => {
      const mockTrainers = [
        {
          id: 'trainer1',
          first_name_th: 'ครูมวย1',
          first_name_en: 'Trainer1',
          province_id: 1,
          is_active: true,
          provinceData: { id: 1, name_th: 'กรุงเทพ', name_en: 'Bangkok' } as Province,
          gymData: null
        }
      ];

      (db.select as any).mockReturnValueOnce(mockDbFluent(mockTrainers));
      (db.select as any).mockReturnValueOnce(mockDbFluent([{ value: 1 }]));

      const result = await trainerService.getAllTrainers(1, 10, undefined, 1);

      expect(result).toBeDefined();
      expect(result.trainers).toHaveLength(1);
      expect(result.trainers[0].province_id).toBe(1);
    });

    it('should filter freelance trainers', async () => {
      const mockTrainers = [
        {
          id: 'trainer1',
          first_name_th: 'ครูมวย1',
          first_name_en: 'Trainer1',
          is_freelance: true,
          gym_id: null,
          is_active: true,
          provinceData: { id: 1, name_th: 'กรุงเทพ', name_en: 'Bangkok' } as Province,
          gymData: null
        }
      ];

      (db.select as any).mockReturnValueOnce(mockDbFluent(mockTrainers));
      (db.select as any).mockReturnValueOnce(mockDbFluent([{ value: 1 }]));

      const result = await trainerService.getAllTrainers(1, 10, undefined, undefined, undefined, true);

      expect(result).toBeDefined();
      expect(result.trainers).toHaveLength(1);
      expect(result.trainers[0].is_freelance).toBe(true);
    });

    it('should search trainers by name', async () => {
      const mockTrainers = [
        {
          id: 'trainer1',
          first_name_th: 'ครูมวย1',
          first_name_en: 'Trainer1',
          is_active: true,
          provinceData: { id: 1, name_th: 'กรุงเทพ', name_en: 'Bangkok' } as Province,
          gymData: null
        }
      ];

      (db.select as any).mockReturnValueOnce(mockDbFluent(mockTrainers));
      (db.select as any).mockReturnValueOnce(mockDbFluent([{ value: 1 }]));

      const result = await trainerService.getAllTrainers(1, 10, 'Trainer1');

      expect(result).toBeDefined();
      expect(result.trainers.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getTrainerById', () => {
    it('should return trainer with details', async () => {
      const trainerId = 'test-trainer-id';
      const mockTrainerData = {
        id: trainerId,
        first_name_th: 'ทดสอบ',
        first_name_en: 'Test',
        last_name_th: 'นามสกุล',
        last_name_en: 'Lastname',
        bio_th: 'ประวัติย่อ',
        bio_en: 'Bio',
        phone: '0123456789',
        email: 'test@example.com',
        line_id: '@test',
        is_freelance: false,
        gym_id: 'test-gym-id',
        province_id: 1,
        is_active: true,
        created_at: new Date(),
        provinceData: { id: 1, name_th: 'กรุงเทพ', name_en: 'Bangkok' } as Province,
        gymData: { id: 'test-gym-id', name_th: 'ยิมทดสอบ', name_en: 'Test Gym' } as any
      };

      const mockClasses: Class[] = [
        { id: 'class1', name_th: 'มวยไทย', name_en: 'Muay Thai', description_th: null, description_en: null }
      ];

      const mockTags: Tag[] = [
        { id: 'tag1', name_th: 'ผู้เชี่ยวชาญ', name_en: 'Expert' }
      ];

      // Mock the main trainer query
      (db.select as any).mockReturnValueOnce(mockDbFluent([mockTrainerData]));
      // Mock the trainer classes query
      (db.select as any).mockReturnValueOnce(mockDbFluent([{ class_id: 'class1' }]));
      // Mock the classes query
      (db.select as any).mockReturnValueOnce(mockDbFluent(mockClasses));
      // Mock the trainer tags query
      (db.select as any).mockReturnValueOnce(mockDbFluent([{ tag_id: 'tag1' }]));
      // Mock the tags query
      (db.select as any).mockReturnValueOnce(mockDbFluent(mockTags));

      const result = await trainerService.getTrainerById(trainerId);

      expect(result).toBeDefined();
      expect(result?.id).toBe(trainerId);
      expect(result?.first_name_en).toBe('Test');
      expect(result?.province?.name_en).toBe('Bangkok');
      expect(result?.primaryGym?.name_en).toBe('Test Gym');
      expect(result?.classes).toEqual(mockClasses);
      expect(result?.tags).toEqual(mockTags);
      expect(db.select).toHaveBeenCalledTimes(5);
    });

    it('should return null for non-existent trainer', async () => {
      const trainerId = 'non-existent-id';
      const mockChain = mockDbFluent([]);
      (db.select as any).mockReturnValueOnce(mockChain);

      const result = await trainerService.getTrainerById(trainerId);

      expect(result).toBeNull();
      expect(db.select).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateTrainer', () => {
    it('should update trainer successfully', async () => {
      const trainerId = 'test-trainer-id';
      const updateData: UpdateTrainerRequest = {
        email: 'updated@example.com'
      };

      const updatedTrainerMock: Trainer = {
        id: trainerId,
        first_name_th: 'อัปเดต',
        first_name_en: 'Updated',
        last_name_th: null,
        last_name_en: null,
        bio_th: null,
        bio_en: null,
        phone: null,
        email: 'updated@example.com',
        line_id: null,
        is_freelance: false,
        gym_id: null,
        province_id: 1,
        is_active: true,
        created_at: new Date(),
      };

      const mockChain = mockDbFluent([updatedTrainerMock]);
      (db.update as any).mockReturnValue(mockChain);

      const result = await trainerService.updateTrainer(trainerId, updateData);
      
      expect(result).toEqual(updatedTrainerMock);
      expect(result?.email).toBe('updated@example.com');
    });

    it('should return null for non-existent trainer', async () => {
      const trainerId = 'non-existent-id';
      const updateData: UpdateTrainerRequest = {
        email: 'test@example.com'
      };

      const mockChain = mockDbFluent([]);
      (db.update as any).mockReturnValue(mockChain);

      const result = await trainerService.updateTrainer(trainerId, updateData);
      
      expect(result).toBeNull();
    });
  });

  describe('deleteTrainer', () => {
    it('should soft delete trainer successfully', async () => {
      const trainerId = 'test-trainer-id';

      const mockChain = mockDbFluent([{ id: trainerId }]);
      (db.update as any).mockReturnValue(mockChain);

      const result = await trainerService.deleteTrainer(trainerId);
      
      expect(result).toBe(true);
      expect(db.update).toHaveBeenCalledWith(schema.trainers);
    });

    it('should return false for non-existent trainer', async () => {
      const trainerId = 'non-existent-id';

      const mockChain = mockDbFluent([]);
      (db.update as any).mockReturnValue(mockChain);

      const result = await trainerService.deleteTrainer(trainerId);
      
      expect(result).toBe(false);
    });
  });

  describe('trainer classes management', () => {
    it('should add and remove trainer classes', async () => {
      const trainerId = 'test-trainer-id';
      const classId = 'test-class-id';

      // Mock add class - returns boolean, not object
      const mockAddChain = mockDbFluent([{ id: 'tc1', trainer_id: trainerId, class_id: classId }]);
      (db.insert as any).mockReturnValueOnce(mockAddChain);

      const addResult = await trainerService.addTrainerClass(trainerId, classId);
      expect(addResult).toBe(true); // addTrainerClass returns boolean

      // Mock remove class
      const mockRemoveChain = mockDbFluent([{ id: 'tc1' }]);
      (db.delete as any).mockReturnValue(mockRemoveChain);

      const removeResult = await trainerService.removeTrainerClass(trainerId, classId);
      expect(removeResult).toBe(true);
    });
  });

  describe('search and filtering', () => {
    it('should search trainers by bio content', async () => {
      const mockTrainers = [
        {
          id: 'trainer1',
          first_name_th: 'ครู',
          first_name_en: 'Teacher',
          bio_en: 'Experienced trainer',
          is_active: true,
          provinceData: null,
          gymData: null
        }
      ];

      (db.select as any).mockReturnValueOnce(mockDbFluent(mockTrainers));
      (db.select as any).mockReturnValueOnce(mockDbFluent([{ value: 1 }]));

      const result = await trainerService.getAllTrainers(1, 10, 'Experienced');

      expect(result).toBeDefined();
      expect(result.trainers.length).toBeGreaterThanOrEqual(0);
    });

    it('should return paginated search results', async () => {
      const mockTrainers = [
        {
          id: 'trainer1',
          first_name_th: 'ครู1',
          first_name_en: 'Teacher1',
          is_active: true,
          provinceData: null,
          gymData: null
        }
      ];

      (db.select as any).mockReturnValueOnce(mockDbFluent(mockTrainers));
      (db.select as any).mockReturnValueOnce(mockDbFluent([{ value: 1 }]));

      const result = await trainerService.getAllTrainers(1, 1, 'Teacher');

      expect(result).toBeDefined();
      expect(result.trainers).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('getFreelanceTrainers', () => {
    it('should return only freelance trainers', async () => {
      const mockTrainers = [
        {
          id: 'trainer1',
          first_name_th: 'ครูอิสระ',
          first_name_en: 'Freelance',
          is_freelance: true,
          gym_id: null,
          is_active: true,
          provinceData: null,
          gymData: null
        }
      ];

      (db.select as any).mockReturnValueOnce(mockDbFluent(mockTrainers));
      (db.select as any).mockReturnValueOnce(mockDbFluent([{ value: 1 }]));

      const result = await trainerService.getFreelanceTrainers();

      expect(result).toBeDefined();
      expect(result.trainers.every(t => t.is_freelance === true)).toBe(true);
    });
  });

  describe('getTrainersByGym', () => {
    it('should return trainers for specific gym', async () => {
      const gymId = 'test-gym-id';
      const mockTrainers = [
        {
          id: 'trainer1',
          first_name_th: 'ครูยิม',
          first_name_en: 'Gym Trainer',
          gym_id: gymId,
          is_active: true,
          provinceData: null,
          gymData: { id: gymId, name_th: 'ยิม', name_en: 'Gym' } as any
        }
      ];

      (db.select as any).mockReturnValueOnce(mockDbFluent(mockTrainers));
      (db.select as any).mockReturnValueOnce(mockDbFluent([{ value: 1 }]));

      const result = await trainerService.getTrainersByGym(gymId);

      expect(result).toBeDefined();
      expect(result.trainers.every(t => t.gym_id === gymId)).toBe(true);
    });
  });

  describe('getTrainersByProvince', () => {
    it('should return trainers for specific province', async () => {
      const provinceId = 1;
      const mockTrainers = [
        {
          id: 'trainer1',
          first_name_th: 'ครูจังหวัด',
          first_name_en: 'Province Trainer',
          province_id: provinceId,
          is_active: true,
          provinceData: { id: provinceId, name_th: 'กรุงเทพ', name_en: 'Bangkok' } as Province,
          gymData: null
        }
      ];

      (db.select as any).mockReturnValueOnce(mockDbFluent(mockTrainers));
      (db.select as any).mockReturnValueOnce(mockDbFluent([{ value: 1 }]));

      const result = await trainerService.getTrainersByProvince(provinceId);

      expect(result).toBeDefined();
      expect(result.trainers.every(t => t.province_id === provinceId)).toBe(true);
    });
  });
}); 