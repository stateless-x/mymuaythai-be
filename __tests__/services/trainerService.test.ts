import { describe, it, expect, beforeEach, mock } from 'bun:test';
import * as trainerService from '../../src/services/trainerService';
import { db } from '../../src/db/config';
import type { TrainerWithDetails, CreateTrainerRequest, UpdateTrainerRequest, Province, Gym, Class, Tag, Trainer } from '../../src/types';

// Create a proper fluent chain mock
const createFluentChain = (resolveValue: any) => {
  const chain = {
    from: mock(() => chain),
    where: mock(() => chain),
    leftJoin: mock(() => chain),
    orderBy: mock(() => chain),
    limit: mock(() => chain),
    offset: mock(() => chain),
    returning: mock(() => Promise.resolve(resolveValue)),
    values: mock(() => chain),
    set: mock(() => chain),
    then: mock((onFulfilled: any) => Promise.resolve(resolveValue).then(onFulfilled))
  };
  return chain;
};

// Mock the database
mock.module('../../src/db/config', () => ({
  db: {
    select: mock(() => createFluentChain([])),
    insert: mock(() => createFluentChain([])),
    update: mock(() => createFluentChain([])),
    delete: mock(() => createFluentChain([])),
    transaction: mock(async (callback: any) => {
      const tx = {
        select: mock(() => createFluentChain([])),
        insert: mock(() => createFluentChain([{ id: 'new-trainer-id' }])),
        update: mock(() => createFluentChain([])),
        delete: mock(() => createFluentChain([]))
      };
      return await callback(tx);
    })
  }
}));

// Mock schema
mock.module('../../src/db/schema', () => ({
  trainers: {
    id: 'trainers.id',
    first_name_th: 'trainers.first_name_th',
    last_name_th: 'trainers.last_name_th',
    first_name_en: 'trainers.first_name_en',
    last_name_en: 'trainers.last_name_en',
    bio_th: 'trainers.bio_th',
    bio_en: 'trainers.bio_en',
    phone: 'trainers.phone',
    email: 'trainers.email',
    line_id: 'trainers.line_id',
    is_freelance: 'trainers.is_freelance',
    gym_id: 'trainers.gym_id',
    province_id: 'trainers.province_id',
    exp_year: 'trainers.exp_year',
    is_active: 'trainers.is_active',
    created_at: 'trainers.created_at',
    updated_at: 'trainers.updated_at'
  },
  provinces: {
    id: 'provinces.id',
    name_th: 'provinces.name_th',
    name_en: 'provinces.name_en'
  },
  gyms: {
    id: 'gyms.id',
    name_th: 'gyms.name_th',
    name_en: 'gyms.name_en'
  },
  trainerClasses: {
    id: 'trainerClasses.id',
    trainer_id: 'trainerClasses.trainer_id',
    class_id: 'trainerClasses.class_id'
  },
  classes: {
    id: 'classes.id',
    name_th: 'classes.name_th',
    name_en: 'classes.name_en'
  },
  trainerTags: {
    trainer_id: 'trainerTags.trainer_id',
    tag_id: 'trainerTags.tag_id'
  },
  tags: {
    id: 'tags.id',
    name_th: 'tags.name_th',
    name_en: 'tags.name_en'
  }
}));

// Mock drizzle-orm functions
mock.module('drizzle-orm', () => ({
  eq: mock((col: any, val: any) => ({ col, val, type: 'eq' })),
  ilike: mock((col: any, val: any) => ({ col, val, type: 'ilike' })),
  and: mock((...args: any[]) => ({ args, type: 'and' })),
  or: mock((...args: any[]) => ({ args, type: 'or' })),
  desc: mock((col: any) => ({ col, type: 'desc' })),
  asc: mock((col: any) => ({ col, type: 'asc' })),
  sql: mock((strings: TemplateStringsArray, ...values: any[]) => ({ strings, values, type: 'sql' })),
  count: mock(() => ({ type: 'count' })),
  inArray: mock((col: any, val: any) => ({ col, val, type: 'inArray' }))
}));

describe('TrainerService', () => {
  beforeEach(() => {
    mock.restore();
  });

  describe('getAllTrainers', () => {
    it('should return paginated trainers with default parameters', async () => {
      const mockTrainerData = {
        id: 'trainer-1',
        first_name_th: 'สมชาย',
        last_name_th: 'ใจดี',
        first_name_en: 'John',
        last_name_en: 'Doe',
        bio_th: 'ประวัติ',
        bio_en: 'Bio',
        phone: '123456789',
        email: 'trainer@example.com',
        line_id: '@trainer',
        is_freelance: false,
        gym_id: 'gym-1',
        province_id: 1,
        exp_year: 5,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        provinceData: { id: 1, name_th: 'กรุงเทพฯ', name_en: 'Bangkok' },
        gymData: { id: 'gym-1', name_th: 'ยิม', name_en: 'Gym' }
      };

      const mockCountResult = [{ value: 1 }];

      (db.select as any)
        .mockReturnValueOnce(createFluentChain([mockTrainerData]))
        .mockReturnValueOnce(createFluentChain(mockCountResult));

      const result = await trainerService.getAllTrainers();

      expect(result.total).toBe(1);
      expect(result.trainers.length).toBe(1);
      expect(result.trainers[0].id).toBe('trainer-1');
      expect(result.trainers[0].province?.name_en).toBe('Bangkok');
    });

    it('should filter trainers by search term', async () => {
      const mockTrainerData = {
        id: 'trainer-1',
        first_name_th: 'สมชาย',
        last_name_th: 'ใจดี',
        first_name_en: 'John',
        last_name_en: 'Doe',
        bio_th: null,
        bio_en: null,
        phone: null,
        email: null,
        line_id: null,
        is_freelance: false,
        gym_id: null,
        province_id: 1,
        exp_year: null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        provinceData: { id: 1, name_th: 'กรุงเทพฯ', name_en: 'Bangkok' },
        gymData: null
      };

      (db.select as any).mockReturnValue(createFluentChain([mockTrainerData]));

      const result = await trainerService.getAllTrainers(1, 20, 'John');

      expect(result.trainers.length).toBe(1);
      expect(result.trainers[0].first_name_en).toBe('John');
    });

    it('should filter trainers by province', async () => {
      const mockTrainerData = {
        id: 'trainer-1',
        first_name_th: 'สมชาย',
        last_name_th: 'ใจดี',
        first_name_en: 'John',
        last_name_en: 'Doe',
        bio_th: null,
        bio_en: null,
        phone: null,
        email: null,
        line_id: null,
        is_freelance: false,
        gym_id: null,
        province_id: 1,
        exp_year: null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        provinceData: { id: 1, name_th: 'กรุงเทพฯ', name_en: 'Bangkok' },
        gymData: null
      };

      (db.select as any).mockReturnValue(createFluentChain([mockTrainerData]));

      const result = await trainerService.getAllTrainers(1, 20, undefined, 1);

      expect(result.trainers.length).toBe(1);
      expect(result.trainers[0].province?.id).toBe(1);
    });

    it('should filter freelance trainers', async () => {
      const mockTrainerData = {
        id: 'trainer-1',
        first_name_th: 'สมชาย',
        last_name_th: 'ใจดี',
        first_name_en: 'John',
        last_name_en: 'Doe',
        bio_th: null,
        bio_en: null,
        phone: null,
        email: null,
        line_id: null,
        is_freelance: true,
        gym_id: null,
        province_id: 1,
        exp_year: null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        provinceData: { id: 1, name_th: 'กรุงเทพฯ', name_en: 'Bangkok' },
        gymData: null
      };

      (db.select as any).mockReturnValue(createFluentChain([mockTrainerData]));

      const result = await trainerService.getAllTrainers(1, 20, undefined, undefined, undefined, true);

      expect(result.trainers.length).toBe(1);
      expect(result.trainers[0].is_freelance).toBe(true);
    });
  });

  describe('getTrainerById', () => {
    it('should return trainer with details if found', async () => {
      const mockTrainerData = {
        id: 'trainer-1',
        first_name_th: 'สมชาย',
        last_name_th: 'ใจดี',
        first_name_en: 'John',
        last_name_en: 'Doe',
        bio_th: 'ประวัติ',
        bio_en: 'Bio',
        phone: '123456789',
        email: 'trainer@example.com',
        line_id: '@trainer',
        is_freelance: false,
        gym_id: 'gym-1',
        province_id: 1,
        exp_year: 5,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        provinceData: { id: 1, name_th: 'กรุงเทพฯ', name_en: 'Bangkok' },
        gymData: { id: 'gym-1', name_th: 'ยิม', name_en: 'Gym' }
      };

      const mockClasses: Class[] = [
        { id: 'class-1', name_th: 'มวยไทยพื้นฐาน', name_en: 'Basic Muay Thai', description_th: null, description_en: null }
      ];

      const mockTags: Tag[] = [
        { id: 1, name_th: 'มืออาชีพ', name_en: 'Professional', slug: 'professional', created_at: new Date(), updated_at: new Date() }
      ];

      const mockTrainerClasses = [{
        trainer_classes: {
          id: 'tc-1',
          trainer_id: 'trainer-1',
          class_id: 'class-1',
          name_th: 'มวยไทยพื้นฐาน',
          name_en: 'Basic Muay Thai',
          description_th: null,
          description_en: null,
          duration_minutes: 60,
          max_students: 10,
          price: 50000,
          is_active: true,
          is_private_class: false,
          created_at: new Date(),
          updated_at: new Date()
        },
        classes: { id: 'class-1', name_th: 'มวยไทยพื้นฐาน', name_en: 'Basic Muay Thai', description_th: null, description_en: null }
      }];

      (db.select as any)
        .mockReturnValueOnce(createFluentChain([mockTrainerData]))
        .mockReturnValueOnce(createFluentChain([{ tag_id: 1 }]))
        .mockReturnValueOnce(createFluentChain(mockTags))
        .mockReturnValueOnce(createFluentChain(mockTrainerClasses));

      const result = await trainerService.getTrainerById('trainer-1');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('trainer-1');
      expect(result?.province?.name_en).toBe('Bangkok');
      expect(result?.classes).toEqual(expect.any(Array));
      expect(result?.tags).toEqual(mockTags);
    });

    it('should return null if trainer not found', async () => {
      (db.select as any).mockReturnValue(createFluentChain([]));

      const result = await trainerService.getTrainerById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('createTrainer', () => {
    it('should create and return a new trainer', async () => {
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

      const createdTrainer: Trainer = {
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
        exp_year: null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      };

      const mockProvince: Province = {
        id: 1,
        name_th: 'กรุงเทพฯ',
        name_en: 'Bangkok'
      };

      (db.transaction as any).mockImplementation(async (callback: any) => {
        const tx = {
          insert: mock(() => createFluentChain([createdTrainer])),
          select: mock(() => createFluentChain([mockProvince]))
        };
        return await callback(tx);
      });

      const result = await trainerService.createTrainer(newTrainerData);

      expect(result.id).toBe('new-trainer-id');
      expect(result.first_name_en).toBe('New');
      expect(result.province?.name_en).toBe('Bangkok');
    });

    it('should throw error if trainer creation fails', async () => {
      const newTrainerData: CreateTrainerRequest = {
        first_name_th: 'Test',
        last_name_th: 'Trainer',
        first_name_en: 'Test',
        last_name_en: 'Trainer',
        province_id: 1
      };

      (db.transaction as any).mockImplementation(async (callback: any) => {
        const tx = {
          insert: mock(() => createFluentChain([]))
        };
        return await callback(tx);
      });

      await expect(trainerService.createTrainer(newTrainerData)).rejects.toThrow('Trainer creation failed.');
    });
  });

  describe('updateTrainer', () => {
    it('should update and return the trainer', async () => {
      const updateData: UpdateTrainerRequest = {
        first_name_en: 'Updated',
        phone: '5555555555'
      };

      const updatedTrainer: Trainer = {
        id: 'trainer-1',
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
        exp_year: null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      };

      const mockProvince: Province = {
        id: 1,
        name_th: 'กรุงเทพฯ',
        name_en: 'Bangkok'
      };

      const mockTrainerClassesDetailed = [{
        trainer_classes: {
          id: 'tc-1',
          trainer_id: 'trainer-1',
          class_id: null,
          name_th: 'คลาสส่วนตัว',
          name_en: 'Private Class',
          description_th: null,
          description_en: null,
          duration_minutes: 60,
          max_students: 1,
          price: 100000,
          is_active: true,
          is_private_class: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        classes: null
      }];

      (db.transaction as any).mockImplementation(async (callback: any) => {
        const tx = {
          update: mock(() => createFluentChain([updatedTrainer])),
          select: mock()
            .mockReturnValueOnce(createFluentChain([mockProvince]))
            .mockReturnValueOnce(createFluentChain([]))
            .mockReturnValueOnce(createFluentChain(mockTrainerClassesDetailed)),
          delete: mock(() => createFluentChain([]))
        };
        return await callback(tx);
      });

      const result = await trainerService.updateTrainer('trainer-1', updateData);
      expect(result).not.toBeNull();
      expect(result?.first_name_en).toBe('Updated');
      expect(result?.phone).toBe('5555555555');
    });

    it('should return null if trainer not found', async () => {
      const updateData: UpdateTrainerRequest = { first_name_en: 'Updated' };

      (db.transaction as any).mockImplementation(async (callback: any) => {
        const tx = {
          update: mock(() => createFluentChain([]))
        };
        return await callback(tx);
      });

      const result = await trainerService.updateTrainer('non-existent', updateData);

      expect(result).toBeNull();
    });
  });

  describe('deleteTrainer', () => {
    it('should hard delete trainer and return true', async () => {
      const mockDeleteResult = [{ id: 'trainer-1' }];

      (db.transaction as any).mockImplementation(async (callback: any) => {
        const tx = {
          delete: mock()
            .mockReturnValueOnce(createFluentChain([])) // trainerTags delete
            .mockReturnValueOnce(createFluentChain([])) // trainerClasses delete
            .mockReturnValueOnce(createFluentChain(mockDeleteResult)) // trainer delete
        };
        return await callback(tx);
      });

      const result = await trainerService.deleteTrainer('trainer-1');

      expect(result).toBe(true);
    });

    it('should return false if trainer not found', async () => {
      (db.transaction as any).mockImplementation(async (callback: any) => {
        const tx = {
          delete: mock()
            .mockReturnValueOnce(createFluentChain([])) // trainerTags delete
            .mockReturnValueOnce(createFluentChain([])) // trainerClasses delete
            .mockReturnValueOnce(createFluentChain([])) // trainer delete (empty = not found)
        };
        return await callback(tx);
      });

      const result = await trainerService.deleteTrainer('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('getTrainerClasses', () => {
    it('should return trainer classes', async () => {
      const mockClasses: Class[] = [
        { id: 'class-1', name_th: 'มวยไทยพื้นฐาน', name_en: 'Basic Muay Thai', description_th: null, description_en: null },
        { id: 'class-2', name_th: 'มวยไทยขั้นสูง', name_en: 'Advanced Muay Thai', description_th: null, description_en: null }
      ];

      (db.select as any)
        .mockReturnValueOnce(createFluentChain([{ class_id: 'class-1' }, { class_id: 'class-2' }]))
        .mockReturnValueOnce(createFluentChain(mockClasses));

      const result = await trainerService.getTrainerClasses('trainer-1');

      expect(result).toEqual(mockClasses);
    });

    it('should return empty array if trainer has no classes', async () => {
      (db.select as any).mockReturnValue(createFluentChain([]));

      const result = await trainerService.getTrainerClasses('trainer-1');

      expect(result).toEqual([]);
    });
  });

  describe('addTrainerClass', () => {
    it('should add trainer class and return true', async () => {
      const mockInsertResult = [{ trainer_id: 'trainer-1', class_id: 'class-1' }];

      (db.insert as any).mockReturnValue(createFluentChain(mockInsertResult));

      const result = await trainerService.addTrainerClass('trainer-1', 'class-1');

      expect(result).toBe(true);
    });
  });

  describe('removeTrainerClass', () => {
    it('should remove trainer class and return true', async () => {
      const mockDeleteResult = [{ trainer_id: 'trainer-1', class_id: 'class-1' }];

      (db.delete as any).mockReturnValue(createFluentChain(mockDeleteResult));

      const result = await trainerService.removeTrainerClass('trainer-1', 'class-1');

      expect(result).toBe(true);
    });

    it('should return false if association not found', async () => {
      (db.delete as any).mockReturnValue(createFluentChain([]));

      const result = await trainerService.removeTrainerClass('trainer-1', 'non-existent');

      expect(result).toBe(false);
    });
  });

  describe('searchTrainers', () => {
    it('should search trainers and return results', async () => {
      const mockTrainerData = {
        id: 'trainer-1',
        first_name_th: 'สมชาย',
        last_name_th: 'ใจดี',
        first_name_en: 'John',
        last_name_en: 'Doe',
        bio_th: null,
        bio_en: null,
        phone: null,
        email: null,
        line_id: null,
        is_freelance: false,
        gym_id: null,
        province_id: 1,
        exp_year: null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        provinceData: { id: 1, name_th: 'กรุงเทพฯ', name_en: 'Bangkok' },
        gymData: null
      };

      (db.select as any).mockReturnValue(createFluentChain([mockTrainerData]));

      const result = await trainerService.searchTrainers('John');

      expect(result.trainers.length).toBe(1);
      expect(result.trainers[0].first_name_en).toBe('John');
    });
  });

  describe('getUnassignedTrainers', () => {
    it('should return unassigned trainers', async () => {
      const mockTrainerData = {
        id: 'trainer-1',
        first_name_th: 'สมชาย',
        last_name_th: 'ใจดี',
        first_name_en: 'John',
        last_name_en: 'Doe',
        bio_th: null,
        bio_en: null,
        phone: null,
        email: null,
        line_id: null,
        is_freelance: false,
        gym_id: null,
        province_id: 1,
        exp_year: null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        provinceData: { id: 1, name_th: 'กรุงเทพฯ', name_en: 'Bangkok' },
        gymData: null
      };

      (db.select as any).mockReturnValue(createFluentChain([mockTrainerData]));

      const result = await trainerService.getUnassignedTrainers();

      expect(result.trainers.length).toBe(1);
      expect(result.trainers[0].gym_id).toBeNull();
      expect(result.trainers[0].is_freelance).toBe(false);
    });
  });
}); 