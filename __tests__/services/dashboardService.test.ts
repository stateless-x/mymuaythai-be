import { describe, it, expect, beforeEach, mock, afterEach } from 'bun:test';
import * as dashboardService from '../../src/services/dashboardService';

// Mock the database module
const mockDb = {
  select: mock()
};

mock.module('../../src/db/config', () => ({
  db: mockDb
}));

// Mock schema
mock.module('../../src/db/schema', () => ({
  trainers: {
    id: 'trainers.id',
    is_active: 'trainers.is_active',
    is_freelance: 'trainers.is_freelance',
    gym_id: 'trainers.gym_id',
    province_id: 'trainers.province_id'
  },
  gyms: {
    id: 'gyms.id',
    is_active: 'gyms.is_active',
    province_id: 'gyms.province_id'
  },
  provinces: {
    id: 'provinces.id',
    name_th: 'provinces.name_th'
  }
}));

// Mock drizzle-orm functions
mock.module('drizzle-orm', () => ({
  eq: mock((col: any, val: any) => ({ col, val, type: 'eq' })),
  and: mock((...args: any[]) => ({ args, type: 'and' })),
  sql: mock((strings: TemplateStringsArray, ...values: any[]) => ({ strings, values, type: 'sql' })),
  count: mock(() => ({ type: 'count' }))
}));

// Helper function to create a mock fluent chain
const createMockChain = (resolveValue: any) => {
  const chain: any = {};
  
  chain.from = mock().mockReturnValue(chain);
  chain.leftJoin = mock().mockReturnValue(chain);
  chain.where = mock().mockReturnValue(chain);
  chain.groupBy = mock().mockReturnValue(chain);
  chain.orderBy = mock().mockReturnValue(chain);
  chain.limit = mock().mockReturnValue(chain);
  chain.offset = mock().mockReturnValue(chain);
  chain.then = mock((callback: any) => Promise.resolve(resolveValue).then(callback));
  chain.catch = mock((callback: any) => Promise.resolve(resolveValue).catch(callback));
  chain.finally = mock((callback: any) => Promise.resolve(resolveValue).finally(callback));
  
  return Object.assign(Promise.resolve(resolveValue), chain);
};

describe('DashboardService', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    mockDb.select.mockClear();
  });

  afterEach(() => {
    // Reset all mocks after each test
    mock.restore();
  });

  describe('getDashboardStats', () => {
    it('should return dashboard statistics', async () => {
      const mockTrainerStats = [{
        total: 100,
        active: 80,
        inactive: 20,
        freelancers: 30,
        staffTrainers: 50,
        unassigned: 10
      }];

      const mockGymStats = [{
        total: 50,
        active: 45,
        inactive: 5
      }];

      const mockTopTrainerProvinces = [
        { provinceId: 1, provinceName: 'กรุงเทพฯ', trainerCount: 25 }
      ];

      const mockTopGymProvinces = [
        { provinceId: 1, provinceName: 'กรุงเทพฯ', gymCount: 15 }
      ];

      // Mock the database calls in sequence
      mockDb.select
        .mockReturnValueOnce(createMockChain(mockTrainerStats))
        .mockReturnValueOnce(createMockChain(mockGymStats))
        .mockReturnValueOnce(createMockChain([{ provinceId: 1, provinceName: 'กรุงเทพฯ', trainerCount: 25 }]))
        .mockReturnValueOnce(createMockChain([{ provinceId: 1, provinceName: 'กรุงเทพฯ', gymCount: 15 }]));

      const result = await dashboardService.getDashboardStats();

      expect(result.totalTrainers).toBe(100);
      expect(result.activeTrainers).toBe(80);
      expect(result.inactiveTrainers).toBe(20);
      expect(result.freelancers).toBe(30);
      expect(result.staffTrainers).toBe(50);
      expect(result.unassignedTrainers).toBe(10);
      expect(result.totalGyms).toBe(50);
      expect(result.activeGyms).toBe(45);
      expect(result.inactiveGyms).toBe(5);
      expect(result.topProvincesByTrainers).toEqual(mockTopTrainerProvinces);
      expect(result.topProvincesByGyms).toEqual(mockTopGymProvinces);
    });

    it('should throw error when database query fails', async () => {
      mockDb.select.mockReturnValue({
        from: mock(() => Promise.reject(new Error('Database error')))
      });

      await expect(dashboardService.getDashboardStats()).rejects.toThrow('Failed to fetch dashboard statistics');
    });
  });

  describe('getTop5TrainersByProvince', () => {
    it('should return top 5 provinces by trainer count', async () => {
      const mockDbResult = [
        { provinceId: 1, provinceName: 'กรุงเทพฯ', trainerCount: 25 },
        { provinceId: 2, provinceName: 'เชียงใหม่', trainerCount: 15 }
      ];

      mockDb.select.mockReturnValue(createMockChain(mockDbResult));

      const result = await dashboardService.getTop5TrainersByProvince();

      expect(result).toEqual([
        { provinceId: 1, provinceName: 'กรุงเทพฯ', trainerCount: 25 },
        { provinceId: 2, provinceName: 'เชียงใหม่', trainerCount: 15 }
      ]);
    });

    it('should handle provinces with null values', async () => {
      const mockDbResult = [
        { provinceId: null, provinceName: null, trainerCount: 5 }
      ];

      mockDb.select.mockReturnValue(createMockChain(mockDbResult));

      const result = await dashboardService.getTop5TrainersByProvince();

      expect(result).toEqual([{
        provinceId: 0,
        provinceName: 'ไม่ระบุจังหวัด',
        trainerCount: 5
      }]);
    });
  });

  describe('getTop5GymsByProvince', () => {
    it('should return top 5 provinces by gym count', async () => {
      const mockDbResult = [
        { provinceId: 1, provinceName: 'กรุงเทพฯ', gymCount: 15 },
        { provinceId: 2, provinceName: 'เชียงใหม่', gymCount: 8 }
      ];

      mockDb.select.mockReturnValue(createMockChain(mockDbResult));

      const result = await dashboardService.getTop5GymsByProvince();

      expect(result).toEqual([
        { provinceId: 1, provinceName: 'กรุงเทพฯ', gymCount: 15 },
        { provinceId: 2, provinceName: 'เชียงใหม่', gymCount: 8 }
      ]);
    });
  });

  describe('getTrainerCountsByProvince', () => {
    it('should return trainer counts by all provinces', async () => {
      const mockResult = [
        { provinceId: 1, provinceName: 'กรุงเทพฯ', trainerCount: 25 },
        { provinceId: 2, provinceName: 'เชียงใหม่', trainerCount: 15 },
        { provinceId: 3, provinceName: 'ภูเก็ต', trainerCount: 10 }
      ];

      mockDb.select.mockReturnValue(createMockChain(mockResult));

      const result = await dashboardService.getTrainerCountsByProvince();

      expect(result).toEqual(mockResult);
    });
  });

  describe('getGymCountsByProvince', () => {
    it('should return gym counts by all provinces', async () => {
      const mockResult = [
        { provinceId: 1, provinceName: 'กรุงเทพฯ', gymCount: 15 },
        { provinceId: 2, provinceName: 'เชียงใหม่', gymCount: 8 },
        { provinceId: 3, provinceName: 'ภูเก็ต', gymCount: 5 }
      ];

      mockDb.select.mockReturnValue(createMockChain(mockResult));

      const result = await dashboardService.getGymCountsByProvince();

      expect(result).toEqual(mockResult);
    });
  });
}); 