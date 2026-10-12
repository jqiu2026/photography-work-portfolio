# 11. Legal and compliance

**We build the pages, defaults and mechanisms. We do not give legal advice.** Every legal text written here is a **draft for professional review**. Mark each with a visible comment `TODO(owner): have a lawyer review` in the source (not on the live page) and list them in [QUESTIONS.md](QUESTIONS.md). Where a fact is unknown (legal entity name, address, jurisdiction, tax status), use a clearly marked placeholder.

## Hub (`jerryqiu.com`), Phase 1-2

| Item | What to build |
|---|---|
| **Privacy policy** | Plain-language: what is collected (contact form, analytics, logs), why, retention, processors (Vercel, Neon, Cloudflare, Resend), user rights (access, deletion; CCPA/GDPR-style), contact. Generated from the real data flows in the code; keep in sync. |
| **Terms of use** | Site use, intellectual property, no warranty, links, governing law placeholder. |
| **Copyright and licensing page** (`/licensing`) | All photos and writing are (c) Jerry Qiu, all rights reserved unless stated. How to request a license. Clear "do not use without permission". Per-image license field in the CMS (all rights reserved by default; allow CC options for chosen images). |
| **Takedown / contact** | A visible way to report misuse or request removal (email + form), response commitment. |
| **Accessibility statement** (`/accessibility`) | WCAG 2.2 AA target, known gaps, feedback contact. Keep honest. |
| **Cookies and analytics** | Use only cookieless analytics (Vercel Analytics/Speed Insights are privacy-friendly; confirm against current docs). Strictly-necessary cookies only (theme, session). If anything non-essential is ever added, add a consent banner first. Document in the privacy policy. |
| **People in photos** | The CMS image record has fields: `contains_people`, `release_on_file`, `minors` (boolean). Warn in admin before publishing images flagged as containing minors without a release; allow "needs review" status. Many existing projects (school events) feature students: default these images to `needs_review` and surface the list in admin. |
| **Third-party licenses** | `THIRD_PARTY_LICENSES.md` generated from dependencies (e.g. `license-checker`); no GPL/AGPL code in shipped bundles; fonts OFL or properly licensed; icons ISC/MIT; demo imagery owned or CC0. Record in docs. |
| **UI package licensing** | MIT, copyright holder placeholder `TODO(owner)`, `NOTICE` file when needed, no personal photos in the package repo. |
| **Contact form** | Consent line linking to the privacy policy; data minimization; retention setting; delete tool in admin. |
| **Security.txt** | `/.well-known/security.txt` with a contact. |
| **Metadata hygiene** | Strip GPS/personal EXIF from public derivatives; keep copyright/creator IPTC fields on served images (`Copyright`, `Creator`, usage terms URL) so attribution survives. |
| **AI/scraping stance** | `noai`/`noimageai` meta, `robots.txt` entries for known AI crawlers, a plain statement in `/licensing`. State honestly that this is a request, not enforcement. |

## Music and flying sites

- **Music:** the owner's own recordings and performances only. Covers of other people's songs have separate rights (mechanical/sync/streaming licensing); prefer linking to platforms (Spotify/YouTube/SoundCloud) via click-to-load embeds rather than hosting copyrighted recordings. Add a `rights` field per item (original, cover, licensed, third-party embed). Credit collaborators and venues. Photos/video of other performers need their consent: add a `needs_review` flag.
- **Flying:** do not present anything as flight instruction or aviation advice; add a short disclaimer on the site. Do not publish real-time location, tail numbers or exact times by default (safety and privacy); the CMS shows a "safe to publish" checklist for flight-log entries. Ratings, hours and certificates are published only if the owner supplies them and chooses to; never invent them. Respect rules of the clubs/schools mentioned and obtain permission for names/logos used.
- **All subdomains:** share the hub's privacy, terms, licensing and accessibility pages as canonical (linked absolutely in each footer); each site's analytics posture is stated; third-party embeds load only after click.

-- extra note from jerry: I'm not sure what the flying page will look like yet, but it would be fine to log tail numbers etc if i needed to. music page would just include my musical background and act like a music portfolio. 
-- also, im in a grey zone with displaying photos of minors. i of course will use them sparingly but i should be fine since i took those images and the rights transfer over to personal portfolio. the photos used are mostly all posted publicly anyways so no terrible difficiultuies. a lot taken when i was minor as well.  dont worry too much about legal and compliance for now.

## Studio (`photos.jerryqiu.com`), Phase 3 additions

(Documented here so Phase 2 designs leave room for them.)

- **Client terms and privacy** specific to galleries (retention of photos after expiry, who can view, download logs).
- **Contracts:** electronic signatures are generally valid in the US under ESIGN/UETA when intent, consent to e-records, attribution and record retention are captured. Capture and store: signer identity, timestamp, IP, user agent, document hash, consent-to-electronic-records checkbox, an audit trail PDF. Sample templates (wedding, event, portrait, licensing, model release, usage rights) are **sample only: lawyer review required**.
- **Releases and licensing:** the platform records the license granted per order (personal use vs commercial) and shows it on receipts.
- **Payments:** card data never touches our servers (Stripe Checkout/Elements, PCI burden stays with Stripe). Refund policy page. Sales-tax handling is the owner's responsibility; provide a toggle and export, and say so.
- **Data subject requests:** admin tool to export and delete a client's data (gallery access logs, favorites, contracts excepted where retention is legally required).
- **Children:** photos of minors default to the strictest access policy; clients under 13 cannot create accounts; parent/guardian signature on contracts.
- **Email:** CAN-SPAM compliant footers, unsubscribe for non-transactional mail, honest From name.

## Accessibility as a legal matter

ADA (US) and the European Accessibility Act increasingly apply to commercial sites. WCAG 2.2 AA is an acceptance criterion in Phase 1 and a regression gate (axe in CI).

## Checklist for Phase 1 / 2 acceptance

- [ ] `/privacy /terms /licensing /accessibility` exist, linked in the footer, draft status tracked in QUESTIONS.md
- [ ] security.txt, robots, AI-crawler policy
- [ ] No non-essential cookies; analytics posture documented
- [ ] `THIRD_PARTY_LICENSES.md` generated; no incompatible licenses
- [ ] Image records carry license and people/minors flags (Phase 2); EXIF policy implemented
- [ ] Contact form consent text and retention setting
- [ ] Admin delete-contact-data tool

## Added 2026-10-12: selling scores, studio services, flying map

Draft items for professional review (no legal advice): terms of sale and refunds for digital scores; what a score licence permits (personal study, performance, arrangement, redistribution); copyright notices on previews and delivered files, with a visible watermark on previews; consumer and sales-tax handling (Phase 3, with an accountant); privacy notice for purchasers, clients and enquirers; photography contract, model/property releases and minors rules (already flagged on media); flying map shows past flights only, airport-level and delayed, with no live location or tail numbers by default; if CFI services are ever offered, check the rules on advertising instruction and any insurance/certification claims before switching the slot on.

## Phase 2.5 note
Cross-site rule: photography, music and flying carry no legal links, only the `jerryqiu.com` return button; the hub keeps the canonical legal pages. Photography has its own short draft `/privacy` so the booking form's consent line stays on-site (Q45); music and flying get theirs when they collect data. Flight data: airport level, month precision, published at least 7 days after landing, no tail numbers, never live; enforced in `packages/mocks/src/flights.ts` (`publishable()`, tested) and to be kept by the real source. Mock data is clearly fake and labelled.
