# 01. Photo site spec: photo.jerryqiu.com

One scoped spec for `apps/photos` (`@jerryqiu/photos`, dev port 3002): the public portfolio, the product tour, and the native photo-business platform that replaces ShootProof and similar services. Merged on 2026-10-15 from the old docs 04, 05, 11 and 13 (archived in `archive/`). The owner decisions at the end of this file win over anything older.

Status words are checked against the code: **done** (works, tested), **mock** (works behind an interface using a labelled mock), **partial**, **missing**. `PHOTO-Mx` is the milestone in [PROGRESS.md](PROGRESS.md) that delivers it. P1 launch, P2 next, P3 later, OPT optional.

## 1. Owner decisions (2026-10-15, latest; these override everything older)

1. **No ShootProof bridge.** The platform is native. No import, OAuth, external-gallery proxy or cron. Removed in PHOTO-M2.
2. **Image protection on everything.** Every photograph, public or client, goes through the protected pipeline (section 4). No unprotected image path. One strict-by-default policy.
3. **The site is the product tour.** Home and marketing pages show the whole platform from the feature table (section 6), with honest Live / Preview / Soon badges.
4. **Ambition: every feature imaginable.** The `F-` table is the floor.
5. Storage is Vercel Blob only (Q51). Stripe is the payment rail only; own invoices and quotes in our DB; tax shown at checkout, nothing after collection (Q52). Client login is password plus magic link plus gallery passcode (Q53). WHCC and face search sit behind interfaces with mocks (Q54, Q55). Website-only cost about $20/month; Stripe and WHCC fees passed to clients (Q56). Host `photo.jerryqiu.com`, `photos.` redirects (Q57). Every price is a placeholder `$XX` or labelled SAMPLE (Q61).

Not legal or tax advice. Stripe Tax calculates; registering and filing stay with the owner. All legal text is a draft for professional review (`TODO(owner): lawyer review`).

## 2. Architecture

- Next.js 16 (App Router, `proxy.ts` not middleware), React 19, Auth.js v5 beta, own CSS tokens from `@halation/ui` (not Tailwind in app code).
- Providers sit behind interfaces; each has a real adapter (reads its key from an env var) and a labelled mock that is disabled in production builds (`mocksEnabled()` in `@jerryqiu/mocks`). Missing keys never crash the app; the feature says what to set.

| Concern | Package or place | Interface | Mock |
|---|---|---|---|
| Database | `@jerryqiu/db` (Drizzle; Neon in production, PGlite locally) | `Database` | PGlite |
| Storage | `@jerryqiu/storage` | `StorageProvider` (local, Vercel Blob) | local disk |
| Image pipeline and serving | `@jerryqiu/media`, `@jerryqiu/protect` | `serveImage`, signed tokens | n/a |
| Payments | `@jerryqiu/payments` | `PaymentProvider` (Stripe Checkout, webhooks) | `@jerryqiu/mocks` `payments` (only card 4242 succeeds) |
| Email | `@jerryqiu/email` (new) | `EmailProvider` (Resend) | outbox table plus dev viewer |
| Auth | `@jerryqiu/auth` | Auth.js, password, magic link, passcode | open sign-in only under `next dev` with a flag |
| Prints | `@jerryqiu/prints` (new) | `PrintProvider` (WHCC) | in-memory order book |
| Face search | `@jerryqiu/facesearch` (new) | `FaceSearchProvider` | deterministic fake matcher |
| E-sign | in `@jerryqiu/db` studio plus audit | typed signature, IP, hash | none needed |
| Cron | `apps/photos/vercel.json` plus `/api/cron/*` | secret bearer | run locally by script |

Rules: apps never import from other apps; `packages/*` never import from an app. No live third-party call is made without an env key and the owner enabling it.

## 3. Data model and route map

**Exists (migrations 0000 to 0002):** users, settings, media, galleries and gallery_items (portfolio), projects, pages, inbox_messages, audit_log, redirects, rate_limits, external_connections and external_cache (**dropped in PHOTO-M2**), studio_clients, studio_jobs, studio_galleries, studio_gallery_items, studio_favorites, studio_contracts, studio_invoices, studio_payments, studio_bookings, webhook_events.

**Additive migrations planned** (never edit an applied migration; run only on throwaway or local databases):

| Migration | Adds |
|---|---|
| 0003 `drop_shootproof` | drops external_connections, external_cache |
| 0004 `leads_calendar` | lead source, score, shoot type on jobs; availability_rules, blackout_dates, appointments |
| 0005 `commerce` | packages, add_ons, quotes, quote_lines, promo_codes, gift_cards, payment_plans, installments, refunds, tax_lines |
| 0006 `forms` | contract_templates, questionnaires, questionnaire_responses, releases, usage_rights |
| 0007 `portal` | client_accounts (password hash, magic tokens), notifications, messages, email_log, outbox |
| 0008 `galleries_v2` | albums, photo comments and ratings, download_events, view_events, selections, gallery expiry and reactivation fields, upload sessions |
| 0009 `store` | print_products, print_orders, digital_products, orders, order_items |
| 0010 `ops` | tasks, automations, automation_runs, expenses, mileage, gear, gear_bookings, team_members, call_sheets, drone_checklists, api_keys, webhook_endpoints |

**Routes today:** `/` `/about` `/book` `/portfolio` `/portfolio/[slug]` `/work` `/work/[slug]` `/video` `/privacy` `/sign-in` `/client` `/client/gallery` `/client/pay/[token]` `/client/sign/[token]` `/studio` `/studio/[section]`, `/api/{img/[id],img/token,contact,revalidate,webhooks/stripe,auth/*,authenticate}`, catch-all redirect page.

**Routes planned:** marketing `/features` `/how-it-works` `/packages` `/client-portal` (sample tour) `/galleries` `/prints` `/faq` `/contact` `/terms` `/accessibility` `/licensing`; booking `/book/[type]` `/book/confirm/[token]` `/embed/inquiry`; portal `/client/login` `/client/home` `/client/jobs/[id]` `/client/messages` `/client/questionnaire/[token]` `/client/gallery/[id]` `/client/store/[galleryId]` `/client/account`; studio sections (pipeline, calendar, quotes, packages, tasks, inbox, automations, reports, expenses, gear, team, settings, data export); API `/api/cron/*`, `/api/v1/*` (owner API key), `/api/ics/[token]`, `/api/upload/*`, `/api/download/*`.

## 4. Image protection (single policy)

Anything on a screen can be captured. These measures **deter casual copying and bulk scraping; they cannot stop a determined person capturing the screen.** Never claim "screenshot-proof"; keep this wording in owner-facing help.

Every photograph of the owner or a client, in the portfolio, home page, case studies, marketing pages, client galleries, prints and emails, is delivered like this:

- Originals are never served. Only derivatives (480, 960, 1600, 2400 px AVIF/WebP, GPS and personal EXIF stripped, copyright kept).
- Opaque ids in the HTML; the browser fetches bytes with a short-lived HMAC token bound to image, width and (for clients) viewer; blob rendering with a transparent shield; blur placeholder; the first image is preloaded.
- The image route refuses unsigned, expired, wrong-width and wrong-image tokens, scraper and AI user agents, and cross-site fetches; per-IP and per-image rate limits; `X-Robots-Tag: noai, noimageai`; `nosniff`; signed derivatives are cacheable at the CDN where the token allows.
- Right-click and drag blocked, selection off, print hides photographs, the screenshot guard dialog on capture shortcuts and blur on focus loss (strict tier).
- Client galleries add a per-viewer invisible watermark and a view log; a visible watermark policy per site and per gallery.
- The `off` and `light` tiers are removed. Single documented exception (owner-visible, in help text): UI illustrations that are not photographs, such as product screenshots drawn from sample data, may be plain images.
- Accessibility is kept: alt text always, focus order, screen-reader names.
- Tests: no direct file URL in the server HTML of any public page; every photograph element is a protected image; the image route refuses unsigned or expired requests.
- Uploads: magic-byte type sniffing, size limits, decompression-bomb limits, random ids, no predictable keys.
- Webhooks verified (signature, idempotency, replay window). Secrets only in env. Cookie posture: strictly necessary cookies only.

Limits to state plainly: OS screenshots, phone cameras and screen recorders are invisible to a page; devtools can read the bytes a page fetched; the real protection is small previews, traceability and visible watermarks.

## 5. Legal and compliance defaults

Draft pages (`/privacy`, `/terms`, `/licensing`, `/accessibility`), contract templates marked "sample only", ESIGN-style audit trail (signer, timestamp, IP, user agent, document hash, consent to electronic records), refund policy, gallery expiry and reactivation terms, model and property releases, minors default to the strictest access policy and a parent signature, data export and delete-my-data tools, event privacy opt-outs, CAN-SPAM footer and unsubscribe for non-transactional mail, card data never touches our servers. Face search (OPT) is consent-gated, off by default, mock only, with a legal check on biometric laws before any real integration. Owner note: tail numbers may be logged on the flying site if wanted; photos of minors are used sparingly and mostly already public, so do not over-engineer compliance here (but keep the mechanisms).

## 6. Feature table

Columns: id, feature, priority, status today (verified 2026-10-15), where it lives or will live, provider and mock, test, milestone.

### Acquire

| Id | Feature | Pri | Status | Where | Provider / mock | Test | Milestone |
|---|---|---|---|---|---|---|---|
| F-01 | Booking inquiry form creates a stored lead | P1 | partial (inbox stores it, no lead) | `/book`, `@jerryqiu/inbox` | email: Resend / outbox | e2e book | M4 |
| F-02 | Inquiry form per shoot type | P1 | missing | `/book/[type]` | n/a | e2e | M4 |
| F-03 | Embeddable inquiry widget | P2 | missing | `/embed/inquiry` (frame-ancestors allow-list) | n/a | e2e | M5 |
| F-04 | Lead source tracking (UTM, referrer) and lead score | P2 | missing | jobs.source, score | n/a | unit | M4 |
| F-05 | Availability and instant booking with deposit | P1 | missing | `/book/[type]`, calendar | Stripe / mock | e2e | M5 |
| F-06 | Mini-sessions and sale-day booking | P2 | missing | slots with capacity | n/a | e2e | M5 |
| F-07 | Waitlist | P2 | missing | appointments.waitlist | email | unit | M5 |
| F-08 | Referral codes | P2 | missing | promo_codes kind=referral | n/a | unit | M6 |
| F-09 | Gift cards | P2 | missing | gift_cards | Stripe / mock | unit | M6 |
| F-10 | Discount and promo codes | P2 | missing | promo_codes | n/a | unit | M6 |
| F-11 | Testimonials and reviews with consent | P2 | missing | publish-to-portfolio | n/a | e2e | M14 |
| F-12 | SEO pages and structured data | P1 | partial (sitemap, robots, JSON-LD on work) | all public pages | n/a | e2e | M11 |
| F-13 | Newsletter signup (own stream, unsubscribe) | OPT | missing | footer form | Resend / outbox | e2e | M12 |

### Sell

| Id | Feature | Pri | Status | Where | Provider / mock | Test | Milestone |
|---|---|---|---|---|---|---|---|
| F-20 | Package builder (deliverables, not editing hours) | P1 | missing | `/studio/packages`, `/packages` | n/a | unit | M6 |
| F-21 | Tiers plus a la carte add-ons, real standalone add-on prices beside bundles | P1 | missing | add_ons | n/a | unit | M6 |
| F-22 | Quotes and proposal pages, accept and pay | P1 | missing | `/client/quote/[token]` | Stripe / mock | e2e | M6 |
| F-23 | Mandatory fees in headline price, optional fees separate | P1 | missing | quote_lines.kind | n/a | unit | M6 |
| F-24 | Sales tax as its own line (Stripe Tax; mock rate) | P1 | missing | tax_lines | Stripe Tax / mock | unit | M6 |
| F-25 | Payment plans and installments | P1 | missing | payment_plans | Stripe / mock | unit | M8 |
| F-26 | Multi-currency display | P3 | missing | price formatter | n/a | unit | M6 |
| F-27 | Upsells at checkout | P2 | missing | quote page | n/a | e2e | M6 |
| F-28 | Print and product store (prints, albums, canvases, cards) | P2 | missing | `/client/store/[gallery]` | WHCC / mock | e2e | M13 |
| F-29 | Digital download sales | P2 | missing | digital_products | Stripe / mock | e2e | M13 |
| F-30 | Gallery extension and reactivation sales | P1 | missing | expiry flow | Stripe / mock | e2e | M10 |
| F-31 | Tips | P3 | missing | invoice pay | Stripe / mock | unit | M8 |
| F-32 | Abandoned-cart and unpaid-invoice reminders | P2 | missing | automations | email | unit | M12 |

### Contract and comply

| Id | Feature | Pri | Status | Where | Provider / mock | Test | Milestone |
|---|---|---|---|---|---|---|---|
| F-40 | Contracts: send, view, typed e-signature, one-time link, audit (timestamp, IP, hash) | P1 | done | `/client/sign/[token]`, studio | n/a | e2e studio | done |
| F-41 | Contract templates with merge fields; sample set marked for review | P1 | missing | contract_templates | n/a | unit | M7 |
| F-42 | Usage-rights and licence terms in contracts, licence tracker with expiry reminders | P1/P2 | missing | usage_rights | email | unit | M7, M14 |
| F-43 | Model and property releases, minors and parental consent | P2 | missing | releases | n/a | e2e | M7 |
| F-44 | Questionnaires and intake forms (builder, send, respond) | P1 | missing | questionnaires | email | e2e | M7 |
| F-45 | Gallery expiry and reactivation policy in the contract | P1 | missing | template clause | n/a | unit | M7 |
| F-46 | Privacy, terms, licensing, accessibility, cookie statement | P1 | partial (`/privacy` draft) | public pages | n/a | e2e | M11 |
| F-47 | Data export and delete-my-data tools | P1 | partial (admin export, contact erase) | studio and portal | n/a | e2e | M14 |
| F-48 | Event privacy opt-outs (hide specific people) | P2 | missing | gallery_items.hidden_for | n/a | unit | M14 |

### Payments

| Id | Feature | Pri | Status | Where | Provider / mock | Test | Milestone |
|---|---|---|---|---|---|---|---|
| F-50 | Own invoices, pay through Stripe Checkout, webhook updates | P1 | done (mock labelled when no key) | `/client/pay/[token]`, `/api/webhooks/stripe` | Stripe / mock | e2e studio (1 failing webhook test to fix) | M1 |
| F-51 | Deposits, retainers, recurring invoices | P1 | missing | invoices.kind | Stripe / mock | unit | M8 |
| F-52 | Refunds (Stripe) and cancel unstarted print order | P1 | missing | payments, refunds | Stripe / mock | unit | M8 |
| F-53 | ACH option | P1 | missing | checkout payment_method_types | Stripe / mock | unit | M8 |
| F-54 | Receipts by email, PDF invoices | P1 | missing | email templates | Resend / outbox | unit | M8 |
| F-55 | Manual mark paid (cash, Zelle, check) | P1 | done | studio invoices | n/a | e2e | done |
| F-56 | Optional card surcharge, default off | P2 | missing | settings | Stripe | unit | M8 |
| F-57 | Revenue reports from Stripe data, CSV export, tax-export | P2 | missing | `/studio/reports` | n/a | unit | M14 |

### Deliver

| Id | Feature | Pri | Status | Where | Provider / mock | Test | Milestone |
|---|---|---|---|---|---|---|---|
| F-60 | Private gallery with passcode, favourites | P1 | done | `/client`, `/client/gallery` | n/a | e2e studio | done |
| F-61 | Password, PIN and magic-link access modes | P1 | partial (schema only) | portal | Resend / outbox | e2e | M9 |
| F-62 | Direct-from-browser resumable uploads to Vercel Blob, dedupe by hash | P1 | missing | `/api/upload/*`, studio | Blob / local disk | e2e | M10 |
| F-63 | Pre-generated sizes (thumb, display, web, original) | P1 | partial (portfolio pipeline) | `@jerryqiu/media` | n/a | unit | M10 |
| F-64 | Albums and sets, slideshow | P1 | missing | albums, lightbox | n/a | e2e | M10 |
| F-65 | Proofing: comments, ratings, approvals, selection limits, send selection | P1 | partial (favourites only) | gallery page | n/a | e2e | M10 |
| F-66 | Downloads: web, full-res, ZIP, per-photo, PIN-gated, download log | P1 | missing | `/api/download/*` | n/a | e2e | M10 |
| F-67 | Gallery expiry, reminders, paid reactivation | P1 | missing | cron, reactivation page | Stripe / mock | e2e | M10, M12 |
| F-68 | Delivery status page with ETA | P2 | missing | portal job page | n/a | e2e | M9 |
| F-69 | Client notifications (gallery ready, viewed, favourited) | P1 | missing | automations | email | unit | M12 |
| F-70 | Per-viewer invisible watermark and view logs | P1 | partial (visible watermark only) | `@jerryqiu/media` | n/a | unit | M3 |
| F-71 | Per-gallery branding | P3 | missing | gallery settings | n/a | e2e | M10 |
| F-72 | Culling helpers: duplicates, blur, closed eyes | P3 | missing | studio uploader | cull mock | unit | M16 |
| F-73 | Face search (consent-gated, off by default) | OPT | missing | gallery settings | `FaceSearchProvider` / mock | unit | M16 |
| F-74 | Video delivery | P3 | missing | gallery video items | Blob | e2e | M16 |
| F-75 | Storage cost per gallery, auto-archive | P2 | missing | studio meter | n/a | unit | M14 |
| F-76 | Publish to portfolio with recorded consent | P2 | missing | gallery to portfolio | n/a | e2e | M14 |

### Client portal

| Id | Feature | Pri | Status | Where | Provider / mock | Test | Milestone |
|---|---|---|---|---|---|---|---|
| F-80 | One login: password, magic link, passcode | P1 | partial (passcode) | `/client/login` | email | e2e | M9 |
| F-81 | Portal home: jobs, galleries, contracts, invoices, questionnaires, messages, files | P1 | missing | `/client/home` | n/a | e2e | M9 |
| F-82 | Email thread and messages visible in portal; replies routed to a real inbox | P1 | missing | messages, email_log | Resend / outbox | e2e | M9 |
| F-83 | Self-reschedule and cancel within policy | P2 | missing | portal job page | n/a | e2e | M9 |
| F-84 | Notification preferences | P2 | missing | `/client/account` | n/a | e2e | M9 |
| F-85 | Branded email templates | P1 | missing | `@jerryqiu/email` | Resend / outbox | unit | M4 |

### Run the business

| Id | Feature | Pri | Status | Where | Provider / mock | Test | Milestone |
|---|---|---|---|---|---|---|---|
| F-90 | CRM: clients, contacts, notes, tags, history, segments | P1 | partial (clients with notes and tags) | `/studio/clients` | n/a | e2e | M5, M15 |
| F-91 | Visual pipeline and kanban (inquiry, booked, shot, editing, delivered, paid) | P1 | partial (step trail) | `/studio/pipeline` | n/a | e2e | M5 |
| F-92 | Calendar with availability, buffers, travel time, no double-booking | P1 | missing | `/studio/calendar` | n/a | unit | M5 |
| F-93 | `.ics` calendar feeds | P1 | missing | `/api/ics/[token]` | n/a | unit | M5 |
| F-94 | Tasks and reminders | P2 | missing | tasks | n/a | e2e | M12 |
| F-95 | Email templates and threads in studio | P1 | missing | `/studio/inbox` | Resend / outbox | e2e | M4 |
| F-96 | Automations: trigger, condition, action on Vercel Cron | P2 | missing | automations | cron | unit | M12 |
| F-97 | Shot lists and call sheets | P3 | missing | call_sheets | n/a | e2e | M15 |
| F-98 | Roles: second shooter, assistant; job assignment | P3 | missing | team_members | n/a | unit | M15 |
| F-99 | Gear inventory, double-booking warnings | P3 | missing | gear | n/a | unit | M15 |
| F-100 | Drone job checklist (Part 107, weather go/no-go) | P3 | missing | drone_checklists | weather: mock | unit | M15 |
| F-101 | Mileage and expense tracking with receipts | P2 | missing | `/studio/expenses` | Blob | e2e | M14 |
| F-102 | True hourly rate, revenue and storage-cost reports, dashboards | P2/P3 | missing | `/studio/reports` | n/a | unit | M14 |
| F-103 | Audit log | P1 | done | studio actions | n/a | e2e | done |
| F-104 | Backups, restore, full data export | P1 | partial (`db:backup`, zip export) | studio data page | n/a | unit | M14 |
| F-105 | Search across everything | P3 | missing | studio search | n/a | e2e | M15 |

### Platform quality

| Id | Feature | Pri | Status | Where | Test | Milestone |
|---|---|---|---|---|---|---|
| F-110 | Roles and sessions, rate limits | P1 | done (owner/editor, per-IP limits) | auth, db | unit | done |
| F-111 | Webhooks in (Stripe) and out (owner endpoints), owner API | P3 | partial (in only) | `/api/v1/*` | unit | M15 |
| F-112 | Notifications centre and activity feed | P3 | missing | studio | e2e | M15 |
| F-113 | Mobile-friendly photographer side, installable PWA | P1 | missing | studio CSS, manifest | e2e 390px | M5, M18 |
| F-114 | Dark and light themes | P1 | done | `@halation/ui` | e2e | done |
| F-115 | WCAG 2.2 AA, performance budgets (Lighthouse mobile 80+, CLS under 0.02) | P1 | partial | all | axe, lighthouse | M18 |
| F-116 | Error and health pages, seed and demo data | P1 | partial | `/api/health`, seed | e2e | M11 |
| F-117 | Marketing pages from this table (Live / Preview / Soon badges) | P1 | missing | `/features` etc. | e2e | M11 |

## 7. Marketing and showcase rules

`/` leads with the work (protected photographs), then the platform highlights. `/features` renders this table grouped, with a badge: **Live** (done), **Preview** (mock or partial), **Soon** (missing). The page reads `apps/photos/src/content/features.ts`, which is the single typed copy of this table, so pages cannot drift. No invented clients, testimonials, numbers or awards (`TODO(owner)`). Sample demos run on the mock layer, are labelled SAMPLE, and are off in production unless the owner enables previews. Prices are `$XX`.

## 8. Cost and vendor notes (re-verify prices before relying on them)

Vercel Pro about $20/month (includes Blob usage credit, cron). Neon free tier. Resend free tier (3,000/month) from a mail subdomain with SPF, DKIM, DMARC. Stripe: no monthly fee; card, ACH and Tax fees pass to clients; hosted-domain checkout page costs extra, so use the redirect or embedded form. WHCC: API credentials by request, sandbox first, no PO boxes, resolution rules 300 or 180 ppi, order only after payment confirmed, idempotent retries. Rekognition (OPT) roughly $0 to $5/month, not enabled. Set a Vercel spend budget (about $10) with pausing.
