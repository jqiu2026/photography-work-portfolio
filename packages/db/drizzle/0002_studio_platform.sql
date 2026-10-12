CREATE TYPE "public"."studio_access_mode" AS ENUM('passcode', 'magic-link', 'both');--> statement-breakpoint
CREATE TYPE "public"."studio_booking_status" AS ENUM('new', 'converted', 'archived');--> statement-breakpoint
CREATE TYPE "public"."studio_gallery_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."studio_contract_status" AS ENUM('draft', 'sent', 'viewed', 'signed', 'declined', 'void');--> statement-breakpoint
CREATE TYPE "public"."studio_download_policy" AS ENUM('none', 'preview', 'web', 'full');--> statement-breakpoint
CREATE TYPE "public"."studio_invoice_status" AS ENUM('draft', 'sent', 'viewed', 'partial', 'paid', 'void');--> statement-breakpoint
CREATE TYPE "public"."studio_job_status" AS ENUM('inquiry', 'booked', 'shot', 'editing', 'delivered', 'paid', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."studio_payment_status" AS ENUM('pending', 'succeeded', 'failed', 'refunded');--> statement-breakpoint
CREATE TABLE "studio_bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"topic" text DEFAULT 'General' NOT NULL,
	"message" text NOT NULL,
	"status" "studio_booking_status" DEFAULT 'new' NOT NULL,
	"client_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studio_clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"notes" text,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text,
	"deleted_at" timestamp with time zone,
	"studio_id" uuid
);
--> statement-breakpoint
CREATE TABLE "studio_contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"status" "studio_contract_status" DEFAULT 'draft' NOT NULL,
	"token_hash" text,
	"sent_at" timestamp with time zone,
	"viewed_at" timestamp with time zone,
	"signed_at" timestamp with time zone,
	"signer_name" text,
	"signer_ip_hash" text,
	"signer_user_agent" text,
	"document_sha256" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text,
	"deleted_at" timestamp with time zone,
	"studio_id" uuid
);
--> statement-breakpoint
CREATE TABLE "studio_favorites" (
	"gallery_id" uuid NOT NULL,
	"media_id" uuid NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "studio_favorites_gallery_id_media_id_pk" PRIMARY KEY("gallery_id","media_id")
);
--> statement-breakpoint
CREATE TABLE "studio_galleries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"title" text NOT NULL,
	"status" "studio_gallery_status" DEFAULT 'draft' NOT NULL,
	"access_mode" "studio_access_mode" DEFAULT 'passcode' NOT NULL,
	"passcode_hash" text,
	"download_policy" "studio_download_policy" DEFAULT 'preview' NOT NULL,
	"watermark" boolean DEFAULT true NOT NULL,
	"cover_media_id" uuid,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text,
	"deleted_at" timestamp with time zone,
	"studio_id" uuid
);
--> statement-breakpoint
CREATE TABLE "studio_gallery_items" (
	"gallery_id" uuid NOT NULL,
	"media_id" uuid NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"hidden" boolean DEFAULT false NOT NULL,
	CONSTRAINT "studio_gallery_items_gallery_id_media_id_pk" PRIMARY KEY("gallery_id","media_id")
);
--> statement-breakpoint
CREATE TABLE "studio_invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number" text NOT NULL,
	"job_id" uuid NOT NULL,
	"lines" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"currency" text DEFAULT 'usd' NOT NULL,
	"total_cents" integer DEFAULT 0 NOT NULL,
	"status" "studio_invoice_status" DEFAULT 'draft' NOT NULL,
	"due_date" date,
	"token_hash" text,
	"sent_at" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text,
	"deleted_at" timestamp with time zone,
	"studio_id" uuid
);
--> statement-breakpoint
CREATE TABLE "studio_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"title" text NOT NULL,
	"type" text DEFAULT 'event' NOT NULL,
	"date" date,
	"location" text,
	"status" "studio_job_status" DEFAULT 'inquiry' NOT NULL,
	"fee_cents" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text,
	"deleted_at" timestamp with time zone,
	"studio_id" uuid
);
--> statement-breakpoint
CREATE TABLE "studio_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"provider_ref" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"status" "studio_payment_status" DEFAULT 'pending' NOT NULL,
	"receipt_ref" text,
	"raw" jsonb,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"id" text PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"type" text NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "studio_bookings" ADD CONSTRAINT "studio_bookings_client_id_studio_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."studio_clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_contracts" ADD CONSTRAINT "studio_contracts_job_id_studio_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."studio_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_favorites" ADD CONSTRAINT "studio_favorites_gallery_id_studio_galleries_id_fk" FOREIGN KEY ("gallery_id") REFERENCES "public"."studio_galleries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_favorites" ADD CONSTRAINT "studio_favorites_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_galleries" ADD CONSTRAINT "studio_galleries_job_id_studio_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."studio_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_galleries" ADD CONSTRAINT "studio_galleries_cover_media_id_media_id_fk" FOREIGN KEY ("cover_media_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_gallery_items" ADD CONSTRAINT "studio_gallery_items_gallery_id_studio_galleries_id_fk" FOREIGN KEY ("gallery_id") REFERENCES "public"."studio_galleries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_gallery_items" ADD CONSTRAINT "studio_gallery_items_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_invoices" ADD CONSTRAINT "studio_invoices_job_id_studio_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."studio_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_jobs" ADD CONSTRAINT "studio_jobs_client_id_studio_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."studio_clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_payments" ADD CONSTRAINT "studio_payments_invoice_id_studio_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."studio_invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "studio_clients_email_idx" ON "studio_clients" USING btree ("email") WHERE "studio_clients"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "studio_contracts_token_idx" ON "studio_contracts" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "studio_contracts_job_idx" ON "studio_contracts" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "studio_galleries_job_idx" ON "studio_galleries" USING btree ("job_id");--> statement-breakpoint
CREATE UNIQUE INDEX "studio_invoices_number_idx" ON "studio_invoices" USING btree ("number");--> statement-breakpoint
CREATE UNIQUE INDEX "studio_invoices_token_idx" ON "studio_invoices" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "studio_invoices_job_idx" ON "studio_invoices" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "studio_jobs_client_idx" ON "studio_jobs" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "studio_jobs_status_idx" ON "studio_jobs" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "studio_payments_provider_ref_idx" ON "studio_payments" USING btree ("provider","provider_ref");--> statement-breakpoint
CREATE INDEX "studio_payments_invoice_idx" ON "studio_payments" USING btree ("invoice_id");