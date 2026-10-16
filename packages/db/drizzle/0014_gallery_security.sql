CREATE TABLE "studio_security_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gallery_id" uuid NOT NULL,
	"viewer" text NOT NULL,
	"kind" text NOT NULL,
	"combo" text,
	"action" text DEFAULT 'logged' NOT NULL,
	"ip_hash" text,
	"until" timestamp with time zone,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "studio_galleries" ADD COLUMN "security" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "studio_galleries" ADD COLUMN "style" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "studio_security_events" ADD CONSTRAINT "studio_security_events_gallery_id_studio_galleries_id_fk" FOREIGN KEY ("gallery_id") REFERENCES "public"."studio_galleries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "studio_security_events_gallery_idx" ON "studio_security_events" USING btree ("gallery_id","at");