# AGENTS.md

Rules for AI agents and contributors. Project plan, status and hard rules live in `docs/project/` (start with `README.md`, then `08-operating-rules.md` and `PROGRESS.md`). `CLAUDE.md` repeats the hard rules.

## Hard rules (summary; the docs are authoritative)

- Work on branch `feat/custom-ui-cms` only. No co-author trailers, no "Generated with" text in commits or PRs.
- Never push, merge to `main`, deploy, publish, change DNS, create cloud resources, or spend money.
- Never block on questions: use the documented default and log it in `docs/project/QUESTIONS.md`.
- Scope: the photo site, `apps/photos` (`docs/project/01-photo-site-spec.md`, `HANDOFF.md`) first; music, flying, make and the hub's public site were added on the owner's request on 2026-10-27 (Q125, `docs/project/other-sites.md`). The v3 design is paused.
- Never invent facts about the owner. Use `todo("...")` (dev-only placeholder) or a `TODO(owner):` comment.

## Repo layout

`apps/web` hub (:3000), `apps/music` (:3003), `apps/flying` (:3004), `apps/make` (:3005), `apps/photos` photography and studio (:3002), `apps/docs` Holominimal docs, `packages/holominimal` (`@holominimal/ui`, **Holominimal**: the one design system, a vendored build), `packages/sites` site registry, contact form and theme script, `packages/render` (Markdown, MDX, project blocks), `packages/mocks` (labelled local mocks of Phase 3 services), plus `db`, `auth`, `storage`, `protect`, `media`, `inbox`, `payments`, `config`.

## Working with the interface (Holominimal)

- Every site uses `@holominimal/ui` (vendored build in `packages/holominimal`; rebuild in `~/Documents/holominimal` and re-copy `dist` to update). Tokens are `--hm-*`, classes `hm-*`. No Tailwind, no CSS-in-JS. Never hard-code colours in apps; use tokens.
- Server-compatible components carry no `"use client"`; do not pass functions from server components to client components. Router links go through `asChild`.
- Content rendering (prose, embeds) and the protected-image components live in `@jerryqiu/render` (`/ui`, `/media`, `render.css`).
- Fonts come from the app through `next/font` variables; all SIL OFL 1.1, licence texts in `licenses/fonts/`.
- Accessibility is an acceptance criterion: visible focus, 44px targets, labelled controls, AA contrast, keyboard use, no bare-letter shortcuts.
- Cross-site rule: photography, music and flying contain no reference to another family site; their footer carries the single `jerryqiu.com` return button (`data-return-to-hub`). `e2e/cross-site.spec.ts` enforces it.
- Mocks (`packages/mocks`) are labelled `MOCK` in the UI, behind interfaces, and 404 in production builds (`mocksEnabled()`); never add live keys or network calls to them.
- Images: run `node scripts/optimize-images.mjs <src> <out> <prefix>`; use `Image` with the manifest entry. Never delete or overwrite original photos.

## Next.js 16

This is not the Next.js you may remember. Read `apps/web/node_modules/next/dist/docs/` before writing Next code (for example `proxy.ts` replaces `middleware.ts`; folders starting with `_` need a `%5F` prefix to be routable).

## Checks before committing

`pnpm lint && pnpm typecheck && pnpm test`, then `pnpm test:e2e` (production builds on :4000-4002) and `pnpm test:admin` (dev servers and a throwaway database). UI work: take Playwright screenshots (`node scripts/shot.mjs <url> <out.png> [width] [dark|light] [--scroll] [--reduce]`), look at them, fix what is off.
