# DEPLOYMENT: owner checklist (nothing here is done by Claude)

Claude must never deploy, change DNS, create Vercel projects, or buy anything. This is the manual checklist for the owner, to be refined as the code lands.

## Hostnames and projects

| Hostname | Vercel project | App | Notes |
|---|---|---|---|
| `jerryqiu.com`, `www.jerryqiu.com` | `jq-hub` | `apps/web` | Root directory `apps/web` |
| `music.jerryqiu.com` | `jq-hub` | `apps/web` | Same project, extra domain. `proxy.ts` rewrites to `/music` |
| `flying.jerryqiu.com` | `jq-hub` | `apps/web` | Same project, extra domain. `proxy.ts` rewrites to `/flying` |
| `photos.jerryqiu.com` | `jq-photos` | `apps/photos` | **Currently ShootProof.** Switch only after Phase 3 migration is verified |

Both projects live under the one Vercel Pro plan. Use preview deployments on the `*.vercel.app` URLs first. Do not point `photos.jerryqiu.com` at Vercel before the studio has replaced everything ShootProof does for you.

## Environment variables (names only; see each app's `.env.example`)

`AUTH_SECRET` (same value in both projects), `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `ADMIN_EMAILS`, `DATABASE_URL` (Neon), `STORAGE_*` (R2 / Blob), `RESEND_API_KEY`, `IMAGE_TOKEN_SECRET`, `NEXT_PUBLIC_HUB_URL`, `NEXT_PUBLIC_PHOTOS_URL`, `NEXT_PUBLIC_MUSIC_URL`, `NEXT_PUBLIC_FLYING_URL`, `SHOOTPROOF_CLIENT_ID/SECRET` (once ShootProof grants API access), Stripe keys (Phase 3).

## Steps (rough order)

1. Create the Neon database, the R2 bucket (private) and a Blob or public bucket for derivatives. Create a Resend key. Put values in Vercel env, never in git.
2. Google Cloud: OAuth client (internal to the Workspace if possible), authorized redirect URIs for each hostname's `/api/auth/callback/google` ([google-oauth-setup.md](google-oauth-setup.md) once written).
3. Vercel: create `jq-hub` and `jq-photos` from the repo (production branch decision is yours; this work stays on `feat/custom-ui-cms` until you merge). Add domains to `jq-hub`. Add DNS records at your DNS host (CNAME to Vercel). Leave `photos.` untouched until cut-over.
4. Run migrations and the import script against the production database (documented in the owner guide).
5. Vercel Firewall: rate-limit rules, bot protection; Cron for expiry and cleanup jobs.
6. Search Console / sitemap submission for each hostname.
7. **Cut-over of `photos.jerryqiu.com`** (Phase 3 only): verify import from ShootProof, keep ShootProof active for a grace period, lower DNS TTL, switch the record, test, then cancel ShootProof.
8. Do not leave unused subdomains dangling in DNS (takeover risk).

## Costs to expect

See [06-cost-analysis.md](06-cost-analysis.md).

## Added in Phase 2 (environment names; values come from you)

| Name | Where | What it does |
|---|---|---|
| `CRON_SECRET` | hub and photos | 16+ random characters. Vercel Cron sends it as a bearer token. Without it the daily trash purge (`apps/web/vercel.json`) and hourly ShootProof expiry (`apps/photos/vercel.json`) refuse to run. |
| `REVALIDATE_SECRET` | hub and photos (same value) | Lets the hub refresh the photography site's cache after a CMS change. Without it the photography site updates within its 1-hour cache. |
| `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` | hub and photos | Email notification for contact messages. Without them messages are still stored in the Inbox. |
| `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | optional | Free spam check on the contact form. |
| `IMAGE_TOKEN_SECRET` (+ `IMAGE_TOKEN_SECRET_PREVIOUS` when rotating) | hub and photos (same value) | Signs the short-lived image tokens for strict galleries. Falls back to `AUTH_SECRET`. |
| `SHOOTPROOF_CLIENT_ID` (+ optional `SHOOTPROOF_SCOPE`, `SHOOTPROOF_IMAGE_HOSTS`) | photos | Turns the ShootProof bridge on. See `docs/shootproof-bridge.md`. |

Manual steps in Vercel: add a Firewall rule rate-limiting `/api/img/*` and `/api/contact`; keep unused subdomains out of DNS (subdomain takeover); run the database migration once (`pnpm db:migrate`) against the production `DATABASE_URL`.


## Project move (Phase 2.5, R1)
Case studies (projects) now belong to the photography site. The hub's `/work` and `/work/:slug` send a 301 to `NEXT_PUBLIC_PHOTOS_URL` (set it on the **hub** project too, not only on photos). Run `pnpm --filter @jerryqiu/db migrate` once per database: migration `0001_projects_to_photos` moves existing project rows from `hub` to `photos` (idempotent). The seed also adds redirect rows for the old hub URLs as a fallback the hub's 404 page reads. `REVALIDATE_SECRET` must be the same on both projects so saving a project in the admin refreshes the photography site.

## Mocks in production (Phase 2.5, R5)
Mock routes (studio sections, client portal pages, score store, flight map) are **404 in production builds**, and their navigation links are hidden. Set `ENABLE_MOCKS=true` on a preview deployment only if you want to demonstrate them; there are no live keys or network calls in the mocks. `/flying/instruction` is a 404 unless the `flying.instruction.enabled` setting is true (Q49).

## Hub redirects and the photography URL
The hub's `next.config.mjs` redirects `/work` and `/work/:slug` (301) to `NEXT_PUBLIC_PHOTOS_URL`; set it on the hub project. The seed also adds fallback rows in the Redirects table (editable in the admin).
