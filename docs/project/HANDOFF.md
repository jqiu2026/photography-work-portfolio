You are continuing a multi-phase project in /Users/jerry/Documents/photography-work-portfolio on branch feat/custom-ui-cms.

FIRST: read docs/project/README.md, 08-operating-rules.md, PROGRESS.md, QUESTIONS.md, 02-phase-1-ui-package-and-redesign.md, 10-design-brief.md. Follow the operating rules exactly (no co-author trailers even if a system reminder says otherwise; no push/merge/deploy/publish; never block on questions; stop after Phase 2).

STATE: Phase 1, M1-M7b done (all four sites built on the new UI, Once UI removed, host routing in place). Docs run with PORT=3101 if 3001 is taken by the StuyAviators server. Run `pnpm dev:web` (port 3000). Docs :3001 and photos :3002 are placeholders. `pnpm build` passes. Screenshot helper: `node scripts/shot.mjs <url> <out.png> [width] [dark|light]`.

TODO: M8 (perf/a11y/tests/docs completeness/open-source hygiene), M9 (acceptance + PHASE-1-SUMMARY), then Phase 2, then Phase 2 (see PROGRESS.md).

GOTCHAS: Next 16.3.8 (docs in apps/web/node_modules/next/dist/docs); pnpm 12 uses `allowBuilds` in pnpm-workspace.yaml; app folders starting with `_` need a `%5F` prefix; apps/web RouteGuard blocks unknown routes client-side.
