# Phase 1 summary

Date: 2026-10-12. Branch `feat/custom-ui-cms`. Nothing was pushed, merged, deployed or published.

## What was built

- **Monorepo (pnpm workspace):** `apps/web` (hub + music + flying, :3000), `apps/photos` (:3002), `apps/docs` (:3001), `packages/ui` (the old UI kit), `packages/sites` (site registry, shared chrome, contact form), `packages/config`.
- **UI package (88 exported components):** layout, typography, forms (Radix), overlays, navigation (site switcher, header, footer with "More from me"), profile and site components, motion layer (reveals, parallax, pinned scenes, step sequence, stacking cards, horizontal showcase, tilt, magnetic, Lenis, marquee), media (responsive `Image`, justified/masonry `Gallery`, `Lightbox`, `BeforeAfter`, scroll-scrubbed `ImageSequence`, `VideoBackground`, `ProtectedImage` stub), WebGL (`ShaderHero`, `ShaderLayer`: the pointer-reactive glitch). Plain CSS with old-kit tokens tokens, light/dark and four site presets.
- **Docs site:** a page for every component (live example, props, accessibility, when not to use), plus guides. A test fails if an export is undocumented.
- **Sites:**
  - Hub `jerryqiu.com`: type-first hero with a glitch photograph band, profile row, scroll-highlight intro, pinned scene with image sequence, previews of the other sites, horizontal showcase of real projects, writing, closing CTA; /about, /work (+ project pages with lightbox), /writing (+ RSS), /connect, legal pages, `security.txt`, robots (AI crawler opt-out), sitemap, redirects.
  - Photography: full-bleed cinematic home, justified gallery with hover glitch, colour-vs-monochrome compare slider, subject pages, book/inquiry, client page (ShootProof URL via env).
  - Music and flying: shared interest template; only real facts shown, everything else is dev-only `TODO(owner)` and hidden in production.
  - Host routing in `apps/web/src/proxy.ts` (music./flying. rewrite, production redirects).
- **Quality tooling:** Vitest unit tests (UI 38, registry 5, docs coverage 4), Playwright e2e (every route of every site x light/dark x 390/1440 with axe, console-error and overflow checks, keyboard, reduced motion, mobile menu; 149 tests), Biome, Lighthouse script, image optimizer, sequence maker, contrast checker, rename script, licenses script, packed-tarball Vite example.
- **Open-source hygiene:** MIT `LICENSE`, README, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, Changesets, issue/PR templates, CI (verify only, no publish/deploy), `THIRD_PARTY_LICENSES.md` (no copyleft), (an earlier brief, removed), working `dist` build that keeps `"use client"` boundaries.

## Decisions made along the way (also in QUESTIONS.md)

- **Design:** the first pass (warm paper + serif) was rejected by the owner. Final direction: Instrument Sans (+ DM Mono) on neutral grayscale with small red/blue/green/yellow dashes, one accent per site, square-edged shapes. It deliberately avoids both Once UI's look (Geist, round pills) and the StuyAviators look (compared in `screenshots/phase-1/compare/`; the hub hero was redesigned after the comparison because both were full-bleed photo + white sans).
- Handwritten CSS instead of compiled Tailwind (A4 changed); route groups `(site)`, `(music)`, `(flying)` each with their own root layout; shared chrome in `packages/sites`; Lenis, `ogl`, Radix kept; Radix popover replaced by a plain disclosure in the header, mobile sheet lazy-loaded.
- Ports: web 3000, docs 3001 (3101 when the StuyAviators dev server holds 3001), photos 3002.

## Acceptance criteria

| Criterion | Result |
|---|---|
| `install && build && test && lint && typecheck` from a clean clone | Pass (fresh `git clone`, `pnpm install --frozen-lockfile`, build, test, lint, typecheck, run on the final Phase 1 commit) |
| No `once-ui` in apps/packages; dependency removed | Pass |
| Lighthouse mobile (throttled), perf / a11y / best-practices / SEO | Hub `/` 94 / 100 / 96 / 100; `/about` 98 / 100 / 96 / 100; project page 93 / 100 / 96 / 100; photos `/` 95 / 100 / 96 / 100; photos `/portfolio` 91 / 100 / 96 / 100; `/flying` 96 / 100 / 96 / 100 |
| axe: zero serious/critical on every page | Pass (142 route x theme x width runs) |
| Keyboard walkthrough | Pass (skip link, focus visibility, switcher, mobile menu, lightbox tested) |
| Reduced motion: complete static site | Pass (3 sites tested; found and fixed a real bug in the process) |
| Not-a-StuyAviators-lookalike side by side | Pass after redesigning the hub hero (`screenshots/phase-1/compare/`) |
| Legal checklist (11) Phase 1 items | Pass: privacy, terms, licensing, accessibility, security.txt, robots + AI policy, no non-essential cookies, third-party licenses, contact-form consent line. Image-record flags and the admin delete tool are Phase 2. |
| Screenshots | `docs/project/screenshots/phase-1/` (138 images) |
| Docs: every export documented | Pass (88/88, enforced by test) |
| Package builds; `pack` shows only intended files; Vite example consumes the tarball | Pass |
| Rename script tested on a scratch copy | Pass (`scripts/test-rename.sh`) |

## Known gaps (honest list)

- **JS size:** the hub home route ships about 284 KB gzipped of JavaScript. About 156 KB of that is the React 19 + Next 16 framework baseline; our share is about 110 KB (Radix ~49, motion ~50, Lenis ~8). That is above the 180 KB target. Cheap next steps: `LazyMotion` with `m` components (about -20 KB), loading Lenis only on pointer-fine devices, and dropping Radix from `Lightbox`. Lighthouse performance still passes.
- The music and flying sites are mostly structure; the owner supplies facts (Q11, Q22). Photograph alt text is generic (Q20). Comparison slider shows colour vs monochrome, not real unedited vs edited pairs (needs the owner's unedited files).
- The placeholder hero sequence is built from stills (no ffmpeg on this machine, no footage supplied, Q2).
- Local `.next` production servers can go stale when rebuilt under a running server; the e2e config reuses running servers, so kill ports 4000-4002 before re-running.
- The Next dev indicator, Vercel analytics 404s and similar dev-only console noise are not present in production builds.
- Legal text is a draft; entity, address and governing law are placeholders (Q13). No legal advice is given.

## How to run

```bash
pnpm install
pnpm dev                 # hub :3000 (/_progress, /_design), docs :3001, photos :3002
pnpm build && pnpm test && pnpm lint && pnpm typecheck
pnpm test:e2e            # builds with test URLs, then Playwright + axe
node scripts/lighthouse.mjs http://localhost:4000/   # against `next start`
```
