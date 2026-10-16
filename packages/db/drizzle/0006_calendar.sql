CREATE TYPE "public"."appointment_kind" AS ENUM('shoot', 'consult', 'minislot', 'block');--> statement-breakpoint
CREATE TYPE "public"."appointment_status" AS ENUM('open', 'hold', 'confirmed', 'cancelled');--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "appointment_kind" DEFAULT 'shoot' NOT NULL,
	"status" "appointment_status" DEFAULT 'confirmed' NOT NULL,
	"title" text NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"buffer_before_min" integer DEFAULT 0 NOT NULL,
	"buffer_after_min" integer DEFAULT 0 NOT NULL,
	"travel_min" integer DEFAULT 0 NOT NULL,
	"blocked_start" timestamp with time zone NOT NULL,
	"blocked_end" timestamp with time zone NOT NULL,
	"location" text,
	"notes" text,
	"job_id" uuid,
	"client_id" uuid,
	"booking_id" uuid,
	"invoice_id" uuid,
	"group_label" text,
	"hold_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "availability_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"weekday" integer NOT NULL,
	"start_minute" integer NOT NULL,
	"end_minute" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blackout_dates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date NOT NULL,
	"reason" text,
	CONSTRAINT "blackout_dates_date_unique" UNIQUE("date")
);
--> statement-breakpoint
CREATE TABLE "studio_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "waitlist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"wanted" text NOT NULL,
	"shoot_type" text,
	"notified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_job_id_studio_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."studio_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_client_id_studio_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."studio_clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_booking_id_studio_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."studio_bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_invoice_id_studio_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."studio_invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "appointments_start_idx" ON "appointments" USING btree ("starts_at");--> statement-breakpoint
CREATE INDEX "appointments_job_idx" ON "appointments" USING btree ("job_id");
--> statement-breakpoint
-- No overlapping live appointments (buffers and travel included). Cancelled ones do not count. Adjacent ranges are fine.
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_no_overlap" EXCLUDE USING gist (tstzrange("blocked_start", "blocked_end", '[)') WITH &&) WHERE ("status" <> 'cancelled');
