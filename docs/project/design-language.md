> **2026-10-12 (later), owner direction, supersedes everything below and the earlier note:** all four sites (hub, photos, music, flying) get one shared, navbar-less, scroll-driven "scene" experience built on a brand-new UI system designed from scratch (original, sellable, not derived from Once UI or any kit), with each site a distinct world on the same grammar. The photography site keeps its cinematic character but must get cooler. The designer's work is documented in `redesign-brief.md` (created in Phase 2.5, see `HANDOFF.md`); this file is rewritten there. Until then the tokens described below are the live ones.

# Design language

> **2026-10-12, owner direction (supersedes the A/B/C pick below):** the first pass (warm paper, serif display) was rejected as ugly. The identity is now **a modern minimalist sans (Geist, tight tracking, one family plus Geist Mono) on a truly neutral grayscale palette, with small dashes of blue, red, green and yellow**. Each site carries one accent (hub blue, photos red, music yellow, flying green) used sparingly: eyebrow marks, status dots, the "More from me" dots, links, focus rings, and the yellow text selection. Buttons and surfaces stay black/white/gray. The exploration below is kept for the record (it is still on `/_design`); the live tokens are in `packages/ui/src/styles/themes.css`.


Decided at M2 from the `/_design` exploration (screenshots in `screenshots/m1/design.png`). Logged as Q3/Q12 in [QUESTIONS.md](QUESTIONS.md).

## The three directions tested

| | A Gallery white | B Midnight cinema | C Soft neutral |
|---|---|---|---|
| Surface | warm paper `#f5f2ec`, dark `#151412` | near-black `#07080a`, light `#f4f6f8` | stone `#e9e6df`, dark `#1b1a18` |
| Display / text | Instrument Serif / Inter Tight | Geist (tight, huge) / Geist Mono | Newsreader light / Geist, mono captions |
| Accent | clay `#8a4b2a` (dark `#d49a74`) | cool blue `#2457c5` (dark `#8ab6ff`) | sage `#4a5a43` (dark `#a9bd9f`) |
| Shape | pill buttons, 14px radius | 10px buttons, 6px radius | 4px buttons, 2px radius |

All six palettes pass WCAG AA (`scripts/contrast.mjs`): body text 12.9 to 18.0, muted text 5.4 to 6.6, accent 5.9 to 9.8.

## Scoring against the priorities (10-design-brief.md)

| Priority | A | B | C |
|---|---|---|---|
| 1 Professional, elegant | **5**: editorial serif reads as a studio-made personal site | 4: elegant but closer to a product/tech site | 4: refined, slightly austere |
| 2 Modern, minimalist, sleek | 4 | **5** | 3 |
| 3 Intuitive | 5 | 5 | 4 (low-weight serif is less scannable) |
| 4 Legal (readable, accessible) | 5 | 5 | 5 |
| 5 Cinematic, a bit futuristic | 3 (needs motion to carry it) | **5** | 3 |
| Photo neutrality | 4: warm paper flatters most photos; saturated stage photos pop | **5** | 4 |
| Not StuyAviators | 5 (warm, serif, editorial: opposite of bright blue cards) | 4 | 5 |

## Decision

- **Hub (`jerryqiu.com`): A, Gallery white.** The hub is about a whole person and is read, not just looked at. A warm paper surface and a serif display give it warmth and a clear identity that is the opposite of StuyAviators (bright, blue, card-heavy, sans). Dark mode is a warm charcoal, not pure black.
- **Photography (`photos.`): B, Midnight cinema** as a preset. Photographs need a neutral, near-black surround and the UI should disappear. Light mode exists but cinema black is the default.
- **Music: C, Soft neutral** as a preset (warm, textural, printed feel).
- **Flying: B light/cool** variant with the blue accent (airy, precise) on the hub's sans display, so it never reuses the StuyAviators look.
- Because layout, components, motion and legal pages are shared, the families feel like one house with different rooms. Presets are data in `packages/sites` and tokens in `packages/ui/src/themes.css`; the owner switches by changing a preset name.

Fonts (all SIL OFL, via `next/font/google`, self-hosted at build): Instrument Serif, Inter Tight, Geist, Geist Mono, Newsreader.

## Principles distilled from Squarespace-grade sites and Apple product pages

Notes are patterns from general familiarity with their public sites and templates; no assets, text or layouts are copied. (I did not browse them live in this unattended run; revisit with the owner if specific pages are wanted.)

- Editorial typography: one large display size, small tracking-tight headlines, small tasteful captions, 60 to 75ch reading measure.
- Imagery gets air: full-bleed sections alternate with narrow text columns; consistent vertical rhythm (8px base, section padding 96 to 160px on desktop).
- Very quiet header: wordmark left, 3 to 5 links, one emphasized action. Glass only after scroll.
- Slow, graceful hovers (200 to 400ms), underline links, hairline borders, almost no shadows.
- Motion (Apple-style) is a layer on top, used for 2 to 3 moments on the home page: a hero reveal, one pinned scene, and gentle parallax. Everything else is calm. `prefers-reduced-motion` gives a complete static page.
- Color restraint: neutrals plus a single accent; photos are the color.

## Token structure (`--ph-*`)

Surfaces `--ph-bg --ph-surface --ph-surface-2`, text `--ph-text --ph-muted`, `--ph-line` hairline, `--ph-accent`, `--ph-accent-contrast`, `--ph-cinema` (pure black gallery surface), semantic `--ph-danger --ph-success --ph-warn`. Type `--ph-font-display --ph-font-sans --ph-font-mono` and a fluid scale `--ph-text-xs` to `--ph-text-display`. Space on a 4px base `--ph-space-1..32`. Radius `--ph-radius-sm/md/lg/pill`. Motion: `--ph-ease` (cubic-bezier(.16,1,.3,1)), `--ph-ease-inout`, durations `--ph-dur-fast/base/slow`. Themes switch with `[data-theme="light|dark"]` and `[data-preset="hub|photos|music|flying"]`; no flash on load (inline init script).
