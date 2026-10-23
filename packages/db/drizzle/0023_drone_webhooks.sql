CREATE TABLE "studio_drone_checklists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"weather" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"decision" text,
	"decided_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "studio_drone_checklists_job_id_unique" UNIQUE("job_id")
);
--> statement-breakpoint
CREATE TABLE "studio_webhook_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"webhook_id" uuid NOT NULL,
	"event" text NOT NULL,
	"status" integer,
	"error" text,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studio_webhooks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"url" text NOT NULL,
	"secret" text NOT NULL,
	"events" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "studio_drone_checklists" ADD CONSTRAINT "studio_drone_checklists_job_id_studio_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."studio_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_webhook_deliveries" ADD CONSTRAINT "studio_webhook_deliveries_webhook_id_studio_webhooks_id_fk" FOREIGN KEY ("webhook_id") REFERENCES "public"."studio_webhooks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "studio_webhook_deliveries_hook_idx" ON "studio_webhook_deliveries" USING btree ("webhook_id","at");