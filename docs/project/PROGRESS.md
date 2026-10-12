# PROGRESS

Living status. Update at every milestone. Newest entries at the top of "Log".

**Branch:** `feat/custom-ui-cms`  **Live view:** http://localhost:3000/_progress
**Current phase:** 1  **Current milestone:** M5  **State:** M4 done (component gallery on /_progress arrives with M3)

## Phase 1: UI package and redesign
- [x] M1 pnpm workspace (`apps/web`, `apps/photos`, `apps/docs`, `packages/ui`, `packages/sites`, `packages/config`), dev on :3000/:3002/:3001, `/_progress` live page
- [x] M2 Once UI audit, design exploration (`/_design`, 3 directions), design language doc (Squarespace-grade, not StuyAviators), tokens, site theme presets
- [x] M3 Foundations, forms, overlays, profile/site components (ProfileHeader, SocialLinks, SiteSwitcher...) + docs site skeleton
- [x] M4 Motion + media components
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


## Log
- 2026-10-12: M4 done. Motion (`@placeholder/ui/motion`): InView, RevealText, CountUp, ScrollHighlight, Parallax, PinnedScene (+useSceneProgress), StepSequence, StackingCards, HorizontalShowcase, ScrollProgress, TiltCard, MagneticButton, SmoothScroll (Lenis), PageTransition, Marquee, CursorFollower; all static under reduced motion. Media (`/media`): Image (srcset, blur-up, dominant colour), Gallery (justified/masonry), Lightbox, BeforeAfter, ImageSequence (canvas, progressive, poster fallback on Save-Data/2g/reduced motion), VideoBackground, ProtectedImage stub. Pinned scene verified with Playwright (sticks, steps advance).
- 2026-10-12: M3 done. `packages/ui`: layout (Container/Stack/Row/Grid/Section), typography (Heading/Text/Link/Prose/Eyebrow/Separator), Button/IconButton, forms (Field/Input/Textarea/Select/Checkbox/Switch/RadioGroup/Slider on Radix), overlays (Dialog/Sheet/Popover/Tooltip/Menu/Tabs/Accordion/Toast), feedback atoms, navigation (Header glass-on-scroll, SiteSwitcher, SkipLink, ThemeToggle, TableOfContents), Footer/MoreFromMe/Breadcrumbs/Pagination, content (Card/Avatar/Stat/Quote/CodeBlock/Table), profile (ProfileHeader/SocialLinks/SkillTags/Timeline/SitePreviewCard/InterestHero/ResumeButton), embeds (click-to-load EmbedFacade, AudioPlayer). Live gallery at /_progress. Docs skeleton in `apps/docs` (running on :3101 because the StuyAviators server took :3001; default script port stays 3001). Unit tests, per-component docs pages: M8.
- 2026-10-12: M2 done. `audit-once-ui.md`, `/_design` (3 directions, light+dark, real photos), `design-language.md` (pick: hub=A Gallery white, photos=B cinema, music=C soft neutral, flying=cool B; all AA), tokens/themes/ThemeProvider in `packages/ui`, presets in `packages/sites`, `scripts/optimize-images.mjs` (84 MB -> 9.4 MB WebP derivatives in `apps/web/public/opt/gallery`). Decision: package styles are handwritten CSS (`--ph-*`, `ph-*` classes) instead of compiled Tailwind v4 (deviates from A4; zero build toolchain, framework-agnostic).
- 2026-10-12: M1 done. pnpm workspace (apps/web via git mv, photos+docs placeholders, packages/ui, sites registry, config). Pins: Once UI 1.5.6, react-icons 5.5.0 (newer versions break the old site), Next 16.3.8, React 19.2.8. Dev-only `/_progress` (RouteGuard lets `/_*` through in dev). Playwright + `scripts/shot.mjs`. Build passes. Hub on :3000 after owner freed the port.
- 2026-10-12: Planning docs written (`docs/project/`), then revised: hub + subdomain sites (photos, music, flying), Squarespace-grade non-StuyAviators design, profile-style home, legal doc. No code changes yet.
