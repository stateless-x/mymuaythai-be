import { describe, it, expect, mock, beforeEach, afterEach } from 'bun:test';
import * as trainerService from '../../src/services/trainerService';
import * as schema from '../../src/db/schema';
import { db } from '../../src/db/config';
import type { TrainerWithDetails, Province, Gym, Class, Tag, CreateTrainerRequest, Trainer, UpdateTrainerRequest } from '../../src/types';
import { eq, ilike, and, or, desc, sql, count, SQL, inArray } from 'drizzle-orm';

// Mock drizzle-orm functions
mock.module('drizzle-orm', () => ({
  eq: mock((col: any, val: any) => ({ col, val, type: 'eq' })),
  ilike: mock((col: any, val: any) => ({ col, val, type: 'ilike' })),
  and: mock((...args: any[]) => ({ args, type: 'and' })),
  or: mock((...args: any[]) => ({ args, type: 'or' })),
  desc: mock((col: any) => ({ col, type: 'desc' })),
  sql: mock((strings: TemplateStringsArray, ...values: any[]) => ({ strings, values, type: 'sql' })),
  count: mock((col: any) => ({ col: col || 'default', type: 'count', toSQL: () => 'COUNT(*)' })),
  inArray: mock((col: any, val: any) => ({ col, val, type: 'inArray' })),
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

describe('TrainerService Functions', () => {
  beforeEach(() => {
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
    (inArray as any).mockClear();
  });

  afterEach(() => {
    // Cleanup
  });

  describe('getTrainerById', () => {
    it('should return null if trainer is not found', async () => {
      const trainerId = 'non-existent-id';
      const mockChain = mockDbFluent([]);
      (db.select as any).mockReturnValueOnce(mockChain);

      const result = await trainerService.getTrainerById(trainerId);

      expect(result).toBeNull();
      expect(db.select).toHaveBeenCalledTimes(1);
    });

    it('should return trainer details if trainer is found', async () => {
      const trainerId = 'existing-id';
      const mockTrainerData = {
        id: trainerId,
        first_name_th: 'ชื่อ',
        last_name_th: 'นามสกุล',
        first_name_en: 'First',
        last_name_en: 'Last',
        bio_th: 'ประวัติ',
        bio_en: 'Bio',
        phone: '1234567890',
        email: 'trainer@example.com',
        line_id: '@trainer',
        is_freelance: false,
        gym_id: 'gym-id',
        province_id: 1,
        is_active: true,
        created_at: new Date(),
        provinceData: { id: 1, name_th: 'กรุงเทพฯ', name_en: 'Bangkok' } as Province,
        gymData: { id: 'gym-id', name_th: 'ยิม', name_en: 'Gym' } as Gym,
      };
      
      const mockClasses: Class[] = [
        { id: 'class1', name_th: 'มวยไทยพื้นฐาน', name_en: 'Basic Muay Thai', description_th: null, description_en: null }
      ];
      const mockTags: Tag[] = [
        { id: 'tag1', name_th: 'มืออาชีพ', name_en: 'Professional' }
      ];

      // Mock the main trainer select query
      (db.select as any).mockReturnValueOnce(mockDbFluent([mockTrainerData]));
      // Mock the trainerClasses select query
      (db.select as any).mockReturnValueOnce(mockDbFluent([{ class_id: 'class1' }]));
      // Mock the classes select query
      (db.select as any).mockReturnValueOnce(mockDbFluent(mockClasses));
      // Mock the trainerTags select query
      (db.select as any).mockReturnValueOnce(mockDbFluent([{ tag_id: 'tag1' }]));
      // Mock the tags select query
      (db.select as any).mockReturnValueOnce(mockDbFluent(mockTags));

      const result = await trainerService.getTrainerById(trainerId);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(trainerId);
      expect(result?.first_name_en).toBe('First');
      expect(result?.classes).toEqual(mockClasses);
      expect(result?.tags).toEqual(mockTags);
      expect(result?.province?.name_en).toBe('Bangkok');
      expect(result?.primaryGym?.name_en).toBe('Gym');
      expect(db.select).toHaveBeenCalledTimes(5);
    });
  });

  describe('createTrainer', () => {
    it('should create a new trainer and return it', async () => {
      const newTrainerData: CreateTrainerRequest = {
        first_name_th: 'ชื่อใหม่',
        last_name_th: 'นามสกุลใหม่',
        first_name_en: 'New',
        last_name_en: 'Trainer',
        bio_th: 'ประวัติใหม่',
        bio_en: 'New bio',
        phone: '0987654321',
        email: 'newtrainer@example.com',
        line_id: '@newtrainer',
        is_freelance: true,
        province_id: 1
      };
      
      const createdTrainerMock: Trainer = {
        id: 'new-trainer-id',
        first_name_th: newTrainerData.first_name_th,
        last_name_th: newTrainerData.last_name_th ?? null,
        first_name_en: newTrainerData.first_name_en,
        last_name_en: newTrainerData.last_name_en ?? null,
        bio_th: newTrainerData.bio_th || null,
        bio_en: newTrainerData.bio_en || null,
        phone: newTrainerData.phone || null,
        email: newTrainerData.email || null,
        line_id: newTrainerData.line_id || null,
        is_freelance: newTrainerData.is_freelance || false,
        gym_id: newTrainerData.gym_id || null,
        province_id: newTrainerData.province_id ?? null,
        is_active: true,
        created_at: new Date(),
      };

      const mockChain = mockDbFluent([createdTrainerMock]);
      (db.insert as any).mockReturnValue(mockChain);

      const result = await trainerService.createTrainer(newTrainerData);
      
      expect(result).toEqual(createdTrainerMock);
      expect(db.insert).toHaveBeenCalledWith(schema.trainers);
    });

    it('should throw an error if trainer creation returns no data', async () => {
      const newTrainerData: CreateTrainerRequest = {
        first_name_th: 'Test',
        last_name_th: 'Trainer',
        first_name_en: 'Test',
        last_name_en: 'Trainer',
        province_id: 1
      };
      const mockChain = mockDbFluent([]);
      (db.insert as any).mockReturnValue(mockChain);

      await expect(trainerService.createTrainer(newTrainerData)).rejects.toThrow('Trainer creation failed, no data returned.');
    });
  });

  describe('updateTrainer', () => {
    it('should update a trainer and return the updated trainer', async () => {
      const trainerId = 'existing-trainer-id';
      const updateData: UpdateTrainerRequest = {
        first_name_en: 'Updated',
        phone: '5555555555'
      };
      const updatedTrainerMock: Trainer = {
        id: trainerId,
        first_name_th: 'ชื่อเดิม',
        last_name_th: 'นามสกุลเดิม',
        first_name_en: 'Updated',
        last_name_en: 'Original',
        bio_th: null,
        bio_en: null,
        phone: '5555555555',
        email: null,
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
      expect(db.update).toHaveBeenCalledWith(schema.trainers);
    });

    it('should return null if trainer is not found', async () => {
      const trainerId = 'non-existent-id';
      const updateData: UpdateTrainerRequest = { first_name_en: 'Updated' };
      const mockChain = mockDbFluent([]);
      (db.update as any).mockReturnValue(mockChain);

      const result = await trainerService.updateTrainer(trainerId, updateData);

      expect(result).toBeNull();
    });
  });

  describe('deleteTrainer', () => {
    it('should soft delete a trainer and return true', async () => {
      const trainerId = 'existing-trainer-id';
      const mockChain = mockDbFluent([{ id: trainerId }]);
      (db.update as any).mockReturnValue(mockChain);

      const result = await trainerService.deleteTrainer(trainerId);

      expect(result).toBe(true);
      expect(db.update).toHaveBeenCalledWith(schema.trainers);
    });

    it('should return false if trainer is not found', async () => {
      const trainerId = 'non-existent-id';
      const mockChain = mockDbFluent([]);
      (db.update as any).mockReturnValue(mockChain);

      const result = await trainerService.deleteTrainer(trainerId);

      expect(result).toBe(false);
    });
  });

  describe('getAllTrainers', () => {
    it('should return paginated list of trainers', async () => {
      const mockTrainers = [
        { id: 'trainer1', first_name_en: 'John', provinceData: { id: 1, name_en: 'Bangkok' }, gymData: null },
        { id: 'trainer2', first_name_en: 'Jane', provinceData: { id: 2, name_en: 'Chiang Mai' }, gymData: null }
      ];
      const totalCount = 10;

      const mockChain = mockDbFluent(mockTrainers);
      const mockCountChain = mockDbFluent([{ value: totalCount }]);
      
      (db.select as any).mockReturnValueOnce(mockChain);
      (db.select as any).mockReturnValueOnce(mockCountChain);

      const result = await trainerService.getAllTrainers(1, 20);

      expect(result.trainers).toHaveLength(2);
      expect(result.total).toBe(totalCount);
      expect(db.select).toHaveBeenCalledTimes(2);
    });

    it('should filter by freelance status', async () => {
      const mockFreelanceTrainers = [
        { id: 'freelance1', first_name_en: 'Free', is_freelance: true, provinceData: null, gymData: null }
      ];

      const mockChain = mockDbFluent(mockFreelanceTrainers);
      const mockCountChain = mockDbFluent([{ value: 1 }]);
      
      (db.select as any).mockReturnValueOnce(mockChain);
      (db.select as any).mockReturnValueOnce(mockCountChain);

      const result = await trainerService.getAllTrainers(1, 20, undefined, undefined, undefined, true);

      expect(result.trainers).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('addTrainerClass', () => {
    it('should add a class to a trainer and return true', async () => {
      const trainerId = 'trainer-id';
      const classId = 'class-id';
      const mockChain = mockDbFluent([{ id: 'new-relation-id', trainer_id: trainerId, class_id: classId }]);
      (db.insert as any).mockReturnValue(mockChain);

      const result = await trainerService.addTrainerClass(trainerId, classId);

      expect(result).toBe(true);
      expect(db.insert).toHaveBeenCalledWith(schema.trainerClasses);
    });

    it('should return false if adding class fails', async () => {
      const trainerId = 'trainer-id';
      const classId = 'class-id';
      const mockChain = mockDbFluent([]);
      (db.insert as any).mockReturnValue(mockChain);

      const result = await trainerService.addTrainerClass(trainerId, classId);

      expect(result).toBe(false);
    });

    it('should return false if there is an error', async () => {
      const trainerId = 'trainer-id';
      const classId = 'class-id';
      (db.insert as any).mockImplementation(() => {
        throw new Error('Database error');
      });

      const result = await trainerService.addTrainerClass(trainerId, classId);

      expect(result).toBe(false);
    });
  });

  describe('removeTrainerClass', () => {
    it('should remove a class from a trainer and return true', async () => {
      const trainerId = 'trainer-id';
      const classId = 'class-id';
      const mockChain = mockDbFluent([{ id: 'relation-id' }]);
      (db.delete as any).mockReturnValue(mockChain);

      const result = await trainerService.removeTrainerClass(trainerId, classId);

      expect(result).toBe(true);
      expect(db.delete).toHaveBeenCalledWith(schema.trainerClasses);
    });

    it('should return false if relation is not found', async () => {
      const trainerId = 'trainer-id';
      const classId = 'non-existent-class';
      const mockChain = mockDbFluent([]);
      (db.delete as any).mockReturnValue(mockChain);

      const result = await trainerService.removeTrainerClass(trainerId, classId);

      expect(result).toBe(false);
    });
  });

  describe('getTrainerClasses', () => {
    it('should return trainer classes', async () => {
      const trainerId = 'trainer-id';
      const mockClasses: Class[] = [
        { id: 'class1', name_th: 'มวยไทยพื้นฐาน', name_en: 'Basic Muay Thai', description_th: null, description_en: null },
        { id: 'class2', name_th: 'มวยไทยขั้นสูง', name_en: 'Advanced Muay Thai', description_th: null, description_en: null }
      ];

      // Mock trainerClasses junction query
      const mockJunctionChain = mockDbFluent([
        { class_id: 'class1' },
        { class_id: 'class2' }
      ]);
      (db.select as any).mockReturnValueOnce(mockJunctionChain);
      
      // Mock classes query
      const mockClassesChain = mockDbFluent(mockClasses);
      (db.select as any).mockReturnValueOnce(mockClassesChain);

      const result = await trainerService.getTrainerClasses(trainerId);

      expect(result).toEqual(mockClasses);
      expect(db.select).toHaveBeenCalledTimes(2);
    });

    it('should return empty array if trainer has no classes', async () => {
      const trainerId = 'trainer-id';
      const mockJunctionChain = mockDbFluent([]);
      (db.select as any).mockReturnValueOnce(mockJunctionChain);

      const result = await trainerService.getTrainerClasses(trainerId);

      expect(result).toEqual([]);
      expect(db.select).toHaveBeenCalledTimes(1);
    });
  });

  describe('searchTrainers', () => {
    it('should return empty results for empty search term', async () => {
      const result = await trainerService.searchTrainers('');
      
      expect(result.trainers).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should delegate to getAllTrainers for valid search term', async () => {
      const searchTerm = 'john';
      const mockResult = [
        { id: 'trainer1', first_name_en: 'John', provinceData: null, gymData: null }
      ];

      const mockChain = mockDbFluent(mockResult);
      const mockCountChain = mockDbFluent([{ value: 1 }]);
      
      (db.select as any).mockReturnValueOnce(mockChain);
      (db.select as any).mockReturnValueOnce(mockCountChain);

      const result = await trainerService.searchTrainers(searchTerm);

      expect(result.trainers).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('getTrainersByGym', () => {
    it('should delegate to getAllTrainers with gym filter', async () => {
      const gymId = 'gym-id';
      const mockResult = [
        { id: 'trainer1', gym_id: gymId, provinceData: null, gymData: null }
      ];

      const mockChain = mockDbFluent(mockResult);
      const mockCountChain = mockDbFluent([{ value: 1 }]);
      
      (db.select as any).mockReturnValueOnce(mockChain);
      (db.select as any).mockReturnValueOnce(mockCountChain);

      const result = await trainerService.getTrainersByGym(gymId);

      expect(result.trainers).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('getTrainersByProvince', () => {
    it('should delegate to getAllTrainers with province filter', async () => {
      const provinceId = 1;
      const mockResult = [
        { id: 'trainer1', province_id: provinceId, provinceData: null, gymData: null }
      ];

      const mockChain = mockDbFluent(mockResult);
      const mockCountChain = mockDbFluent([{ value: 1 }]);
      
      (db.select as any).mockReturnValueOnce(mockChain);
      (db.select as any).mockReturnValueOnce(mockCountChain);

      const result = await trainerService.getTrainersByProvince(provinceId);

      expect(result.trainers).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('getFreelanceTrainers', () => {
    it('should delegate to getAllTrainers with freelance filter', async () => {
      const mockResult = [
        { id: 'trainer1', is_freelance: true, provinceData: null, gymData: null }
      ];

      const mockChain = mockDbFluent(mockResult);
      const mockCountChain = mockDbFluent([{ value: 1 }]);
      
      (db.select as any).mockReturnValueOnce(mockChain);
      (db.select as any).mockReturnValueOnce(mockCountChain);

      const result = await trainerService.getFreelanceTrainers();

      expect(result.trainers).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });
}); 