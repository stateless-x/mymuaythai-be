import { describe, it, expect, mock, beforeEach, afterEach } from 'bun:test';
import * as gymService from '../../src/services/gymService';
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

describe('GymService Functions', () => {
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
    it('should update a gym and return the updated gym', async () => {
      const gymId = 'existing-gym-id';
      const updateData: UpdateGymRequest = {
        name_en: 'Updated Gym Name',
        phone: '9876543210'
      };
      const updatedGymMock: Gym = {
        id: gymId,
        name_th: 'Original Thai Name',
        name_en: 'Updated Gym Name',
        description_th: null,
        description_en: null,
        phone: '9876543210',
        email: null,
        province_id: 1,
        map_url: null,
        youtube_url: null,
        line_id: null,
        is_active: true,
        created_at: new Date(),
      };

      const mockChain = mockDbFluent([updatedGymMock]);
      (db.update as any).mockReturnValue(mockChain);

      const result = await gymService.updateGym(gymId, updateData);

      expect(result).toEqual(updatedGymMock);
      expect(db.update).toHaveBeenCalledWith(schema.gyms);
    });

    it('should return null if gym is not found', async () => {
      const gymId = 'non-existent-id';
      const updateData: UpdateGymRequest = { name_en: 'Updated Name' };
      const mockChain = mockDbFluent([]);
      (db.update as any).mockReturnValue(mockChain);

      const result = await gymService.updateGym(gymId, updateData);

      expect(result).toBeNull();
    });
  });

  describe('deleteGym', () => {
    it('should soft delete a gym and return true', async () => {
      const gymId = 'existing-gym-id';
      const mockChain = mockDbFluent([{ id: gymId }]);
      (db.update as any).mockReturnValue(mockChain);

      const result = await gymService.deleteGym(gymId);

      expect(result).toBe(true);
      expect(db.update).toHaveBeenCalledWith(schema.gyms);
    });

    it('should return false if gym is not found', async () => {
      const gymId = 'non-existent-id';
      const mockChain = mockDbFluent([]);
      (db.update as any).mockReturnValue(mockChain);

      const result = await gymService.deleteGym(gymId);

      expect(result).toBe(false);
    });
  });

  describe('getAllGyms', () => {
    it('should return paginated list of gyms', async () => {
      const mockGyms = [
        { id: 'gym1', name_en: 'Gym 1', provinceData: { id: 1, name_en: 'Bangkok' } },
        { id: 'gym2', name_en: 'Gym 2', provinceData: { id: 2, name_en: 'Chiang Mai' } }
      ];
      const totalCount = 5;

      const mockChain = mockDbFluent(mockGyms);
      const mockCountChain = mockDbFluent([{ value: totalCount }]);
      
      (db.select as any).mockReturnValueOnce(mockChain);
      (db.select as any).mockReturnValueOnce(mockCountChain);

      const result = await gymService.getAllGyms(1, 10);

      expect(result.gyms).toHaveLength(2);
      expect(result.total).toBe(totalCount);
      expect(db.select).toHaveBeenCalledTimes(2);
    });
  });

  describe('addGymImage', () => {
    it('should add an image to a gym and return the image', async () => {
      const gymId = 'gym-id';
      const imageUrl = 'http://example.com/image.jpg';
      const mockImage: GymImage = {
        id: 'image-id',
        gym_id: gymId,
        image_url: imageUrl
      };

      const mockChain = mockDbFluent([mockImage]);
      (db.insert as any).mockReturnValue(mockChain);

      const result = await gymService.addGymImage(gymId, imageUrl);

      expect(result).toEqual(mockImage);
      expect(db.insert).toHaveBeenCalledWith(schema.gymImages);
    });

    it('should throw an error if image addition fails', async () => {
      const gymId = 'gym-id';
      const imageUrl = 'http://example.com/image.jpg';
      const mockChain = mockDbFluent([]);
      (db.insert as any).mockReturnValue(mockChain);

      await expect(gymService.addGymImage(gymId, imageUrl)).rejects.toThrow('Image addition failed, no data returned.');
    });
  });

  describe('removeGymImage', () => {
    it('should remove an image and return true', async () => {
      const imageId = 'image-id';
      const mockChain = mockDbFluent([{ id: imageId }]);
      (db.delete as any).mockReturnValue(mockChain);

      const result = await gymService.removeGymImage(imageId);

      expect(result).toBe(true);
      expect(db.delete).toHaveBeenCalledWith(schema.gymImages);
    });

    it('should return false if image is not found', async () => {
      const imageId = 'non-existent-id';
      const mockChain = mockDbFluent([]);
      (db.delete as any).mockReturnValue(mockChain);

      const result = await gymService.removeGymImage(imageId);

      expect(result).toBe(false);
    });
  });

  describe('searchGyms', () => {
    it('should return empty results for empty search term', async () => {
      const result = await gymService.searchGyms('');
      
      expect(result.gyms).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should delegate to getAllGyms for valid search term', async () => {
      const searchTerm = 'test gym';
      const mockResult = {
        gyms: [{ id: 'gym1', name_en: 'Test Gym' }] as any,
        total: 1
      };

      // Mock getAllGyms by mocking the database calls it makes
      const mockChain = mockDbFluent(mockResult.gyms);
      const mockCountChain = mockDbFluent([{ value: mockResult.total }]);
      
      (db.select as any).mockReturnValueOnce(mockChain);
      (db.select as any).mockReturnValueOnce(mockCountChain);

      const result = await gymService.searchGyms(searchTerm);

      expect(result.gyms).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });
}); 