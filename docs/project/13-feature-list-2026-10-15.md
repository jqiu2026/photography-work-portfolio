# 13. Platform feature list (owner plan, 2026-10-15)

Hostname: `photo.jerryqiu.com` is canonical; `photos.jerryqiu.com` redirects to it (Q57).

Planned in a separate chat and recorded here as the **current feature wishlist** for jerryqiu.com, the studio/business portal and the gallery revamp. It does not start any work: Phase 3 rules in [04](04-phase-3-photo-business-platform.md) and [08](08-operating-rules.md) still apply (no live keys, no spending, no push or deploy without the owner). Where this list differs from earlier docs, the difference is listed under "Differences from existing docs" and logged in [QUESTIONS.md](QUESTIONS.md) (Q51 to Q61) with the default in use.

Phase tags: **P1** launch, **P2** next, **P3** later, **OPT** optional. These are priorities inside this list, not the same as the repo's Phase 1/2/2.5/3.

Caveats from the plan: not legal or tax advice. Stripe Tax calculates sales tax, but registering and filing stay with the owner unless Tax Complete is used. Check surcharge and biometric rules for the states where the owner works. See [11](11-legal-and-compliance.md).

## 1. Stack and monthly cost

- Vercel Pro (app, cron jobs, Blob storage, CDN): $20/mo, includes $20 usage credit
- Neon Postgres (free tier) for CRM data
- Resend (free tier, 3,000 emails/mo), sent from a mail subdomain
- Stripe for payments, invoicing and tax calculation (section 5)
- WHCC for print fulfillment (API credentials by request)
- AWS Rekognition for face search (OPT, roughly $0 to $5/mo)
- Estimated fixed cost: about $20 to $28/month, plus Stripe and WHCC fees per sale
- Vercel spend budget set around $10 with pausing enabled

## 2. Leads and booking

- P1 Embeddable inquiry form on jerryqiu.com that creates a lead
- P1 Visual pipeline: inquiry, booked, shot, editing, delivered, paid
- P1 Booking calendar with availability, buffers and no double-booking
- P1 Calendar links (.ics) instead of Google Calendar sync

## 3. Packages, quotes and pricing

- P1 Package builder that lists deliverables (coverage hours, edited images, gallery time), not editing hours
- P1 Tiered packages plus a la carte add-ons (extra images, rush delivery, travel, second shooter, additional retouching)
- P1 Real standalone add-on prices shown next to bundles (for example, Plus = Standard + $20 includes a gallery extension that sells for $30)
- P1 Quotes and proposals
- P1 Mandatory fees included in the headline price; optional fees shown separately
- P1 Sales tax shown as its own line, calculated by Stripe

## 4. Contracts and forms

- P1 Contract templates with typed e-signature and an audit trail (timestamp, IP, document hash)
- P1 Customizable questionnaires sent before a shoot
- P1 Usage-rights and license terms in contracts
- P1 Gallery expiry and reactivation policy written into the contract

## 5. Payments, invoicing and tax (handled by Stripe)

- P1 Stripe handles payment processing and sales tax calculation; the platform builds no card, bank or tax-calculation logic and reads payment status from Stripe webhooks to update the pipeline and client portal
- P1 Own invoices, deposits and retainers, and recurring invoices in our database, paid through Stripe (Stripe Invoicing is not used, so its per-invoice fee is avoided); payment plans built as scheduled payments on our side
- P1 Card payments through an embedded Stripe form on the owner's own domain (a Stripe-hosted page on the owner's domain costs $10/mo)
- P1 ACH bank payment option (0.8%, capped at $5)
- P1 Sales tax calculated and itemized by Stripe Tax (0.5% per transaction without code, or $0.50 per transaction through the API, only where registered); registering and filing stay with the owner unless Tax Complete (from $90/mo)
- P1 Refunds issued in Stripe; the platform cancels any unstarted print order (confirm WHCC's cancellation rules)
- P2 Optional labeled credit-card surcharge, only if Stripe supports it for the account (default off): credit cards only, never debit, capped at the lower of 3% or actual cost, advance notice to the card networks, disclosed before sale, not allowed in states that ban it
- P2 Revenue reports built from Stripe data
- P2 In-house expense tracking (categories, receipts, per-job costs) that feeds the true-hourly-rate report
- P2 CSV export of Stripe revenue and expenses for the accountant or tax software
- Income tax prep (deductions, estimates, filing) is handled outside the platform by an accountant or tax software

## 6. Client portal

- P1 One login per client: password account or emailed magic link (owner decision, Q53)
- P1 Contracts, invoices, questionnaires, messages and galleries in one place
- P1 Full email thread visible in the portal
- P1 Branded emails
- P2 Delivery status page: where my photos are, with an ETA

## 7. Galleries and storage

- P1 Private and password-protected galleries
- P1 Direct-from-browser uploads to Vercel Blob (about 500 GB planned; Blob only, no R2)
- P1 Pre-generated sizes (thumbnail, display, web, original) so image-optimization charges are avoided
- P1 Favorites, proofing and comments
- P1 Downloads in web size and full resolution, plus ZIP downloads
- P1 Private delivery for client galleries
- P1 Gallery access included for a set period (for example 3 months), then paid extension (for example $30 per additional 3 months)
- P1 Expiry reminders and a paid reactivation flow through Stripe
- P2 Storage cost per gallery, with auto-archive of old galleries
- P2 Publish to portfolio: one toggle to put an approved gallery or testimonial on jerryqiu.com, with client consent recorded

## 8. Face search (OPT, opt-in)

- OPT Off by default, enabled per gallery
- OPT Consent screen with retention date, and a consent log (time, gallery, consent text version; no face data)
- OPT A separate Rekognition collection per gallery, deleted after the retention period, plus a manual delete button
- OPT Selfie processed in memory and never stored
- OPT Disabled for school and minor galleries unless a parent consents
- OPT No separate fee for face search (bundle into normal pricing; check with a lawyer first)

## 9. Prints and store (WHCC)

- P2 Print store with the owner's markup over WHCC wholesale
- P2 WHCC Order Submit API: request API credentials from WHCC and build against their sandbox first. Flow: images reachable by URL, authenticate, import a JSON order, check the response, confirm with the ConfirmationID, then receive webhooks
- P2 Drop-shipped to the client across North America, no PO Box addresses; the order minimum is reportedly waived for drop-shipping (confirm with WHCC)
- P2 Resolution check: WHCC wants 300 or 180 ppi files, so hide products when the image is too small
- P2 Margin check against WHCC pricing so the markup covers wholesale, shipping and Stripe fees
- P2 Send the order to WHCC only after Stripe confirms payment, with idempotent retries
- P2 Time-limited signed links for the image files
- P2 Tracking updates from WHCC webhooks shown in the client portal
- P2 Wholesale billed through the owner's WHCC account (confirm terms with WHCC)
- P2 Shipping shown as its own line; tax calculated by Stripe
- OPT WHCC Editor API for white-label product design (currently flat cards with foil and shapes)

## 10. Email and automation

- P1 Resend on a mail subdomain with SPF, DKIM and DMARC
- P1 Email templates for confirmations, invoices and gallery-ready notices
- P2 Triggered reminders: payment due, pre-shoot questionnaire, post-shoot thanks, gallery expiring
- P2 Scheduled jobs through Vercel Cron, protected by a secret
- P1 Replies routed to a real inbox
- OPT Unsubscribe link and separate stream if newsletters are ever sent
- OPT AI draft replies in the owner's voice, approved by the owner before sending

## 11. Business insights

- P3 True hourly rate per job (shoot, travel, editing and admin time against the fee)
- P3 Storage and usage cost reporting

## 12. Compliance and trust

- P2 Usage-rights tracker with license terms, expiry and reminders
- P2 Event privacy controls: opt-out lists that hide specific people's photos in event galleries
- P1 Terms page covering gallery expiry, reactivation fees and add-on prices
- P1 Open data export: contacts, contracts, invoices and gallery originals in standard formats

## 13. Operations

- P3 Roles and permissions for assistants and second shooters, with job assignment and team scheduling
- P3 Gear checklists per job, with conflict warnings when equipment is double-booked
- P3 Drone job checklist: airspace and authorization notes, weather go/no-go (Part 107)
- P1 Mobile-friendly photographer side

## 14. Public site (jerryqiu.com)

- P1 Portfolio and gallery showcase
- P1 Inquiry form tied to the pipeline
- P2 Testimonials published with consent

## Suggested build order

1. Email setup, inquiry form, pipeline and booking
2. Contracts, Stripe invoicing and payments, and the client portal
3. Galleries, expiry and reactivation
4. Reminders and automation, prints and WHCC fulfillment, reports
5. Face search (after the consent flow and a legal check), then insights and operations features

## Owner decisions (2026-10-15)

Layout and hosts: see [14](14-sites-and-deployment.md). Each site is its own Vercel project from the same repo, locked to its app folder plus a shared master folder. Costs are capped at about $20/month (Vercel Pro).


Made after reviewing this list; they override the list where they differ.

- **Storage:** Vercel Blob only. Vercel Pro's included usage should cover it, so Cloudflare R2 is not used (Q51).
- **Payments:** Stripe is the payment rail only. We build our own invoices, quotes and payment records in our database (not Stripe Invoicing). Tax is shown at checkout, but nothing after collection: no filing, IRS reporting or tax prep (Q52).
- **Client login:** account with password **and** magic link; the gallery passcode link stays (Q53).
- **WHCC:** set it up with placeholder URLs, IDs and credentials (clearly marked, for example `https://whcc.example/placeholder`), behind a mock. Real values come from the owner later (Q54).
- **Face search:** set up the consent flow, flags and provider interface with placeholder links and a mock; no AWS integration and a legal check first (Q55).
- **Prices:** every package, add-on, extension and print price in the product is a placeholder (shown as `$XX` or sample numbers labelled SAMPLE) until the owner sets real ones. The examples in section 3 (Plus = Standard + $20, $30 extension) are illustrations only (Q61).
- **Cost:** website-only costs up to about $20/month. Stripe and WHCC fees are passed to clients, not paid out of pocket (Q56). Pass-through is done in pricing or as a disclosed line; the card surcharge (section 5, P2) stays default off.
- **Host:** `photo.jerryqiu.com`, with `photos.` redirecting to it (Q57).

## Differences from existing docs

| Topic | Existing docs / code | Now |
|---|---|---|
| Storage | A15: R2 for originals, Blob for public derivatives | Blob only (Q51); update A15 and the cost table |
| Invoicing and tax | 04 3.5 in-house invoice builder; invoices in the DB already | Same as built: own invoices, Stripe for payment, tax at checkout only (Q52) |
| Client login | Passcode session (built) | Password plus magic link plus passcode link (Q53) |
| Prints | 3.3 manual fulfillment | WHCC set up with placeholders behind `PrintProvider` and a mock (Q54) |
| Face search | Not in scope | Foundation behind `FaceSearchProvider` and a mock (Q55) |
| Cost | 06: about $0.30 to $2 beyond Vercel | Up to about $20 website-only; fees passed to clients (Q56) |
| Host | `photos.jerryqiu.com` | `photo.jerryqiu.com`, `photos.` redirects (Q57) |

Also new relative to earlier docs: package builder and quotes with add-on pricing, gallery expiry with paid extension and reactivation, expense tracking and the true-hourly-rate report, usage-rights tracker, event privacy opt-outs, publish-to-portfolio with recorded consent, and gear, drone and team operations (P3).

## Where it maps in the existing plan

- Leads, pipeline, booking, portal, contracts, invoices: 04 sections 3.1, 3.4, 3.5, 3.6 (already partly built on this branch in P3-M1 and the studio commit).
- Galleries, expiry, proofing, downloads: 04 section 3.2.
- Store and prints: 04 section 3.3, extended by section 9 above.
- Email and cron: 04 section 3.2 notifications and 3.8 ops.
- Compliance and data export: 04 section 3.8 and [11](11-legal-and-compliance.md).
