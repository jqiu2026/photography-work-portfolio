# Design language (v2: Flow)

Authoritative direction: [12-vision-v2.md](12-vision-v2.md). Full reasoning, storyboards and research: [redesign-brief.md](redesign-brief.md). This file is the compact reference for building; update it with a dated note when a decision changes. The v1 language is archived in [design-language-v1-archive.md](design-language-v1-archive.md).

**Library name:** Halation UI (default, Q33). CSS prefix `hl-`, custom properties `--hl-*`. Original: nothing derived from Once UI, shadcn/Radix Themes, Chakra, MUI, Tailwind UI, Geist, Apple or Stripe (comparison in the brief, section 8).

## Principles
1. Nothing cuts: content condenses out of the stage and dissolves back into it.
2. Light is the material: hierarchy by luminance, scale and depth; edges are light, not borders.
3. One physics: one easing family, one spring, one reveal grammar, one cursor.
4. Content first, stage behind: the DOM is complete without JS or WebGL.
5. Photographs are never filtered by effects.
6. Accessible and resilient: WCAG 2.2 AA, keyboard, reduced motion = a complete static page.

## Colour (hex; contrast against the field; AA verified 2026-10-12)
| Token | Night | Day |
|---|---|---|
| field | `#07080c` | `#f3f1ec` |
| surface | `#0e1118` | `#e9e6df` |
| ink | `#eceff5` (17.4) | `#0b0d12` (17.2) |
| dim | `#a2a9ba` (8.5) | `#545a68` (6.1) |
| blue (hub) | `#6f9bff` (7.4) | `#1d48c9` (6.6) |
| red (photography) | `#ff6a5e` (7.1) | `#b3251e` (5.8) |
| amber (music) | `#ffcb47` (13.2) | `#7a5c00` (5.5) |
| green (flying) | `#4fe0a0` (11.9) | `#0a6b46` (5.8) |
Third theme **Cinema** (pure black) for photograph pages. Accents are signature light (streaks, halation, edges, focus), never large paint. Halation tint: accent 70% + `#ff5a3c`.

## Type (SIL OFL 1.1; licence files to verify in R2, Q41)
Display **Anybody** (width 90 to 130, weight 300 to 600; width stretches with scroll velocity); text **Hanken Grotesk**; voice and journal **Newsreader**; data **Martian Mono** (tabular). Scale: fluid, 1.25 ratio, display clamp(3rem, 9vw, 9rem). Reveals split by words, never characters.

## Motion (Flow)
Easing: glide `cubic-bezier(.22,1,.36,1)` (arrivals), pour `cubic-bezier(.65,0,.35,1)` (transitions), drain `cubic-bezier(.5,0,.9,.4)` (exits). Durations: blink 120, short 280, medium 640, long 1100, scene 1600 ms. Springs: settle (k120 c22 m1, no overshoot), droplet (k220 c18, one soft overshoot, magnetic and index button only). Stagger 60 ms per line, 24 ms per word. Reveals: Condense, Streak, Settle. Transitions: the Pour (page to page), the Threshold (frame to world). Cursor: native cursor kept, light-streak trail, fluid force, magnetic on primary calls to action only. Details and timelines: brief section 3.

## Layout and shape
Fluid 12-column grid, wide margins, generous vertical rhythm in `vh`. Frames are outlined by light with aperture-like superellipse corners (radius scale 0, 6, 14, 28 px plus `full`), not uniform cards. No navbar anywhere on homes: floating index control (scroll-progress ring, aperture glyph, theme toggle), skip link, hidden table-of-contents landmark.

## Stage and tiers
One fixed canvas behind the DOM (ogl): field shader, fluid dye, light streaks, halation, grain. Tiers full / reduced / static chosen by reduced-motion, Save-Data, connection, WebGL2, user "Calm" choice, battery, memory/cores, a frame probe, then a runtime governor. `data-hl-tier` on `<html>`. Static tier is complete and beautiful (posters, CSS only).

## Worlds
Hub (blue; corridor of thresholds), Photography (red; Aperture: scroll is the iris), Music (amber; stage and spotlight / typographic score / listening room), Flying (green; ascent, instruments, flight paths). Storyboards and wording samples in the brief, section 4.

## Components (vocabulary)
Stage, Scene, Threshold, Index, Streak, Halo, Condense, Iris, Altimeter, ContactSheet, plus core primitives (Button, Field, Dialog, Menu, Tabs, Toast, Table) and the protected-image set (ProtectedImage, ProtectedGallery, ScreenshotGuard) with unchanged semantics ([05](05-security-and-image-protection.md)).

## Sound
None by default, never autoplay; the listening room plays on press with a visible stop.

## Voice
First person, Jerry's own, short and specific; no buzzwords or superlatives; real facts only; every draft marked `TODO(owner): rewrite in your voice`.
