import { z } from 'zod';

// Common validation patterns
const emailSchema = z.string().email('Invalid email format').optional();
const phoneSchema = z.string().regex(/^[0-9\-+\s()]+$/, 'Invalid phone number format');
const urlSchema = z.string().url('Invalid URL format').optional();
const lineIdSchema = z.string().regex(/^@?[a-zA-Z0-9._-]+$/, 'Line ID must contain valid characters (optional @ at start)').optional();

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
  tags: z.array(z.object({
    id: z.string().uuid('Invalid tag ID format'),
    name_th: z.string().min(1, 'Thai tag name is required'),
    name_en: z.string().min(1, 'English tag name is required'),
  })).optional(),
  associatedTrainers: z.array(z.string().uuid('Invalid trainer ID format')).optional(),
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
  exp_year: z.number().int().min(0, 'Experience years must be non-negative').max(100, 'Experience years too high').optional(),
  tags: z.array(z.object({
    id: z.string().uuid('Invalid tag ID format'),
    name_th: z.string().min(1, 'Thai tag name is required'),
    name_en: z.string().min(1, 'English tag name is required'),
  })).optional(),
  classes: z.array(z.object({
    id: z.string().optional(),
    name: z.object({
      th: z.string().min(1, 'Thai class name is required'),
      en: z.string().min(1, 'English class name is required'),
    }),
    description: z.object({
      th: z.string().min(1, 'Thai description is required'),
      en: z.string().min(1, 'English description is required'),
    }),
    duration: z.number().int().min(1, 'Duration must be at least 1 minute'),
    price: z.number().min(0, 'Price must be non-negative'),
    currency: z.string().optional(),
    maxStudents: z.number().int().min(1, 'Max students must be at least 1'),
    isActive: z.boolean().optional(),
  })).optional(),
});

export const updateTrainerSchema = createTrainerSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);

// Trainer class validation schemas
export const createTrainerClassSchema = z.object({
  trainer_id: z.string().uuid('Invalid trainer ID format'),
  class_id: z.string().uuid('Invalid class ID format').optional(),
  name_th: z.string().min(1, 'Thai class name is required').max(255, 'Class name too long').optional(),
  name_en: z.string().min(1, 'English class name is required').max(255, 'Class name too long').optional(),
  description_th: z.string().max(5000, 'Thai description too long').optional(),
  description_en: z.string().max(5000, 'English description too long').optional(),
  duration_minutes: z.number().int().min(1, 'Duration must be at least 1 minute').max(1440, 'Duration cannot exceed 24 hours').optional(),
  max_students: z.number().int().min(1, 'Max students must be at least 1').max(100, 'Max students too high').optional(),
  price: z.number().int().min(0, 'Price must be non-negative').optional(),
  is_private_class: z.boolean().default(false),
}).refine(
  (data) => {
    // Either class_id must be provided (existing class) or private class fields must be provided
    if (!data.class_id && !data.is_private_class) {
      return false;
    }
    if (data.is_private_class && (!data.name_th || !data.name_en)) {
      return false;
    }
    return true;
  },
  { message: 'Either provide class_id for existing class or complete private class information (name_th, name_en) for private class' }
);

export const updateTrainerClassSchema = z.object({
  class_id: z.string().uuid('Invalid class ID format').optional(),
  name_th: z.string().min(1, 'Thai class name is required').max(255, 'Class name too long').optional(),
  name_en: z.string().min(1, 'English class name is required').max(255, 'Class name too long').optional(),
  description_th: z.string().max(5000, 'Thai description too long').optional(),
  description_en: z.string().max(5000, 'English description too long').optional(),
  duration_minutes: z.number().int().min(1, 'Duration must be at least 1 minute').max(1440, 'Duration cannot exceed 24 hours').optional(),
  max_students: z.number().int().min(1, 'Max students must be at least 1').max(100, 'Max students too high').optional(),
  price: z.number().int().min(0, 'Price must be non-negative').optional(),
  is_active: z.boolean().optional(),
  is_private_class: z.boolean().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);

// Query parameter validation
export const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().positive()).default('1'),
  pageSize: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().positive().max(100)).default('10'),
});

export const gymQuerySchema = paginationSchema.extend({
  searchTerm: z.string().max(255).optional(),
  provinceId: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().positive()).optional(),
  includeInactive: z.string().transform((val) => val === 'true').pipe(z.boolean()).optional(),
  sortField: z.enum(['created_at', 'updated_at']).default('created_at'),
  sortBy: z.enum(['asc', 'desc']).default('desc'),
  includeAssociatedTrainers: z.string().transform((val) => val === 'true').pipe(z.boolean()).optional(),
});

export const trainerQuerySchema = paginationSchema.extend({
  search: z.string().max(255).optional(),
  provinceId: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().positive()).optional(),
  gymId: z.string().uuid().optional(),
  isFreelance: z.string().transform((val) => val === 'true').pipe(z.boolean()).optional(),
  includeInactive: z.string().transform((val) => val === 'true').pipe(z.boolean()).optional(),
  includeClasses: z.string().transform((val) => val === 'true').pipe(z.boolean()).optional(),
  unassignedOnly: z.string().transform((val) => val === 'true').pipe(z.boolean()).optional(),
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