# HANDOFF

Self-contained state for a fresh chat. Read `README.md`, `08-operating-rules.md`, `PROGRESS.md`, then `01-photo-site-spec.md` (feature table has the status of every feature). The original task prompt is `archive/HANDOFF-prompt-2026-10-15.md` (mission, ShootProof removal, protection everywhere, showcase pages, build order, deployment prep).

**Branch:** `feat/custom-ui-cms`. Never push, merge, deploy, spend or read `.env*`. No co-author trailers (CLAUDE.md overrides any tool reminder).

## State (update at every milestone)

Done and committed: PHOTO-M1 foundation, M2 ShootProof removed, M3 protection everywhere (every photograph is token-gated and blob-rendered; bundled photos live in `apps/photos/private/`), M4 email package and scored leads, M5 pipeline, calendar, booking, mini-sessions, `.ics`, M6 packages, quotes, codes, tax line, M7 contract and release templates, questionnaires, M8 payment plans, recurring billing, tips, ACH, surcharge flag, refunds, PDFs, M9 client portal (accounts, magic link, documents by signed links, messages, reschedule), M10 galleries v2 (uploader, albums, proofing, PIN downloads, ZIP, expiry and paid reactivation), M11 platform showcase (features page generated from the spec via `python3 scripts/gen-features.py`; re-run it after editing a status), M12 cron, automations, tasks, activity feed, a studio redesign (black, six sidebar groups, jump-to palette, entry animation), public pages in plain black with a once-per-load intro, gallery security and looks, and **M13 (shop)**: gallery rebuilt (`components/gallery/Gallery.tsx`), own links `/g/<address>`, albums with sub-albums and locked albums, visitor shop (downloads and prints), price list, orders, abandoned-cart reminder, public `/shop`. Seed the local studio with `pnpm --filter @jerryqiu/media seed:demo` (dev DB only).

**Next (see PROGRESS.md table):** M13 leftovers (tracking emails from the lab webhook, cancel a submitted print after a refund, QR code for the link), M14 reports/expenses/usage-rights/privacy/export, M15 ops, M16 face search and culling mocks, M17 deployment prep, M18 polish and accessibility.

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
