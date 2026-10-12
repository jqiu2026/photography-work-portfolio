# PROGRESS

Living status. Update at every milestone. Newest entries at the top of "Log".

**Branch:** `feat/custom-ui-cms`  **Live view:** http://localhost:3000/_progress
**Current phase:** 1  **Current milestone:** M8  **State:** M7b done (component gallery on /_progress arrives with M3)

## Phase 1: UI package and redesign
- [x] M1 pnpm workspace (`apps/web`, `apps/photos`, `apps/docs`, `packages/ui`, `packages/sites`, `packages/config`), dev on :3000/:3002/:3001, `/_progress` live page
- [x] M2 Once UI audit, design exploration (`/_design`, 3 directions), design language doc (Squarespace-grade, not StuyAviators), tokens, site theme presets
- [x] M3 Foundations, forms, overlays, profile/site components (ProfileHeader, SocialLinks, SiteSwitcher...) + docs site skeleton
- [x] M4 Motion + media components
- [x] M5 WebGL hero + image sequence tooling
- [x] M6 Hub home rebuilt (profile-forward showpiece, preview cards for photos/music/flying)
- [x] M7 Remaining hub pages (about, work, writing, connect) + legal pages migrated, Once UI removed
- [x] M7b Photography site (`apps/photos`), music and flying sites, `proxy.ts` host routing, site switcher
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


## Log
- 2026-10-12: M7b done. `apps/photos` (:3002): cinematic home (WebGL hero, justified gallery, subject grid), /portfolio and /portfolio/[slug] (masonry + lightbox), /about, /book (mailto form), /client (ShootProof URL via env), robots/sitemap; cinema-dark preset by default. Music and flying built on the hub app as route groups `(music)`/`(flying)` with their own presets, on a shared interest template; only real facts shown (Part 107, StuyAviators Instagram, cockpit and airliner photos), everything else dev-only `TODO(owner)` and hidden in production. `src/proxy.ts` host routing verified (music./flying. rewrite, prefixed paths redirect, production redirects /music -> subdomain). Shared chrome (SiteShell, SiteHeader with site switcher, Footer with More from me, ContactForm) lives in `packages/sites`; legal pages are hub-canonical with absolute links from the other sites. Gallery originals moved (git mv, not deleted) from `apps/web/public/images/gallery` to `apps/photos/public/images/gallery`.
- 2026-10-12: M7 done. Hub pages on the new UI: /about (profile, timeline, skills from the original real copy), /work + /work/[slug] (cover, credits, MDX, lightbox gallery, next/prev, password gate for `protected: true`), /writing + posts (+ `/writing/rss.xml`, reading progress), /connect (socials + mailto form with honeypot), /privacy /terms /licensing /accessibility (drafts, marked for review), security.txt, robots (AI crawler opt-out), sitemap, redirects (/blog, /contact, /gallery->photos, /api/rss). Once UI fully removed (`@once-ui-system/core`, sass, react-icons, legacy components, OG fetch/proxy routes dropped as SSRF surface). Biome configured; lint, typecheck, build pass. `.agents` replaced by `AGENTS.md`.
- 2026-10-12: M6 done. Hub home (`apps/web/src/app/(site)/page.tsx`): WebGL hero over a real photo, profile row (portrait, headline, socials, `Person` JSON-LD), scroll-highlight intro, pinned scene with scroll-scrubbed image sequence + step text, preview cards for photos/music/flying, horizontal showcase of real projects, latest writing, closing CTA, footer with More from me + legal links. App is split into route groups: `(site)` = new UI, `(legacy)` = Once UI pages still to migrate in M7. MDX content moved to `src/content/{projects,posts}`. Optimized derivatives for gallery/projects/blogs/avatar in `public/opt/*` (originals untouched). Screenshots: `screenshots/m1/home-*.png`. Placeholder facts are dev-only `TODO(owner)` and hidden in production.
- 2026-10-12: M5 done. `@placeholder/ui/webgl` ShaderHero (ogl, lazy import, pointer-reactive chromatic split, drifting displacement, light leak, DPR cap 1.5, pauses off-screen, plain-image fallback for reduced motion/Save-Data/low-power/no-WebGL). `scripts/make-sequence.mjs` (sharp-only, no ffmpeg on this machine) generated the placeholder `apps/web/public/sequence/hero` (96 frames, 2.2 MB) + README for swapping real footage. Verified in headless Chromium (swiftshader).
- 2026-10-12: M4 done. Motion (`@placeholder/ui/motion`): InView, RevealText, CountUp, ScrollHighlight, Parallax, PinnedScene (+useSceneProgress), StepSequence, StackingCards, HorizontalShowcase, ScrollProgress, TiltCard, MagneticButton, SmoothScroll (Lenis), PageTransition, Marquee, CursorFollower; all static under reduced motion. Media (`/media`): Image (srcset, blur-up, dominant colour), Gallery (justified/masonry), Lightbox, BeforeAfter, ImageSequence (canvas, progressive, poster fallback on Save-Data/2g/reduced motion), VideoBackground, ProtectedImage stub. Pinned scene verified with Playwright (sticks, steps advance).
- 2026-10-12: M3 done. `packages/ui`: layout (Container/Stack/Row/Grid/Section), typography (Heading/Text/Link/Prose/Eyebrow/Separator), Button/IconButton, forms (Field/Input/Textarea/Select/Checkbox/Switch/RadioGroup/Slider on Radix), overlays (Dialog/Sheet/Popover/Tooltip/Menu/Tabs/Accordion/Toast), feedback atoms, navigation (Header glass-on-scroll, SiteSwitcher, SkipLink, ThemeToggle, TableOfContents), Footer/MoreFromMe/Breadcrumbs/Pagination, content (Card/Avatar/Stat/Quote/CodeBlock/Table), profile (ProfileHeader/SocialLinks/SkillTags/Timeline/SitePreviewCard/InterestHero/ResumeButton), embeds (click-to-load EmbedFacade, AudioPlayer). Live gallery at /_progress. Docs skeleton in `apps/docs` (running on :3101 because the StuyAviators server took :3001; default script port stays 3001). Unit tests, per-component docs pages: M8.
- 2026-10-12: M2 done. `audit-once-ui.md`, `/_design` (3 directions, light+dark, real photos), `design-language.md` (pick: hub=A Gallery white, photos=B cinema, music=C soft neutral, flying=cool B; all AA), tokens/themes/ThemeProvider in `packages/ui`, presets in `packages/sites`, `scripts/optimize-images.mjs` (84 MB -> 9.4 MB WebP derivatives in `apps/web/public/opt/gallery`). Decision: package styles are handwritten CSS (`--ph-*`, `ph-*` classes) instead of compiled Tailwind v4 (deviates from A4; zero build toolchain, framework-agnostic).
- 2026-10-12: M1 done. pnpm workspace (apps/web via git mv, photos+docs placeholders, packages/ui, sites registry, config). Pins: Once UI 1.5.6, react-icons 5.5.0 (newer versions break the old site), Next 16.3.8, React 19.2.8. Dev-only `/_progress` (RouteGuard lets `/_*` through in dev). Playwright + `scripts/shot.mjs`. Build passes. Hub on :3000 after owner freed the port.
- 2026-10-12: Planning docs written (`docs/project/`), then revised: hub + subdomain sites (photos, music, flying), Squarespace-grade non-StuyAviators design, profile-style home, legal doc. No code changes yet.
