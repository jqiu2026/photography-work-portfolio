CREATE TABLE "client_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"email" text NOT NULL,
	"password_hash" text,
	"prefs" jsonb DEFAULT '{"galleryReady":true,"reminders":true,"news":false}'::jsonb NOT NULL,
	"failed_attempts" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_login_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studio_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"job_id" uuid,
	"direction" text NOT NULL,
	"body" text NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "studio_jobs" ADD COLUMN "delivery_eta" date;--> statement-breakpoint
ALTER TABLE "client_accounts" ADD CONSTRAINT "client_accounts_client_id_studio_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."studio_clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_login_tokens" ADD CONSTRAINT "client_login_tokens_account_id_client_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."client_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_messages" ADD CONSTRAINT "studio_messages_client_id_studio_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."studio_clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_messages" ADD CONSTRAINT "studio_messages_job_id_studio_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."studio_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "client_accounts_client_idx" ON "client_accounts" USING btree ("client_id");--> statement-breakpoint
CREATE UNIQUE INDEX "client_accounts_email_idx" ON "client_accounts" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "client_login_tokens_hash_idx" ON "client_login_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "studio_messages_client_idx" ON "studio_messages" USING btree ("client_id");