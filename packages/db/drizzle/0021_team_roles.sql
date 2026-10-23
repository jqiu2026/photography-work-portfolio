ALTER TYPE "public"."role" ADD VALUE 'bookkeeper';--> statement-breakpoint
ALTER TYPE "public"."role" ADD VALUE 'photographer';--> statement-breakpoint
CREATE TABLE "studio_created" (
	"entity" text NOT NULL,
	"entity_id" text NOT NULL,
	"by_email" text NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "studio_created_entity_entity_id_pk" PRIMARY KEY("entity","entity_id")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "external" boolean DEFAULT false NOT NULL;