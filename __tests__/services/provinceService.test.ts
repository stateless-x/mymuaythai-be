import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { ProvinceService } from '../../src/services/provinceService';
import { db } from '../../src/db/config';
import type { Province } from '../../src/types';

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
    select: mock(() => createFluentChain([]))
  }
}));

// Mock schema
mock.module('../../src/db/schema', () => ({
  provinces: {
    id: 'provinces.id',
    name_th: 'provinces.name_th',
    name_en: 'provinces.name_en'
  },
  gyms: {
    id: 'gyms.id',
    province_id: 'gyms.province_id'
  }
}));

// Mock drizzle-orm functions
mock.module('drizzle-orm', () => ({
  eq: mock((col: any, val: any) => ({ col, val, type: 'eq' })),
  ilike: mock((col: any, val: any) => ({ col, val, type: 'ilike' })),
  or: mock((...args: any[]) => ({ args, type: 'or' })),
  asc: mock((col: any) => ({ col, type: 'asc' }))
}));

describe('ProvinceService', () => {
  let provinceService: ProvinceService;

  beforeEach(() => {
    mock.restore();
    provinceService = new ProvinceService();
  });

  describe('getAllProvinces', () => {
    it('should return all provinces sorted by English name', async () => {
      const mockProvinces: Province[] = [
        { id: 1, name_th: 'กรุงเทพฯ', name_en: 'Bangkok' },
        { id: 2, name_th: 'เชียงใหม่', name_en: 'Chiang Mai' },
        { id: 3, name_th: 'ภูเก็ต', name_en: 'Phuket' }
      ];

      (db.select as any).mockReturnValue(createFluentChain(mockProvinces));

      const result = await provinceService.getAllProvinces();

      expect(result).toEqual(mockProvinces);
      expect(db.select).toHaveBeenCalled();
    });

    it('should return empty array if no provinces found', async () => {
      (db.select as any).mockReturnValue(createFluentChain([]));

      const result = await provinceService.getAllProvinces();

      expect(result).toEqual([]);
    });
  });

  describe('getAllProvincesThaiSort', () => {
    it('should return all provinces sorted by Thai name', async () => {
      const mockProvinces: Province[] = [
        { id: 1, name_th: 'กรุงเทพฯ', name_en: 'Bangkok' },
        { id: 2, name_th: 'เชียงใหม่', name_en: 'Chiang Mai' },
        { id: 3, name_th: 'ภูเก็ต', name_en: 'Phuket' }
      ];

      (db.select as any).mockReturnValue(createFluentChain(mockProvinces));

      const result = await provinceService.getAllProvincesThaiSort();

      expect(result).toEqual(mockProvinces);
    });
  });

  describe('getProvinceById', () => {
    it('should return province if found', async () => {
      const mockProvince: Province = {
        id: 1,
        name_th: 'กรุงเทพฯ',
        name_en: 'Bangkok'
      };

      (db.select as any).mockReturnValue(createFluentChain([mockProvince]));

      const result = await provinceService.getProvinceById(1);

      expect(result).toEqual(mockProvince);
    });

    it('should return null if province not found', async () => {
      (db.select as any).mockReturnValue(createFluentChain([]));

      const result = await provinceService.getProvinceById(999);

      expect(result).toBeNull();
    });
  });

  describe('getProvincesByRegion', () => {
    it('should return provinces for central region', async () => {
      const mockProvinces: Province[] = [
        { id: 1, name_th: 'กรุงเทพฯ', name_en: 'Bangkok' },
        { id: 2, name_th: 'สมุทรปราการ', name_en: 'Samut Prakan' }
      ];

      (db.select as any).mockReturnValue(createFluentChain(mockProvinces));

      const result = await provinceService.getProvincesByRegion('central');

      expect(result).toEqual(mockProvinces);
    });

    it('should return provinces for northern region', async () => {
      const mockProvinces: Province[] = [
        { id: 31, name_th: 'เชียงใหม่', name_en: 'Chiang Mai' },
        { id: 32, name_th: 'เชียงราย', name_en: 'Chiang Rai' }
      ];

      (db.select as any).mockReturnValue(createFluentChain(mockProvinces));

      const result = await provinceService.getProvincesByRegion('northern');

      expect(result).toEqual(mockProvinces);
    });

    it('should return empty array for invalid region', async () => {
      const result = await provinceService.getProvincesByRegion('invalid' as any);

      expect(result).toEqual([]);
    });
  });

  describe('searchProvinces', () => {
    it('should search provinces by English name', async () => {
      const mockProvinces: Province[] = [
        { id: 1, name_th: 'กรุงเทพฯ', name_en: 'Bangkok' }
      ];

      (db.select as any).mockReturnValue(createFluentChain(mockProvinces));

      const result = await provinceService.searchProvinces('Bangkok');

      expect(result).toEqual(mockProvinces);
    });

    it('should search provinces by Thai name', async () => {
      const mockProvinces: Province[] = [
        { id: 1, name_th: 'กรุงเทพฯ', name_en: 'Bangkok' }
      ];

      (db.select as any).mockReturnValue(createFluentChain(mockProvinces));

      const result = await provinceService.searchProvinces('กรุงเทพ');

      expect(result).toEqual(mockProvinces);
    });

    it('should return empty array if no provinces match search', async () => {
      (db.select as any).mockReturnValue(createFluentChain([]));

      const result = await provinceService.searchProvinces('NonExistent');

      expect(result).toEqual([]);
    });
  });

  describe('getProvinceCount', () => {
    it('should return total count of provinces', async () => {
      const mockProvinces: Province[] = [
        { id: 1, name_th: 'กรุงเทพฯ', name_en: 'Bangkok' },
        { id: 2, name_th: 'เชียงใหม่', name_en: 'Chiang Mai' },
        { id: 3, name_th: 'ภูเก็ต', name_en: 'Phuket' }
      ];

      (db.select as any).mockReturnValue(createFluentChain(mockProvinces));

      const result = await provinceService.getProvinceCount();

      expect(result).toBe(3);
    });

    it('should return 0 if no provinces exist', async () => {
      (db.select as any).mockReturnValue(createFluentChain([]));

      const result = await provinceService.getProvinceCount();

      expect(result).toBe(0);
    });
  });

  describe('getProvincesWithGymCounts', () => {
    it('should return provinces with gym counts', async () => {
      const mockResult = [
        { id: 1, name_th: 'กรุงเทพฯ', name_en: 'Bangkok', gym_count: 'gym-1' },
        { id: 1, name_th: 'กรุงเทพฯ', name_en: 'Bangkok', gym_count: 'gym-2' },
        { id: 2, name_th: 'เชียงใหม่', name_en: 'Chiang Mai', gym_count: 'gym-3' },
        { id: 3, name_th: 'ภูเก็ต', name_en: 'Phuket', gym_count: null }
      ];

      (db.select as any).mockReturnValue(createFluentChain(mockResult));

      const result = await provinceService.getProvincesWithGymCounts();

      expect(result).toEqual([
        { id: 1, name_th: 'กรุงเทพฯ', name_en: 'Bangkok', gym_count: 2 },
        { id: 2, name_th: 'เชียงใหม่', name_en: 'Chiang Mai', gym_count: 1 },
        { id: 3, name_th: 'ภูเก็ต', name_en: 'Phuket', gym_count: 0 }
      ]);
    });

    it('should handle empty result', async () => {
      (db.select as any).mockReturnValue(createFluentChain([]));

      const result = await provinceService.getProvincesWithGymCounts();

      expect(result).toEqual([]);
    });

    it('should handle provinces with no gyms', async () => {
      const mockResult = [
        { id: 1, name_th: 'กรุงเทพฯ', name_en: 'Bangkok', gym_count: null }
      ];

      (db.select as any).mockReturnValue(createFluentChain(mockResult));

      const result = await provinceService.getProvincesWithGymCounts();

      expect(result).toEqual([
        { id: 1, name_th: 'กรุงเทพฯ', name_en: 'Bangkok', gym_count: 0 }
      ]);
    });
  });
}); 