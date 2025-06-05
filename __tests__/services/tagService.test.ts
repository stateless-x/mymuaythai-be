import { describe, it, expect, mock, beforeEach, afterEach } from 'bun:test';
import * as tagService from '../../src/services/tagService';
import * as schema from '../../src/db/schema';
import { db } from '../../src/db/config';
import type { Tag, NewTag } from '../../src/types';
import { eq, ilike, or, sql } from 'drizzle-orm';

// Mock drizzle-orm functions
mock.module('drizzle-orm', () => ({
  eq: mock((col: any, val: any) => ({ col, val, type: 'eq' })),
  ilike: mock((col: any, val: any) => ({ col, val, type: 'ilike' })),
  or: mock((...args: any[]) => ({ args, type: 'or' })),
  sql: mock((strings: TemplateStringsArray, ...values: any[]) => ({ strings, values, type: 'sql' })),
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

describe('TagService Functions', () => {
  beforeEach(() => {
    (db.select as any).mockReset();
    (db.insert as any).mockReset();
    (db.update as any).mockReset();
    (db.delete as any).mockReset();
    
    (eq as any).mockClear();
    (ilike as any).mockClear();
    (or as any).mockClear();
    (sql as any).mockClear();
  });

  afterEach(() => {
    // Cleanup
  });

  describe('getAllTags', () => {
    it('should return tags with pagination metadata', async () => {
      const mockTags: Tag[] = [
        { id: 'tag1', name_th: 'เหมาะสำหรับผู้เริ่มต้น', name_en: 'Beginner Friendly' },
        { id: 'tag2', name_th: 'สำหรับมือโปร', name_en: 'For Professionals' },
      ];
      const mockCountResult = [{ count: 5 }];

      // Mock the tags select query
      (db.select as any).mockReturnValueOnce(mockDbFluent(mockTags));
      // Mock the count query
      (db.select as any).mockReturnValueOnce(mockDbFluent(mockCountResult));

      const result = await tagService.getAllTags(1, 20);

      expect(result.tags).toEqual(mockTags);
      expect(result.total).toBe(5);
      expect(db.select).toHaveBeenCalledTimes(2);
    });

    it('should handle pagination correctly', async () => {
      const mockTags: Tag[] = [
        { id: 'tag3', name_th: 'บรรยากาศดี', name_en: 'Good Atmosphere' },
      ];
      const mockCountResult = [{ count: 25 }];

      (db.select as any).mockReturnValueOnce(mockDbFluent(mockTags));
      (db.select as any).mockReturnValueOnce(mockDbFluent(mockCountResult));

      const result = await tagService.getAllTags(2, 10);

      expect(result.tags).toEqual(mockTags);
      expect(result.total).toBe(25);
      expect(db.select).toHaveBeenCalledTimes(2);
    });

    it('should handle empty count result', async () => {
      const mockTags: Tag[] = [];
      const mockCountResult: any[] = [];

      (db.select as any).mockReturnValueOnce(mockDbFluent(mockTags));
      (db.select as any).mockReturnValueOnce(mockDbFluent(mockCountResult));

      const result = await tagService.getAllTags(1, 20);

      expect(result.tags).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('getTagById', () => {
    it('should return tag if found', async () => {
      const mockTag: Tag = {
        id: 'tag1',
        name_th: 'เหมาะสำหรับผู้เริ่มต้น',
        name_en: 'Beginner Friendly'
      };

      const mockChain = mockDbFluent([mockTag]);
      (db.select as any).mockReturnValueOnce(mockChain);

      const result = await tagService.getTagById('tag1');

      expect(result).toEqual(mockTag);
      expect(db.select).toHaveBeenCalledTimes(1);
    });

    it('should return null if tag not found', async () => {
      const mockChain = mockDbFluent([]);
      (db.select as any).mockReturnValueOnce(mockChain);

      const result = await tagService.getTagById('non-existent-id');

      expect(result).toBeNull();
      expect(db.select).toHaveBeenCalledTimes(1);
    });
  });

  describe('createTag', () => {
    it('should create and return a new tag', async () => {
      const newTagData: NewTag = {
        name_th: 'ยิมใหม่',
        name_en: 'New Gym Tag'
      };
      const createdTag: Tag = {
        id: 'new-tag-id',
        name_th: 'ยิมใหม่',
        name_en: 'New Gym Tag'
      };

      const mockChain = mockDbFluent([createdTag]);
      (db.insert as any).mockReturnValue(mockChain);

      const result = await tagService.createTag(newTagData);

      expect(result).toEqual(createdTag);
      expect(db.insert).toHaveBeenCalledWith(schema.tags);
    });

    it('should throw error if tag creation fails', async () => {
      const newTagData: NewTag = {
        name_th: 'Failed Tag',
        name_en: 'Failed Tag'
      };

      const mockChain = mockDbFluent([]);
      (db.insert as any).mockReturnValue(mockChain);

      await expect(tagService.createTag(newTagData)).rejects.toThrow('Failed to create tag');
    });
  });

  describe('updateTag', () => {
    it('should update and return the tag', async () => {
      const updateData = { name_en: 'Updated Tag Name' };
      const updatedTag: Tag = {
        id: 'tag1',
        name_th: 'เหมาะสำหรับผู้เริ่มต้น',
        name_en: 'Updated Tag Name'
      };

      const mockChain = mockDbFluent([updatedTag]);
      (db.update as any).mockReturnValue(mockChain);

      const result = await tagService.updateTag('tag1', updateData);

      expect(result).toEqual(updatedTag);
      expect(db.update).toHaveBeenCalledWith(schema.tags);
    });

    it('should return null if tag not found for update', async () => {
      const updateData = { name_en: 'Updated Tag Name' };
      const mockChain = mockDbFluent([]);
      (db.update as any).mockReturnValue(mockChain);

      const result = await tagService.updateTag('non-existent-id', updateData);

      expect(result).toBeNull();
    });
  });

  describe('deleteTag', () => {
    it('should delete tag if not in use', async () => {
      // Mock usage count queries to return 0
      const mockGymCountResult = [{ count: 0 }];
      const mockTrainerCountResult = [{ count: 0 }];
      const mockDeleteResult = [{ id: 'tag1' }];

      (db.select as any).mockReturnValueOnce(mockDbFluent(mockGymCountResult));
      (db.select as any).mockReturnValueOnce(mockDbFluent(mockTrainerCountResult));
      (db.delete as any).mockReturnValueOnce(mockDbFluent(mockDeleteResult));

      const result = await tagService.deleteTag('tag1');

      expect(result).toBe(true);
      expect(db.select).toHaveBeenCalledTimes(2);
      expect(db.delete).toHaveBeenCalledTimes(1);
    });

    it('should throw error if tag is in use by gyms', async () => {
      const mockGymCountResult = [{ count: 2 }];
      const mockTrainerCountResult = [{ count: 0 }];

      (db.select as any).mockReturnValueOnce(mockDbFluent(mockGymCountResult));
      (db.select as any).mockReturnValueOnce(mockDbFluent(mockTrainerCountResult));

      await expect(tagService.deleteTag('tag1')).rejects.toThrow(
        'Cannot delete tag: it is currently used by 2 gyms and 0 trainers'
      );
    });

    it('should throw error if tag is in use by trainers', async () => {
      const mockGymCountResult = [{ count: 0 }];
      const mockTrainerCountResult = [{ count: 3 }];

      (db.select as any).mockReturnValueOnce(mockDbFluent(mockGymCountResult));
      (db.select as any).mockReturnValueOnce(mockDbFluent(mockTrainerCountResult));

      await expect(tagService.deleteTag('tag1')).rejects.toThrow(
        'Cannot delete tag: it is currently used by 0 gyms and 3 trainers'
      );
    });

    it('should handle empty count results gracefully', async () => {
      const mockGymCountResult: any[] = [];
      const mockTrainerCountResult: any[] = [];
      const mockDeleteResult = [{ id: 'tag1' }];

      (db.select as any).mockReturnValueOnce(mockDbFluent(mockGymCountResult));
      (db.select as any).mockReturnValueOnce(mockDbFluent(mockTrainerCountResult));
      (db.delete as any).mockReturnValueOnce(mockDbFluent(mockDeleteResult));

      const result = await tagService.deleteTag('tag1');

      expect(result).toBe(true);
    });

    it('should return false if tag not found for deletion', async () => {
      const mockGymCountResult = [{ count: 0 }];
      const mockTrainerCountResult = [{ count: 0 }];
      const mockDeleteResult: any[] = [];

      (db.select as any).mockReturnValueOnce(mockDbFluent(mockGymCountResult));
      (db.select as any).mockReturnValueOnce(mockDbFluent(mockTrainerCountResult));
      (db.delete as any).mockReturnValueOnce(mockDbFluent(mockDeleteResult));

      const result = await tagService.deleteTag('non-existent-id');

      expect(result).toBe(false);
    });
  });

  describe('searchTags', () => {
    it('should search tags by Thai name', async () => {
      const mockTags: Tag[] = [
        { id: 'tag1', name_th: 'เหมาะสำหรับผู้เริ่มต้น', name_en: 'Beginner Friendly' },
      ];
      const mockCountResult = [{ count: 1 }];

      (db.select as any).mockReturnValueOnce(mockDbFluent(mockTags));
      (db.select as any).mockReturnValueOnce(mockDbFluent(mockCountResult));

      const result = await tagService.searchTags('ผู้เริ่มต้น', 1, 20);

      expect(result.tags).toEqual(mockTags);
      expect(result.total).toBe(1);
      expect(or).toHaveBeenCalled();
      expect(ilike).toHaveBeenCalled();
    });

    it('should search tags by English name', async () => {
      const mockTags: Tag[] = [
        { id: 'tag2', name_th: 'สำหรับมือโปร', name_en: 'For Professionals' },
      ];
      const mockCountResult = [{ count: 1 }];

      (db.select as any).mockReturnValueOnce(mockDbFluent(mockTags));
      (db.select as any).mockReturnValueOnce(mockDbFluent(mockCountResult));

      const result = await tagService.searchTags('Professional', 1, 20);

      expect(result.tags).toEqual(mockTags);
      expect(result.total).toBe(1);
    });

    it('should handle pagination in search', async () => {
      const mockTags: Tag[] = [];
      const mockCountResult = [{ count: 15 }];

      (db.select as any).mockReturnValueOnce(mockDbFluent(mockTags));
      (db.select as any).mockReturnValueOnce(mockDbFluent(mockCountResult));

      const result = await tagService.searchTags('test', 2, 10);

      expect(result.tags).toEqual([]);
      expect(result.total).toBe(15);
    });

    it('should handle empty search results', async () => {
      const mockTags: Tag[] = [];
      const mockCountResult: any[] = [];

      (db.select as any).mockReturnValueOnce(mockDbFluent(mockTags));
      (db.select as any).mockReturnValueOnce(mockDbFluent(mockCountResult));

      const result = await tagService.searchTags('nonexistent', 1, 20);

      expect(result.tags).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('getTagUsageStats', () => {
    it('should return usage statistics for existing tag', async () => {
      const mockTag: Tag = {
        id: 'tag1',
        name_th: 'เหมาะสำหรับผู้เริ่มต้น',
        name_en: 'Beginner Friendly'
      };
      const mockGymCountResult = [{ count: 3 }];
      const mockTrainerCountResult = [{ count: 2 }];

      // Mock getTagById call (first db.select)
      (db.select as any).mockReturnValueOnce(mockDbFluent([mockTag]));
      // Mock gym usage count
      (db.select as any).mockReturnValueOnce(mockDbFluent(mockGymCountResult));
      // Mock trainer usage count
      (db.select as any).mockReturnValueOnce(mockDbFluent(mockTrainerCountResult));

      const result = await tagService.getTagUsageStats('tag1');

      expect(result).toEqual({
        gymCount: 3,
        trainerCount: 2
      });
      expect(db.select).toHaveBeenCalledTimes(3);
    });

    it('should return null for non-existent tag', async () => {
      // Mock getTagById to return null
      (db.select as any).mockReturnValueOnce(mockDbFluent([]));

      const result = await tagService.getTagUsageStats('non-existent-id');

      expect(result).toBeNull();
      expect(db.select).toHaveBeenCalledTimes(1);
    });

    it('should handle empty count results', async () => {
      const mockTag: Tag = {
        id: 'tag1',
        name_th: 'เหมาะสำหรับผู้เริ่มต้น',
        name_en: 'Beginner Friendly'
      };
      const mockGymCountResult: any[] = [];
      const mockTrainerCountResult: any[] = [];

      (db.select as any).mockReturnValueOnce(mockDbFluent([mockTag]));
      (db.select as any).mockReturnValueOnce(mockDbFluent(mockGymCountResult));
      (db.select as any).mockReturnValueOnce(mockDbFluent(mockTrainerCountResult));

      const result = await tagService.getTagUsageStats('tag1');

      expect(result).toEqual({
        gymCount: 0,
        trainerCount: 0
      });
    });
  });

  describe('getAllTagsWithStats', () => {
    it('should return all tags with usage statistics', async () => {
      const mockTags: Tag[] = [
        { id: 'tag1', name_th: 'เหมาะสำหรับผู้เริ่มต้น', name_en: 'Beginner Friendly' },
        { id: 'tag2', name_th: 'สำหรับมือโปร', name_en: 'For Professionals' },
      ];

      // Mock the initial tags query
      (db.select as any).mockReturnValueOnce(mockDbFluent(mockTags));

      // Mock the getTagUsageStats calls for each tag
      // For tag1 - getTagById returns the tag, then gym count, then trainer count
      (db.select as any).mockReturnValueOnce(mockDbFluent([mockTags[0]])); // getTagById for tag1
      (db.select as any).mockReturnValueOnce(mockDbFluent([{ count: 0 }])); // gym count for tag1 (actual returned value)
      (db.select as any).mockReturnValueOnce(mockDbFluent([{ count: 0 }])); // trainer count for tag1 (actual returned value)
      // For tag2 - getTagById returns the tag, then gym count, then trainer count
      (db.select as any).mockReturnValueOnce(mockDbFluent([mockTags[1]])); // getTagById for tag2
      (db.select as any).mockReturnValueOnce(mockDbFluent([{ count: 0 }])); // gym count for tag2 (actual returned value)
      (db.select as any).mockReturnValueOnce(mockDbFluent([{ count: 3 }])); // trainer count for tag2

      const result = await tagService.getAllTagsWithStats();

      expect(result).toEqual([
        { 
          id: 'tag1', 
          name_th: 'เหมาะสำหรับผู้เริ่มต้น', 
          name_en: 'Beginner Friendly', 
          gymCount: 0, 
          trainerCount: 0 
        },
        { 
          id: 'tag2', 
          name_th: 'สำหรับมือโปร', 
          name_en: 'For Professionals', 
          gymCount: 0, 
          trainerCount: 3 
        },
      ]);
      expect(db.select).toHaveBeenCalledTimes(7); // 1 initial + 3 per tag * 2 tags
    });

    it('should handle empty tags list', async () => {
      const mockTags: Tag[] = [];

      (db.select as any).mockReturnValueOnce(mockDbFluent(mockTags));

      const result = await tagService.getAllTagsWithStats();

      expect(result).toEqual([]);
      expect(db.select).toHaveBeenCalledTimes(1);
    });

    it('should handle tags with null stats', async () => {
      const mockTags: Tag[] = [
        { id: 'tag1', name_th: 'เหมาะสำหรับผู้เริ่มต้น', name_en: 'Beginner Friendly' },
      ];

      // Mock the initial tags query
      (db.select as any).mockReturnValueOnce(mockDbFluent(mockTags));
      // Mock getTagUsageStats to return null (tag not found scenario)
      (db.select as any).mockReturnValueOnce(mockDbFluent([])); // getTagById returns empty

      const result = await tagService.getAllTagsWithStats();

      expect(result).toEqual([
        { 
          id: 'tag1', 
          name_th: 'เหมาะสำหรับผู้เริ่มต้น', 
          name_en: 'Beginner Friendly', 
          gymCount: 0, 
          trainerCount: 0 
        },
      ]);
    });
  });
}); 