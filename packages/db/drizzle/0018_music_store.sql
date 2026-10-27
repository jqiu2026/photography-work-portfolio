CREATE TYPE "public"."music_commission_status" AS ENUM('new', 'talking', 'accepted', 'declined', 'done');--> statement-breakpoint
CREATE TYPE "public"."music_license_tier" AS ENUM('personal', 'ensemble', 'institution');--> statement-breakpoint
CREATE TYPE "public"."music_order_status" AS ENUM('pending', 'paid', 'refunded', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."music_product_kind" AS ENUM('score', 'bundle');--> statement-breakpoint
CREATE TYPE "public"."music_file_kind" AS ENUM('full-score', 'parts', 'piano-reduction', 'midi', 'practice-audio', 'other');--> statement-breakpoint
CREATE TYPE "public"."music_work_rights" AS ENUM('original', 'public-domain-arrangement', 'arrangement-copyrighted');--> statement-breakpoint
CREATE TYPE "public"."music_work_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TABLE "music_bundle_items" (
	"bundle_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	CONSTRAINT "music_bundle_items_bundle_id_product_id_pk" PRIMARY KEY("bundle_id","product_id")
);
--> statement-breakpoint
CREATE TABLE "music_buyer_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"buyer_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "music_buyers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "music_commissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"organization" text,
	"forces" text,
	"occasion" text,
	"deadline" date,
	"budget" text,
	"message" text NOT NULL,
	"status" "music_commission_status" DEFAULT 'new' NOT NULL,
	"owner_note" text,
	"ip_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "music_downloads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"license_id" uuid NOT NULL,
	"file_id" uuid NOT NULL,
	"ip_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "music_licenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"license_no" text NOT NULL,
	"order_id" uuid NOT NULL,
	"order_line_id" uuid NOT NULL,
	"buyer_id" uuid,
	"work_id" uuid NOT NULL,
	"tier" "music_license_tier" NOT NULL,
	"holder" text NOT NULL,
	"organization" text,
	"file_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"download_limit" integer DEFAULT 10 NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "music_order_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"work_id" uuid,
	"title" text NOT NULL,
	"tier" "music_license_tier" NOT NULL,
	"price_cents" integer NOT NULL,
	"file_ids" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "music_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seq" bigserial NOT NULL,
	"buyer_id" uuid,
	"email" text NOT NULL,
	"holder_name" text NOT NULL,
	"organization" text,
	"status" "music_order_status" DEFAULT 'pending' NOT NULL,
	"subtotal_cents" integer NOT NULL,
	"discount_cents" integer DEFAULT 0 NOT NULL,
	"fee_cents" integer DEFAULT 0 NOT NULL,
	"total_cents" integer NOT NULL,
	"currency" text DEFAULT 'usd' NOT NULL,
	"provider" text,
	"provider_ref" text,
	"access_token_hash" text NOT NULL,
	"paid_at" timestamp with time zone,
	"refunded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "music_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "music_product_kind" DEFAULT 'score' NOT NULL,
	"work_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"tier" "music_license_tier" DEFAULT 'personal' NOT NULL,
	"price_cents" integer NOT NULL,
	"file_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text,
	"deleted_at" timestamp with time zone,
	"studio_id" uuid
);
--> statement-breakpoint
CREATE TABLE "music_score_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"work_id" uuid NOT NULL,
	"kind" "music_file_kind" DEFAULT 'full-score' NOT NULL,
	"label" text NOT NULL,
	"filename" text NOT NULL,
	"mime" text DEFAULT 'application/pdf' NOT NULL,
	"storage_key" text NOT NULL,
	"bytes" integer DEFAULT 0 NOT NULL,
	"pages" integer,
	"preview_pages" integer DEFAULT 2 NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text,
	"deleted_at" timestamp with time zone,
	"studio_id" uuid
);
--> statement-breakpoint
CREATE TABLE "music_subscribers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"token_hash" text NOT NULL,
	"confirmed_at" timestamp with time zone,
	"unsubscribed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "music_works" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"year" integer,
	"forces" text,
	"instruments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"genre" text,
	"difficulty" text,
	"duration_sec" integer,
	"summary" text,
	"program_note" text,
	"rights_type" "music_work_rights" DEFAULT 'original' NOT NULL,
	"license_on_file" boolean DEFAULT false NOT NULL,
	"license_note" text,
	"status" "music_work_status" DEFAULT 'draft' NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"cover_media_id" uuid,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text,
	"deleted_at" timestamp with time zone,
	"studio_id" uuid
);
--> statement-breakpoint
ALTER TABLE "music_items" ADD COLUMN "work_id" uuid;--> statement-breakpoint
ALTER TABLE "music_bundle_items" ADD CONSTRAINT "music_bundle_items_bundle_id_music_products_id_fk" FOREIGN KEY ("bundle_id") REFERENCES "public"."music_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_bundle_items" ADD CONSTRAINT "music_bundle_items_product_id_music_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."music_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_buyer_links" ADD CONSTRAINT "music_buyer_links_buyer_id_music_buyers_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."music_buyers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_downloads" ADD CONSTRAINT "music_downloads_license_id_music_licenses_id_fk" FOREIGN KEY ("license_id") REFERENCES "public"."music_licenses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_downloads" ADD CONSTRAINT "music_downloads_file_id_music_score_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."music_score_files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_licenses" ADD CONSTRAINT "music_licenses_order_id_music_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."music_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_licenses" ADD CONSTRAINT "music_licenses_order_line_id_music_order_lines_id_fk" FOREIGN KEY ("order_line_id") REFERENCES "public"."music_order_lines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_licenses" ADD CONSTRAINT "music_licenses_buyer_id_music_buyers_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."music_buyers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_licenses" ADD CONSTRAINT "music_licenses_work_id_music_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."music_works"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_order_lines" ADD CONSTRAINT "music_order_lines_order_id_music_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."music_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_order_lines" ADD CONSTRAINT "music_order_lines_product_id_music_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."music_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_order_lines" ADD CONSTRAINT "music_order_lines_work_id_music_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."music_works"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_orders" ADD CONSTRAINT "music_orders_buyer_id_music_buyers_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."music_buyers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_products" ADD CONSTRAINT "music_products_work_id_music_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."music_works"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_score_files" ADD CONSTRAINT "music_score_files_work_id_music_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."music_works"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_works" ADD CONSTRAINT "music_works_cover_media_id_media_id_fk" FOREIGN KEY ("cover_media_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "music_buyer_links_hash_idx" ON "music_buyer_links" USING btree ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "music_buyers_email_idx" ON "music_buyers" USING btree ("email");--> statement-breakpoint
CREATE INDEX "music_downloads_license_idx" ON "music_downloads" USING btree ("license_id");--> statement-breakpoint
CREATE UNIQUE INDEX "music_licenses_no_idx" ON "music_licenses" USING btree ("license_no");--> statement-breakpoint
CREATE INDEX "music_licenses_buyer_idx" ON "music_licenses" USING btree ("buyer_id");--> statement-breakpoint
CREATE INDEX "music_order_lines_order_idx" ON "music_order_lines" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "music_orders_seq_idx" ON "music_orders" USING btree ("seq");--> statement-breakpoint
CREATE UNIQUE INDEX "music_orders_access_idx" ON "music_orders" USING btree ("access_token_hash");--> statement-breakpoint
CREATE INDEX "music_orders_buyer_idx" ON "music_orders" USING btree ("buyer_id");--> statement-breakpoint
CREATE INDEX "music_products_work_idx" ON "music_products" USING btree ("work_id");--> statement-breakpoint
CREATE INDEX "music_score_files_work_idx" ON "music_score_files" USING btree ("work_id","sort");--> statement-breakpoint
CREATE UNIQUE INDEX "music_subscribers_email_idx" ON "music_subscribers" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "music_works_slug_idx" ON "music_works" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "music_works_status_idx" ON "music_works" USING btree ("status","sort");--> statement-breakpoint
ALTER TABLE "music_items" ADD CONSTRAINT "music_items_work_id_music_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."music_works"("id") ON DELETE no action ON UPDATE no action;