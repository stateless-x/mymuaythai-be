import { db } from '../db/config';
import * as schema from '../db/schema';
import { eq, ilike, or, sql } from 'drizzle-orm';
import { Tag, NewTag, PaginatedResponse } from '../types';

// Helper function to generate slug from English name
function generateSlug(nameEn: string): string {
  return nameEn
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

// Check if slug already exists (for uniqueness)
async function isSlugUnique(slug: string, excludeId?: number): Promise<boolean> {
  const existing = await db
    .select({ id: schema.tags.id })
    .from(schema.tags)
    .where(eq(schema.tags.slug, slug))
    .limit(1);
  
  if (existing.length === 0) return true;
  if (excludeId && existing[0]?.id === excludeId) return true;
  return false;
}

// Generate unique slug
async function generateUniqueSlug(nameEn: string, excludeId?: number): Promise<string> {
  let baseSlug = generateSlug(nameEn);
  let slug = baseSlug;
  let counter = 1;

  while (!(await isSlugUnique(slug, excludeId))) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

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
export async function getTagById(id: number): Promise<Tag | null> {
  const tags = await db
    .select()
    .from(schema.tags)
    .where(eq(schema.tags.id, id))
    .limit(1);
  
  return tags[0] || null;
}

// Get tag by slug
export async function getTagBySlug(slug: string): Promise<Tag | null> {
  const tags = await db
    .select()
    .from(schema.tags)
    .where(eq(schema.tags.slug, slug))
    .limit(1);
  
  return tags[0] || null;
}

// Create new tag
export async function createTag(tagData: Omit<NewTag, 'id' | 'slug'>): Promise<Tag> {
  const slug = await generateUniqueSlug(tagData.name_en);
  
  const insertedTags = await db
    .insert(schema.tags)
    .values({
      ...tagData,
      slug,
    })
    .returning();
  
  if (!insertedTags[0]) {
    throw new Error('Failed to create tag');
  }
  
  return insertedTags[0];
}

// Update tag
export async function updateTag(id: number, updateData: Partial<Omit<NewTag, 'id' | 'slug'>>): Promise<Tag | null> {
  let slug: string | undefined;
  
  // If name_en is being updated, regenerate slug
  if (updateData.name_en) {
    slug = await generateUniqueSlug(updateData.name_en, id);
  }
  
  const updatedTags = await db
    .update(schema.tags)
    .set({
      ...updateData,
      ...(slug && { slug }),
    })
    .where(eq(schema.tags.id, id))
    .returning();
  
  return updatedTags[0] || null;
}

// Delete tag (cascading deletion - removes all associations)
export async function deleteTag(id: number): Promise<boolean> {
  return await db.transaction(async (tx) => {
    // First, delete all gym-tag associations
    await tx
      .delete(schema.gymTags)
      .where(eq(schema.gymTags.tag_id, id));
    
    // Then, delete all trainer-tag associations  
    await tx
      .delete(schema.trainerTags)
      .where(eq(schema.trainerTags.tag_id, id));
    
    // Finally, delete the tag itself
    const deletedTags = await tx
      .delete(schema.tags)
      .where(eq(schema.tags.id, id))
      .returning();
    
    return deletedTags.length > 0;
  });
}

// Search tags by name (Thai or English) with usage stats
export async function searchTags(query: string, page: number = 1, pageSize: number = 20): Promise<{ tags: (Tag & { gymCount: number, trainerCount: number })[], total: number }> {
  const offset = (page - 1) * pageSize;
  const searchPattern = `%${query}%`;
  
  const tags = await db
    .select()
    .from(schema.tags)
    .where(
      or(
        ilike(schema.tags.name_th, searchPattern),
        ilike(schema.tags.name_en, searchPattern),
        ilike(schema.tags.slug, searchPattern)
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
        ilike(schema.tags.name_en, searchPattern),
        ilike(schema.tags.slug, searchPattern)
      )
    );
  
  const total = totalResult[0] ? Number(totalResult[0].count) : 0;
  
  // Add usage statistics to each tag
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
  
  return { tags: tagsWithStats, total };
}

// Get paginated tags with search and usage stats
export async function getTagsPaginated(
  page: number = 1,
  pageSize: number = 20,
  searchTerm?: string,
  sortField: 'name_th' | 'name_en' | 'id' = 'name_en',
  sortBy: 'asc' | 'desc' = 'asc'
): Promise<{ tags: (Tag & { gymCount: number, trainerCount: number })[], total: number }> {
  
  // If search term provided, use search function
  if (searchTerm && searchTerm.trim()) {
    return searchTags(searchTerm.trim(), page, pageSize);
  }
  
  // Otherwise, use regular pagination
  const offset = (page - 1) * pageSize;
  
  const sortColumn = sortField === 'name_th' ? schema.tags.name_th : 
                    sortField === 'id' ? schema.tags.id : 
                    schema.tags.name_en;
  
  const tags = await db
    .select()
    .from(schema.tags)
    .limit(pageSize)
    .offset(offset)
    .orderBy(sortBy === 'desc' ? sql`${sortColumn} DESC` : sortColumn);
  
  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.tags);
  
  const total = totalResult[0] ? Number(totalResult[0].count) : 0;
  
  // Add usage statistics to each tag
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
  
  return { tags: tagsWithStats, total };
}

// Get tag usage statistics
export async function getTagUsageStats(id: number): Promise<{ gymCount: number, trainerCount: number } | null> {
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