CREATE TABLE "studio_download_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gallery_id" uuid NOT NULL,
	"album_id" uuid,
	"name" text NOT NULL,
	"max_px" integer,
	"per_visitor" integer,
	"watermark_id" uuid,
	"pin_hash" text,
	"print_release" text,
	"show_all" boolean DEFAULT true NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studio_plan_charges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"description" text NOT NULL,
	"amount_cents" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'paid' NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studio_price_sheets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text,
	"deleted_at" timestamp with time zone,
	"studio_id" uuid
);
--> statement-breakpoint
CREATE TABLE "studio_tracks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"artist" text,
	"storage_key" text NOT NULL,
	"mime" text DEFAULT 'audio/mpeg' NOT NULL,
	"bytes" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text,
	"deleted_at" timestamp with time zone,
	"studio_id" uuid
);
--> statement-breakpoint
CREATE TABLE "studio_visitors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gallery_id" uuid NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"visits" integer DEFAULT 1 NOT NULL,
	"first_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studio_watermarks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"kind" text DEFAULT 'text' NOT NULL,
	"text" text,
	"image_key" text,
	"position" text DEFAULT 'bottom-right' NOT NULL,
	"opacity" integer DEFAULT 45 NOT NULL,
	"size_pct" integer DEFAULT 22 NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text,
	"deleted_at" timestamp with time zone,
	"studio_id" uuid
);
--> statement-breakpoint
ALTER TABLE "studio_galleries" ADD COLUMN "shoot_date" date;--> statement-breakpoint
ALTER TABLE "studio_galleries" ADD COLUMN "order_due_date" date;--> statement-breakpoint
ALTER TABLE "studio_galleries" ADD COLUMN "email_required" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "studio_galleries" ADD COLUMN "auto_archive" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "studio_products" ADD COLUMN "sheet_id" uuid;--> statement-breakpoint
ALTER TABLE "studio_download_rules" ADD CONSTRAINT "studio_download_rules_gallery_id_studio_galleries_id_fk" FOREIGN KEY ("gallery_id") REFERENCES "public"."studio_galleries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_visitors" ADD CONSTRAINT "studio_visitors_gallery_id_studio_galleries_id_fk" FOREIGN KEY ("gallery_id") REFERENCES "public"."studio_galleries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "studio_download_rules_gallery_idx" ON "studio_download_rules" USING btree ("gallery_id");--> statement-breakpoint
CREATE UNIQUE INDEX "studio_visitors_gallery_email_idx" ON "studio_visitors" USING btree ("gallery_id","email");