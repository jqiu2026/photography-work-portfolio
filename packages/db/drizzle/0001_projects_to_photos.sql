-- Phase 2.5 (R1): project case studies belong to the photography site. Idempotent: rows already on "photos" are untouched,
-- and a hub row is skipped if a photos row with the same slug already exists.
UPDATE "projects" AS p SET "site" = 'photos'
WHERE p."site" = 'hub'
  AND NOT EXISTS (SELECT 1 FROM "projects" q WHERE q."site" = 'photos' AND q."slug" = p."slug");
