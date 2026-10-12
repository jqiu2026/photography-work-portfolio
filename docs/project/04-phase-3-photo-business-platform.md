# 04. Phase 3: Photo business platform (ShootProof replacement)

> **Status 2026-10-12: still not started for real services, but the whole experience is now DESIGNED and MOCKED first** (Phase 2.5, [12-vision-v2.md](12-vision-v2.md)). Phase 3 replaces the mocks with real providers and backends. Scope additions from the owner:
> - **Photography studio platform** (native, built around the site): photo and video portfolio management, client galleries, bookings, contracts, invoices, payments, a dashboard. Mock providers locally: `PaymentProvider` (Stripe test-mode shape), `ClientPortal`, contract/e-signature stub, invoices.
> - **Music score store**: compositions catalogue; listen (only when a performance recording exists) separate from score preview and purchase; cart, checkout (mock), library, delivery of purchased scores (mock file delivery with a watermarked preview). Real payments, tax and delivery are Phase 3.
> - **Flying**: journal, map of past flights (airport-level, delayed; never live), and a hidden-by-default CFI services slot (inquiry form only until the owner decides).
> Hard rules still apply: never spend money, no live keys, no live third-party calls without the owner.

> **NOT STARTED. Do not begin this phase unless the owner explicitly says so.** This document is the plan so the next chat can start immediately.

**Goal:** the owner cancels ShootProof (about 30 GB of photos today) and runs client delivery and business admin on their own infrastructure, for roughly the cost in [06](06-cost-analysis.md).

All of Phase 3 lives in `apps/photos` at **`photos.jerryqiu.com`** (the public portfolio is already there from Phase 1). Client area under `/client`, owner area under `/studio`, booking under `/book`. Everything uses the UI package and the shared auth, storage, db and protection packages from Phases 1-2. **DNS cut-over is the owner's manual step**: ShootProof keeps serving that hostname until the migration is verified; provide a written checklist, never touch DNS.

## 3.1 Data model (Drizzle)

`clients`, `client_contacts`, `jobs` (a booking/project for a client: type, date, location, status, fee), `galleries` (belong to a job; title, slug, cover, status draft/published/archived, access mode, expiry, download policy, watermark policy), `photos` (storage keys for original + derivatives, dims, EXIF, hash), `photo_groups`/`albums`, `favorites`, `comments`, `download_events`, `view_events`, `products` (digital packages, prints), `orders`, `order_items`, `invoices`, `invoice_items`, `payments`, `contracts`, `contract_templates`, `signatures`, `questionnaires`, `appointments`, `email_log`, `audit_log`. Keep a nullable `studio_id` on top-level tables so multi-tenancy could be added later, but do not build it.

## 3.2 Client galleries (core)

- **Upload:** bulk drag-drop of hundreds of RAW-exports/JPEGs, resumable direct-to-storage uploads, progress, retry, dedupe by hash, background derivative generation (queue: Vercel Functions + a `jobs` table processed by cron/after-upload; no paid queue). Originals to private R2. Large zips for download built on demand (stream, don't buffer).
- **Delivery:** gallery page with the Phase 1 `Gallery` + `Lightbox`, slideshow, mobile-first, fast. Photos via `ProtectedImage` and signed expiring URLs.
- **Access:** public (unlisted link), password, 6-digit PIN, or email magic link (Resend). Per-gallery expiry with reminder emails. Client accounts optional: a client portal at `/client` listing all their galleries, invoices, contracts.
- **Proofing:** favorites lists, "send selection" to the photographer, per-photo comments, star/flag, selection limits (e.g. album picks).
- **Downloads:** policies per gallery: none, watermarked-preview only, free web-size, free full-res, paid. Single photo or whole gallery zip, with "download log". Rate limited. Optional PIN for download.
- **Watermarks:** visible (studio logo) on previews; **invisible forensic watermark** per viewer/session on served derivatives (frequency-domain or LSB-robust technique via `sharp`; record the viewer id in `view_events`) so a leaked image can be traced to the link. Include a tool in admin to "identify watermark in an uploaded image". Be honest about robustness (survives resize/JPEG to a degree, not a determined attacker).
- **Protection:** gallery `strict` mode uses `ScreenshotGuard`, blob rendering, tokens with short TTL, no right-click. See [05](05-security-and-image-protection.md).
- **Notifications:** gallery-ready email, expiry reminders, "client viewed", "client favorited", download alerts.

## 3.3 Store and payments

- Digital download packages (price tiers), optional prints/products list with manual fulfillment (no lab integration at first; note lab APIs as future work).
- **Stripe Checkout** (test mode until the owner supplies live keys), webhooks verified and idempotent, receipts by email, refunds from admin, discount codes, sales tax toggle (document that tax handling is the owner's responsibility).
- Orders unlock downloads automatically.

## 3.4 Contracts and e-signature

- Contract templates with merge fields (client, date, fee, location), a rich-text/markdown template editor, send by link/email, client views and signs (typed + drawn), signer name, timestamp, IP, user agent, SHA-256 document hash; produce a final signed PDF (`@react-pdf/renderer` or similar) and an audit trail page; countersign by the owner; reminders; expiry; store in private storage; status (draft/sent/viewed/signed/declined).
- Include example templates (wedding, event, portrait, licensing) clearly marked **"sample only: have a lawyer review"**.
- Questionnaires / intake forms, simple form builder.

## 3.5 Invoices

- Invoice builder (line items, tax, discount, deposit/retainer, due dates, payment plans/installments), numbering, PDF export, email with a pay link (Stripe), status (draft/sent/viewed/partial/paid/overdue), automatic reminders, receipts, manual "mark paid" for cash/Zelle/check, recurring option.
- Link invoice -> job -> contract -> gallery.

## 3.6 Studio management

- Clients CRM (notes, tags, history), jobs pipeline (inquiry -> booked -> shot -> delivered -> paid), booking calendar with availability (iCal feed export, `ics` like stuyaviators), booking page at `photos.jerryqiu.com/book` (linked from the hub) with deposit payment, task reminders.
- Dashboard: revenue, outstanding invoices, upcoming shoots, gallery views and downloads, storage used vs budget.
- Reports CSV export (income, taxes).

## 3.7 Migration from ShootProof

- Use the Phase 2 ShootProof adapter to **import** galleries (photos, favorites, orders if exposed) into the new system, resumable, with a dry-run report. Keep the user's ShootProof subscription until migration is verified; document a cut-over checklist.
- Redirect old ShootProof share links by mapping where possible (document limits).

## 3.8 Ops

- Storage and cost meter in admin; alert when storage nears the $5 extras budget.
- Backups: nightly DB dump to R2 (cron), documented restore; export all data.
- Error monitoring: use free Vercel logs; no paid APM.
- Privacy: privacy policy and terms pages, data retention settings, delete-client-data tool (GDPR/CCPA style), cookie-free.
- Load/abuse tests on the image endpoint; chaos checks on token expiry.

## 3.9 Acceptance

A realistic end-to-end Playwright scenario in test mode: create client -> create job -> send contract -> client signs -> send invoice -> client pays (Stripe test) -> upload 50 photos -> publish gallery with PIN -> client favorites and comments -> client buys download package -> downloads zip -> leak-trace identifies the viewer. Cost sheet updated with real measured numbers. Owner guide for the full workflow. Security review. Phase summary.

## 3.10 Suggested milestone order

P3-M1 schema + clients/jobs. M2 gallery upload + delivery. M3 access modes + proofing. M4 downloads + watermarks. M5 Stripe orders. M6 invoices. M7 contracts. M8 booking + calendar. M9 migration + backups + ops. M10 acceptance.
