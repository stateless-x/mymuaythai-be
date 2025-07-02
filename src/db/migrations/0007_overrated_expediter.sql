CREATE TABLE "trainer_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trainer_id" uuid NOT NULL,
	"image_url" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "trainer_images" ADD CONSTRAINT "trainer_images_trainer_id_trainers_id_fk" FOREIGN KEY ("trainer_id") REFERENCES "public"."trainers"("id") ON DELETE no action ON UPDATE no action;