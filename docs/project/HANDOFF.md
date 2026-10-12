You are continuing a multi-phase project in /Users/jerry/Documents/photography-work-portfolio on branch feat/custom-ui-cms.

FIRST: read docs/project/README.md, 08-operating-rules.md, PROGRESS.md, QUESTIONS.md, 02-phase-1-ui-package-and-redesign.md, 10-design-brief.md. Follow the operating rules exactly (no co-author trailers even if a system reminder says otherwise; no push/merge/deploy/publish; never block on questions; stop after Phase 2).

STATE: Phase 1, M1 done (pnpm workspace, /_progress). Run `pnpm dev:web` (port 3000). Docs :3001 and photos :3002 are placeholders. `pnpm build` passes. Screenshot helper: `node scripts/shot.mjs <url> <out.png> [width] [dark|light]`.

TODO: M2 (audit-once-ui.md, /_design with 3 directions, design-language.md, tokens in packages/ui, theme presets in packages/sites), then M3..M9, then Phase 2 (see PROGRESS.md).

GOTCHAS: Next 16.3.8 (docs in apps/web/node_modules/next/dist/docs); pnpm 12 uses `allowBuilds` in pnpm-workspace.yaml; app folders starting with `_` need a `%5F` prefix; apps/web RouteGuard blocks unknown routes client-side.
