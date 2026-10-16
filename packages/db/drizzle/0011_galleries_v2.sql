CREATE TABLE "studio_albums" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gallery_id" uuid NOT NULL,
	"name" text NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studio_download_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gallery_id" uuid NOT NULL,
	"media_id" uuid,
	"kind" text NOT NULL,
	"part" integer,
	"viewer" text,
	"ip_hash" text,
	"bytes" integer,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studio_proofs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gallery_id" uuid NOT NULL,
	"media_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"rating" integer,
	"decision" text,
	"body" text,
	"author" text DEFAULT 'client' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "sha256" text;--> statement-breakpoint
ALTER TABLE "studio_galleries" ADD COLUMN "welcome" text;--> statement-breakpoint
ALTER TABLE "studio_galleries" ADD COLUMN "accent" text;--> statement-breakpoint
ALTER TABLE "studio_galleries" ADD COLUMN "download_pin_hash" text;--> statement-breakpoint
ALTER TABLE "studio_galleries" ADD COLUMN "selection_limit" integer;--> statement-breakpoint
ALTER TABLE "studio_galleries" ADD COLUMN "selection_sent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "studio_galleries" ADD COLUMN "allow_comments" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "studio_galleries" ADD COLUMN "allow_ratings" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "studio_galleries" ADD COLUMN "delivered_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "studio_galleries" ADD COLUMN "expiry_reminder_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "studio_galleries" ADD COLUMN "reactivated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "studio_gallery_items" ADD COLUMN "album_id" uuid;--> statement-breakpoint
ALTER TABLE "studio_invoices" ADD COLUMN "gallery_id" uuid;--> statement-breakpoint
ALTER TABLE "studio_albums" ADD CONSTRAINT "studio_albums_gallery_id_studio_galleries_id_fk" FOREIGN KEY ("gallery_id") REFERENCES "public"."studio_galleries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_download_events" ADD CONSTRAINT "studio_download_events_gallery_id_studio_galleries_id_fk" FOREIGN KEY ("gallery_id") REFERENCES "public"."studio_galleries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_proofs" ADD CONSTRAINT "studio_proofs_gallery_id_studio_galleries_id_fk" FOREIGN KEY ("gallery_id") REFERENCES "public"."studio_galleries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_proofs" ADD CONSTRAINT "studio_proofs_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "studio_albums_gallery_idx" ON "studio_albums" USING btree ("gallery_id");--> statement-breakpoint
CREATE INDEX "studio_download_events_gallery_idx" ON "studio_download_events" USING btree ("gallery_id");--> statement-breakpoint
CREATE INDEX "studio_proofs_gallery_idx" ON "studio_proofs" USING btree ("gallery_id","media_id");