ALTER TABLE "gym_tags" DROP CONSTRAINT IF EXISTS "gym_tags_tag_id_tags_id_fk";
ALTER TABLE "trainer_tags" DROP CONSTRAINT IF EXISTS "trainer_tags_tag_id_tags_id_fk";
DELETE FROM "gym_tags";
DELETE FROM "trainer_tags";
ALTER TABLE "gym_tags" DROP COLUMN IF EXISTS "tag_id";
ALTER TABLE "trainer_tags" DROP COLUMN IF EXISTS "tag_id";
DROP TABLE IF EXISTS "tags" CASCADE;
CREATE TABLE "tags" (
    "id" serial PRIMARY KEY,
    "slug" text NOT NULL UNIQUE,
    "name_th" text NOT NULL,
    "name_en" text NOT NULL
);
ALTER TABLE "gym_tags" ADD COLUMN "tag_id" integer;
ALTER TABLE "trainer_tags" ADD COLUMN "tag_id" integer;
ALTER TABLE "gym_tags" ADD CONSTRAINT "gym_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE;
ALTER TABLE "trainer_tags" ADD CONSTRAINT "trainer_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE; 