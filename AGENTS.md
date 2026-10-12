# AGENTS.md

Rules for AI agents and contributors. Project plan, status and hard rules live in `docs/project/` (start with `README.md`, then `08-operating-rules.md` and `PROGRESS.md`). `CLAUDE.md` repeats the hard rules.

## Hard rules (summary; the docs are authoritative)

- Work on branch `feat/custom-ui-cms` only. No co-author trailers, no "Generated with" text in commits or PRs.
- Never push, merge to `main`, deploy, publish, change DNS, create cloud resources, or spend money.
- Never block on questions: use the documented default and log it in `docs/project/QUESTIONS.md`.
- Phase 1 flows into Phase 2; stop after Phase 2.
- Never invent facts about the owner. Use `todo("...")` (dev-only placeholder) or a `TODO(owner):` comment.

## Repo layout

`apps/web` hub + music + flying (:3000), `apps/photos` (:3002), `apps/docs` UI docs (:3001), `packages/ui` (`@placeholder/ui`, open source, MIT), `packages/sites` site registry and theme presets, `packages/config` shared tsconfig.

## Working with the UI package (`packages/ui`)

- Styling is plain CSS with tokens: `--ph-*` variables (`src/styles/tokens.css`, `themes.css`) and `ph-*` classes (`components.css`). No Tailwind, no CSS-in-JS. Never hard-code colours in apps; use tokens. Themes switch on `[data-theme]` and `[data-preset]`.
- Compose pages from the package components (`Container`, `Stack`, `Row`, `Grid`, `Section`, `Heading`, `Text`, `Button`, ...). Add a new component to the package when two pages need it; keep it generic (no Jerry-specific content in `packages/ui`).
- Subpath exports: `@placeholder/ui` (primitives), `/motion`, `/media`, `/webgl`, `/styles.css`, `/tokens`. Heavy code (ogl, Lenis, image sequences) stays out of the main entry.
- Every motion component must render a complete static state under `prefers-reduced-motion` (use `useCalm()`).
- Accessibility is an acceptance criterion: visible focus, 44px targets, labelled controls, AA contrast, keyboard use.
- Use `motion` tokens from `src/tokens.ts` (one easing curve, one spring); do not invent per-component curves.
- Fonts are provided by the app through `next/font` variables (`--font-inter-tight`, `--font-instrument-serif`, `--font-geist-mono`, `--font-geist`, `--font-newsreader`).
- Images: run `node scripts/optimize-images.mjs <src> <out> <prefix>`; use `Image` with the manifest entry. Never delete or overwrite original photos.

## Next.js 16

This is not the Next.js you may remember. Read `apps/web/node_modules/next/dist/docs/` before writing Next code (for example `proxy.ts` replaces `middleware.ts`; folders starting with `_` need a `%5F` prefix to be routable).

## Checks before committing

`pnpm build && pnpm typecheck && pnpm lint` (and `pnpm test` once tests exist). UI work: take Playwright screenshots (`node scripts/shot.mjs <url> <out.png> [width] [dark|light] [--scroll] [--reduce]`), look at them, fix what is off.
