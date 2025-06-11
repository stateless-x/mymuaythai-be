import { z } from 'zod';

// Common validation patterns
const emailSchema = z.string().email('Invalid email format');
const phoneSchema = z.string().regex(/^[0-9\-+\s()]+$/, 'Invalid phone number format').optional();
const urlSchema = z.string().url('Invalid URL format').optional();
const lineIdSchema = z.string().regex(/^@[a-zA-Z0-9._-]+$/, 'Line ID must start with @ and contain valid characters').optional();

// Gym validation schemas
export const createGymSchema = z.object({
  name_th: z.string().min(1, 'Thai name is required').max(255, 'Thai name too long'),
  name_en: z.string().min(1, 'English name is required').max(255, 'English name too long'),
  description_th: z.string().max(5000, 'Thai description too long').optional(),
  description_en: z.string().max(5000, 'English description too long').optional(),
  phone: phoneSchema,
  email: emailSchema.optional(),
  province_id: z.number().int().positive('Province ID must be positive').optional(),
  map_url: urlSchema,
  youtube_url: urlSchema,
  line_id: lineIdSchema,
});

export const updateGymSchema = createGymSchema.partial().extend({
  is_active: z.boolean().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);

// Trainer validation schemas
export const createTrainerSchema = z.object({
  first_name_th: z.string().min(1, 'Thai first name is required').max(100, 'First name too long'),
  first_name_en: z.string().min(1, 'English first name is required').max(100, 'First name too long'),
  last_name_th: z.string().max(100, 'Last name too long').optional(),
  last_name_en: z.string().max(100, 'Last name too long').optional(),
  bio_th: z.string().max(5000, 'Thai bio too long').optional(),
  bio_en: z.string().max(5000, 'English bio too long').optional(),
  phone: phoneSchema,
  email: emailSchema.optional(),
  line_id: lineIdSchema,
  is_freelance: z.boolean().default(false),
  gym_id: z.string().uuid('Invalid gym ID format').optional(),
  province_id: z.number().int().positive('Province ID must be positive').optional(),
});

export const updateTrainerSchema = createTrainerSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);

// Query parameter validation
export const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().positive()).default('1'),
  pageSize: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().positive().max(100)).default('10'),
});

export const gymQuerySchema = paginationSchema.extend({
  search: z.string().max(255).optional(),
  provinceId: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().positive()).optional(),
  includeInactive: z.string().transform((val) => val === 'true').pipe(z.boolean()).optional(),
});

export const trainerQuerySchema = paginationSchema.extend({
  search: z.string().max(255).optional(),
  provinceId: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().positive()).optional(),
  gymId: z.string().uuid().optional(),
  isFreelance: z.string().transform((val) => val === 'true').pipe(z.boolean()).optional(),
  includeInactive: z.string().transform((val) => val === 'true').pipe(z.boolean()).optional(),
});

export const gymByIdQuerySchema = z.object({
  includeInactive: z.string().transform((val) => val === 'true').pipe(z.boolean()).optional(),
});

export const trainerByIdQuerySchema = z.object({
  includeInactive: z.string().transform((val) => val === 'true').pipe(z.boolean()).optional(),
});

// Error formatter
export function formatZodError(error: z.ZodError): string {
  return error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
} 