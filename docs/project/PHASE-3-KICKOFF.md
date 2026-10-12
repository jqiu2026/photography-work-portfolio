# Phase 3 kickoff prompt (do not start until the owner says so)

Paste this into a fresh chat when you are ready.

---

You are continuing the project in /Users/jerry/Documents/photography-work-portfolio on branch feat/custom-ui-cms. Read, in order: docs/project/README.md, 08-operating-rules.md (HARD RULES), PROGRESS.md, QUESTIONS.md, PHASE-2-SUMMARY.md, 04-phase-3-photo-business-platform.md, 05-security-and-image-protection.md, 11-legal-and-compliance.md, docs/shootproof-bridge.md, AGENTS.md.

Rules: no co-author trailers or "Generated with" text; never push, merge to main, deploy, publish, change DNS or spend money; never block on questions (use the documented default, log it in QUESTIONS.md); compact at about 30% context left; write a fresh HANDOFF.md at about 98% usage.

Phase 3 builds the photo business platform inside apps/photos (/studio and client areas): client galleries with passcodes/magic links, favourites, downloads with per-viewer invisible watermarks, bookings, contracts with e-signatures, invoices and payments (Stripe test mode only), and a client portal, replacing ShootProof.

## What exists as mocks (Phase 2.5) and what Phase 3 replaces

| Mock (packages/mocks) | Interface | Phase 3 replacement |
|---|---|---|
| Studio data in localStorage (`StudioRepo`) | `StudioRepo` methods | Drizzle tables and guarded server actions (clients, shoots, galleries, contracts, invoices, bookings) |
| `MockPaymentProvider` | `PaymentProvider` (Stripe PaymentIntent shape; only 4242 succeeds) | Stripe in test mode first, signature-verified webhooks with idempotency keys |
| `MockESignProvider` | `ESignProvider` (typed name) | A real e-signature provider |
| `MockClientPortal` | `ClientPortal` (passcode, on-screen magic link) | Host-only client auth cookie on photos., real emails (Resend), per-viewer watermark and view logs |
| `MockScoreDelivery` | `ScoreDelivery` (SVG preview, placeholder file) | Server-side rasterised watermarked previews and a private-storage PDF behind the order check |
| `MockFlightSource` | `FlightSource` (+ `publishable()` privacy rules) | Owner-entered flights in the CMS, same privacy filter |
| Score cart and orders in localStorage | `useScoreStore` | Orders in the database, receipts by email |

UI routes to keep as they are: `/studio/[section]`, `/client`, `/client/g/[id]`, `/client/sign/[envelope]`, `/client/pay/[invoice]`, `/music/compositions`, `/music/scores/*`, `/flying/map`. Remove the `MockBanner` per route as each becomes real. Mocks are 404 in production builds; Phase 3 removes that guard route by route.

Phase 2.5 note: the owner's vision (docs/project/12-vision-v2.md) had the whole studio, the music score store, the client portal and the flight map DESIGNED and built as labelled local mocks first; Phase 3 replaces each mock behind its interface with a real provider/backend (payments, e-signature, delivery, client auth, storage), never changing the UI contract. Read PHASE-2.5-SUMMARY.md for what exists.

Foundations already in place: users table with a reserved `client` role and `studio_id` columns on content tables; guarded actions, audit log, rate limits; image route with strict tier, signed tokens and ScreenshotGuard; direct-to-storage uploads and the ingest pipeline; the inbox; encrypted token storage; the ShootProof bridge to migrate existing galleries from.

First steps: (1) read 04 and list the open decisions as defaults in QUESTIONS.md; (2) design the schema additions (clients, projects/shoots, galleries-for-clients, contracts, invoices, payments) with migrations; (3) client authentication (host-only cookie on photos.jerryqiu.com, separate from staff); (4) client gallery delivery with per-viewer watermark and view logs; (5) then bookings, contracts, invoices. Stripe in test mode only, signature-verified webhooks with idempotency keys. Update PROGRESS.md at every milestone and stop at the end of Phase 3 with PHASE-3-SUMMARY.md.
