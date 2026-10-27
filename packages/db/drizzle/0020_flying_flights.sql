CREATE TABLE "flying_airports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"lat" double precision NOT NULL,
	"lon" double precision NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flying_flights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_code" text NOT NULL,
	"to_code" text NOT NULL,
	"landed_on" date NOT NULL,
	"aircraft_type" text,
	"note" text,
	"visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX "flying_airports_code_idx" ON "flying_airports" USING btree ("code");--> statement-breakpoint
CREATE INDEX "flying_flights_landed_idx" ON "flying_flights" USING btree ("landed_on");