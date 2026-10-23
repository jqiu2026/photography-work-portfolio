CREATE TABLE "studio_privacy_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"details" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"resolution" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"handled_at" timestamp with time zone
);
