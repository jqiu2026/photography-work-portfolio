# HANDOFF

Self-contained state for a fresh chat. Read `README.md`, `08-operating-rules.md`, `PROGRESS.md`, then `01-photo-site-spec.md` (feature table has the status of every feature). The original task prompt is `archive/HANDOFF-prompt-2026-10-15.md` (mission, ShootProof removal, protection everywhere, showcase pages, build order, deployment prep).

**Branch:** `feat/custom-ui-cms`. Never push, merge, deploy, spend or read `.env*`. No co-author trailers (CLAUDE.md overrides any tool reminder).

## State (update at every milestone)

Done and committed: PHOTO-M1 foundation, M2 ShootProof removed, M3 protection everywhere (every photograph is token-gated and blob-rendered; bundled photos live in `apps/photos/private/`), M4 email package and scored leads, M5 pipeline, calendar, booking, mini-sessions, `.ics`, M6 packages, quotes, codes, tax line, M7 contract and release templates, questionnaires, M8 payment plans, recurring billing, tips, ACH, surcharge flag, refunds, PDFs, M9 client portal (accounts, magic link, documents by signed links, messages, reschedule), M10 galleries v2 (uploader, albums, proofing, PIN downloads, ZIP, expiry and paid reactivation), M11 platform showcase (features page generated from the spec via `python3 scripts/gen-features.py`; re-run it after editing a status), M12 cron, automations, tasks, activity feed, a studio redesign (black, six sidebar groups, jump-to palette, entry animation), public pages in plain black with a once-per-load intro, gallery security and looks, and **M13 (shop)**: gallery rebuilt (`components/gallery/Gallery.tsx`), own links `/g/<address>`, albums with sub-albums and locked albums, visitor shop (downloads and prints), price list, orders, abandoned-cart reminder, public `/shop`. **Client access:** there is no client login. A client opens `/g/<address>` (the passcode is asked on that page); the old `/client*` pages redirect home except the emailed document links (`pay`, `quote`, `sign`, `questionnaire`, `download`). Studio navigation is six groups (see `components/studio/sections.ts`). Plans live in `packages/db/src/plan.ts`. Seed the local studio with `pnpm --filter @jerryqiu/media seed:demo` (dev DB only).

**Done 2026-10-23 (see PROGRESS log, Q124 to Q132):** the owner request batch, expenses and mileage, testimonials with consent, gear, call sheets, usage-rights tracker, newsletter list, studio search, installable manifest.

**Also done (round two):** team roles, print store (sample WHCC catalog), download sizes, privacy requests, drone checklist, outgoing webhooks, publish to portfolio, release prep.

**Next (see PROGRESS.md table):** M13 leftovers (tracking emails from the lab webhook, cancel a submitted print after a refund; the QR code for the link is done), M14 rest (revenue and true-hourly-rate reports, storage cost in money, data export and delete), M15 rest (the owner REST API with keys), M16 face search, culling and video mocks, M17 deployment prep, M18 polish and accessibility (axe on the new pages: /book questionnaire, studio Expenses, Gear, Call sheets, Rights, Subscribers, Testimonials).

**Studio tests read toasts:** use `note(page)` from `e2e-admin/ui.ts` (toast or status element), not `getByRole("status")`; the toast's Dismiss button label repeats its text, so `getByLabel("Email")` can match it: use `getByRole("textbox", { name })`.

## UI: Holominimal (2026-10-18)

The whole photo site is on Holominimal (`@holominimal/ui`, vendored build in `packages/holominimal`; rebuild in `~/Documents/holominimal` and re-copy `dist` to update). There is no `--hl-*` bridge and no Halation stylesheet any more.

- **Frames:** public `PublicChrome` (AppShell, Atmosphere, PublicDock; `Shell cta={false}` hides the booking button), studio `StudioChrome` (AppShell, Dock, `CommandPalette` jump-to).
- **Pages** import from `components/ui.tsx` (Container, Section, Heading, Field with `required`, plus re-exports). Shared pieces there: `FormMessage` (a form's error or confirmation, role alert/status) and `ResultCard` (the end of a client document flow). Inner public pages start with `components/PageHeader.tsx`.
- **Studio:** `StudioFrame.tsx` holds `StudioHead` (PageHeader and PageTabs), `Banner` (Alert, with `CopyLink`), `Card` (section surface), `statusTone()` and `useConfirm()` (Holominimal alert dialog; no `window.confirm` left; which actions ask is Q91). Layout CSS: `studio.css`, `studio-dashboard.css`, `gallery-manager.css`, `galleries.css`, all `--hm-*` only.
- **Client gallery:** `components/gallery/Gallery.tsx` and `gallery.css`. The four gallery themes re-point `--hm-*` tokens on `.gx.hm-theme` (Q80); the lightbox is always dark (`data-hm-scheme="dark"`). Feedback is the `Notice` (Q81).
- **Protection:** `components/media` (in the app, no Halation): `ProtectedImage` (token-fetched blob, shield, fade-in), `ProtectedGallery` and `ProtectedViewer` (Holominimal lightbox frame), `ScreenshotGuard`/`GuardScope` (reminder is a Holominimal alert dialog; `<html>` state classes `pm-guard-*`). CSS: `app/protection.css`. Unit tests: `test/media.test.tsx`.
- **Home:** `components/home/HomeJourney.tsx` + `home.css`, animated on purpose. One scroll engine (`useScrollStory`) writes `--p` to every `[data-scroll]` element (`pin`, `center`, `pass`, `track`) and `[data-live]` near the screen (runs the CSS loops). The pinned hero (300vh) deals seven prints into a collage, then scatters them as "Here's how it works" and the six step cards rise; prints drift with the mouse. Work rows tilt and slide; each step flies in (copy slides and unblurs, mockup swings in in 3D, number ring fills) along a rail that fills; mockups loop (`useCycle`): pointer choosing a package, days and times picked, viewfinder focus hunt and shutter flash, edit wipe and sliders, hearts and a selection count, a swaying print and a download bar. Holominimal `Cursor` on the page. Phones: nothing pinned. Reduced motion: no pin, no loops, no cursor. Steps never fade by opacity (axe reads contrast through it). `Shell intro` hides the dock and top bar until `[data-bar-end]` (ChromeReveal, Q92).
- **Studio nav:** seven groups, at most six tabs (Q88); the dock shows groups only, the page header shows the tabs. Status badges use `statusTone()` from `StudioFrame.tsx`; studio forms (`.st-form`) lay short fields side by side.
- **Tests:** `e2e-admin/ui.ts` has `choose(control, label)`, which picks an option in a native select or a Holominimal Select by its visible label. Holominimal Select options have no value attribute, so specs use labels.
- Dev check without the e2e setup: `scripts/shot.mjs`; for gated screens a Playwright script can fill the gallery passcode first.

## How to work here

- Gates: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e` (prod builds, 4000 to 4004), `env -u NEXT_PUBLIC_HUB_URL pnpm test:admin` (dev servers 3300+, throwaway DB; keep NEXT_PUBLIC_*_URL unset). Run a single admin spec with `pnpm exec playwright test -c playwright.admin.config.ts e2e-admin/<file>`.
- Migrations: edit `packages/db/src/schema.ts`, run `pnpm db:generate --name <x>` from the repo root; never edit an applied migration.
- Studio sections are components in `apps/photos/src/components/studio/*View.tsx` wired in `app/studio/[section]/page.tsx` and `components/studio/sections.ts`; actions use `lib/studio-run.ts` (`studio(...)`).
- Email: `@jerryqiu/email` (mock outbox in dev; every send in `email_log`, shown in Studio Inbox). Client documents open by link token, or by `portalRef`/`resolveRef` capability links from the signed-in portal.

## Gotchas

- Port 3001 is an unrelated project; docs app on 3010. `pnpm` 12.11.2; macOS `sed -i ''`.
- React 19 resets uncontrolled form fields after a `<form action>` finishes: use `onSubmit` + transition (see `useServerForm` in `components/portal/PortalForms.tsx`) or controlled fields.
- Gallery pages: the visitor session is the same signed cookie as the client's (`PortalSession.r = "v"`); proofing actions require `a.role === "client"`. A locked album's photographs are filtered with `lockedMediaIds` everywhere (page data, downloads, image tokens). A shop order is an invoice of kind `shop`; paid orders are finished in `lib/shop-fulfil.ts` (called from `afterPayment`).
- Playwright: `getByLabel` is substring-matched and also matches `aria-label` on forms: scope to the form (`getByRole("form", { name })`) or use `exact`.
- Dev `unstable_cache` staleness makes `e2e-admin/public.spec.ts` tests 2 and 3 flaky (pre-existing).
- A stale `apps/photos/.next/types` breaks typecheck after deleting routes: `rm -rf apps/photos/.next/types`.
- Public e2e rate limits are per IP; the image route allows 900 requests per minute per IP.

## Owner to-do (keys and accounts)

See PROGRESS.md "Owner to-do". Nothing has been created or spent.
