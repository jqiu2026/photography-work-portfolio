# 02. Sites and deployment

Merged 2026-10-15 from the old 14, DEPLOYMENT and PUBLISHING (archived). **Claude never deploys, changes DNS, creates Vercel/Neon/Stripe/Resend resources or spends money.** This is preparation plus an owner checklist.

## Layout

One Git repo; each site is its own Vercel project with Root Directory set to its app folder. A failed build in one project blocks only that project. Shared code is in `packages/`; apps never import other apps, packages never import apps.

| Site | Host | Folder | Suggested Vercel project | Dev / e2e port |
|---|---|---|---|---|
| Hub and CMS | jerryqiu.com | `apps/web` | `jq-hub` | 3000 / 4000 |
| **Photo** | **photo.jerryqiu.com** (`photos.` alias redirects) | **`apps/photos`** | **`jq-photo`** | **3002 / 4002** |
| Music | music.jerryqiu.com | `apps/music` | `jq-music` | 3003 / 4003 |
| Flying | flying.jerryqiu.com | `apps/flying` | `jq-flying` | 3004 / 4004 |
| Make | make.jerryqiu.com | `apps/make` | `jq-make` | 3005 |

Port 3001 on the owner's machine is an unrelated project; the docs app runs on 3010 (`cd apps/docs && PORT=3010 pnpm dev`).

## Building `apps/photos` as its own Vercel project

Status of the open question "can Root Directory `apps/photos` read `packages/*`": **partially verified**. Vercel's documentation search (read-only, 2026-10-15) confirms pnpm workspaces with `apps/*` and `packages/*` globs, per-project `vercel.json` build settings, and an "Ignored Build Step" for monorepos. It did **not** return the text of the "Include source files outside of the Root Directory in the Build Step" setting, so its default and exact wording are **NOT VERIFIED**; the owner confirms it in the project's Settings, General, Root Directory on the first project and leaves it **enabled**. Without it the build cannot see `packages/*`.

Prepared in the repo:

- `apps/photos/vercel.json`: `installCommand` and `buildCommand` (run from the repo root: `cd ../.. && pnpm install --frozen-lockfile`; build `pnpm --filter @jerryqiu/photos build`), plus the cron entries.
- `apps/photos/next.config.mjs` `transpilePackages` lists every workspace package the app imports.
- `.env.example` lists every env name (names only).
- A production build of `apps/photos` in isolation is run in PHOTO-M17 and checked not to import from another app.
- Optional "Ignored Build Step" so other apps' changes do not rebuild photo: `git diff --quiet HEAD^ HEAD -- apps/photos packages ../../pnpm-lock.yaml` (NOT VERIFIED on Vercel; the owner tests it).

## Owner checklist (photo project)

1. Vercel: create project `jq-photo` from the repo, Root Directory `apps/photos`, framework Next.js, leave "include source files outside of the Root Directory" enabled. Production branch is your decision (this work stays on `feat/custom-ui-cms` until you merge).
2. Neon: create a database; set `DATABASE_URL`; run `pnpm db:migrate` once against it.
3. Blob: create a Blob store on the project; set `BLOB_READ_WRITE_TOKEN`; set `STORAGE_DRIVER=blob`.
4. Stripe: test mode first. Set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`; add the webhook endpoint `https://photo.jerryqiu.com/api/webhooks/stripe`. Decide Stripe Tax registration states with your accountant.
5. Resend: verify a mail subdomain (SPF, DKIM, DMARC); set `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO` (a real inbox), `CONTACT_TO_EMAIL`.
6. Secrets: `AUTH_SECRET` (same in hub and photo), `IMAGE_TOKEN_SECRET`, `REVALIDATE_SECRET` (same in hub and photo), `CRON_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `ADMIN_EMAILS`, `AUTH_COOKIE_DOMAIN=.jerryqiu.com`.
7. URLs: `NEXT_PUBLIC_HUB_URL`, `NEXT_PUBLIC_PHOTOS_URL=https://photo.jerryqiu.com`.
8. Domains: add `photo.jerryqiu.com` (and `photos.jerryqiu.com` as an alias that redirects) to the project; add DNS CNAMEs at your DNS host. Do not leave unused subdomains dangling (takeover risk).
9. Firewall: rate-limit `/api/img/*`, `/api/contact`, `/api/upload/*`. Set a spend budget (about $10) with pausing.
10. WHCC (later): request API credentials; real values replace the placeholders (Q54). Face search stays off until a legal check (Q55).
11. Search Console and sitemap submission. Lawyer review of every draft legal text (Q13).
12. Hub project: set `NEXT_PUBLIC_PHOTOS_URL` there too so `/work` redirects and cache pokes work.

Placeholders in use are listed in [PROGRESS.md](PROGRESS.md) under "Owner to-do (keys and accounts)".

## Owner checklist (music project)

1. Vercel: project `jq-music`, Root Directory `apps/music`, "include source files outside of the Root Directory" enabled (as for photo). Domain `music.jerryqiu.com`.
2. Env: `DATABASE_URL` (same Neon database as the hub; run `pnpm db:migrate` once, migration 0018 adds the music tables), `AUTH_SECRET` (same value as the hub and photo), `AUTH_COOKIE_DOMAIN=.jerryqiu.com`, `ADMIN_EMAILS`, `NEXT_PUBLIC_HUB_URL`, `NEXT_PUBLIC_MUSIC_URL=https://music.jerryqiu.com`, `REVALIDATE_SECRET` (same as the hub).
3. Score files: a Blob store on this project, `STORAGE_DRIVER=blob`, `BLOB_READ_WRITE_TOKEN`. Files live under a `private/` prefix and are only ever read by the server (the download route stamps each PDF). That is capability-URL privacy, not access control (Q51).
4. Payments: Stripe test mode first. `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`; add a webhook endpoint `https://music.jerryqiu.com/api/webhooks/stripe` for `checkout.session.completed` and `charge.refunded`. Without the key a production build refuses orders; development shows a labeled MOCK payment page.
5. Email: `RESEND_API_KEY`, `MUSIC_EMAIL_FROM` (or `EMAIL_FROM`), `EMAIL_REPLY_TO`, `CONTACT_TO_EMAIL` (commission inquiries are sent there).
6. Studio: sign in on the hub, then open `https://music.jerryqiu.com/studio`. Enter the real pieces, upload score PDFs, set prices, tick "license on file" only for arrangements you hold a license for, then publish.
7. Maintenance mode: the site is in maintenance mode by default in a production build (see MAINTENANCE.md); the studio stays reachable, the store does not.
8. Firewall: rate-limit `/api/download/*`, `/api/preview/*`, `/api/cart` and the form posts.

## Environment names (full list; values only in Vercel or untracked env files)

`DATABASE_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `ALLOWED_EMAIL_DOMAIN`, `ADMIN_EMAILS`, `AUTH_COOKIE_DOMAIN`, `STORAGE_DRIVER`, `STORAGE_DIR`, `BLOB_READ_WRITE_TOKEN`, `IMAGE_TOKEN_SECRET` (+ `_PREVIOUS`), `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`, `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `WHCC_BASE_URL`, `WHCC_CONSUMER_KEY`, `WHCC_CONSUMER_SECRET`, `FACESEARCH_PROVIDER`, `CRON_SECRET`, `REVALIDATE_SECRET`, `NEXT_PUBLIC_HUB_URL`, `NEXT_PUBLIC_PHOTOS_URL`, `NEXT_PUBLIC_MUSIC_URL`, `NEXT_PUBLIC_FLYING_URL`, `PAGE_ACCESS_PASSWORD`, `MUSIC_EMAIL_FROM`, `ENABLE_MOCKS`, `DASHBOARD_OPEN_SIGNIN` (local only).

## Mocks in production

Mock routes and sample demos are 404 or hidden in production builds unless `ENABLE_MOCKS=true` (preview deployments only). No live keys or network calls exist in mocks.

## Hub redirects

The hub redirects `/work` and `/work/:slug` (301) to `NEXT_PUBLIC_PHOTOS_URL`; `/music` and `/flying` (308) to their hosts. Migration `0001_projects_to_photos` moved projects to the photo site.

## UI package publishing (not in scope)

Halation UI publishing and selling (licence Q32, npm, trademark) is the owner's; see `archive/PUBLISHING.md` and `archive/SELLING.md`. Releases are manual via Changesets; nothing publishes automatically.
