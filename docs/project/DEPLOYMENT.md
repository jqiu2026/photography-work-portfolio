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
