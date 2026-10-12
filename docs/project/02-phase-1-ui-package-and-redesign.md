# 02. Phase 1: UI package and site redesign

> **Status 2026-10-12:** Phase 1 is complete and archived. Its visual outcome (Instrument Sans, neutral grayscale, handwritten `--ph-*` CSS, header-based pages) is being **replaced from scratch** in Phase 2.5 by an original, sellable UI system; see [12-vision-v2.md](12-vision-v2.md) and [HANDOFF.md](HANDOFF.md). Engineering parts (workspace layout, tests, docs-coverage rule, rename script, accessibility test rig) carry over.

**Goal:** an open-source, documented UI package, and the family of sites rebuilt on it: the hub (profile-style, `jerryqiu.com`), the photography portfolio (`photos.jerryqiu.com`), and the music and flying sites. Squarespace-grade polish with a restrained Apple-style motion layer ([10](10-design-brief.md)). No Once UI left when done. Must **not** resemble the StuyAviators site.

**Exit:** all acceptance criteria below pass, [PROGRESS.md](PROGRESS.md) is updated, then continue straight into Phase 2.

## 1.0 Setup (do first)

1. `git checkout -b feat/custom-ui-cms` (already created; verify). Commit docs first.
2. Read `node_modules/next/dist/docs/` for the installed Next version. Read the stuyaviators repo pieces listed in [09](09-reference-stuyaviators.md).
3. Convert to a **pnpm workspace**:
   ```
   /
     apps/web        hub (jerryqiu.com) + music + flying sites via host routing (:3000)
                     (moved from current root: src/, public/, next.config.mjs)
     apps/photos     photography site (photos.jerryqiu.com) (:3002). Phase 1: public portfolio
     apps/docs       docs site for the UI package (:3001)
     packages/sites  site registry (hostnames, nav, theme presets, cross-site links)
     packages/ui     the library (placeholder name)
     packages/config shared tsconfig, lint config
     scripts/        make-sequence.ts, optimize-images.ts, rename-package.ts
     docs/project/   these planning docs (stay at repo root)
   ```
   Do the move in small commits so history stays readable (`git mv`). The site must still build at every commit.
4. Dev scripts: `pnpm dev` starts `apps/web` on **:3000** (the live view), `apps/docs` on :3001 and `apps/photos` on :3002. Add `pnpm dev:web`, `pnpm dev:photos`, `pnpm dev:docs`, `pnpm build`, `pnpm test`, `pnpm lint`, `pnpm typecheck`.
5. **Live progress page.** Add a dev-only route in `apps/web` at `/_progress` (return 404 in production) that renders [PROGRESS.md](PROGRESS.md), links to every site (hub, `/music`, `/flying`, photos on :3002, docs on :3001), and a gallery of the components built so far, with auto-refresh via `fs.watch` + SSE or `router.refresh()` polling. The owner watches `localhost:3000/_progress` while Claude works. Keep it simple and pretty (it is the first customer of the UI package).
6. Tooling: Biome is already present in the portfolio. stuyaviators uses Prettier + xo. **Pick one** (default: keep Biome since it exists here; one tool for lint and format), record it in [01](01-decisions-and-assumptions.md).

## 1.1 Audit what exists

Produce `docs/project/audit-once-ui.md`:
- Every Once UI component and prop currently used (`Column`, `Row`, `Grid`, `Heading`, `Text`, `Media`, `Button`, etc.) and where.
- The tokens in `src/resources/once-ui.config.ts` and `custom.css`.
- Every page and its content source (`src/resources/content.tsx`, MDX files).
- Features to keep: blog (MDX + RSS), work/projects, gallery, about, route guard/password pages (`/api/authenticate`, `RouteGuard`), OG image generation, sitemap/robots, Mailchimp component, theme toggle.
- Decide for each: port, redesign, or drop.

## 1.2 Design language

First do the **design exploration** in [10](10-design-brief.md) (three directions on a dev-only `/_design` page, pick one with reasons, keep the others as presets), and study Squarespace-grade patterns. Then write `docs/project/design-language.md` and implement it as tokens in `packages/ui`:

- **Color:** neutral scale, one accent, semantic (danger/success/warn), light and dark themes, plus a "cinema" surface (pure black) for galleries. Do **not** start from the StuyAviators values. Use the winner of the `/_design` exploration ([10](10-design-brief.md)); a token *structure* like `--bg --surface --text --muted --accent --hairline --shadow` is fine, the values and look are new. Define per-site theme presets (hub, photos, music, flying) as data in `packages/sites`. Check contrast (AA) in both themes.
- **Type:** one variable sans (self-hosted via `next/font`, e.g. Inter Tight / Inter / Geist, whichever the license and look favor) plus optional serif for captions. A fluid scale (`clamp`) from caption up to a display size around 8-12vw. Tight letter-spacing on big type, as Apple does.
- **Space and layout:** 4px base, container widths, a 12-col grid, full-bleed utilities, safe areas.
- **Radius, elevation, borders, glass** (backdrop blur surfaces with a solid fallback).
- **Motion tokens:** durations, easing curves (a signature `ease-out-expo`-like curve and a spring), stagger, distance. One source of truth for JS and CSS.
- **Theming API:** all tokens are CSS variables under a prefix (`--ph-*`), switch by `[data-theme]`, respect `prefers-color-scheme`, no flash on load.

## 1.3 The UI package (`packages/ui`)

**Authoring:** TypeScript, React 19, Tailwind v4 compiled to `dist/styles.css`, tokens as CSS variables. `"use client"` only where needed. Build with `tsup` or `tsdown`. ESM + types. **Subpath exports** so apps only pull what they use:

```
@placeholder/ui            primitives, layout, typography, forms, overlays, navigation
@placeholder/ui/motion     scroll and animation components
@placeholder/ui/media      image, gallery, lightbox, sequence, protection components
@placeholder/ui/webgl      optional WebGL hero (lazy, ogl)
@placeholder/ui/styles.css compiled stylesheet and tokens
@placeholder/ui/tokens     JS token export
```

`sideEffects` flags correct, tree-shakeable, no runtime CSS-in-JS.

**Components** (build in this order; each gets a docs page, a11y notes, tests):

1. *Foundations:* `ThemeProvider`, `Box/Stack/Row/Grid/Container`, `Text`, `Heading`, `Link`, `Icon` (lucide), `VisuallyHidden`, `Separator`.
2. *Actions and forms:* `Button`, `IconButton`, `Input`, `Textarea`, `Select`, `Checkbox`, `Radio`, `Switch`, `Slider`, `Field` (label/hint/error), `Form` helpers. Build on headless primitives (Radix UI or React Aria; pick one, justify it; default Radix for the surface area).
3. *Feedback and overlay:* `Dialog`, `Sheet/Drawer`, `Popover`, `Tooltip`, `Toast`, `Menu/Dropdown`, `Tabs`, `Accordion`, `Spinner`, `Skeleton`, `Badge`, `Progress`.
4. *Navigation:* `Header` (transparent to glass on scroll), `MobileSheetNav`, `Footer`, `Breadcrumbs`, `Pagination`, `TableOfContents`, `SkipLink`.
5. *Content:* `Card`, `Prose` (typography for MDX/markdown), `CodeBlock`, `Table`, `Avatar`, `Stat`, `Quote`/testimonial, `Timeline`.
5b. *Profile and sites:* `ProfileHeader` (portrait, name, headline, location, "currently", links), `SocialLinks` (icon + label, `rel="me"`), `SkillTags`, `ExperienceItem`/`TimelineEntry`, `SiteSwitcher` (header control listing all sites from the registry), `MoreFromMe` footer row, `SitePreviewCard`, `InterestHero`, `EmbedFacade` (click-to-load Spotify/SoundCloud/YouTube/Bandcamp), `AudioPlayer` (self-hosted clips), `ResumeButton`. These are generic and themeable; none may contain Jerry-specific content (that comes from `apps`).
6. *Motion* (`/motion`): port from stuyaviators and polish: `InView`, `RevealText`, `Parallax`, `PinnedScene` (+ `useSceneProgress`), `StackingCards`, `TiltCard`, `HorizontalShowcase`, `StepSequence`, `CountUp`, `ScrollHighlight`, `MagneticButton`, `SmoothScroll` (Lenis), `PageTransition` (View Transitions API with fallback), `Marquee`, `CursorFollower` (desktop only).
7. *Media* (`/media`): `Image` (wraps `next/image`-like behavior but framework-agnostic: blur placeholder, dominant color, srcset), `Gallery` (masonry + justified), `Lightbox` (keyboard, swipe, zoom, EXIF caption), `BeforeAfter` slider, `ImageSequence` (canvas, scroll-scrubbed, progressive load, poster fallback), `VideoBackground`, `ProtectedImage` stub (the real implementation lands in Phase 2; define the interface now).
8. *WebGL* (`/webgl`): `ShaderHero` (e.g. a soft, interactive light-leak / chromatic-aberration / displacement effect over a hero photo that reacts to pointer and scroll). Lazy-load, pause when off-screen, cap DPR, falls back to the static photo on no-WebGL, reduced motion, and low-power devices.

**Quality gates for each component:** keyboard + screen reader behavior documented and tested; works in light/dark; responsive at 320px; no layout shift; unit tests; docs page with live example, props table, accessibility section, and "when not to use".

**Performance rules:** total JS for home page route <= about 180 KB gzipped (excluding images/frames). WebGL and sequence code split. Respect `prefers-reduced-motion`, `prefers-reduced-data`, and `Save-Data`.

## 1.4 Documentation and open-source hygiene

In `apps/docs` (Next + MDX, built with the package):
- Getting started (install, Tailwind-free usage, Next.js usage, Vite usage), theming guide, design principles, motion guide (including "how to make an image sequence"), accessibility guide, recipes, changelog, contribution guide.
- One page per component with live preview and copyable code.
- A search box (local, e.g. `flexsearch`, no paid service).

At repo root for the package: `README.md` (badge row, screenshot/GIF, 30-second quickstart), `LICENSE` (MIT), `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md` (Contributor Covenant), `SECURITY.md`, `CHANGELOG.md` (Changesets), issue and PR templates, `.github/workflows/ci.yml` (lint, typecheck, test, build on PR; **do not add publish or deploy jobs that run automatically**). `package.json` metadata complete (`exports`, `types`, `files`, `repository` placeholder, `keywords`).

**Do not publish to npm.** Add `docs/project/PUBLISHING.md` explaining the exact steps for the owner. Make sure no personal photos, keys, or private data are inside `packages/ui` or its docs (use CC0/placeholder imagery, or generated gradients, for demos).

## 1.5 Rebuild the site (`apps/web`)

Migrate route by route, replacing Once UI with the new package. Keep old URLs working with redirects. Information architecture, the profile concept, per-site specifics and the **tone guide** are in [10](10-design-brief.md): read it before building pages. Tone: first person, plain, specific, non-boastful. Never invent biography, credentials, hours, awards or quotes: reuse real existing content (blog posts, project MDX, the about/social data in `src/resources/content.tsx`) and use `TODO(owner):` placeholders for the rest.

**Hub (`apps/web`, jerryqiu.com):**
- **Home (profile-forward):** a profile header (portrait, name, headline, location, "currently", social links), a short intro, a cinematic opening (WebGL or image-sequence hero where the name/tagline resolves as it plays), a pinned scene that introduces who he is in 3-4 beats, **preview cards** for Photography / Music / Flying linking to their subdomains, selected work (stacking cards or horizontal showcase), a "now" strip, latest writing, closing Connect CTA. Striking in the first 3 seconds and still fast.
- **About:** the longer story with a restrained parallax portrait, a profile-style timeline (work, school, leadership, flying, music), education, skills & interests, resume download.
- **Work / `work/[slug]`:** grid with hover-tilt cards, filter by type (photography, software, other), project pages with full-bleed intro, credits, next/previous.
- **Writing (`/writing`, was Blog):** index with featured post, post pages with `Prose`, reading progress, share, RSS (`/api/rss`), OG images (reuse the generator). `/blog` redirects.
- **Connect (`/connect`):** all social/account links in a tidy grid, the contact form (honeypot + rate-limit placeholder; storage comes in Phase 2; mailto fallback), email. `/contact` redirects.
- **Legal and utility** ([11](11-legal-and-compliance.md)): `/privacy`, `/terms`, `/licensing`, `/accessibility`, `security.txt`, 404 (with links home), sitemap, robots, favicon/manifest, OG, theme toggle, cookieless analytics only.
- **Keep:** the password/route-guard mechanism, ported to the new UI (replaced by real auth in Phase 2).

**Music (`/music` in dev, music.jerryqiu.com in prod) and Flying (`/flying`, flying.jerryqiu.com):** built on the shared interest-site template (hero, intro, highlights, timeline, media) with their own theme presets and the site switcher. Music: story, instruments, click-to-load recordings/performances, repertoire. Flying: journey in plain terms, milestones/flight log with photos, aircraft, StuyAviators connection. Host routing via `proxy.ts` ([01](01-decisions-and-assumptions.md) A33; verify Next 16 docs). Facts are placeholders until supplied; production hides empty fields.

**Photography (`apps/photos`, photos.jerryqiu.com):** the existing photography content moves here: cinematic portfolio home, curated galleries with lightbox and category tabs (static from the repo in Phase 1), about the photographer, book/inquiry (form + mailto), a "Client galleries" button pointing at the current ShootProof URL via env (placeholder). The hub's `/gallery` redirects to the photos site (in dev, to `localhost:3002`).

**All sites:** shared header with site switcher, shared footer with "More from me", shared legal links to the hub's canonical pages, one UI package, per-site theme presets, host-aware sitemap/robots/OG.

Move all hard-coded copy into typed content modules (`apps/*/src/content/*`), so Phase 2 can swap the source to the database.

**Images:** run `sharp` over `public/` (59 images, 84 MB; photography images move to `apps/photos/public`) to produce responsive AVIF/WebP sets, blur placeholders and dominant colors (script `scripts/optimize-images.ts`, modeled on stuyaviators). Keep originals out of git if they exceed reason: **do not delete the owner's images**; move originals to a git-ignored `originals/` folder only if the owner asked. Default: keep files in place and add derivatives alongside.

**Sequence assets:** implement `scripts/make-sequence.ts` (ffmpeg if available, else sharp-only crossfade/zoom of stills). Ship a placeholder sequence of 60-120 frames at about 1280px wide, WebP, under about 6 MB total, and a README on swapping in real footage.

## 1.6 Acceptance criteria

- `pnpm install && pnpm build && pnpm test && pnpm lint && pnpm typecheck` all pass from a clean clone.
- `grep -r "once-ui" apps packages` finds nothing except in historical docs. `@once-ui-system/core` is removed from dependencies.
- Lighthouse (mobile, throttled) on `/`: Performance >= 90, Accessibility >= 95, Best Practices >= 95, SEO >= 95. Record results in PROGRESS.md.
- axe: zero serious/critical violations on every page. Keyboard-only walkthrough of every page works.
- `prefers-reduced-motion: reduce` shows a complete, static, attractive site (verify with Playwright).
- Side-by-side screenshot of the new hub home and the StuyAviators home: they must not be mistakable ([10](10-design-brief.md)).
- Legal checklist in [11](11-legal-and-compliance.md) (Phase 1 items) satisfied.
- Playwright smoke tests for every route of every site in light and dark at 390px and 1440px; screenshots saved to `docs/project/screenshots/phase-1/` for the owner to review.
- Docs site builds; every exported component has a docs page. Component test coverage is meaningful (not just "renders").
- Package builds to `dist/`, `npm pack --dry-run` shows only intended files; an example Vite app in `examples/vite` consumes the packed tarball successfully (proves it's not coupled to Next).
- Placeholder name appears **only** via the single config + rename script (test the rename script on a scratch copy).
- PROGRESS.md and `docs/project/PHASE-1-SUMMARY.md` written (what was built, decisions, known gaps, how to run, screenshots).

## 1.7 Suggested milestone order

M1 workspace (hub, photos, docs) + `/_progress` live page. M2 audit + design exploration (`/_design`) + design language + tokens. M3 foundations/forms/overlay components + docs site skeleton. M4 motion + media components. M5 WebGL hero + image sequence. M6 hub home rebuilt (the showpiece; commit screenshots). M7 remaining hub pages + legal pages migrated, Once UI removed. M7b photography site (`apps/photos`) and the music and flying sites on the interest template, host routing, site switcher. M8 optimization, a11y, tests, docs completeness, open-source hygiene. M9 acceptance run and summary. Then Phase 2.
