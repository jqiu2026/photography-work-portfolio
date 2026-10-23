ALTER TABLE "studio_download_rules" ADD COLUMN "preset" text DEFAULT 'custom' NOT NULL;--> statement-breakpoint
ALTER TABLE "studio_download_rules" ADD COLUMN "preview_text" text;