ALTER TABLE "studio_galleries" ADD COLUMN "layout" text DEFAULT 'grid' NOT NULL;--> statement-breakpoint
ALTER TABLE "studio_galleries" ADD COLUMN "theme" text DEFAULT 'dark' NOT NULL;--> statement-breakpoint
ALTER TABLE "studio_galleries" ADD COLUMN "density" text DEFAULT 'medium' NOT NULL;--> statement-breakpoint
ALTER TABLE "studio_galleries" ADD COLUMN "publish_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "studio_galleries" ADD COLUMN "notes" text;