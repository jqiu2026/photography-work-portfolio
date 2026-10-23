CREATE TABLE "studio_call_sheets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"call_time" text,
	"location" text,
	"notes" text,
	"shots" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"contacts" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "studio_call_sheets_job_id_unique" UNIQUE("job_id")
);
--> statement-breakpoint
CREATE TABLE "studio_expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text DEFAULT 'expense' NOT NULL,
	"spent_on" date NOT NULL,
	"category" text DEFAULT 'other' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"vendor" text,
	"amount_cents" integer DEFAULT 0 NOT NULL,
	"tenth_miles" integer,
	"rate_cents_per_mile" integer,
	"job_id" uuid,
	"receipt_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studio_gear" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"kind" text DEFAULT 'other' NOT NULL,
	"notes" text,
	"retired_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studio_gear_uses" (
	"gear_id" uuid NOT NULL,
	"job_id" uuid NOT NULL,
	"on_date" date NOT NULL,
	CONSTRAINT "studio_gear_uses_gear_id_job_id_on_date_pk" PRIMARY KEY("gear_id","job_id","on_date")
);
--> statement-breakpoint
CREATE TABLE "studio_testimonials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid,
	"job_id" uuid,
	"display_name" text NOT NULL,
	"role" text,
	"quote" text NOT NULL,
	"consent_at" timestamp with time zone,
	"consent_note" text,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "studio_call_sheets" ADD CONSTRAINT "studio_call_sheets_job_id_studio_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."studio_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_expenses" ADD CONSTRAINT "studio_expenses_job_id_studio_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."studio_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_gear_uses" ADD CONSTRAINT "studio_gear_uses_gear_id_studio_gear_id_fk" FOREIGN KEY ("gear_id") REFERENCES "public"."studio_gear"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_gear_uses" ADD CONSTRAINT "studio_gear_uses_job_id_studio_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."studio_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_testimonials" ADD CONSTRAINT "studio_testimonials_client_id_studio_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."studio_clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_testimonials" ADD CONSTRAINT "studio_testimonials_job_id_studio_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."studio_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "studio_expenses_date_idx" ON "studio_expenses" USING btree ("spent_on");--> statement-breakpoint
CREATE INDEX "studio_gear_uses_date_idx" ON "studio_gear_uses" USING btree ("on_date");