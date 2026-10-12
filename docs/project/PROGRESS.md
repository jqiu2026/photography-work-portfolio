# PROGRESS

Living status. Update at every milestone. Newest entries at the top of "Log".

**Branch:** `feat/custom-ui-cms`  **Live view:** http://localhost:3000 (`/_progress` once built)
**Current phase:** 1  **Current milestone:** M1  **State:** not started

## Phase 1: UI package and redesign
- [ ] M1 pnpm workspace (`apps/web`, `apps/photos`, `apps/docs`, `packages/ui`, `packages/sites`, `packages/config`), dev on :3000/:3002/:3001, `/_progress` live page
- [ ] M2 Once UI audit, design exploration (`/_design`, 3 directions), design language doc (Squarespace-grade, not StuyAviators), tokens, site theme presets
- [ ] M3 Foundations, forms, overlays, profile/site components (ProfileHeader, SocialLinks, SiteSwitcher...) + docs site skeleton
- [ ] M4 Motion + media components
- [ ] M5 WebGL hero + image sequence tooling
- [ ] M6 Hub home rebuilt (profile-forward showpiece, preview cards for photos/music/flying)
- [ ] M7 Remaining hub pages (about, work, writing, connect) + legal pages migrated, Once UI removed
- [ ] M7b Photography site (`apps/photos`), music and flying sites, `proxy.ts` host routing, site switcher
- [ ] M8 Perf, a11y, tests, docs completeness, open-source hygiene
- [ ] M9 Acceptance run (incl. not-a-StuyAviators-lookalike check, legal checklist) + `PHASE-1-SUMMARY.md`

## Phase 2: CMS and protection
- [ ] M10 DB (Drizzle/Neon/PGlite), shared packages (`db`, `auth`, `storage`, `protect`), storage providers, env handling
- [ ] M11 Auth (Google, `@jerryqiu.com`, allow-list, roles)
- [ ] M12 Admin shell (site selector) + profile/timeline/social links + posts + projects
- [ ] M13 Galleries, music and flying content types, media library, image pipeline
- [ ] M14 Settings, inbox, users, trash, audit, versions
- [ ] M15 All four public sites on DB, cache/revalidation, SEO/feeds, import/export
- [ ] M16 Image protection (signed URLs, ProtectedImage, ScreenshotGuard, watermark)
- [ ] M17 Studio shell + ShootProof bridge in `apps/photos` (mocked until credentials)
- [ ] M18 Security review, owner guide, acceptance, `PHASE-2-SUMMARY.md`, `PHASE-3-KICKOFF.md`
- [ ] **STOP (Phase 3 is not started automatically)**

## Phase 3: not started (needs owner go-ahead)

## Blocked / waiting on owner
(none yet; see QUESTIONS.md)

## Log
- 2026-10-12: Planning docs written (`docs/project/`), then revised: hub + subdomain sites (photos, music, flying), Squarespace-grade non-StuyAviators design, profile-style home, legal doc. No code changes yet.
