CREATE TABLE "studio_contract_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"kind" text DEFAULT 'contract' NOT NULL,
	"body" text NOT NULL,
	"usage_rights" jsonb,
	"is_sample" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text,
	"deleted_at" timestamp with time zone,
	"studio_id" uuid
);
--> statement-breakpoint
CREATE TABLE "studio_questionnaire_sends" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"questionnaire_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"job_id" uuid,
	"fields" jsonb NOT NULL,
	"title" text NOT NULL,
	"token_hash" text NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"answers" jsonb
);
--> statement-breakpoint
CREATE TABLE "studio_questionnaires" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"fields" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_sample" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text,
	"deleted_at" timestamp with time zone,
	"studio_id" uuid
);
--> statement-breakpoint
ALTER TABLE "studio_contracts" ADD COLUMN "kind" text DEFAULT 'contract' NOT NULL;--> statement-breakpoint
ALTER TABLE "studio_contracts" ADD COLUMN "template_id" uuid;--> statement-breakpoint
ALTER TABLE "studio_contracts" ADD COLUMN "subject" text;--> statement-breakpoint
ALTER TABLE "studio_contracts" ADD COLUMN "minor" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "studio_contracts" ADD COLUMN "guardian_name" text;--> statement-breakpoint
ALTER TABLE "studio_contracts" ADD COLUMN "signer_email" text;--> statement-breakpoint
ALTER TABLE "studio_contracts" ADD COLUMN "consent_electronic" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "studio_contracts" ADD COLUMN "usage_rights" jsonb;--> statement-breakpoint
ALTER TABLE "studio_contracts" ADD COLUMN "license_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "studio_questionnaire_sends" ADD CONSTRAINT "studio_questionnaire_sends_questionnaire_id_studio_questionnaires_id_fk" FOREIGN KEY ("questionnaire_id") REFERENCES "public"."studio_questionnaires"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_questionnaire_sends" ADD CONSTRAINT "studio_questionnaire_sends_client_id_studio_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."studio_clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_questionnaire_sends" ADD CONSTRAINT "studio_questionnaire_sends_job_id_studio_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."studio_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "studio_contract_templates_slug_idx" ON "studio_contract_templates" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "studio_questionnaire_sends_token_idx" ON "studio_questionnaire_sends" USING btree ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "studio_questionnaires_slug_idx" ON "studio_questionnaires" USING btree ("slug");