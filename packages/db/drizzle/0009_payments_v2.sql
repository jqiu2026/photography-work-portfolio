ALTER TYPE "public"."studio_invoice_status" ADD VALUE 'refunded';--> statement-breakpoint
CREATE TABLE "studio_payment_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"name" text NOT NULL,
	"total_cents" integer NOT NULL,
	"count" integer NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studio_recurring" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"description" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"interval_months" integer DEFAULT 1 NOT NULL,
	"next_run_on" date NOT NULL,
	"ends_on" date,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studio_refunds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"amount_cents" integer NOT NULL,
	"reason" text,
	"provider_ref" text,
	"by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "studio_invoices" ADD COLUMN "kind" text DEFAULT 'standard' NOT NULL;--> statement-breakpoint
ALTER TABLE "studio_invoices" ADD COLUMN "plan_id" uuid;--> statement-breakpoint
ALTER TABLE "studio_invoices" ADD COLUMN "installment_no" integer;--> statement-breakpoint
ALTER TABLE "studio_invoices" ADD COLUMN "installment_of" integer;--> statement-breakpoint
ALTER TABLE "studio_invoices" ADD COLUMN "recurring_id" uuid;--> statement-breakpoint
ALTER TABLE "studio_payments" ADD COLUMN "tip_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "studio_payments" ADD COLUMN "surcharge_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "studio_payments" ADD COLUMN "method" text;--> statement-breakpoint
ALTER TABLE "studio_payments" ADD COLUMN "refunded_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "studio_payment_plans" ADD CONSTRAINT "studio_payment_plans_job_id_studio_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."studio_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_recurring" ADD CONSTRAINT "studio_recurring_job_id_studio_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."studio_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_refunds" ADD CONSTRAINT "studio_refunds_payment_id_studio_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."studio_payments"("id") ON DELETE no action ON UPDATE no action;