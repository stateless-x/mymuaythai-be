import * as schema from '../db/schema';

// Database entity types based on the ER diagram

// --- Inferred Types from Drizzle Schema (Strictly based on new ERD-aligned schema) ---

export type User = typeof schema.users.$inferSelect;
export type NewUser = typeof schema.users.$inferInsert;

export type Province = typeof schema.provinces.$inferSelect;
export type NewProvince = typeof schema.provinces.$inferInsert;

export type Gym = typeof schema.gyms.$inferSelect;
export type NewGym = typeof schema.gyms.$inferInsert;

export type GymImage = typeof schema.gymImages.$inferSelect;
export type NewGymImage = typeof schema.gymImages.$inferInsert;

export type Trainer = typeof schema.trainers.$inferSelect;
export type NewTrainer = typeof schema.trainers.$inferInsert;

export type Class = typeof schema.classes.$inferSelect; // Renamed from ClassType
export type NewClass = typeof schema.classes.$inferInsert; // Renamed from NewClassType

export type TrainerClass = typeof schema.trainerClasses.$inferSelect;
export type NewTrainerClass = typeof schema.trainerClasses.$inferInsert;

export type Tag = typeof schema.tags.$inferSelect;
export type NewTag = typeof schema.tags.$inferInsert;

export type GymTag = typeof schema.gymTags.$inferSelect;
export type NewGymTag = typeof schema.gymTags.$inferInsert;

export type TrainerTag = typeof schema.trainerTags.$inferSelect;
export type NewTrainerTag = typeof schema.trainerTags.$inferInsert;

// --- API Request and Response Types ---

// Generic API Response Structure
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  statusCode?: number;
}

// --- Gym Specific API Types ---
// CreateGymRequest needs to align with the new gyms schema from ERD
export interface CreateGymRequest extends Omit<NewGym, 'id' | 'created_at' | 'is_active'> {
  // province_id is required as per schema (references)
  // name_th, name_en are required
  // Other fields like description_th, description_en, phone, email, map_url, youtube_url, line are optional (text or nullable)
}

export interface UpdateGymRequest extends Partial<Omit<NewGym, 'id' | 'created_at'>> {
  // is_active can be updated, so not omitting it here explicitly
  // but typically handled by a dedicated activate/deactivate endpoint.
}

// For displaying a gym with its related details
export interface GymWithDetails {
  id: string;
  name_th: string;
  name_en: string;
  description_th: string | null;
  description_en: string | null;
  phone: string | null;
  email: string | null;
  map_url: string | null;
  youtube_url: string | null;
  line_id: string | null;
  is_active: boolean;
  created_at: Date;
  province?: Province | null;
  images?: GymImage[];
  tags?: Tag[]; // via gymTags
  // Direct classes link for a gym is not in ERD, only via trainers.
  // If gyms can offer classes directly, a gym_classes table would be needed.
  associatedTrainers?: Trainer[]; // Trainers primarily associated with this gym
}

// --- Trainer Specific API Types ---
export interface CreateTrainerRequest extends Omit<NewTrainer, 'id' | 'created_at' | 'is_active'> {
  // first_name_th, first_name_en are required.
  // Other fields are optional based on schema.
  // gym_id and province_id are optional FKs.
}

export interface UpdateTrainerRequest extends Partial<Omit<NewTrainer, 'id' | 'created_at'>> {
}

export interface TrainerWithDetails extends Trainer {
  province?: Province;
  primaryGym?: Gym; // The gym listed in trainers.gym_id
  classes?: Class[]; // via trainerClasses
  tags?: Tag[]; // via trainerTags
}

// --- Class Specific API Types (Example) ---
export interface ClassWithDetails extends Class {
  trainers?: Trainer[]; // Trainers who teach this class (via trainerClasses)
}

// --- Paginated Response ---
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Specific paginated responses for type safety
export interface PaginatedGymResponse extends PaginatedResponse<GymWithDetails> {}
export interface PaginatedTrainerResponse extends PaginatedResponse<TrainerWithDetails> {} 