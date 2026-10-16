# Phase 2.5 summary: the split, Halation UI, four worlds, local mocks

Branch `feat/custom-ui-cms`, 2026-10-12. Nothing is pushed, merged, deployed or published. Written by the lead designer/engineer; direction in [12-vision-v2.md](12-vision-v2.md), reasoning in [redesign-brief.md](redesign-brief.md), reference in [design-language.md](design-language.md).

## What changed

| Area | Result |
|---|---|
| **R0 Brief** | `redesign-brief.md`: audit of the old build, research notes, the Flow system (curves, springs, reveal grammar, transitions, cursor, index control, tiers), concept sheets and storyboards for the four worlds, the hub's first-15-seconds test, type and colour with licences, name shortlist, licence options, candid comparison with Once UI and other kits. `SELLING.md` checklist. |
| **R1 Split** | Project case studies live on the photography site (`/work`, `/work/[slug]`, `/video`); hub `/work*` 301s there (config + seeded redirect rows); admin Projects sit under Photography and write `site: "photos"`; migration `0001_projects_to_photos`; shared `@jerryqiu/render` (Markdown, MDX, blocks). The cross-site rule is built into the shell and tested: photography, music and flying carry only the `jerryqiu.com` return button. |
| **R2 System** | **Halation UI** (`@halation/ui`, prefix `hl`): tokens (Night, Day, Cinema), four OFL type roles, own fluid solver on `ogl` with streak and halation passes, `StageProvider`, `Scene`, `IndexControl`, `Condense`/`Streak`/`Settle`, `Threshold`, quality tiers with a governor, view-transition CSS, ink rendering on light themes. Superseded Phase 1 chrome and motion removed. 11 stage exports documented in `apps/docs`; 33 new unit tests (tiers, store, stage components). |
| **R3 Homes** | Hub (Ignition, Proof, statements, three rooms as thresholds with depth, featured post + list, Say hello.), Photography (Aperture iris scene, categories, projects, video, booking), Music (spotlight stage), Flying (ascent with altimeter and heading). None has a navbar; index control, skip link, landmarks. Static tier verified with no JS, reduced motion and the Calm switch. |
| **R4 Inner pages** | Quiet header + index shell on every inner page of the four sites and the admin (inherits tokens). |
| **R5 Mocks** | `@jerryqiu/mocks` + UIs: studio (7 sections), client portal (passcode, on-screen magic link, favourites, e-sign, pay), score store (catalogue, watermarked preview, cart, checkout, library, placeholder download; listen and score separate), flight map (Natural Earth outline, own projection, keyboard, accessible table) and a hidden instruction slot. Labelled `MOCK`, disabled in production builds. |
| **R6 Gates** | See below. |
| **R7 Docs** | README, AGENTS, owner guide, DEPLOYMENT, SELLING/PUBLISHING, QUESTIONS (Q40 to Q50), PHASE-3-KICKOFF (mock to real table), status notes in 00/01/05/10/11/12. |

## Verification (final run)

`pnpm lint` and `pnpm typecheck` clean. `pnpm test` (unit): protect 14, storage 7, db 16, ui 82, sites 5, docs 4, auth 22, inbox 7, media 26, web 14, shootproof 16, mocks 19 (232 in total). `pnpm test:e2e` (production builds): **207 passed** (every route x light/dark x 390/1440 with axe, keyboard and index control, no-JS and reduced-motion static tiers for all four homes, the Calm switch, the cross-site rule on every photography/music/flying route, hub `/work` 301s, every mock route is a 404 in production). `pnpm test:admin` (dev servers, throwaway database): **50 passed** (admin flows plus the clickable mock flows: studio to paid invoice, client portal, score purchase and download, flight map). `scripts/test-rename.sh` passes with the new name.

## Lighthouse (mobile, simulated throttling, production build, no GPU)

| Page | Performance | Accessibility | Best practices | SEO | LCP | TBT | CLS |
|---|---|---|---|---|---|---|---|
| Hub `/` | 87 | 100 | 96 | 100 | 4.1 s | 20 ms | 0 |
| Photography `/` | 86 | 100 | 96 | 100 | 4.2 s | 10 ms | 0 |
| Music `/music` | 89 | 100 | 96 | 100 | 3.8 s | 20 ms | 0 |
| Flying `/flying` | 89 | 100 | 96 | 100 | 3.8 s | 20 ms | 0 |
| Post `/writing/day-one` | 83 | 100 | 96 | 100 | 4.8 s | 30 ms | 0 |
| Work `/work/stuy-sing-26` | 81 | 100 | 96 | 100 | 5.2 s | 30 ms | 0 |
| Gallery `/portfolio/theater` | 91 | 100 | 96 | 100 | 3.5 s | 20 ms | 0 |

Targets: performance 90 or better, the other three 95 or better. Accessibility, best practices and SEO meet them everywhere; **performance meets the target on one page of seven**. FCP is 0.9 s everywhere, TBT is at most 30 ms and CLS is 0, so the gap is LCP under Lighthouse's simulated slow-4G transfer (the post and the work page are image LCPs of 1.9 MB and 0.7 MB pages). Measured without a GPU: in a software-GL browser the stage correctly stays on the static tier. Found and fixed during the run: a streak bar animating `left` (CLS 0.17 to 0), software GL stalling the main thread (TBT 28 s to 20 ms), a late font swap re-measuring the headline.

## Screenshots

[screenshots/phase-2.5/](screenshots/phase-2.5/): every home at 1440 and 390 (dark) and 1440 (light), plus the hub statement scene. Before-state: [screenshots/r0/](screenshots/r0/).

## Honest gaps

- **The GPU stage was only ever run on software GL** (SwiftShader in headless Chromium). It looks right there, but frame rate, thermal behaviour and the tier thresholds (24 ms probe limit, 28 ms governor limit) are untested on real phones and laptops. The code treats software GL as "no GPU" (static tier) unless the visitor chooses Full; the runtime governor exists but has not been tuned on hardware. Do a device pass before launch.
- **The 15-second probe from the brief** (rendering 45 frames offscreen before committing to the full tier) is not built; the governor and the capability signals do the job. Logged here rather than faked.
- **Lighthouse performance is below 90 on some pages** (see table). The measured cause is simulated slow-4G transfer of fonts, CSS and chunks, not main-thread work (TBT is under 100 ms, CLS is 0). Levers not yet pulled: trimming the five font files, splitting the hub CSS, and `font-display: optional` (applied, Q50).
- **Copy is draft.** Every line is first-person from real repo facts and marked `TODO(owner)`; the instrument you play, the college, prices and repertoire are unknown and not claimed (Q42).
- **View transitions** are progressive enhancement (cross-document `@view-transition`); cross-origin hops use the exit animation then a normal navigation. Browser support was checked only from non-authoritative articles plus Chromium.
- **Mocks are single-browser.** State lives in localStorage; the studio and client views share one browser only in this phase. Real multi-user behaviour is Phase 3.
- **Photography `/privacy` is a short draft** and music/flying have no legal pages of their own yet (Q45, Q13).
- **Fonts** are verified OFL 1.1 and shipped with licence texts, but a custom typeface (Q44) is the owner's call.
- **Licence and name** are defaults, not decisions (Q32, Q33); trademark and npm-org checks are the owner's.
