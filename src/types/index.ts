// Database entity types based on the ER diagram

export interface User {
  id: string;
  role: string;
  email: string;
}

export interface Province {
  id: number;
  name_th: string;
  name_en: string;
}

export interface Gym {
  id: string;
  name_th: string;
  name_en: string;
  description_th: string;
  description_en: string;
  phone: string;
  email: string;
  province_id: number;
  map_url: string;
  youtube_url: string;
  line: string;
  is_active: boolean;
  created_at: Date;
}

export interface GymImage {
  id: string;
  gym_id: string;
  image_url: string;
}

export interface Trainer {
  id: string;
  first_name_th: string;
  last_name_th: string;
  first_name_en: string;
  last_name_en: string;
  bio_th: string;
  bio_en: string;
  phone: string;
  email: string;
  line: string;
  is_freelance: boolean;
  gym_id: string;
  province_id: number;
  is_active: boolean;
  created_at: Date;
}

export interface Class {
  id: string;
  name_th: string;
  name_en: string;
  description_th: string;
  description_en: string;
}

export interface TrainerClass {
  id: string;
  trainer_id: string;
  class_id: string;
}

export interface Tag {
  id: string;
  name_th: string;
  name_en: string;
}

export interface GymTag {
  id: string;
  gym_id: string;
  tag_id: string;
}

export interface TrainerTag {
  id: string;
  trainer_id: string;
  tag_id: string;
}

// Request/Response types for API
export interface CreateGymRequest {
  name_th: string;
  name_en: string;
  description_th: string;
  description_en: string;
  phone: string;
  email: string;
  province_id: number;
  map_url?: string;
  youtube_url?: string;
  line?: string;
}

export interface CreateTrainerRequest {
  first_name_th: string;
  last_name_th: string;
  first_name_en: string;
  last_name_en: string;
  bio_th: string;
  bio_en: string;
  phone: string;
  email: string;
  line?: string;
  is_freelance: boolean;
  gym_id?: string;
  province_id: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
} 