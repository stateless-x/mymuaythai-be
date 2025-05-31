CREATE TABLE "classes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name_th" text NOT NULL,
	"name_en" text NOT NULL,
	"description_th" text,
	"description_en" text
);
--> statement-breakpoint
CREATE TABLE "gym_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gym_id" uuid NOT NULL,
	"image_url" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gym_tags" (
	"id" uuid PRIMARY KEY NOT NULL,
	"gym_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gyms" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name_th" text NOT NULL,
	"name_en" text NOT NULL,
	"description_th" text,
	"description_en" text,
	"phone" text,
	"email" text,
	"province_id" integer,
	"map_url" text,
	"youtube_url" text,
	"line_id" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provinces" (
	"id" serial PRIMARY KEY NOT NULL,
	"name_th" text NOT NULL,
	"name_en" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name_th" text NOT NULL,
	"name_en" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trainer_classes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"trainer_id" uuid NOT NULL,
	"class_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trainer_tags" (
	"id" uuid PRIMARY KEY NOT NULL,
	"trainer_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trainers" (
	"id" uuid PRIMARY KEY NOT NULL,
	"first_name_th" text NOT NULL,
	"last_name_th" text,
	"first_name_en" text NOT NULL,
	"last_name_en" text,
	"bio_th" text,
	"bio_en" text,
	"phone" text,
	"email" text,
	"line_id" text,
	"is_freelance" boolean DEFAULT false NOT NULL,
	"gym_id" uuid,
	"province_id" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"role" text,
	"email" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "gym_images" ADD CONSTRAINT "gym_images_gym_id_gyms_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gym_tags" ADD CONSTRAINT "gym_tags_gym_id_gyms_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gym_tags" ADD CONSTRAINT "gym_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gyms" ADD CONSTRAINT "gyms_province_id_provinces_id_fk" FOREIGN KEY ("province_id") REFERENCES "public"."provinces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trainer_classes" ADD CONSTRAINT "trainer_classes_trainer_id_trainers_id_fk" FOREIGN KEY ("trainer_id") REFERENCES "public"."trainers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trainer_classes" ADD CONSTRAINT "trainer_classes_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trainer_tags" ADD CONSTRAINT "trainer_tags_trainer_id_trainers_id_fk" FOREIGN KEY ("trainer_id") REFERENCES "public"."trainers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trainer_tags" ADD CONSTRAINT "trainer_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trainers" ADD CONSTRAINT "trainers_gym_id_gyms_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trainers" ADD CONSTRAINT "trainers_province_id_provinces_id_fk" FOREIGN KEY ("province_id") REFERENCES "public"."provinces"("id") ON DELETE no action ON UPDATE no action;