CREATE TABLE "email_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"to_email" text NOT NULL,
	"from_email" text NOT NULL,
	"reply_to" text,
	"subject" text NOT NULL,
	"body_text" text NOT NULL,
	"body_html" text,
	"provider" text NOT NULL,
	"status" text NOT NULL,
	"provider_id" text,
	"error" text,
	"related_type" text,
	"related_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "studio_bookings" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "studio_bookings" ADD COLUMN "shoot_type" text;--> statement-breakpoint
ALTER TABLE "studio_bookings" ADD COLUMN "event_date" date;--> statement-breakpoint
ALTER TABLE "studio_bookings" ADD COLUMN "location" text;--> statement-breakpoint
ALTER TABLE "studio_bookings" ADD COLUMN "budget" text;--> statement-breakpoint
ALTER TABLE "studio_bookings" ADD COLUMN "guests" integer;--> statement-breakpoint
ALTER TABLE "studio_bookings" ADD COLUMN "source" text;--> statement-breakpoint
ALTER TABLE "studio_bookings" ADD COLUMN "referrer" text;--> statement-breakpoint
ALTER TABLE "studio_bookings" ADD COLUMN "utm" jsonb;--> statement-breakpoint
ALTER TABLE "studio_bookings" ADD COLUMN "details" jsonb;--> statement-breakpoint
ALTER TABLE "studio_bookings" ADD COLUMN "score" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX "email_log_to_idx" ON "email_log" USING btree ("to_email");--> statement-breakpoint
CREATE INDEX "email_log_related_idx" ON "email_log" USING btree ("related_type","related_id");