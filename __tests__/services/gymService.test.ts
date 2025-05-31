import { describe, it, expect, mock, beforeEach, afterEach } from 'bun:test';
import { GymService } from '../../src/services/gymService';
import * as schema from '../../src/db/schema';
import { db } from '../../src/db/config';
import type { GymWithDetails, Province, GymImage, Tag, Trainer, CreateGymRequest, Gym, UpdateGymRequest, NewGymImage } from '../../src/types';
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

describe('GymService', () => {
  let gymService: GymService;

  beforeEach(() => {
    gymService = new GymService();
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

  describe('getGymById', () => {
    it('should return null if gym is not found', async () => {
      const gymId = 'non-existent-id';
      const mockChain = mockDbFluent([]);
      (db.select as any).mockReturnValueOnce(mockChain);

      const result = await gymService.getGymById(gymId);

      expect(result).toBeNull();
      expect(db.select).toHaveBeenCalledTimes(1);
    });

    it('should return gym details if gym is found', async () => {
      const gymId = 'existing-id';
      const mockGymData = {
        id: gymId,
        name_th: 'Test Gym TH',
        name_en: 'Test Gym EN',
        description_th: 'Description TH',
        description_en: 'Description EN',
        phone: '1234567890',
        email: 'test@gym.com',
        province_id: 1,
        map_url: 'http://map.url',
        youtube_url: 'http://youtube.url',
        line_id: '@testgym',
        is_active: true,
        created_at: new Date(),
        provinceData: { id: 1, name_th: 'Bangkok TH', name_en: 'Bangkok EN' } as Province,
      };
      const mockImages: GymImage[] = [
        { id: 'img1', gym_id: gymId, image_url: 'http://image.url/1.jpg' }
      ];
      const mockTags: Tag[] = [
        { id: 'tag1', name_th: 'มวยไทย', name_en: 'Muay Thai' }
      ];
      const mockTrainers: Trainer[] = [
        {
          id: 'trainer1',
          gym_id: gymId, 
          first_name_th: 'เทรนเนอร์',
          first_name_en: 'Trainer',
          last_name_th: 'นามสกุล',
          last_name_en: 'Lastname',
          bio_th: 'ประวัติย่อ',
          bio_en: 'Bio EN',
          phone: '0987654321',
          email: 'trainer@gym.com',
          line_id: 'trainerline',
          is_active: true,
          created_at: new Date(),
          province_id: 1,
          is_freelance: false,
        }
      ];

      // Mock the main gym select query
      (db.select as any).mockReturnValueOnce(mockDbFluent([mockGymData]));
      // Mock the gymImages select query
      (db.select as any).mockReturnValueOnce(mockDbFluent(mockImages));
      // Mock the gymTags select query  
      (db.select as any).mockReturnValueOnce(mockDbFluent([{ tag_id: 'tag1' }]));
      // Mock the tags select query
      (db.select as any).mockReturnValueOnce(mockDbFluent(mockTags));
      // Mock the trainers select query
      (db.select as any).mockReturnValueOnce(mockDbFluent(mockTrainers));

      const result = await gymService.getGymById(gymId);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(gymId);
      expect(result?.name_en).toBe('Test Gym EN');
      expect(result?.images).toEqual(mockImages);
      expect(result?.tags).toEqual(mockTags);
      expect(result?.associatedTrainers).toEqual(mockTrainers);
      expect(result?.province?.name_en).toBe('Bangkok EN');
      expect(db.select).toHaveBeenCalledTimes(5);
    });
  });

  describe('createGym', () => {
    it('should create a new gym and return it', async () => {
      const newGymData: CreateGymRequest = {
        name_th: 'ยิมใหม่',
        name_en: 'New Gym',
        description_th: 'คำอธิบายยิมใหม่',
        description_en: 'New gym description',
        phone: '0123456789',
        email: 'newgym@example.com',
        province_id: 1,
        map_url: 'http://maps.google.com/newgym',
        youtube_url: 'http://youtube.com/newgym',
        line_id: '@newgym'
      };
      const createdGymMock: Gym = {
        id: 'new-gym-id',
        name_th: newGymData.name_th,
        name_en: newGymData.name_en,
        description_th: newGymData.description_th || null,
        description_en: newGymData.description_en || null,
        phone: newGymData.phone || null,
        email: newGymData.email || null,
        province_id: newGymData.province_id === undefined ? null : newGymData.province_id,
        map_url: newGymData.map_url || null,
        youtube_url: newGymData.youtube_url || null,
        line_id: newGymData.line_id || null,
        is_active: true,
        created_at: new Date(),
      };

      const mockChain = mockDbFluent([createdGymMock]);
      (db.insert as any).mockReturnValue(mockChain);

      const result = await gymService.createGym(newGymData);
      
      expect(result).toEqual(createdGymMock);
      expect(db.insert).toHaveBeenCalledWith(schema.gyms);
    });

    it('should throw an error if gym creation returns no data', async () => {
      const newGymData: CreateGymRequest = { name_th: 'No Data Gym', name_en: 'No Data Gym EN', province_id: 1 };
      const mockChain = mockDbFluent([]);
      (db.insert as any).mockReturnValue(mockChain);

      await expect(gymService.createGym(newGymData)).rejects.toThrow('Gym creation failed, no data returned.');
    });
  });

  describe('updateGym', () => {
    it('should update an existing gym and return it', async () => {
      const gymId = 'existing-gym-id';
      const updateData: UpdateGymRequest = {
        name_en: 'Updated Gym Name EN',
        phone: '0998887777'
      };
      const updatedGymMock: Gym = {
        id: gymId,
        name_th: 'Original Name TH',
        name_en: updateData.name_en!,
        description_th: null,
        description_en: null,
        phone: updateData.phone!,
        email: 'original@example.com',
        province_id: 1,
        map_url: null,
        youtube_url: null,
        line_id: null,
        is_active: true,
        created_at: new Date(),
      };

      (db.update as any).mockReturnValue(mockDbFluent([updatedGymMock]));

      const result = await gymService.updateGym(gymId, updateData);

      expect(result).toEqual(updatedGymMock);
      expect(db.update).toHaveBeenCalledWith(schema.gyms);
    });

    it('should return null if gym to update is not found or inactive', async () => {
      const gymId = 'non-existent-gym-id';
      const updateData: UpdateGymRequest = { name_en: 'Updated Gym Name EN' };
      (db.update as any).mockReturnValue(mockDbFluent([]));

      const result = await gymService.updateGym(gymId, updateData);

      expect(result).toBeNull();
    });
  });

  describe('deleteGym', () => {
    it('should deactivate an existing gym and return true', async () => {
      const gymId = 'existing-gym-id';
      (db.update as any).mockReturnValue(mockDbFluent([{ id: gymId }]));

      const result = await gymService.deleteGym(gymId);

      expect(result).toBe(true);
      expect(db.update).toHaveBeenCalledWith(schema.gyms);
    });

    it('should return false if gym to delete is not found or already inactive', async () => {
      const gymId = 'non-existent-gym-id';
      (db.update as any).mockReturnValue(mockDbFluent([]));

      const result = await gymService.deleteGym(gymId);

      expect(result).toBe(false);
    });
  });

  describe('getAllGyms', () => {
    const mockGymRawData = (id: string, name: string, provinceId: number) => ({
      id, name_th: `${name} TH`, name_en: name, description_th: 'Desc TH', description_en: 'Desc EN', phone: '111', email: 'gym@test.com', province_id: provinceId, map_url: null, youtube_url: null, line_id: null, is_active: true, created_at: new Date(),
      provinceData: { id: provinceId, name_th: 'Province', name_en: 'Province' } as Province,
    });

    it('should return the first page of gyms with total count', async () => {
      const page = 1, pageSize = 2;
      const rawGyms = [mockGymRawData('gym1', 'Gym Alpha', 1), mockGymRawData('gym2', 'Gym Beta', 2)];
      const totalCount = 5;

      // Mock for the data query
      const dataMockChain = mockDbFluent(rawGyms);
      (db.select as any).mockReturnValueOnce(dataMockChain);
     
      // Mock for the count query
      const countMockResult = [{ value: totalCount }];
      const countMockChain = mockDbFluent(countMockResult);
      (db.select as any).mockReturnValueOnce(countMockChain);

      const result = await gymService.getAllGyms(page, pageSize);

      expect(result.gyms).toHaveLength(2);
      expect(result.total).toBe(totalCount);
      expect(result.gyms[0]!.id).toBe('gym1');
      expect(result.gyms[0]!.name_en).toBe('Gym Alpha');
      expect(result.gyms[0]!.province?.id).toBe(1);
      expect(db.select).toHaveBeenCalledTimes(2);
    });

    it('should return empty array and total 0 if no gyms match', async () => {
        const dataMockChain = mockDbFluent([]);
        (db.select as any).mockReturnValueOnce(dataMockChain);
        const countMockChain = mockDbFluent([{ value: 0 }]);
        (db.select as any).mockReturnValueOnce(countMockChain);

        const result = await gymService.getAllGyms(1,10);
        expect(result.gyms).toEqual([]);
        expect(result.total).toBe(0);
        expect(db.select).toHaveBeenCalledTimes(2);
    });
  });
}); 