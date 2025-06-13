ALTER TABLE "trainer_classes" ALTER COLUMN "class_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "trainer_classes" ADD COLUMN "name_th" text;--> statement-breakpoint
ALTER TABLE "trainer_classes" ADD COLUMN "name_en" text;--> statement-breakpoint
ALTER TABLE "trainer_classes" ADD COLUMN "description_th" text;--> statement-breakpoint
ALTER TABLE "trainer_classes" ADD COLUMN "description_en" text;--> statement-breakpoint
ALTER TABLE "trainer_classes" ADD COLUMN "duration_minutes" integer;--> statement-breakpoint
ALTER TABLE "trainer_classes" ADD COLUMN "max_students" integer;--> statement-breakpoint
ALTER TABLE "trainer_classes" ADD COLUMN "price" integer;--> statement-breakpoint
ALTER TABLE "trainer_classes" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "trainer_classes" ADD COLUMN "is_private_class" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "trainer_classes" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "trainer_classes" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "trainers" ADD COLUMN "exp_year" integer;