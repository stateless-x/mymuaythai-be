import { db } from '../db/config';
import * as schema from '../db/schema';
import { eq, ilike, or, sql } from 'drizzle-orm';
import { Tag, NewTag, PaginatedResponse } from '../types';

// Get all tags with pagination
export async function getAllTags(page: number = 1, pageSize: number = 20): Promise<{ tags: Tag[], total: number }> {
  const offset = (page - 1) * pageSize;
  
  const tags = await db
    .select()
    .from(schema.tags)
    .limit(pageSize)
    .offset(offset)
    .orderBy(schema.tags.name_en);
  
  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.tags);
  
  const total = totalResult[0] ? Number(totalResult[0].count) : 0;
  
  return { tags, total };
}

// Get tag by ID
export async function getTagById(id: string): Promise<Tag | null> {
  const tags = await db
    .select()
    .from(schema.tags)
    .where(eq(schema.tags.id, id))
    .limit(1);
  
  return tags[0] || null;
}

// Create new tag
export async function createTag(tagData: NewTag): Promise<Tag> {
  const insertedTags = await db
    .insert(schema.tags)
    .values(tagData)
    .returning();
  
  if (!insertedTags[0]) {
    throw new Error('Failed to create tag');
  }
  
  return insertedTags[0];
}

// Update tag
export async function updateTag(id: string, updateData: Partial<NewTag>): Promise<Tag | null> {
  const updatedTags = await db
    .update(schema.tags)
    .set(updateData)
    .where(eq(schema.tags.id, id))
    .returning();
  
  return updatedTags[0] || null;
}

// Delete tag
export async function deleteTag(id: string): Promise<boolean> {
  // First check if tag is being used
  const gymTagsCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.gymTags)
    .where(eq(schema.gymTags.tag_id, id));
  
  const trainerTagsCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.trainerTags)
    .where(eq(schema.trainerTags.tag_id, id));
  
  const gymUsageCount = gymTagsCount[0] ? Number(gymTagsCount[0].count) : 0;
  const trainerUsageCount = trainerTagsCount[0] ? Number(trainerTagsCount[0].count) : 0;
  
  if (gymUsageCount > 0 || trainerUsageCount > 0) {
    throw new Error(`Cannot delete tag: it is currently used by ${gymUsageCount} gyms and ${trainerUsageCount} trainers`);
  }
  
  const deletedTags = await db
    .delete(schema.tags)
    .where(eq(schema.tags.id, id))
    .returning();
  
  return deletedTags.length > 0;
}

// Search tags by name (Thai or English)
export async function searchTags(query: string, page: number = 1, pageSize: number = 20): Promise<{ tags: Tag[], total: number }> {
  const offset = (page - 1) * pageSize;
  const searchPattern = `%${query}%`;
  
  const tags = await db
    .select()
    .from(schema.tags)
    .where(
      or(
        ilike(schema.tags.name_th, searchPattern),
        ilike(schema.tags.name_en, searchPattern)
      )
    )
    .limit(pageSize)
    .offset(offset)
    .orderBy(schema.tags.name_en);
  
  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.tags)
    .where(
      or(
        ilike(schema.tags.name_th, searchPattern),
        ilike(schema.tags.name_en, searchPattern)
      )
    );
  
  const total = totalResult[0] ? Number(totalResult[0].count) : 0;
  
  return { tags, total };
}

// Get tag usage statistics
export async function getTagUsageStats(id: string): Promise<{ gymCount: number, trainerCount: number } | null> {
  const tag = await getTagById(id);
  if (!tag) return null;
  
  const gymTagsCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.gymTags)
    .where(eq(schema.gymTags.tag_id, id));
  
  const trainerTagsCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.trainerTags)
    .where(eq(schema.trainerTags.tag_id, id));
  
  return {
    gymCount: gymTagsCount[0] ? Number(gymTagsCount[0].count) : 0,
    trainerCount: trainerTagsCount[0] ? Number(trainerTagsCount[0].count) : 0
  };
}

// Get all tags with usage statistics
export async function getAllTagsWithStats(): Promise<(Tag & { gymCount: number, trainerCount: number })[]> {
  const tags = await db
    .select()
    .from(schema.tags)
    .orderBy(schema.tags.name_en);
  
  const tagsWithStats = await Promise.all(
    tags.map(async (tag) => {
      const stats = await getTagUsageStats(tag.id);
      return {
        ...tag,
        gymCount: stats?.gymCount || 0,
        trainerCount: stats?.trainerCount || 0
      };
    })
  );
  
  return tagsWithStats;
} 