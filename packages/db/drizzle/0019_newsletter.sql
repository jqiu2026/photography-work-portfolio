CREATE TABLE "studio_subscribers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"token_hash" text NOT NULL,
	"source" text,
	"confirmed_at" timestamp with time zone,
	"unsubscribed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "studio_subscribers_email_idx" ON "studio_subscribers" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "studio_subscribers_token_idx" ON "studio_subscribers" USING btree ("token_hash");