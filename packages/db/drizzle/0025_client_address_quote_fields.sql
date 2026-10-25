ALTER TABLE "studio_clients" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "studio_quotes" ADD COLUMN "fields" jsonb DEFAULT '[]'::jsonb NOT NULL;