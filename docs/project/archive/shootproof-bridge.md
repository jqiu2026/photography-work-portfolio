# ShootProof bridge

A temporary bridge so client galleries that still live on ShootProof can be shown from the photography studio
(`photo.jerryqiu.com/studio/shootproof`) until Phase 3 replaces ShootProof. Code: `packages/shootproof`, UI in
`apps/photos/src/app/studio/shootproof`.

## State today: built, mocked, not live

The live adapter is written against ShootProof's published OpenAPI document and authorization guide, but **it has never been
run against the real service** because ShootProof only issues API client IDs on request. Until `SHOOTPROOF_CLIENT_ID` is set,
the studio shows a "Not connected" page with the steps below and **nothing is ever sent to ShootProof**. Tests use a fake
`fetch` and generated fixtures. `SHOOTPROOF_MODE=mock` (development and tests only, refused in production) runs the whole
flow on sample data.

## Getting access (owner)

1. Email **support@shootproof.com** asking for a Studio API client ID. They ask for: your name or company, a support email,
   the app name, a public description (255 characters max), a website, a 500×500 avatar, and one or more redirect URLs.
2. Redirect URL to give them: `https://photo.jerryqiu.com/studio/shootproof/callback` (and
   `http://localhost:3002/studio/shootproof/callback` for local tests, if they accept it).
3. Set in the photography Vercel project: `SHOOTPROOF_CLIENT_ID`. Optional: `SHOOTPROOF_SCOPE` (default `studio`, which the
   guide says must be included; `studio.brand.read-only` exists and would be the least-privilege choice if ShootProof
   confirms it covers events and photos), `SHOOTPROOF_IMAGE_HOSTS` (extra comma-separated hosts photo files may come from).
4. Open `/studio/shootproof` and press Connect.

## How it works

- **Auth:** three-legged OAuth 2.0 authorization code, `https://auth.shootproof.com/oauth2/authorization/{new,token}`,
  refresh tokens, 2-week access tokens. A one-time `state` cookie protects the return (`/studio/shootproof/connect` sets it,
  `/callback` checks it with a constant-time compare). Tokens are stored AES-256-GCM encrypted (key derived from
  `AUTH_SECRET`) in `external_connections`; a tampered value or a changed secret reads as "not connected". They are refreshed
  automatically when they expire within a day.
- **Listing:** `GET /brand`, `/brand/{id}/event`, `/brand/{id}/event/{id}/photo` on `https://api.shootproof.com/studio`,
  header `Accept: application/vnd.shootproof+json`, paged `{ items, meta }`. Only the owner can use it (`shootproof.manage`).
- **Import (temporary):** the owner picks an event. For each photo (first 60) a display-size image is downloaded from the
  `displayUrl` that ShootProof provides, never from the `/original` endpoint, turned into one downscaled, metadata-stripped
  WebP (at most 1600 px), stored under `ext/shootproof/…` in the public store, and recorded in `external_cache` with an
  expiry of 24 hours. Re-importing replaces files instead of duplicating them.
- **Download safety (SSRF):** only `https` URLs on `*.shootproof.com` (plus any host in `SHOOTPROOF_IMAGE_HOSTS`), no IP
  addresses, ports, credentials or redirects, 25 MB cap, 30 s timeout, and no `Authorization` header is sent to file hosts.
- **Display:** staff-only studio page. Photos are shown with `ProtectedImage` (strict): tokens from the server, bytes fetched
  from `/api/ext/[id]` with a valid token and same-site fetch metadata, private and uncacheable, never indexed.
- **Expiry:** `/api/cron/purge-external` (Vercel Cron, hourly, needs `CRON_SECRET`) deletes expired rows and files. The route
  also refuses to serve anything past its expiry even if the cron has not run. There is a "Clear expired now" button.
- **Audit:** connect, disconnect, import, remove and purge are written to the audit log.

## Terms: not verified

I could not find ShootProof's API terms or any statement about caching, storing or redistributing photos obtained through
the API (the developer site, the OpenAPI document and the guides do not mention it). Treat this as **unknown** and ask
support in the same email as the client ID request: *"May I cache display-size copies of my own events' photos for up to 24
hours on my own site, and display them to the studio owner?"* The design is deliberately conservative in the meantime:
derivatives only, 24-hour expiry, owner-only viewing, no public sharing, no originals, no bulk export. Rate limits are also not
documented; the importer is sequential and capped at 60 photos per run. Do not widen any of this without an answer.

## Verify at the first live connection

1. The consent screen accepts our redirect URL and returns `code` and `state`.
2. The token response has `access_token`, `refresh_token`, `expires_in`; refresh rotates the refresh token (we store the
   replacement).
3. `GET /brand` returns the studio's brand(s) with the scope you chose; events and photos list with it too.
4. `displayUrl.large` exists and is hosted on a `shootproof.com` domain. If it is on another CDN host, add the host to
   `SHOOTPROOF_IMAGE_HOSTS` after checking it really is ShootProof's.
5. Import one small event and look at the result.
