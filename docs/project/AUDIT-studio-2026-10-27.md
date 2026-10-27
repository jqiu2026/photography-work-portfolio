# Studio audit, 2026-10-27

Scope: the studio (owner side of `apps/photos`). Method: every studio page opened in a browser at 1440 and 390 px
against a throwaway database with the demo data (`seed`, `seed:demo`), axe (WCAG 2 A/AA, 2.2 AA) on every page and every
gallery workspace tab, keyboard pass on Clients, empty-form submits, then a read of the code behind each flow.
No console errors on any page; every page answered 200 in under 1.2 s on dev (galleries 2.8 s on first compile).

Ranked by impact. **Fixed** items name the commit topic; the rest are open, with the reason.

## UX problems

| # | Problem | Where | Status |
|---|---|---|---|
| U1 | An invoice made by mistake can never be voided. It stays "unpaid", inflates the dashboard total and the cron keeps sending the client reminders for it. | Sales, Invoices | **Fixed**: Void (asks first; only while nothing is paid) |
| U2 | Inquiries are a dead end: the only action is Convert to client. Spam or a lead you turn down stays "new" forever and keeps "N new inquiries" on the dashboard. The `archived` status existed but nothing set it. | Clients, Inquiries | **Fixed**: Archive and Restore |
| U3 | A shoot cannot be edited (title, date, place, fee), moved back after a mis-click on Next step, or cancelled (the `cancelled` stage existed but nothing set it). | Shoots, List | **Fixed**: Edit shoot dialog with the stage, Cancelled group |
| U4 | Dashboard "N unpaid invoices, $X due" and the Invoices total count drafts nobody has been sent and use the full total even when part is paid. | Dashboard, Invoices | **Fixed**: only sent, viewed and part-paid invoices, by balance; drafts counted apart |
| U5 | Invoice cards show the shoot but not the client, the due date or whether it is overdue. | Invoices | **Fixed**: client, due date, Overdue badge, balance when part-paid |
| U6 | "Mark paid (cash, Zelle)" moves money with one click and no confirmation (Q91 says money actions ask first). Refunded invoices still showed Mark paid and New payment link. | Invoices | **Fixed**: asks with the amount; refunded invoices have no pay actions |
| U7 | Messages say "job" where every screen says "shoot" ("Job added", "Job is now booked", "Unknown job."). | studio actions | **Fixed** |
| U8 | Gallery Branding, Layout picker: the five layout cards render on the browser's grey button face (axe: 5 contrast failures). | gallery workspace | **Fixed** |
| U9 | Calendar month uses `role="grid"` without rows or arrow-key support (axe: 36 ARIA failures); day names are read as "2026-10-29". | Shoots, Calendar | **Fixed**: plain labelled buttons, spoken dates |
| U10 | No single client page with their shoots, invoices, galleries and emails (spec F-90 "history"). Today you piece it together from five pages. | Clients | Open, Q161 (bigger build) |
| U11 | A contract sent in error cannot be voided (the `void` status exists). | Contracts | Open, Q162 |
| U12 | On phones the section strip scrolls sideways with no hint that Reports and Studio are off screen; "Jump to ⌘K" shows a key hint on touch devices. | studio chrome | Open, low impact |
| U13 | Focus ring is a 1 px outline: visible (2.4.7 passes) but faint on the dark theme. | Holominimal | Open: library-wide, not a studio change |
| U14 | Branding accent swatch shows white while the field is empty. | gallery workspace | Open, cosmetic |

## Engineering problems

| # | Problem | Where | Status |
|---|---|---|---|
| E1 | Mark paid records the **full total** even when part was already paid by card, so a part-paid invoice ends up over-collected in the books and reports. The server also accepted void or refunded invoices, and looked the invoice up by loading every invoice. | `markInvoicePaidAction` | **Fixed**: `st.markInvoicePaidManually` records the balance, refuses closed invoices; unit tests |
| E2 | Clients, Shoots, Inquiries, Invoices, Contracts and Email log each loaded all eight record lists plus the media list, then ran one query per gallery that fetched every photo row only to count it. The count fed `StudioApp`, a 505-line view no route reaches any more. | `app/studio/[section]/page.tsx` | **Fixed**: each page loads only its own lists; `StudioApp.tsx` removed |
| E3 | `sendInvoice` re-opened a refunded invoice as "sent". | `packages/db/src/studio.ts` | **Fixed** with E1 |
| E4 | All galleries page: one `galleryContents` query per gallery without a cover, run in sequence, loading all items to take the first. | galleries section | Open: fine at today's size; one grouped query when galleries pass ~100 |
| E5 | Owner's local dev database (`~/.jerryqiu-dev/pglite`) aborts on open (PGlite WASM abort). Not touched; the audit used a throwaway copy. | local env | Open, see HANDOFF |

Checked and fine: studio document view and PDF routes check the role; every studio action goes through `guarded` with a
role and audit; upload routes sniff types; no `window.confirm` left; empty forms answer with a toast naming the field.

## Missing features a working photographer expects (not already in the spec)

| Feature | Fits the platform because | Status |
|---|---|---|
| Void an invoice | Mistakes happen and reminders must stop | **Built** (U1) |
| Archive an inquiry | Leads you turn down must leave the queue | **Built** (U2) |
| Cancel or reschedule a shoot | Shoots get cancelled; the stage list already had it | **Built** (U3) |
| Overdue invoices at a glance | Chasing money is the most common studio task | **Built** (U5) |
| A polite "not a fit" reply when archiving | Saves typing the same email | Q163, not built |
| Duplicate a gallery's settings to a new gallery | Wedding photographers reuse one look | **Built** after the owner's answer (Q164): Duplicate… asks whether to carry the photographs, which are shared, never stored again |
| Never store the same file twice; rename a different picture with a taken name | Owner rule (Q168) | **Built**: exact copies skipped everywhere, same-name clashes renamed and reported |

## Verification

Lint and typecheck clean; unit tests green (4 new db tests: manual payment by balance, void, edit shoot, archive
inquiry); `pnpm test:e2e` 304 passed; `pnpm test:admin` passed except one intermittent click in
`galleries-security.spec.ts` that passes alone (see HANDOFF). New `e2e-admin/records.spec.ts` covers edit and cancel a
shoot, Mark paid with its confirm, Void, and archive and restore an inquiry. Screenshots: `screenshots/audit-2026-10-27/`.
