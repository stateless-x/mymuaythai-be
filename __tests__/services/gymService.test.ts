import { describe, it, expect, beforeEach, mock } from 'bun:test';
import * as gymService from '../../src/services/gymService';
import { db } from '../../src/db/config';
import type { GymWithDetails, CreateGymRequest, UpdateGymRequest, Province, GymImage, Tag, Trainer } from '../../src/types';

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
    select: mock(() => createFluentChain([])),
    insert: mock(() => createFluentChain([])),
    update: mock(() => createFluentChain([])),
    delete: mock(() => createFluentChain([])),
    transaction: mock(async (callback: any) => {
      const tx = {
        select: mock(() => createFluentChain([])),
        insert: mock(() => createFluentChain([{ id: 'new-gym-id' }])),
        update: mock(() => createFluentChain([])),
        delete: mock(() => createFluentChain([]))
      };
      return await callback(tx);
    })
  }
}));

// Mock schema
mock.module('../../src/db/schema', () => ({
  gyms: {
    id: 'gyms.id',
    name_th: 'gyms.name_th',
    name_en: 'gyms.name_en',
    description_th: 'gyms.description_th',
    description_en: 'gyms.description_en',
    phone: 'gyms.phone',
    email: 'gyms.email',
    province_id: 'gyms.province_id',
    map_url: 'gyms.map_url',
    youtube_url: 'gyms.youtube_url',
    line_id: 'gyms.line_id',
    is_active: 'gyms.is_active',
    created_at: 'gyms.created_at',
    updated_at: 'gyms.updated_at'
  },
  provinces: {
    id: 'provinces.id',
    name_th: 'provinces.name_th',
    name_en: 'provinces.name_en'
  },
  gymImages: {
    id: 'gymImages.id',
    gym_id: 'gymImages.gym_id',
    image_url: 'gymImages.image_url'
  },
  gymTags: {
    gym_id: 'gymTags.gym_id',
    tag_id: 'gymTags.tag_id'
  },
  tags: {
    id: 'tags.id',
    name_th: 'tags.name_th',
    name_en: 'tags.name_en'
  },
  trainers: {
    id: 'trainers.id',
    first_name_th: 'trainers.first_name_th',
    last_name_th: 'trainers.last_name_th',
    gym_id: 'trainers.gym_id'
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

// Mock validation
mock.module('../../src/utils/validation', () => ({
  createGymSchema: {
    parse: mock((data: any) => data),
    safeParse: mock((data: any) => ({ success: true, data }))
  },
  updateGymSchema: {
    parse: mock((data: any) => data),
    safeParse: mock((data: any) => ({ success: true, data }))
  },
  formatZodError: mock((error: any) => 'Validation error')
}));

describe('GymService', () => {
  beforeEach(() => {
    // Clear mock call history but keep mock implementations
    if (db.select) (db.select as any).mockClear();
    if (db.insert) (db.insert as any).mockClear();
    if (db.update) (db.update as any).mockClear();
    if (db.delete) (db.delete as any).mockClear();
    if (db.transaction) (db.transaction as any).mockClear();
  });

  describe('getAllGyms', () => {
    it('should return paginated gyms with default parameters', async () => {
      const mockGymData = {
        id: 'gym-1',
        name_th: 'ยิมมวยไทย',
        name_en: 'Muay Thai Gym',
        description_th: 'คำอธิบาย',
        description_en: 'Description',
        phone: '123456789',
        email: 'gym@example.com',
        province_id: 1,
        map_url: 'http://maps.example.com',
        youtube_url: 'http://youtube.com/watch?v=123',
        line_id: '@gym',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        provinceData: { id: 1, name_th: 'กรุงเทพฯ', name_en: 'Bangkok' }
      };

      const mockCountResult = [{ value: 1 }];

      (db.select as any)
        .mockReturnValueOnce(createFluentChain([mockGymData]))
        .mockReturnValueOnce(createFluentChain(mockCountResult));

      const result = await gymService.getAllGyms();

      expect(result.total).toBe(1);
      expect(result.gyms.length).toBe(1);
      expect(result.gyms[0]!.id).toBe('gym-1');
      expect(result.gyms[0]!.province?.name_en).toBe('Bangkok');
    });

    it('should filter gyms by search term', async () => {
      const mockGymData = {
        id: 'gym-1',
        name_th: 'ยิมมวยไทย',
        name_en: 'Test Gym',
        description_th: null,
        description_en: null,
        phone: null,
        email: null,
        province_id: 1,
        map_url: null,
        youtube_url: null,
        line_id: null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        provinceData: { id: 1, name_th: 'กรุงเทพฯ', name_en: 'Bangkok' }
      };

      (db.select as any).mockReturnValue(createFluentChain([mockGymData]));

      const result = await gymService.getAllGyms({ searchTerm: 'Test' });

      expect(result.gyms.length).toBe(1);
      expect(result.gyms[0]!.name_en).toBe('Test Gym');
    });

    it('should filter gyms by province', async () => {
      const mockGymData = {
        id: 'gym-1',
        name_th: 'ยิมมวยไทย',
        name_en: 'Bangkok Gym',
        description_th: null,
        description_en: null,
        phone: null,
        email: null,
        province_id: 1,
        map_url: null,
        youtube_url: null,
        line_id: null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        provinceData: { id: 1, name_th: 'กรุงเทพฯ', name_en: 'Bangkok' }
      };

      (db.select as any).mockReturnValue(createFluentChain([mockGymData]));

      const result = await gymService.getAllGyms({ provinceId: 1 });

      expect(result.gyms.length).toBe(1);
      expect(result.gyms[0]!.province?.id).toBe(1);
    });

    it('should filter gyms by active status', async () => {
      const mockGymData = {
        id: 'gym-1',
        name_th: 'ยิมมวยไทย',
        name_en: 'Active Gym',
        description_th: null,
        description_en: null,
        phone: null,
        email: null,
        province_id: 1,
        map_url: null,
        youtube_url: null,
        line_id: null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        provinceData: { id: 1, name_th: 'กรุงเทพฯ', name_en: 'Bangkok' }
      };

      (db.select as any).mockReturnValue(createFluentChain([mockGymData]));

      const result = await gymService.getAllGyms({ is_active: true });

      expect(result.gyms.length).toBe(1);
      expect(result.gyms[0]?.is_active).toBe(true);
    });
  });

  describe('getGymById', () => {
    it('should return gym with details if found', async () => {
      const mockGymData = {
        id: 'gym-1',
        name_th: 'ยิมมวยไทย',
        name_en: 'Test Gym',
        description_th: 'คำอธิบาย',
        description_en: 'Description',
        phone: '123456789',
        email: 'gym@example.com',
        province_id: 1,
        map_url: 'http://maps.example.com',
        youtube_url: 'http://youtube.com/watch?v=123',
        line_id: '@gym',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        provinceData: { id: 1, name_th: 'กรุงเทพฯ', name_en: 'Bangkok' }
      };

      const mockImages: GymImage[] = [
        { id: 'img-1', gym_id: 'gym-1', image_url: 'http://example.com/image1.jpg' }
      ];

      const mockTags: Tag[] = [
        { id: 1, name_th: 'มือใหม่', name_en: 'Beginner', slug: 'beginner', created_at: new Date(), updated_at: new Date() }
      ];

      const mockTrainers: Trainer[] = [
        {
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
          gym_id: 'gym-1',
          province_id: 1,
          exp_year: null,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      (db.select as any)
        .mockReturnValueOnce(createFluentChain([mockGymData]))
        .mockReturnValueOnce(createFluentChain(mockImages))
        .mockReturnValueOnce(createFluentChain([{ tag_id: 1 }]))
        .mockReturnValueOnce(createFluentChain(mockTags))
        .mockReturnValueOnce(createFluentChain(mockTrainers));

      const result = await gymService.getGymById('gym-1');

      expect(result).not.toBeNull();
      expect(result!.id).toBe('gym-1');
      expect(result!.province?.name_en).toBe('Bangkok');
      expect(result!.images).toEqual(mockImages);
      expect(result!.tags).toEqual(mockTags);
      expect(result!.associatedTrainers).toEqual(mockTrainers);
    });

    it('should return null if gym not found', async () => {
      (db.select as any).mockReturnValue(createFluentChain([]));

      const result = await gymService.getGymById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('createGym', () => {
    it('should create and return a new gym', async () => {
      const newGymData: CreateGymRequest = {
        name_th: 'ยิมใหม่',
        name_en: 'New Gym',
        description_th: 'คำอธิบายใหม่',
        description_en: 'New description',
        phone: '987654321',
        email: 'newgym@example.com',
        province_id: 1,
        map_url: 'http://maps.example.com/new',
        youtube_url: 'http://youtube.com/watch?v=new',
        line_id: '@newgym'
      };

      const createdGym = {
        id: 'new-gym-id',
        ...newGymData,
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
          insert: mock(() => createFluentChain([createdGym])),
          select: mock(() => createFluentChain([mockProvince])),
          rollback: mock(() => {}),
          query: {
            provinces: {
              findFirst: mock(() => Promise.resolve(mockProvince))
            }
          }
        };
        return await callback(tx);
      });

      const result = await gymService.createGym(newGymData);

      expect(result.id).toBe('new-gym-id');
      expect(result.name_en).toBe('New Gym');
      expect(result.province?.name_en).toBe('Bangkok');
    });

    it('should throw error if gym creation fails', async () => {
      const newGymData: CreateGymRequest = {
        name_th: 'ยิมใหม่',
        name_en: 'New Gym',
        province_id: 1
      };

      (db.transaction as any).mockImplementation(async (callback: any) => {
        const tx = {
          insert: mock(() => createFluentChain([])),
          rollback: mock(() => {})
        };
        return await callback(tx);
      });

      await expect(gymService.createGym(newGymData)).rejects.toThrow('Failed to create gym.');
    });
  });

  describe('updateGym', () => {
    it('should update and return the gym', async () => {
      const updateData: UpdateGymRequest = {
        name_en: 'Updated Gym',
        phone: '555555555'
      };

      const updatedGym = {
        id: 'gym-1',
        name_th: 'ยิมเดิม',
        name_en: 'Updated Gym',
        description_th: null,
        description_en: null,
        phone: '555555555',
        email: null,
        province_id: 1,
        map_url: null,
        youtube_url: null,
        line_id: null,
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
          update: mock(() => createFluentChain([updatedGym])),
          select: mock(() => createFluentChain([mockProvince])),
          delete: mock(() => createFluentChain({ rowCount: 0 })),
          insert: mock(() => createFluentChain([])),
          query: {
            provinces: {
              findFirst: mock(() => Promise.resolve(mockProvince))
            }
          }
        };
        return await callback(tx);
      });

      const result = await gymService.updateGym('gym-1', updateData);

      expect(result).not.toBeNull();
      expect(result!.name_en).toBe('Updated Gym');
      expect(result!.phone).toBe('555555555');
    });

    it('should return null if gym not found', async () => {
      const updateData: UpdateGymRequest = {
        name_en: 'Updated Gym'
      };

      (db.transaction as any).mockImplementation(async (callback: any) => {
        const tx = {
          update: mock(() => createFluentChain([]))
        };
        return await callback(tx);
      });

      const result = await gymService.updateGym('non-existent', updateData);

      expect(result).toBeNull();
    });
  });

  describe('deleteGym', () => {
    it('should soft delete gym and return true', async () => {
      const mockDeleteResult = { rowCount: 1 };

      (db.transaction as any).mockImplementation(async (callback: any) => {
        const tx = {
          delete: mock(() => createFluentChain(mockDeleteResult)),
          update: mock(() => createFluentChain({ rowCount: 1 }))
        };
        return await callback(tx);
      });

      const result = await gymService.deleteGym('gym-1');

      expect(result).toBe(true);
    });

    it('should return false if gym not found', async () => {
      (db.transaction as any).mockImplementation(async (callback: any) => {
        const tx = {
          delete: mock(() => createFluentChain({ rowCount: 0 })),
          update: mock(() => createFluentChain({ rowCount: 0 }))
        };
        return await callback(tx);
      });

      const result = await gymService.deleteGym('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('getGymImages', () => {
    it('should return gym images', async () => {
      const mockImages: GymImage[] = [
        { id: 'img-1', gym_id: 'gym-1', image_url: 'http://example.com/image1.jpg' },
        { id: 'img-2', gym_id: 'gym-1', image_url: 'http://example.com/image2.jpg' }
      ];

      (db.select as any).mockReturnValue(createFluentChain(mockImages));

      const result = await gymService.getGymImages('gym-1');

      expect(result).toEqual(mockImages);
    });
  });

  describe('addGymImage', () => {
    it('should add gym image and return it', async () => {
      const newImage: GymImage = {
        id: 'new-img',
        gym_id: 'gym-1',
        image_url: 'http://example.com/new-image.jpg'
      };

      (db.insert as any).mockReturnValue(createFluentChain([newImage]));

      const result = await gymService.addGymImage('gym-1', 'http://example.com/new-image.jpg');

      expect(result).toEqual(newImage);
    });
  });

  describe('removeGymImage', () => {
    it('should remove gym image and return true', async () => {
      const mockDeleteResult = { rowCount: 1 };

      (db.delete as any).mockReturnValue(createFluentChain(mockDeleteResult));

      const result = await gymService.removeGymImage('img-1');

      expect(result).toBe(true);
    });

    it('should return false if image not found', async () => {
      (db.delete as any).mockReturnValue(createFluentChain({ rowCount: 0 }));

      const result = await gymService.removeGymImage('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('getGymsByProvince', () => {
    it('should return gyms filtered by province', async () => {
      const mockGyms = [{
        id: 'gym-1',
        name_th: 'ยิมมวยไทย',
        name_en: 'Bangkok Gym',
        description_th: null,
        description_en: null,
        phone: null,
        email: null,
        province_id: 1,
        map_url: null,
        youtube_url: null,
        line_id: null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        provinceData: { id: 1, name_th: 'กรุงเทพฯ', name_en: 'Bangkok' }
      }];

      (db.select as any).mockReturnValue(createFluentChain(mockGyms));

      const result = await gymService.getGymsByProvince(1);

      expect(result.length).toBe(1);
      expect(result[0]!.province?.id).toBe(1);
    });
  });
}); 