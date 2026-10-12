# Phase 2 summary: CMS, image protection, ShootProof bridge

Branch `feat/custom-ui-cms`, 2026-10-12. Nothing is pushed, merged, deployed or published. Phase 3 is not started.

## What exists

| Area | Result |
|---|---|
| Foundation (M10) | `packages/db` (Drizzle schema for every content type, committed migration, Neon in production, PGlite locally, seed of the real content), `packages/storage` (local, R2, Blob), `packages/protect` (HMAC image tokens, AES-GCM, IP hashing), env handling that degrades instead of crashing. |
| Auth (M11) | Google sign-in with verified email, `hd` claim and exact `@jerryqiu.com` match, then a database allow-list with roles; removal bites on the next click; guarded actions with rate limit and audit; cross-site staff cookie in production. |
| Admin content (M12, M13) | Profile, links, timeline; posts (Markdown, scheduling, versions, autosave, preview); projects (block editor); media library (signed direct uploads, ingest pipeline, replace-in-place, usage tracking, review flags); galleries; music; flying with a safe-to-publish checklist. |
| Operations (M14) | Settings (SEO, navigation, accent, maintenance, protection defaults, legal pages), inbox (`packages/inbox`), users, trash with 30-day purge, audit log, redirects, export and `pnpm db:backup`. |
| Public sites on the CMS (M15) | Typed content layer with cache tags, repository fallback without a database, redirects, maintenance mode, settings applied on all four sites, cross-app cache refresh. |
| Image protection (M16) | Image route with public and strict tiers, `ProtectedImage`, `ScreenshotGuard` (every shortcut in the plan), server-baked watermark, bot refusal. See `05-security-and-image-protection.md` ("As built"). |
| Studio and ShootProof (M17) | `/studio` shell, `packages/shootproof` (live adapter from the published OpenAPI, mock source, encrypted tokens, 24-hour derivative cache, expiry cron). Mocked until credentials exist. |

## Verification

Lint, typecheck and build pass. Unit tests 198 (protect 14, storage 7, db 16, ui 67, sites 5, docs 4, auth 22, inbox 7, media 26, web 14, shootproof 16). Admin end-to-end suite 44 flows on a throwaway database with the hub and two photography servers. Production end-to-end suite 154 (every route, light/dark, 390 and 1440 px, axe, keyboard, reduced motion).

Security review (the `security-review` skill over the whole branch): no high-confidence vulnerabilities. Two low observations: editors can publish legal-page text by calling the action directly although the settings page is owner-only; the Markdown image filter accepts protocol-relative URLs (editor-authored only). Bugs found and fixed by the tests during this phase include a server-side level mismatch that sent strict images down the non-strict path, file URLs leaking into the page payload, a Server Action redirecting to a route handler (405), a token getter exported from a `"use server"` file, and a cron query that would have deleted all old messages rather than spam.

## Honest gaps

- Never run against real services: Google sign-in, Neon, R2, Resend, Turnstile, ShootProof, Vercel Cron. All are written to the documented behaviour and exercised against fakes or local equivalents. First-connection checklists: `google-oauth-setup.md`, `shootproof-bridge.md`, `DEPLOYMENT.md`.
- Lighthouse was not re-run after the CMS switch; the public pages now render through the content layer. Re-run `scripts/lighthouse.mjs` before launch.
- The JS budget gap recorded in Phase 1 is unchanged.
- ShootProof's API terms about caching could not be found; the bridge is conservative (Q28).
- Music and flying publish no sitemaps of their own (Q26).
- A public image cached before its gallery was switched to strict can stay reachable for up to 24 hours (Q27).
- Image protection is a deterrent and says so everywhere.
- The visual design was reopened by the owner after this phase (see HANDOFF.md).
