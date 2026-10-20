# Maintenance mode ("back soon")

Branch `coming-soon`. One shared page answers every public route of every app while the mode is on. Nothing else was
changed: the sites, the content and the database are as they were.

## How to put the sites down on Vercel

1. Push `coming-soon`.
2. In each Vercel project (hub, photo, music, flying, make): Settings, Git, set **Production Branch** to `coming-soon`
   (or promote a deployment of it). A production build of this branch is in maintenance mode with no other setup.
3. To bring a site back, either set the Production Branch back, or set `MAINTENANCE_MODE=0` on that project and redeploy.

`MAINTENANCE_MODE`: `1` (or true, on, yes) on; `0` (false, off, no) off; unset means on in a production build and off in
development and tests. So `pnpm dev` and the e2e suites are unaffected (the production e2e config sets it to `0`).

## What the visitor gets

HTTP 503 with `Retry-After: 86400`, `X-Robots-Tag: noindex, nofollow`, `Cache-Control: no-store`, a `noindex` meta tag,
and the page. `robots.txt` says `Disallow: /`, the sitemap is a 404, and API calls get a JSON 503. The page is one HTML
document with the Holominimal tokens and the rules it uses inlined: no script, no font, no image, no external request,
no database. Edit the words in `packages/sites/scripts/maintenance-page.mjs` (every line is marked TODO(owner)), then run
`pnpm --filter @jerryqiu/sites maintenance:build`. A unit test fails if the generated file is out of date.

## Routes that stay open while it is on

Every app: `/api/cron`, `/api/webhooks`, `/api/auth`, `/api/health`, `/api/revalidate`, `/.well-known` (scheduled jobs,
payment callbacks, sign-in callbacks, health checks).

- hub (`apps/web`): `/admin`, `/sign-in`, `/api/admin`, `/api/storage`, `/api/img` (the admin and what it uses).
- photo (`apps/photos`): `/studio`, `/sign-in`, `/api/studio`, `/api/upload`, `/api/storage`, `/api/img`,
  `/api/print-file` (the print lab fetches files from it), `/api/ics` (the owner's calendar feed).
- music, flying, make: nothing more.

Everything else is down, including client galleries (`/g/...`, `/client/...`), pay links and the contact and inquiry
forms. Clients who open a link you already sent see the page.

## Checks

`pnpm --filter @jerryqiu/sites test` (the mode, the headers, the exemptions, the page) and `pnpm test:maintenance`
(each app's dev server with the mode on: 503 on `/` and a made-up URL, headers, robots, the open route, axe at 390 and
1440, JavaScript off).
