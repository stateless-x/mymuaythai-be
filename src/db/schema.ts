import { pgTable, serial, text, timestamp, uuid, boolean, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Based on ERDiagram

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  role: text('role'),
  email: text('email').notNull(), // Assuming email should be notNull based on typical usage
});

export const provinces = pgTable('provinces', {
  id: serial('id').primaryKey(),
  name_th: text('name_th').notNull(),
  name_en: text('name_en').notNull(),
});

export const gyms = pgTable('gyms', {
  id: uuid('id').primaryKey().defaultRandom(),
  name_th: text('name_th').notNull(),
  name_en: text('name_en').notNull(),
  description_th: text('description_th'),
  description_en: text('description_en'),
  phone: text('phone'),
  email: text('email'),
  province_id: integer('province_id').references(() => provinces.id),
  map_url: text('map_url'),
  youtube_url: text('youtube_url'),
  line_id: text('line_id'),
  is_active: boolean('is_active').default(true).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const gymImages = pgTable('gym_images', {
  id: uuid('id').primaryKey().defaultRandom(),
  gym_id: uuid('gym_id').references(() => gyms.id).notNull(),
  image_url: text('image_url').notNull(),
});

export const trainers = pgTable('trainers', {
  id: uuid('id').primaryKey().defaultRandom(),
  first_name_th: text('first_name_th').notNull(),
  last_name_th: text('last_name_th'),
  first_name_en: text('first_name_en').notNull(),
  last_name_en: text('last_name_en'),
  bio_th: text('bio_th'),
  bio_en: text('bio_en'),
  phone: text('phone'),
  email: text('email'),
  line_id: text('line_id'),
  is_freelance: boolean('is_freelance').default(false).notNull(),
  gym_id: uuid('gym_id').references(() => gyms.id), // Nullable as per M2M possibility and freelance
  province_id: integer('province_id').references(() => provinces.id),
  is_active: boolean('is_active').default(true).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const classes = pgTable('classes', {
  id: uuid('id').primaryKey().defaultRandom(),
  name_th: text('name_th').notNull(),
  name_en: text('name_en').notNull(),
  description_th: text('description_th'),
  description_en: text('description_en'),
});

export const trainerClasses = pgTable('trainer_classes', {
  id: uuid('id').primaryKey().defaultRandom(),
  trainer_id: uuid('trainer_id').references(() => trainers.id).notNull(),
  class_id: uuid('class_id').references(() => classes.id).notNull(),
});

export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  name_th: text('name_th').notNull(),
  name_en: text('name_en').notNull(),
});

export const gymTags = pgTable('gym_tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  gym_id: uuid('gym_id').references(() => gyms.id).notNull(),
  tag_id: uuid('tag_id').references(() => tags.id).notNull(),
});

export const trainerTags = pgTable('trainer_tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  trainer_id: uuid('trainer_id').references(() => trainers.id).notNull(),
  tag_id: uuid('tag_id').references(() => tags.id).notNull(),
});

// --- RELATIONS ---

export const userRelations = relations(users, ({ many }) => ({}));

export const provinceRelations = relations(provinces, ({ many }) => ({
  gyms: many(gyms),
  trainers: many(trainers),
}));

export const gymRelations = relations(gyms, ({ one, many }) => ({
  province: one(provinces, {
    fields: [gyms.province_id],
    references: [provinces.id],
  }),
  images: many(gymImages),
  gymTags: many(gymTags),
  // ERD: trainers }o--|| gyms : works_at implies a FK on trainers table
  // This can be represented by trainers having a gym_id pointing to gyms
  // and a `many(trainers)` relation here if desired, for trainers primarily associated with this gym.
  associatedTrainers: many(trainers, { relationName: 'GymPrimaryTrainers'}) 
}));

export const gymImageRelations = relations(gymImages, ({ one }) => ({
  gym: one(gyms, {
    fields: [gymImages.gym_id],
    references: [gyms.id],
  }),
}));

export const trainerRelations = relations(trainers, ({ one, many }) => ({
  province: one(provinces, {
    fields: [trainers.province_id],
    references: [provinces.id],
  }),
  primaryGym: one(gyms, {
    fields: [trainers.gym_id],
    references: [gyms.id],
    relationName: 'GymPrimaryTrainers'
  }),
  trainerClasses: many(trainerClasses),
  trainerTags: many(trainerTags),
}));

export const classRelations = relations(classes, ({ many }) => ({
  trainerClasses: many(trainerClasses),
}));

export const trainerClassRelations = relations(trainerClasses, ({ one }) => ({
  trainer: one(trainers, {
    fields: [trainerClasses.trainer_id],
    references: [trainers.id],
  }),
  classItem: one(classes, { // class is a reserved keyword, using classItem
    fields: [trainerClasses.class_id],
    references: [classes.id],
  }),
}));

export const tagRelations = relations(tags, ({ many }) => ({
  gymTags: many(gymTags),
  trainerTags: many(trainerTags),
}));

export const gymTagRelations = relations(gymTags, ({ one }) => ({
  gym: one(gyms, {
    fields: [gymTags.gym_id],
    references: [gyms.id],
  }),
  tag: one(tags, {
    fields: [gymTags.tag_id],
    references: [tags.id],
  }),
}));

export const trainerTagRelations = relations(trainerTags, ({ one }) => ({
  trainer: one(trainers, {
    fields: [trainerTags.trainer_id],
    references: [trainers.id],
  }),
  tag: one(tags, {
    fields: [trainerTags.tag_id],
    references: [tags.id],
  }),
}));

// Note: The ERD implies M2M for gyms and classes through trainer_classes (Gym -> Trainer -> TrainerClass -> Class).
// If a direct M2M between Gyms and Classes is needed (e.g. gym_class_types), it would need to be added.
// Based on ERD `classes ||--o{ trainer_classes : is_in` and `trainers ||--o{ trainer_classes : offers`,
// and `trainers }o--|| gyms : works_at`, there isn't a direct gym-to-class link without going through a trainer.
// I have omitted the `gym_class_types` table from the previous schema as it wasn't in the ERD.
// If it should exist, it needs to be specified. 