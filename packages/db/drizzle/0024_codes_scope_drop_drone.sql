ALTER TABLE "studio_drone_checklists" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "studio_drone_checklists" CASCADE;--> statement-breakpoint
ALTER TABLE "studio_promo_codes" ADD COLUMN "gallery_id" uuid;--> statement-breakpoint
ALTER TABLE "studio_promo_codes" ADD CONSTRAINT "studio_promo_codes_gallery_id_studio_galleries_id_fk" FOREIGN KEY ("gallery_id") REFERENCES "public"."studio_galleries"("id") ON DELETE cascade ON UPDATE no action;