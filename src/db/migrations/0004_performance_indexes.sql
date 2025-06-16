-- Performance indexes for MyMuayThai database
-- Migration: Add performance indexes for optimal query performance

-- Gyms table indexes
CREATE INDEX IF NOT EXISTS idx_gyms_province_id ON gyms(province_id);
CREATE INDEX IF NOT EXISTS idx_gyms_is_active ON gyms(is_active);
CREATE INDEX IF NOT EXISTS idx_gyms_created_at ON gyms(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gyms_name_search ON gyms USING gin(to_tsvector('english', name_en || ' ' || COALESCE(name_th, '')));

-- Trainers table indexes
CREATE INDEX IF NOT EXISTS idx_trainers_gym_id ON trainers(gym_id);
CREATE INDEX IF NOT EXISTS idx_trainers_province_id ON trainers(province_id);
CREATE INDEX IF NOT EXISTS idx_trainers_is_active ON trainers(is_active);
CREATE INDEX IF NOT EXISTS idx_trainers_is_freelance ON trainers(is_freelance);
CREATE INDEX IF NOT EXISTS idx_trainers_created_at ON trainers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trainers_name_search ON trainers USING gin(to_tsvector('english', first_name_en || ' ' || COALESCE(last_name_en, '') || ' ' || COALESCE(first_name_th, '') || ' ' || COALESCE(last_name_th, '')));

-- Junction table indexes
CREATE INDEX IF NOT EXISTS idx_gym_tags_gym_id ON gym_tags(gym_id);
CREATE INDEX IF NOT EXISTS idx_gym_tags_tag_id ON gym_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_trainer_tags_trainer_id ON trainer_tags(trainer_id);
CREATE INDEX IF NOT EXISTS idx_trainer_tags_tag_id ON trainer_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_trainer_classes_trainer_id ON trainer_classes(trainer_id);
CREATE INDEX IF NOT EXISTS idx_trainer_classes_class_id ON trainer_classes(class_id);

-- Gym images index
CREATE INDEX IF NOT EXISTS idx_gym_images_gym_id ON gym_images(gym_id);

-- Compound indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_gyms_active_province ON gyms(is_active, province_id);
CREATE INDEX IF NOT EXISTS idx_trainers_active_gym ON trainers(is_active, gym_id);
CREATE INDEX IF NOT EXISTS idx_trainers_active_province ON trainers(is_active, province_id);
CREATE INDEX IF NOT EXISTS idx_trainers_freelance_active ON trainers(is_freelance, is_active);

-- Add comments for documentation
COMMENT ON INDEX idx_gyms_province_id IS 'Index for filtering gyms by province';
COMMENT ON INDEX idx_trainers_gym_id IS 'Index for finding trainers by gym';
COMMENT ON INDEX idx_gyms_name_search IS 'Full-text search index for gym names';
COMMENT ON INDEX idx_trainers_name_search IS 'Full-text search index for trainer names'; 