ALTER TABLE "gyms" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "trainers" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;