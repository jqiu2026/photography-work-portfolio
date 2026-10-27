# AGENTS.md

Rules for AI agents and contributors. Project plan, status and hard rules live in `docs/project/` (start with `README.md`, then `08-operating-rules.md` and `PROGRESS.md`). `CLAUDE.md` repeats the hard rules.

## Hard rules (summary; the docs are authoritative)

- Work on branch `feat/custom-ui-cms` only. No co-author trailers, no "Generated with" text in commits or PRs.
- Never push, merge to `main`, deploy, publish, change DNS, create cloud resources, or spend money.
- Never block on questions: use the documented default and log it in `docs/project/QUESTIONS.md`.
- Scope: the photo site, `apps/photos` (`docs/project/01-photo-site-spec.md`, `HANDOFF.md`) first; music, flying, make and the hub's public site were added on the owner's request on 2026-10-27 (Q125, `docs/project/other-sites.md`). The v3 design is paused.
- Never invent facts about the owner. Use `todo("...")` (dev-only placeholder) or a `TODO(owner):` comment.

## Repo layout

`apps/web` hub (:3000), `apps/music` (:3003), `apps/flying` (:3004), `apps/make` (:3005), `apps/photos` photography and studio (:3002), `apps/docs` UI docs, `packages/ui` (`@halation/ui`, **Halation UI**: the original design system; licence undecided, Q32), `packages/sites` site registry and shared chrome (`SiteShell`), `packages/render` (Markdown, MDX, project blocks), `packages/mocks` (labelled local mocks of Phase 3 services), plus `db`, `auth`, `storage`, `protect`, `media`, `inbox`, `payments`, `config`.

## Working with the UI package (`packages/ui`, Halation UI)

- Prefix `hl` (`--hl-*` variables, `hl-*` classes), set by `brand.config.json` and `pnpm rename`. Handwritten CSS in `src/styles/` (`tokens.css`, `themes.css`, `base.css`, `components.css`, `stage.css`). No Tailwind, no CSS-in-JS. Never hard-code colours in apps; use tokens (Night, Day, Cinema; world accents blue/red/amber/green). `scripts/contrast.mjs` must stay green.
- The idea is **Flow** (docs/project/archive/redesign-brief.md, design-language.md; paused for the photo site, see 00-vision-and-design.md): one persistent stage (`@halation/ui/stage`: `StageProvider`, `Scene`, `IndexControl`, `Condense`/`Streak`/`Settle`, `Threshold`), one motion language (`--hl-ease-glide|pour|drain`, `--hl-dur-*`, springs `settle` and `droplet`), quality tiers (full, reduced, static) from `src/stage/tier.ts`. **No navbar anywhere**: the floating index control, a skip link and landmarks.
- Content is always real DOM; the stage is decoration. Anything hidden for a reveal must be gated by `html.hl-js` (set by `ThemeScript`, never under reduced motion, Save-Data or no JS). Every effect needs a static equivalent and a test. Heavy code (ogl, the fluid renderer) is lazy-loaded after first paint.
- Subpath exports: `@halation/ui` (primitives), `/stage`, `/motion`, `/media`, `/webgl`, `/styles.css`, `/tokens`. Do not pass functions from server components to client components (use declarative props such as `param={[from, to]}`).
- Every exported component needs a docs entry in `apps/docs/src/content/components.ts` (enforced by `apps/docs/test/coverage.test.ts`; uppercase non-component exports break it, so keep helpers lowercase or unexported).
- Fonts come from the app through `next/font` variables `--font-display` (Anybody), `--font-sans` (Hanken Grotesk), `--font-voice` (Newsreader), `--font-mono` (Martian Mono); all SIL OFL 1.1, licence texts in `packages/ui/licenses/fonts/`.
- Accessibility is an acceptance criterion: visible focus, 44px targets, labelled controls, AA contrast, keyboard use, no bare-letter shortcuts.
- Cross-site rule: photography, music and flying contain no reference to another family site; their footer carries the single `jerryqiu.com` return button (`data-return-to-hub`). `e2e/cross-site.spec.ts` enforces it.
- Mocks (`packages/mocks`) are labelled `MOCK` in the UI, behind interfaces, and 404 in production builds (`mocksEnabled()`); never add live keys or network calls to them.
- Images: run `node scripts/optimize-images.mjs <src> <out> <prefix>`; use `Image` with the manifest entry. Never delete or overwrite original photos.

## Next.js 16

This is not the Next.js you may remember. Read `apps/web/node_modules/next/dist/docs/` before writing Next code (for example `proxy.ts` replaces `middleware.ts`; folders starting with `_` need a `%5F` prefix to be routable).

## Checks before committing

`pnpm lint && pnpm typecheck && pnpm test`, then `pnpm test:e2e` (production builds on :4000-4002) and `pnpm test:admin` (dev servers and a throwaway database). UI work: take Playwright screenshots (`node scripts/shot.mjs <url> <out.png> [width] [dark|light] [--scroll] [--reduce]`), look at them, fix what is off.
