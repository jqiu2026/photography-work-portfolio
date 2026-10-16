CREATE TABLE "studio_order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid,
	"kind" text NOT NULL,
	"name" text NOT NULL,
	"sku" text,
	"media_id" uuid,
	"qty" integer DEFAULT 1 NOT NULL,
	"unit_cents" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studio_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number" text NOT NULL,
	"gallery_id" uuid NOT NULL,
	"invoice_id" uuid,
	"status" text DEFAULT 'pending' NOT NULL,
	"buyer_name" text NOT NULL,
	"buyer_email" text NOT NULL,
	"ship" jsonb,
	"subtotal_cents" integer DEFAULT 0 NOT NULL,
	"shipping_cents" integer DEFAULT 0 NOT NULL,
	"total_cents" integer DEFAULT 0 NOT NULL,
	"token_hash" text NOT NULL,
	"lab_order_id" text,
	"reminder_at" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studio_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"sku" text,
	"name" text NOT NULL,
	"description" text,
	"price_cents" integer DEFAULT 0 NOT NULL,
	"sample" boolean DEFAULT true NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text,
	"deleted_at" timestamp with time zone,
	"studio_id" uuid
);
--> statement-breakpoint
ALTER TABLE "studio_albums" ADD COLUMN "parent_id" uuid;--> statement-breakpoint
ALTER TABLE "studio_albums" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "studio_albums" ADD COLUMN "cover_media_id" uuid;--> statement-breakpoint
ALTER TABLE "studio_albums" ADD COLUMN "passcode_hash" text;--> statement-breakpoint
ALTER TABLE "studio_albums" ADD COLUMN "hidden" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "studio_galleries" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "studio_galleries" ADD COLUMN "visibility" text DEFAULT 'passcode' NOT NULL;--> statement-breakpoint
ALTER TABLE "studio_galleries" ADD COLUMN "shop" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "studio_order_items" ADD CONSTRAINT "studio_order_items_order_id_studio_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."studio_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_order_items" ADD CONSTRAINT "studio_order_items_product_id_studio_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."studio_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_orders" ADD CONSTRAINT "studio_orders_gallery_id_studio_galleries_id_fk" FOREIGN KEY ("gallery_id") REFERENCES "public"."studio_galleries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_orders" ADD CONSTRAINT "studio_orders_invoice_id_studio_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."studio_invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "studio_order_items_order_idx" ON "studio_order_items" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "studio_orders_number_idx" ON "studio_orders" USING btree ("number");--> statement-breakpoint
CREATE UNIQUE INDEX "studio_orders_token_idx" ON "studio_orders" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "studio_orders_gallery_idx" ON "studio_orders" USING btree ("gallery_id");--> statement-breakpoint
CREATE INDEX "studio_products_kind_idx" ON "studio_products" USING btree ("kind");--> statement-breakpoint
CREATE UNIQUE INDEX "studio_galleries_slug_idx" ON "studio_galleries" USING btree ("slug");