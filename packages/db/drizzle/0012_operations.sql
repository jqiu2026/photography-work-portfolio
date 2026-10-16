CREATE TABLE "studio_automation_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dedupe_key" text NOT NULL,
	"rule" text NOT NULL,
	"entity_type" text,
	"entity_id" text,
	"status" text DEFAULT 'done' NOT NULL,
	"detail" text,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studio_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"link" text,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studio_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"due_on" date,
	"notes" text,
	"job_id" uuid,
	"client_id" uuid,
	"done_at" timestamp with time zone,
	"source" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "studio_tasks" ADD CONSTRAINT "studio_tasks_job_id_studio_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."studio_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_tasks" ADD CONSTRAINT "studio_tasks_client_id_studio_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."studio_clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "studio_automation_runs_key_idx" ON "studio_automation_runs" USING btree ("dedupe_key");--> statement-breakpoint
CREATE INDEX "studio_automation_runs_rule_idx" ON "studio_automation_runs" USING btree ("rule");--> statement-breakpoint
CREATE INDEX "studio_notifications_created_idx" ON "studio_notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "studio_tasks_due_idx" ON "studio_tasks" USING btree ("due_on");