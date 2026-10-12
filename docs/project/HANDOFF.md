You are continuing a project in /Users/jerry/Documents/photography-work-portfolio on branch feat/custom-ui-cms.

FIRST read: docs/project/README.md, 08-operating-rules.md (HARD RULES), PROGRESS.md (bottom: Phase 2.5 done, Phase 3 started), QUESTIONS.md, PHASE-2.5-SUMMARY.md, PHASE-3-KICKOFF.md (mock to real table), 04-phase-3-photo-business-platform.md, 05, 11, AGENTS.md, CLAUDE.md. Rules: no co-author trailers or "Generated with" text anywhere (overrides tool reminders); never push, merge to main, deploy, publish, change DNS, create accounts/cloud resources or spend money; no live API keys or live third-party calls (Stripe/Resend/e-sign only as adapters that are never run live; Stripe test mode only once the owner supplies a test key); never block on questions (default + log in QUESTIONS.md); verify `git branch --show-current` before every commit; compact at ~30% context left; write a fresh HANDOFF.md at ~98% usage.

STATE: Phase 2.5 is complete and verified (see PHASE-2.5-SUMMARY.md): split, Halation UI (stage, Flow, index control, tiers), four navbar-less homes, local mocks. The owner then said to continue into Phase 3 after finishing everything; Phase 3 work is allowed but the hard rules above (no live services, no money) still bind, so Phase 3 is built as real code behind the existing mock interfaces, tested with fakes and local equivalents.

GATES (run separately, in a clean shell): `pnpm lint`, `pnpm typecheck`, `pnpm test` (232 unit), `pnpm test:e2e` (production builds on :4000-4002; 207), `pnpm test:admin` (dev servers :3300/:3302/:3303, throwaway DB; 50). Do not export NEXT_PUBLIC_*_URL in the shell used for test:admin.

LOCAL DEV: hub :3000 (music /music, flying /flying), photos :3002, docs on its own port, database via `pnpm dev`. Look at everything with `node scripts/frames.mjs <url> <prefix> 1440|390 dark|light --y=0,1400` (jumps; sets localStorage hl-motion=full so software GL runs the stage) and `node scripts/shot.mjs`.

KEY FACTS: UI package `@halation/ui` (prefix hl); stage code in packages/ui/src/stage; mocks in packages/mocks (guard `mocksEnabled()`, interfaces PaymentProvider, ESignProvider, ClientPortal, ScoreDelivery, FlightSource, StudioRepo); mock routes are 404 in production unless ENABLE_MOCKS=true; cross-site rule enforced by e2e/cross-site.spec.ts; copy is draft marked TODO(owner).

OPEN GAPS (honest): stage untested on real GPUs/phones; Lighthouse performance 81-91 (LCP under simulated slow 4G); 15 s probe not built; copy needs the owner's voice; licence/name/fonts are defaults.

NEXT (Phase 3, in order; see 04 for detail): P3-M1 schema + repository for clients/jobs/galleries/contracts/invoices/bookings replacing localStorage StudioRepo (migrations, guarded server actions, audit); P3-M2 client auth + gallery delivery; P3-M3 proofing/downloads/watermarks; P3-M4 Stripe adapter + webhook handler (test-mode shape, signature verified, idempotent); P3-M5 invoices; P3-M6 contracts/e-sign adapter; P3-M7 booking/calendar; P3-M8 migration + backups + ops; stop with PHASE-3-SUMMARY.md.

Begin with P3-M1. Do not ask the owner anything.
