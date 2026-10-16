CREATE TABLE "studio_view_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"media_id" uuid NOT NULL,
	"viewer" text NOT NULL,
	"code" text NOT NULL,
	"ip_hash" text,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "studio_view_events_code_idx" ON "studio_view_events" USING btree ("code");--> statement-breakpoint
CREATE INDEX "studio_view_events_media_idx" ON "studio_view_events" USING btree ("media_id");