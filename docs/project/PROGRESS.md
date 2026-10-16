# PROGRESS

Living status for the **photo site** build. Newest log entries at the top of "Log". The old Phase 1 to 3 log is in `archive/PROGRESS-log-phases-1-3.md`.

**Branch:** `feat/custom-ui-cms`  **Live preview:** http://localhost:3002 (`cd apps/photos && pnpm dev`)
**State:** Stage 1 (docs) done. Stage 2 (this plan) done. Stage 3 (build) in progress: see the milestone list.

## Gates (run separately, clean shell)

`pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e` (production builds on :4000 to :4004), `pnpm test:admin` (dev servers on :3300+, throwaway DB; do not export `NEXT_PUBLIC_*_URL` in that shell).

Known issues at start (2026-10-15): one lint error in `apps/photos/src/app/studio/actions.ts`; `test:admin` has 1 failing Stripe webhook test in `studio.spec.ts`. Both are PHOTO-M1.

## Milestones (each small enough for one sitting; acceptance = listed check plus gates green)

| Id | Scope | Likely files | Acceptance |
|---|---|---|---|
| PHOTO-M1 | Foundation: baseline gates, fix lint error and the failing webhook test | `studio/actions.ts`, `e2e-admin/studio.spec.ts` | all gates green; dev server on :3002 |
| PHOTO-M2 | Remove ShootProof completely (3d of the handoff); additive migration 0003 | `packages/shootproof`, `studio/shootproof/*`, `api/ext`, `api/cron/purge-external`, nav, auth policy, protect crypto, db schema/export, e2e, env names | `grep -rni shootproof` clean outside `archive/`; gates green |
| PHOTO-M3 | Protection everywhere: single strict policy, no `off`/`light`, invisible per-viewer watermark and view log for client galleries, tests | `@halation/ui/media`, `@jerryqiu/media`, public pages, `e2e/protection` | no file URL in public HTML; every photograph is protected; image route refuses unsigned or expired |
| PHOTO-M4 | `@jerryqiu/email` (Resend adapter, outbox mock, branded templates); inquiry creates a lead; per-type forms; studio inbox | `packages/email`, `/book`, `/book/[type]`, studio inbox | inquiry to lead to confirmation email in outbox (e2e) |
| PHOTO-M5 | Pipeline kanban, calendar, availability, buffers, no double booking, `.ics`, instant booking with deposit (mock), embed widget, mini-sessions, waitlist, mobile studio shell | migration 0004, `/studio/pipeline`, `/studio/calendar`, `/api/ics/[token]` | booking e2e; double-booking refused (unit) |
| PHOTO-M6 | Packages, add-ons, quotes and proposals, promo/referral codes, gift cards, tax lines, upsells, currency display | migration 0005, `/studio/packages`, `/packages`, `/client/quote/[token]` | quote accept and pay e2e |
| PHOTO-M7 | Contract templates, questionnaires, releases, usage-rights clauses | migration 0006 | template to sign e2e; questionnaire respond e2e |
| PHOTO-M8 | Invoices v2: deposits, retainers, payment plans, recurring, refunds, ACH, tips, receipts, PDF, card surcharge flag | `@jerryqiu/payments`, studio invoices | plan schedule unit; refund e2e |
| PHOTO-M9 | Client portal: password and magic-link login, home, messages, delivery status, reschedule/cancel, preferences | migration 0007, `/client/*` | login e2e (password, magic link, passcode) |
| PHOTO-M10 | Galleries v2: Blob direct uploads, sizes, dedupe, albums, slideshow, proofing, selections, downloads and ZIP, logs, expiry, reactivation, branding | migration 0008, `/api/upload/*`, `/api/download/*` | upload to proof to download e2e |
| PHOTO-M11 | Platform showcase: home, `/features` from `content/features.ts`, how-it-works, packages, client-portal tour, galleries, prints, faq, contact, terms, accessibility; JSON-LD; health page | marketing routes | every claim maps to a feature row; badges |
| PHOTO-M12 | Cron, automations, reminders, tasks, notifications | `/api/cron/*`, automations | automation run unit and e2e |
| PHOTO-M13 | Print store behind WHCC mock, digital sales | `packages/prints`, migration 0009 | order after payment e2e |
| PHOTO-M14 | Reports, expenses, mileage, usage-rights tracker, event privacy, publish-to-portfolio, testimonials, data export and delete, storage meter | `/studio/reports`, etc. | CSV export unit; consent e2e |
| PHOTO-M15 | Ops: CRM extras, call sheets, team roles, gear, drone checklist, search, owner API, outgoing webhooks, activity feed | migration 0010 | role permission unit |
| PHOTO-M16 | Face search and culling mocks, video delivery | `packages/facesearch` | consent flow e2e |
| PHOTO-M17 | Deployment prep: vercel.json, isolated production build, env example, checklist | `apps/photos/vercel.json` | isolated build passes |
| PHOTO-M18 | Polish: WCAG 2.2 AA, Lighthouse mobile 80+, CLS under 0.02, 390 and 1440 screenshots light and dark | all | axe clean; Lighthouse recorded |

## Owner to-do (keys and accounts)

Nothing below has been created or spent. Placeholders marked `TODO(owner): needs <KEY>` in code.

| Item | Env names | Used by |
|---|---|---|
| Neon database | `DATABASE_URL` | everything in production |
| Vercel project `jq-photo` (Root Directory `apps/photos`, outside-root setting enabled) | n/a | deployment |
| Vercel Blob store | `BLOB_READ_WRITE_TOKEN`, `STORAGE_DRIVER=blob` | uploads, derivatives |
| Stripe (test mode first) and webhook | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | payments |
| Stripe Tax registrations (with accountant) | n/a | tax lines |
| Resend, verified mail subdomain, real reply inbox | `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO`, `CONTACT_TO_EMAIL` | email |
| Google OAuth client | `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `ADMIN_EMAILS` | studio sign-in |
| Shared secrets | `AUTH_SECRET`, `IMAGE_TOKEN_SECRET`, `REVALIDATE_SECRET`, `CRON_SECRET` | auth, images, cache, cron |
| WHCC API credentials (sandbox first) | `WHCC_BASE_URL`, `WHCC_CONSUMER_KEY`, `WHCC_CONSUMER_SECRET` | prints (mock until set) |
| Rekognition and legal review of biometric rules | `FACESEARCH_PROVIDER` | face search (mock only) |
| DNS: `photo.` and `photos.` alias | n/a | domain |
| Real prices, package contents, contract text | n/a | all `$XX` and SAMPLE values |
| Lawyer review of privacy, terms, contracts, releases | n/a | legal pages |
| Real photographs for any sample galleries, testimonials with consent | n/a | showcase |

## Risks

- Vercel outside-root includes: setting default and wording NOT VERIFIED (see 02).
- Blob limits: upload size per request, request count, and cost at 500 GB are unverified; direct client uploads with chunking are designed to avoid function body limits.
- Stripe: ACH, Tax and surcharge rules by state, hosted-domain checkout fee; webhooks only tested against signed fixtures.
- WHCC: cancellation rules, drop-ship minimum, billing terms unknown (Q54).
- Strict image protection raises CDN cost and Lighthouse risk; mitigated with blur placeholders, preload, signed cacheable derivatives.
- Mock-vs-real drift: every adapter has a contract test run against the mock.
- Scope: this is a very large build; milestones are ordered so the product is usable after M10 and showable after M11.

## Log

- 2026-10-15: Stage 1 docs redone: about 45 files reduced to 8 live docs (`README`, `00`, `01`, `02`, `03`, `08`, `PROGRESS`, `QUESTIONS`, `HANDOFF`, `other-sites`); everything else moved with `git mv` to `archive/`. Stage 2 plan written (above and spec section 6).
