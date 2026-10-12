# Halation UI

An immersive, scroll-driven design system for React. Named after halation: the glow that bleeds around bright light in film.

> Status: in development inside a private monorepo. Name is the owner's default (Q33), licence is undecided (Q32). Nothing here is published or for sale yet; see `docs/project/SELLING.md`.

## What makes it different

- **One stage.** A persistent canvas behind the DOM (fluid simulation, light streaks, halation) driven by scroll and pointer, with scenes that tell the stage their palette. All content is real DOM; the stage is decoration.
- **Flow.** One motion language: three easings, two springs, three text reveals (Condense, Streak, Settle), two transitions (the Pour, the Threshold). Tokens: `--hl-ease-*`, `--hl-dur-*`.
- **Quality tiers.** `full`, `reduced`, `static`, chosen from reduced-motion, Save-Data, connection, WebGL2, battery, memory, a frame probe and a runtime governor. The static tier is complete and is also the no-JavaScript state.
- **No navbar.** A floating index control (scroll-progress ring, aperture glyph, theme toggle) opens a full-screen index of the page's scenes and routes.
- **Photographs first.** `ProtectedImage`, `ProtectedGallery`, `ScreenshotGuard`; effects never filter a photograph outside a named scene.

## Entry points

```ts
import "@halation/ui/styles.css";
import { ThemeProvider, ThemeScript, Button /* … */ } from "@halation/ui";
import { StageProvider, Scene, IndexControl, Condense, Streak, Settle, Threshold } from "@halation/ui/stage";
import { Image, Gallery, Lightbox, ProtectedImage } from "@halation/ui/media";
```

Put `<ThemeScript preset="hub" />` in `<head>` (it sets the theme, the world, and the `hl-js` / `data-hl-tier` flags before first paint). Wrap a page in `<StageProvider world="hub">` and compose it from `<Scene>`s. Everything is documented, with demos where a demo makes sense, in `apps/docs`.

## Tokens and prefix

CSS custom properties are `--hl-*`, classes are `hl-*`. Palette (Night, Day, Cinema), type roles (display, text, voice, mono), motion, space and shape are in `src/styles/tokens.css` and `themes.css` and described in `docs/project/design-language.md`. Fonts are SIL OFL 1.1 families loaded by the host app; their licence texts ship in `licenses/fonts/`.

## Accessibility

WCAG 2.2 AA target: contrast table in `scripts/contrast.mjs`, skip link, landmarks, visible focus, 44 px targets, keyboard paths, no bare-letter shortcuts, reduced motion = complete static page. Accessible primitives (dialog, menu, tabs…) use headless Radix Primitives (MIT) with our own visuals (Q40).

## Rename

`node scripts/rename.mjs --package @acme/kit --brand AcmeKit --prefix ac` renames the package everywhere (see `brand.config.json`).
