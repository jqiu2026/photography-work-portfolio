# Contributing

Thanks for helping. This repository holds a personal site family and the UI package it is built on (`packages/ui`, MIT).

## Set up

```bash
pnpm install
pnpm dev                 # hub :3000, docs :3001, photos :3002
pnpm --filter @halation/ui test
pnpm lint && pnpm typecheck && pnpm build
pnpm test:e2e            # builds with test URLs, then Playwright + axe on every route
```

## Changes to the UI package

1. Keep components generic: no site-specific content inside `packages/ui`.
2. Style with tokens (`--hl-*`) only; no hard-coded colours, no CSS-in-JS, no Tailwind.
3. Every motion component needs a complete static state for `prefers-reduced-motion` (`useCalm()`).
4. Add a docs entry in `apps/docs/src/content/components.ts` (a test fails if an export is undocumented) and unit tests that check behaviour, not only rendering.
5. Add a changeset: `pnpm changeset`.
6. Accessibility is a gate: keyboard use, labels, AA contrast.

## Commits and PRs

Conventional messages (`feat(ui): add X`, `fix: ...`). Keep PRs small. Do not commit secrets, `.env*` files, or photographs you do not own.

## Conduct

Be kind. See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
