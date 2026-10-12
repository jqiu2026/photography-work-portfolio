# 03. Phase 2: CMS, image protection, ShootProof bridge

**Goal:** the owner signs in with Google and manages everything on **all sites** (hub, photos, music, flying) without code changes. Protected image delivery. A temporary ShootProof bridge in the photography app. Shared internal packages (`packages/db`, `auth`, `storage`, `protect`) are created here and used by both `apps/web` and `apps/photos`.

**Exit:** acceptance criteria pass, summary written, **then STOP. Do not start Phase 3.** Write the Phase 3 start-up prompt into `docs/project/PHASE-3-KICKOFF.md` for the owner and end.

Reuse as much as possible from the stuyaviators repo ([09](09-reference-stuyaviators.md)), reading its code first and porting with the new UI package.

## 2.1 Foundation

- **Database:** Neon Postgres + Drizzle ORM (`drizzle-kit` migrations committed). Local dev: PGlite or local Postgres so `pnpm dev` works offline. Schema in `apps/web/src/db/schema.ts`. Seed script imports the existing MDX content (posts, projects) and static gallery.
- **Env handling:** `.env.example` complete and documented. Missing credentials must never crash dev: degrade (e.g. "CMS needs database", local fallbacks) and log what to set. Never commit secrets.
- **Storage:** `StorageProvider` interface (`put`, `getSignedUrl`, `delete`, `list`, `head`) with `local`, `r2`, `vercel-blob` implementations. Public derivatives and private originals use different buckets/prefixes. Cost note: [06](06-cost-analysis.md).

## 2.2 Authentication and authorization

- **Auth.js v5 + Google** (as in stuyaviators `src/auth.ts`). Requirements:
  - Accept only `profile.email_verified === true` **and** an email on `@jerryqiu.com`. Verify the domain from the ID token's `hd` claim *and* the email suffix, server-side. The `hd` request parameter alone is only a UI hint.
  - Then check the email against a `users` allow-list table (role: `owner`, `editor`, later `client`). First user created via `ADMIN_EMAILS` env.
  - JWT sessions, 14-day max, secure cookies, CSRF default. Every page, Server Action and Route Handler re-checks session and role on the server (`session.ts`, `action-guard.ts` pattern). Removal takes effect on next click.
  - Rate-limit sign-in and all mutating actions (port `rate-limit.ts`).
- Setup doc: `docs/google-oauth-setup.md` (copy from stuyaviators and adapt: authorized redirect URIs for `http://localhost:3000/api/auth/callback/google` and the production URL; Workspace "internal" consent screen if the owner uses an org-internal app, which restricts to the domain by itself).
- Optional: passkeys / TOTP for owner. P3, only if cheap.
- Clients (Phase 3) will use a different mechanism (magic link / passcode). Keep the user model ready: `role: 'client'`.

## 2.3 Admin (`/admin` in `apps/web`, built entirely with the UI package)

One CMS for every site: a site selector at the top scopes content (hub / photos / music / flying) and the same login works across them. Dashboard shell: sidebar nav, command palette (Cmd-K), toasts, optimistic UI, keyboard shortcuts, responsive (usable on a phone). Sections:

0. **Profile & timeline:** profile header (name, headline, location, "currently", portrait), **social/account links** (label, URL, icon, order, where shown), skills & interests tags, **timeline entries** (category work/education/leadership/volunteering/flying/music/photography/other, dates, org, description, link, visibility), resume PDF generated from the timeline, "now" note, optional testimonials.
1. **Posts** (writing): markdown/MDX editor with toolbar, live preview, image insert from media library, tags, cover image, SEO fields (title, description, OG image override), slug management with redirects when changed, draft / scheduled / published, reading time, featured flag.
2. **Projects** (work, any `type`): title, summary, date, client, role, category, cover, **block-based body** (text, image, gallery, quote, video embed, two-column), credits, related projects, order/featured.
3. **Portfolio / Galleries** (public showcase on photos.jerryqiu.com): create galleries, bulk-upload with progress, drag to reorder, captions, alt text (with optional free autofill), per-image "hide", cover selection, categories.
3b. **Music:** recordings and performances (title, date, venue/ensemble, notes, cover, embed URL or uploaded audio, featured), instruments, repertoire.
3c. **Flying:** milestones and flight-log entries (date, title, story, photos, aircraft, safe-to-publish checks), aircraft list, ratings (all optional; empty fields hidden publicly; no live location, no tail numbers by default).
4. **Pages and settings (per site):** home hero copy and featured items, about text, social links, contact info, navigation, SEO defaults, theme accent choice, protection settings (see 2.5), maintenance mode.
5. **Media library:** all uploads, usage tracking (where used), replace-in-place, delete only if unused (stuyaviators `blob-cleanup.ts`), EXIF viewer.
6. **Inbox:** contact/booking form submissions with status, notes, reply-by-email link. Discord/email notification optional.
7. **Users:** invite `@jerryqiu.com` editors, change roles.
8. **Trash** (soft delete + restore, auto-purge after 30 days), **Audit log** (who changed what, when), **Version history** for posts/projects with diff and restore.

CMS plumbing: Server Actions with Zod validation; typed content layer (`getPublishedPosts()` etc.) with `unstable_cache`/tags and `revalidateTag` on publish so the public site is fast and updates immediately; preview mode (`/admin/preview/...`) for drafts; autosave; unsaved-changes guard; accessible forms.

**Image pipeline** on upload (`sharp`): validate type and size, strip GPS and personal EXIF from public derivatives (keep original in private storage), auto-rotate, generate AVIF + WebP at multiple widths, blur placeholder, dominant color, perceptual hash (dedupe), store width/height. Large file uploads go directly browser -> storage with signed upload URLs (see stuyaviators `client-upload.ts`) so Vercel function body limits don't matter.

**SEO/feeds:** dynamic sitemap, robots, RSS, per-page OG images (existing generator, now data-driven), JSON-LD (Article, ImageObject, Person/LocalBusiness).

**Import/export:** one-click export of all content to Markdown + JSON + media manifest (backup, no lock-in). A `pnpm db:backup` script.

## 2.4 Public sites switch to the database

Hub, music, flying (`apps/web`) and the photography portfolio (`apps/photos`) all read through the shared typed content layer (`packages/db`). Replace the content modules/MDX reads with it. Keep the MDX files in the repo as a fallback seed. Anything the owner can edit in admin must render on the public site within seconds of publishing.

## 2.5 Image protection (see [05](05-security-and-image-protection.md) for the threat model)

Implement `@placeholder/ui/media` `ProtectedImage` and the server pieces:

1. **Server:** originals are private. A route (`/api/img/[id]`) serves derivatives only after checks: valid HMAC-signed, **expiring** token (`exp`, `w`, `viewer`) minted during server render; `Sec-Fetch-Dest: image` / `Referer` same-site checks; per-IP and per-token rate limiting; `Cache-Control: private, no-store` for protected images; no directory listing; no predictable URLs.
2. **Client:** `ProtectedImage` fetches the image bytes, converts to a `blob:` URL (or draws to `<canvas>`), and revokes it on unmount; the stable file URL never appears in the HTML source (page HTML carries only an opaque id). Transparent overlay element over the image blocks drag/long-press save; `pointer-events` handled so links still work. Skeleton + blur placeholder while loading; works with SSR (placeholder from DB, no JS = low-res placeholder only).
3. **Screenshot / save deterrent (owner's explicit request, like Snapchat's warning):** a `ScreenshotGuard` provider in `/media`:
   - Listens for `keydown`/`keyup` for: `PrintScreen`; macOS `Cmd+Shift+3/4/5/6`; Windows `Win+Shift+S`; `Ctrl/Cmd+S`, `Ctrl/Cmd+P`, `Ctrl/Cmd+U`, `Ctrl+Shift+I/J/C`, `F12`, `Cmd+Opt+I/J/C`.
   - On trigger: immediately blur/hide all protected media (CSS class on `<html>`), show an accessible dialog ("Screenshots and saving are disabled to protect the photographer's work. ..."), and on `PrintScreen` keyup try `navigator.clipboard.writeText('')` (best effort). Auto-restore after dismissal or about 3 s.
   - Also: hide protected content on `visibilitychange`/`window blur` (many capture tools steal focus), `@media print { display:none }`, `user-select:none`, `-webkit-touch-callout:none`, `contextmenu` and `dragstart` blocking (port `MediaGuard`), and a visible, tasteful watermark option.
   - **Be honest in the UI copy and docs:** this is a deterrent, it cannot detect screenshots taken by OS shortcuts the browser never sees, phone cameras or mobile screenshot gestures. Native apps like Snapchat can detect screenshots through OS APIs; websites cannot. Document this in [05](05-security-and-image-protection.md) and the admin settings help text.
   - Policy per context via settings: `off` / `light` (right-click + drag only) / `strict` (everything). Public portfolio default `light` + low-res + watermark off; protected galleries `strict`. Never break accessibility: alt text stays, screen readers work.
4. **Watermarking:** server-side visible watermark (text/logo, position, opacity) baked into derivatives on request via `sharp`, cached. Invisible per-viewer watermark is Phase 3 (needs client galleries).
5. **Anti-scraping:** `robots.txt` + `X-Robots-Tag: noai, noimageai` meta for opted-out content, bot-UA block list, rate limits; Vercel Firewall rules documented (manual step for the owner). Optional C2PA content credentials: research only, record in docs.
6. Tests: unit tests for token sign/verify/expiry, replay beyond expiry fails, wrong width fails, missing token fails, rate-limit; Playwright test that the page source contains no direct image file URL for protected images and that triggering the guard shows the dialog.

## 2.6 ShootProof temporary bridge (in `apps/photos`)

It is a photography concern, so it lives at `photos.jerryqiu.com`'s studio admin (`/studio`), not the hub.

- Build an adapter `ShootProofSource` behind an `ExternalGallerySource` interface in `apps/photos/src/lib/external/`.
- Verify the current API at `developer.shootproof.com` (OpenAPI 3.0, three-legged OAuth 2.0; client ID has to be requested from ShootProof support). Implement OAuth connect flow in admin ("Connect ShootProof"), token storage encrypted with `AUTH_SECRET`-derived key (port `crypto.ts`), refresh handling, brand/event/album/photo listing.
- "Import temporarily": admin picks a ShootProof event -> photos are fetched, cached with a TTL (default 24 h) in storage as derivatives only, expire and are purged by a cron route (Vercel Cron, free on Pro within limits), never kept as originals. Display via `ProtectedImage`.
- If credentials are absent, the whole feature shows a clear "Not connected" state with setup instructions, and tests run against recorded fixtures/mocks. Do not hit the live API without credentials. Record the access request step in [QUESTIONS.md](QUESTIONS.md).
- Terms: check ShootProof's API terms for caching/redistribution limits and write findings in docs.

## 2.7 Other important features (included in Phase 2)

- **Studio shell:** `apps/photos` gets `/studio` (owner-only, shared Google auth) with a dashboard stub, the ShootProof bridge, and a visible "Phase 3" roadmap card. The public photos site keeps linking "Client galleries" to ShootProof (env URL) until Phase 3.
- **Cross-site auth:** parent-domain staff cookie in production, host-only client cookie reserved for Phase 3 ([01](01-decisions-and-assumptions.md) A24).
- **Per-site SEO:** host-aware sitemap, robots, canonical URLs and OG images; `Person` JSON-LD with `sameAs` from the social links.
- **Legal pages editable in the CMS** (draft status visible), image records with license, people and minors flags ([11](11-legal-and-compliance.md)); delete-contact-data tool.

- Contact/booking form storage + email notification (Resend) + spam protection (honeypot, rate-limit, optional Turnstile which is free).
- Newsletter (optional, stuyaviators has a publisher): keep Mailchimp component or implement list capture; no paid service.
- Redirect manager, 404 logging, sitemap ping.
- Health/diagnostics page in admin: env present?, DB reachable?, storage reachable?, build info.
- Accessibility and performance re-check after the CMS-driven rebuild.
- Admin onboarding doc `docs/owner-guide.md`: how to log in, write a post, publish a project, upload a gallery, change protection, back up.

## 2.8 Acceptance criteria

- Sign-in works with Google for `@jerryqiu.com` accounts, denies other domains, denies unlisted users, and a removed user loses access on next action (tests + manual script in docs). Without Google credentials, a clearly-labeled **dev-only** open sign-in (like stuyaviators' `open-signin.ts`, off in production, guarded by `NODE_ENV` and an explicit env) lets Claude exercise the admin.
- Owner can create/edit/publish/unpublish/schedule a post and project, edit the profile, social links and timeline, add a music recording and a flight-log entry, upload a gallery, change settings, restore from trash and version history, entirely in the browser. Playwright e2e covers each flow.
- All four public sites reflect changes without redeploy; switching the site selector scopes the admin correctly; `proxy.ts` host routing is covered by tests.
- Protected images: source of a protected page contains no direct file URL; expired/forged/missing token returns 403; guard dialog appears for each listed key combo (tested via synthetic key events); behavior is documented honestly.
- ShootProof bridge works against mocks; "Not connected" state is clear.
- Security review pass (use the `security-review` skill): authz on every action, input validation, SSRF in any URL fetch, upload validation, secrets handling, rate limits. Findings fixed or logged.
- `pnpm build/test/lint/typecheck` green. Lighthouse targets from Phase 1 still hold on public pages.
- `docs/project/PHASE-2-SUMMARY.md` and `docs/project/PHASE-3-KICKOFF.md` written. Then **stop**.
