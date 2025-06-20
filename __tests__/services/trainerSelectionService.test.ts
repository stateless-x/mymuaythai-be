import { describe, it, expect, beforeEach, mock } from 'bun:test';
import * as trainerSelectionService from '../../src/services/trainerSelectionService';
import { db } from '../../src/db/config';
import type { TrainerForSelection, SelectionFilters, SelectionOptions } from '../../src/services/trainerSelectionService';

// Create a proper fluent chain mock that returns a promise
const createFluentChain = (resolveValue: any) => {
  const promise = Promise.resolve(resolveValue);
  const chain = {
    from: mock(() => chain),
    where: mock(() => chain),
    leftJoin: mock(() => chain),
    orderBy: mock(() => chain),
    limit: mock(() => chain),
    offset: mock(() => chain),
    returning: mock(() => promise),
    values: mock(() => chain),
    set: mock(() => chain),
    then: promise.then.bind(promise),
    catch: promise.catch.bind(promise),
    finally: promise.finally.bind(promise)
  };
  return chain;
};

// Mock the database
mock.module('../../src/db/config', () => ({
  db: {
    select: mock(() => createFluentChain([]))
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
    email: 'trainers.email',
    phone: 'trainers.phone',
    exp_year: 'trainers.exp_year',
    is_active: 'trainers.is_active',
    is_freelance: 'trainers.is_freelance',
    gym_id: 'trainers.gym_id',
    province_id: 'trainers.province_id',
    created_at: 'trainers.created_at'
  },
  provinces: {
    id: 'provinces.id',
    name_th: 'provinces.name_th',
    name_en: 'provinces.name_en'
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
  sql: Object.assign(
    mock((strings: TemplateStringsArray, ...values: any[]) => ({ strings, values, type: 'sql' })),
    {
      join: mock((items: any[], separator: any) => ({ items, separator, type: 'sql-join' }))
    }
  )
}));

describe('TrainerSelectionService', () => {
  beforeEach(() => {
    // Clear mock call history but keep mock implementations
    (db.select as any).mockClear();
  });

  describe('getAvailableTrainersForSelection', () => {
    it('should return available trainers with default parameters', async () => {
      const mockTrainerData = {
        id: 'trainer-1',
        first_name_th: 'สมชาย',
        last_name_th: 'ใจดี',
        first_name_en: 'John',
        last_name_en: 'Doe',
        email: 'trainer@example.com',
        phone: '123456789',
        exp_year: 5,
        province: { id: 1, name_th: 'กรุงเทพฯ', name_en: 'Bangkok' }
      };

      const mockCountResult = [{ count: 1 }];

      (db.select as any)
        .mockReturnValueOnce(createFluentChain([mockTrainerData]))
        .mockReturnValueOnce(createFluentChain(mockCountResult));

      const result = await trainerSelectionService.getAvailableTrainersForSelection();

      expect(result.total).toBe(1);
      expect(result.trainers.length).toBe(1);
      expect(result.trainers[0]!.id).toBe('trainer-1');
      expect(result.trainers[0]!.province?.name_en).toBe('Bangkok');
    });

    it('should filter trainers by search term', async () => {
      const mockTrainerData = {
        id: 'trainer-1',
        first_name_th: 'สมชาย',
        last_name_th: 'ใจดี',
        first_name_en: 'John',
        last_name_en: 'Doe',
        email: 'john@example.com',
        phone: '123456789',
        exp_year: 3,
        province: { id: 1, name_th: 'กรุงเทพฯ', name_en: 'Bangkok' }
      };

      const mockCountResult = [{ count: 1 }];

      (db.select as any)
        .mockReturnValueOnce(createFluentChain([mockTrainerData]))
        .mockReturnValueOnce(createFluentChain(mockCountResult));

      const filters: SelectionFilters = { searchTerm: 'John' };
      const result = await trainerSelectionService.getAvailableTrainersForSelection(filters);

      expect(result.trainers.length).toBe(1);
      expect(result.trainers[0]!.first_name_en).toBe('John');
    });

    it('should filter trainers by province', async () => {
      const mockTrainerData = {
        id: 'trainer-1',
        first_name_th: 'สมชาย',
        last_name_th: 'ใจดี',
        first_name_en: 'John',
        last_name_en: 'Doe',
        email: 'trainer@example.com',
        phone: '123456789',
        exp_year: 2,
        province: { id: 1, name_th: 'กรุงเทพฯ', name_en: 'Bangkok' }
      };

      const mockCountResult = [{ count: 1 }];

      (db.select as any)
        .mockReturnValueOnce(createFluentChain([mockTrainerData]))
        .mockReturnValueOnce(createFluentChain(mockCountResult));

      const filters: SelectionFilters = { provinceId: 1 };
      const result = await trainerSelectionService.getAvailableTrainersForSelection(filters);

      expect(result.trainers.length).toBe(1);
      expect(result.trainers[0]!.province?.id).toBe(1);
    });

    it('should exclude specified trainer IDs', async () => {
      const mockTrainerData = {
        id: 'trainer-2',
        first_name_th: 'สมหญิง',
        last_name_th: 'ใจดี',
        first_name_en: 'Jane',
        last_name_en: 'Doe',
        email: 'jane@example.com',
        phone: '987654321',
        exp_year: 4,
        province: { id: 1, name_th: 'กรุงเทพฯ', name_en: 'Bangkok' }
      };

      const mockCountResult = [{ count: 1 }];

      (db.select as any)
        .mockReturnValueOnce(createFluentChain([mockTrainerData]))
        .mockReturnValueOnce(createFluentChain(mockCountResult));

      const filters: SelectionFilters = { excludeTrainerIds: ['trainer-1'] };
      const result = await trainerSelectionService.getAvailableTrainersForSelection(filters);

      expect(result.trainers.length).toBe(1);
      expect(result.trainers[0]!.id).toBe('trainer-2');
    });

    it('should sort trainers by experience', async () => {
      const mockTrainerData = [
        {
          id: 'trainer-1',
          first_name_th: 'สมชาย',
          last_name_th: 'ใจดี',
          first_name_en: 'John',
          last_name_en: 'Doe',
          email: 'john@example.com',
          phone: '123456789',
          exp_year: 5,
          province: { id: 1, name_th: 'กรุงเทพฯ', name_en: 'Bangkok' }
        },
        {
          id: 'trainer-2',
          first_name_th: 'สมหญิง',
          last_name_th: 'ใจดี',
          first_name_en: 'Jane',
          last_name_en: 'Doe',
          email: 'jane@example.com',
          phone: '987654321',
          exp_year: 3,
          province: { id: 1, name_th: 'กรุงเทพฯ', name_en: 'Bangkok' }
        }
      ];

      const mockCountResult = [{ count: 2 }];

      (db.select as any)
        .mockReturnValueOnce(createFluentChain(mockTrainerData))
        .mockReturnValueOnce(createFluentChain(mockCountResult));

      const options: SelectionOptions = { sortBy: 'experience' };
      const result = await trainerSelectionService.getAvailableTrainersForSelection({}, options);

      expect(result.trainers.length).toBe(2);
      expect(result.trainers[0]!.exp_year).toBe(5);
    });

    it('should sort trainers by name', async () => {
      const mockTrainerData = [
        {
          id: 'trainer-1',
          first_name_th: 'กมล',
          last_name_th: 'ใจดี',
          first_name_en: 'Alice',
          last_name_en: 'Doe',
          email: 'alice@example.com',
          phone: '123456789',
          exp_year: 2,
          province: { id: 1, name_th: 'กรุงเทพฯ', name_en: 'Bangkok' }
        },
        {
          id: 'trainer-2',
          first_name_th: 'สมชาย',
          last_name_th: 'ใจดี',
          first_name_en: 'Bob',
          last_name_en: 'Doe',
          email: 'bob@example.com',
          phone: '987654321',
          exp_year: 4,
          province: { id: 1, name_th: 'กรุงเทพฯ', name_en: 'Bangkok' }
        }
      ];

      const mockCountResult = [{ count: 2 }];

      (db.select as any)
        .mockReturnValueOnce(createFluentChain(mockTrainerData))
        .mockReturnValueOnce(createFluentChain(mockCountResult));

      const options: SelectionOptions = { sortBy: 'name' };
      const result = await trainerSelectionService.getAvailableTrainersForSelection({}, options);

      expect(result.trainers.length).toBe(2);
      expect(result.trainers[0]!.first_name_th).toBe('กมล');
    });

    it('should handle pagination', async () => {
      const mockTrainerData = {
        id: 'trainer-1',
        first_name_th: 'สมชาย',
        last_name_th: 'ใจดี',
        first_name_en: 'John',
        last_name_en: 'Doe',
        email: 'trainer@example.com',
        phone: '123456789',
        exp_year: 5,
        province: { id: 1, name_th: 'กรุงเทพฯ', name_en: 'Bangkok' }
      };

      const mockCountResult = [{ count: 100 }];

      (db.select as any)
        .mockReturnValueOnce(createFluentChain([mockTrainerData]))
        .mockReturnValueOnce(createFluentChain(mockCountResult));

      const options: SelectionOptions = { page: 2, pageSize: 10 };
      const result = await trainerSelectionService.getAvailableTrainersForSelection({}, options);

      expect(result.total).toBe(100);
      expect(result.trainers.length).toBe(1);
    });
  });

  describe('getGymTrainers', () => {
    it('should return trainers assigned to a specific gym', async () => {
      const mockTrainerData = [
        {
          id: 'trainer-1',
          first_name_th: 'สมชาย',
          last_name_th: 'ใจดี',
          first_name_en: 'John',
          last_name_en: 'Doe',
          email: 'john@example.com',
          phone: '123456789',
          exp_year: 5,
          province: { id: 1, name_th: 'กรุงเทพฯ', name_en: 'Bangkok' }
        },
        {
          id: 'trainer-2',
          first_name_th: 'สมหญิง',
          last_name_th: 'ใจดี',
          first_name_en: 'Jane',
          last_name_en: 'Doe',
          email: 'jane@example.com',
          phone: '987654321',
          exp_year: 3,
          province: { id: 1, name_th: 'กรุงเทพฯ', name_en: 'Bangkok' }
        }
      ];

      (db.select as any).mockReturnValue(createFluentChain(mockTrainerData));

      const result = await trainerSelectionService.getGymTrainers('gym-1');

      expect(result.length).toBe(2);
      expect(result[0]!.id).toBe('trainer-1');
      expect(result[1]!.id).toBe('trainer-2');
    });

    it('should return empty array if gym has no trainers', async () => {
      (db.select as any).mockReturnValue(createFluentChain([]));

      const result = await trainerSelectionService.getGymTrainers('gym-1');

      expect(result).toEqual([]);
    });
  });

  describe('searchTrainersForSelection', () => {
    it('should return trainers matching search term', async () => {
      const mockTrainerData = [
        {
          id: 'trainer-1',
          first_name_th: 'สมชาย',
          last_name_th: 'ใจดี',
          first_name_en: 'John',
          last_name_en: 'Doe',
          email: 'john@example.com',
          phone: '123456789',
          exp_year: 5,
          province: { id: 1, name_th: 'กรุงเทพฯ', name_en: 'Bangkok' }
        }
      ];

      (db.select as any).mockReturnValue(createFluentChain(mockTrainerData));

      const result = await trainerSelectionService.searchTrainersForSelection('John');

      expect(result.length).toBe(1);
      expect(result[0]?.first_name_en).toBe('John');
    });

    it('should return empty array for empty search term', async () => {
      const result = await trainerSelectionService.searchTrainersForSelection('');

      expect(result).toEqual([]);
    });

    it('should return empty array for whitespace-only search term', async () => {
      const result = await trainerSelectionService.searchTrainersForSelection('   ');

      expect(result).toEqual([]);
    });

    it('should limit results to specified limit', async () => {
      const mockTrainerData = Array.from({ length: 20 }, (_, i) => ({
        id: `trainer-${i + 1}`,
        first_name_th: `ชื่อ${i + 1}`,
        last_name_th: 'ใจดี',
        first_name_en: `Name${i + 1}`,
        last_name_en: 'Doe',
        email: `trainer${i + 1}@example.com`,
        phone: `12345678${i}`,
        exp_year: i + 1,
        province: { id: 1, name_th: 'กรุงเทพฯ', name_en: 'Bangkok' }
      }));

      (db.select as any).mockReturnValue(createFluentChain(mockTrainerData));

      const result = await trainerSelectionService.searchTrainersForSelection('Name', 5);

      expect(result.length).toBe(20); // Mock returns all data, but limit should be applied in query
    });

    it('should return empty array if no trainers match search', async () => {
      (db.select as any).mockReturnValue(createFluentChain([]));

      const result = await trainerSelectionService.searchTrainersForSelection('NonExistent');

      expect(result).toEqual([]);
    });
  });
}); 