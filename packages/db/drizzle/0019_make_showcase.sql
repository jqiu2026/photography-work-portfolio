CREATE TYPE "public"."make_project_status" AS ENUM('building', 'shipped', 'archived');--> statement-breakpoint
CREATE TABLE "make_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"storage_key" text NOT NULL,
	"mime" text DEFAULT 'image/webp' NOT NULL,
	"width" integer,
	"height" integer,
	"alt" text DEFAULT '' NOT NULL,
	"caption" text,
	"reviewed" boolean DEFAULT false NOT NULL,
	"cover" boolean DEFAULT false NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "make_now" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"body" text NOT NULL,
	"project_id" uuid,
	"visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "make_projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"body" text,
	"status" "make_project_status" DEFAULT 'building' NOT NULL,
	"year" integer,
	"role" text,
	"stack" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"links" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"lessons" text,
	"published" boolean DEFAULT false NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text,
	"deleted_at" timestamp with time zone,
	"studio_id" uuid
);
--> statement-breakpoint
ALTER TABLE "make_images" ADD CONSTRAINT "make_images_project_id_make_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."make_projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "make_now" ADD CONSTRAINT "make_now_project_id_make_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."make_projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "make_images_project_idx" ON "make_images" USING btree ("project_id","sort");--> statement-breakpoint
CREATE UNIQUE INDEX "make_projects_slug_idx" ON "make_projects" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "make_projects_pub_idx" ON "make_projects" USING btree ("published","sort");