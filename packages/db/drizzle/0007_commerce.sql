CREATE TYPE "public"."studio_quote_status" AS ENUM('draft', 'sent', 'viewed', 'accepted', 'declined', 'expired', 'void');--> statement-breakpoint
CREATE TABLE "studio_add_ons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price_cents" integer DEFAULT 0 NOT NULL,
	"unit" text DEFAULT 'each' NOT NULL,
	"max_qty" integer DEFAULT 1 NOT NULL,
	"is_fee" boolean DEFAULT false NOT NULL,
	"upsell" boolean DEFAULT true NOT NULL,
	"visible" boolean DEFAULT true NOT NULL,
	"is_sample" boolean DEFAULT true NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text,
	"deleted_at" timestamp with time zone,
	"studio_id" uuid
);
--> statement-breakpoint
CREATE TABLE "studio_gift_cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"initial_cents" integer NOT NULL,
	"balance_cents" integer NOT NULL,
	"purchaser_email" text,
	"recipient_name" text,
	"expires_at" timestamp with time zone,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studio_gift_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"card_id" uuid NOT NULL,
	"delta_cents" integer NOT NULL,
	"quote_id" uuid,
	"note" text,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studio_packages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"tagline" text,
	"deliverables" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"price_cents" integer DEFAULT 0 NOT NULL,
	"mandatory_fees" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"included_add_ons" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"tier" integer DEFAULT 1 NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"visible" boolean DEFAULT true NOT NULL,
	"is_sample" boolean DEFAULT true NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text,
	"deleted_at" timestamp with time zone,
	"studio_id" uuid
);
--> statement-breakpoint
CREATE TABLE "studio_promo_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"kind" text DEFAULT 'percent' NOT NULL,
	"percent_off" integer,
	"amount_off_cents" integer,
	"min_subtotal_cents" integer DEFAULT 0 NOT NULL,
	"max_uses" integer,
	"uses" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone,
	"active" boolean DEFAULT true NOT NULL,
	"referrer_client_id" uuid,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studio_quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number" text NOT NULL,
	"client_id" uuid NOT NULL,
	"job_id" uuid,
	"title" text NOT NULL,
	"intro" text,
	"terms" text,
	"status" "studio_quote_status" DEFAULT 'draft' NOT NULL,
	"package_id" uuid,
	"lines" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"subtotal_cents" integer DEFAULT 0 NOT NULL,
	"discount_cents" integer DEFAULT 0 NOT NULL,
	"tax_rate_bp" integer DEFAULT 0 NOT NULL,
	"tax_cents" integer DEFAULT 0 NOT NULL,
	"tax_label" text,
	"total_cents" integer DEFAULT 0 NOT NULL,
	"gift_cents" integer DEFAULT 0 NOT NULL,
	"deposit_cents" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'usd' NOT NULL,
	"promo_code" text,
	"gift_code" text,
	"valid_until" timestamp with time zone,
	"token_hash" text,
	"sent_at" timestamp with time zone,
	"viewed_at" timestamp with time zone,
	"accepted_at" timestamp with time zone,
	"accepted_by" text,
	"accepted_ip_hash" text,
	"accepted_hash" text,
	"invoice_id" uuid,
	"is_sample" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text,
	"deleted_at" timestamp with time zone,
	"studio_id" uuid
);
--> statement-breakpoint
ALTER TABLE "studio_gift_ledger" ADD CONSTRAINT "studio_gift_ledger_card_id_studio_gift_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."studio_gift_cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_promo_codes" ADD CONSTRAINT "studio_promo_codes_referrer_client_id_studio_clients_id_fk" FOREIGN KEY ("referrer_client_id") REFERENCES "public"."studio_clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_quotes" ADD CONSTRAINT "studio_quotes_client_id_studio_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."studio_clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_quotes" ADD CONSTRAINT "studio_quotes_job_id_studio_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."studio_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_quotes" ADD CONSTRAINT "studio_quotes_package_id_studio_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."studio_packages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_quotes" ADD CONSTRAINT "studio_quotes_invoice_id_studio_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."studio_invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "studio_add_ons_slug_idx" ON "studio_add_ons" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "studio_gift_cards_code_idx" ON "studio_gift_cards" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "studio_packages_slug_idx" ON "studio_packages" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "studio_promo_codes_code_idx" ON "studio_promo_codes" USING btree ("code");--> statement-breakpoint
CREATE INDEX "studio_quotes_client_idx" ON "studio_quotes" USING btree ("client_id");--> statement-breakpoint
CREATE UNIQUE INDEX "studio_quotes_number_idx" ON "studio_quotes" USING btree ("number");