# Contributing

Thanks for helping. This repository holds a personal site family, all built on the Holominimal design system (`packages/holominimal`).

## Set up

```bash
pnpm install
pnpm dev                 # hub :3000, docs :3001, photos :3002
pnpm test
pnpm lint && pnpm typecheck && pnpm build
pnpm test:e2e            # builds with test URLs, then Playwright + axe on every route
```

## Changes to the interface

1. Build with Holominimal components and its tokens (`--hm-*`) only; no hard-coded colours, no CSS-in-JS, no Tailwind.
2. Every animation needs a complete still state under `prefers-reduced-motion`.
3. Document anything new in the docs app (`apps/docs/src/content/components.ts`, with a live demo) and test behaviour, not only rendering.
4. Accessibility is a gate: keyboard use, labels, AA contrast.

## Commits and PRs

Conventional messages (`feat(ui): add X`, `fix: ...`). Keep PRs small. Do not commit secrets, `.env*` files, or photographs you do not own.

## Conduct

Be kind. See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
