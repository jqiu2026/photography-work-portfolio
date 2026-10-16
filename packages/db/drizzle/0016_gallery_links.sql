-- every existing gallery gets an address (new ones get one when they are created)
UPDATE "studio_galleries" SET "slug" = 'g-' || substr(replace("id"::text, '-', ''), 1, 8) WHERE "slug" IS NULL;
