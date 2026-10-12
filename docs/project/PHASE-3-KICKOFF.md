# Phase 3 kickoff prompt (do not start until the owner says so)

Paste this into a fresh chat when you are ready.

---

You are continuing the project in /Users/jerry/Documents/photography-work-portfolio on branch feat/custom-ui-cms. Read, in order: docs/project/README.md, 08-operating-rules.md (HARD RULES), PROGRESS.md, QUESTIONS.md, PHASE-2-SUMMARY.md, 04-phase-3-photo-business-platform.md, 05-security-and-image-protection.md, 11-legal-and-compliance.md, docs/shootproof-bridge.md, AGENTS.md.

Rules: no co-author trailers or "Generated with" text; never push, merge to main, deploy, publish, change DNS or spend money; never block on questions (use the documented default, log it in QUESTIONS.md); compact at about 30% context left; write a fresh HANDOFF.md at about 98% usage.

Phase 3 builds the photo business platform inside apps/photos (/studio and client areas): client galleries with passcodes/magic links, favourites, downloads with per-viewer invisible watermarks, bookings, contracts with e-signatures, invoices and payments (Stripe test mode only), and a client portal, replacing ShootProof.

Foundations already in place: users table with a reserved `client` role and `studio_id` columns on content tables; guarded actions, audit log, rate limits; image route with strict tier, signed tokens and ScreenshotGuard; direct-to-storage uploads and the ingest pipeline; the inbox; encrypted token storage; the ShootProof bridge to migrate existing galleries from.

First steps: (1) read 04 and list the open decisions as defaults in QUESTIONS.md; (2) design the schema additions (clients, projects/shoots, galleries-for-clients, contracts, invoices, payments) with migrations; (3) client authentication (host-only cookie on photos.jerryqiu.com, separate from staff); (4) client gallery delivery with per-viewer watermark and view logs; (5) then bookings, contracts, invoices. Stripe in test mode only, signature-verified webhooks with idempotency keys. Update PROGRESS.md at every milestone and stop at the end of Phase 3 with PHASE-3-SUMMARY.md.
