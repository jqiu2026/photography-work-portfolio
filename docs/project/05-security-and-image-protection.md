# 05. Security and image protection

## The honest truth

Anything shown on a screen can be captured. Browsers cannot see OS-level screenshots (macOS `Cmd+Shift+3/4`, Windows Snipping Tool, phone screenshot gestures), phone cameras, or hardware capture. Snapchat can warn about screenshots because it is a **native app** using OS APIs; a website has no equivalent. The owner asked for a Snapchat-style popup on screenshot key combos: we build it, and we describe it as what it is, a **deterrent**.

Our strategy is layered, in order of real value:

| Layer | Value | What it stops |
|---|---|---|
| **1. Never expose originals; serve only downscaled derivatives** | High | Print-quality theft. A screenshot of a 1600 px preview has little commercial value. |
| **2. Signed, expiring, rate-limited image URLs** | High | Hot-linking, bulk scraping, sharing a direct file link, scripts crawling the site. |
| **3. Per-viewer invisible watermark + view logs** (Phase 3) | High | Deters leaks by *traceability*: a leaked image identifies the gallery link/viewer. |
| **4. Visible watermark** (configurable) | Medium-High | Casual reuse; makes theft obvious. |
| **5. Blob/canvas rendering, opaque ids in HTML** | Medium | "View source / Save as", simple scrapers, copying the img URL. Defeated by devtools Network tab or a headless browser. |
| **6. Key-combo popup + blur on blur/visibility change** | Low-Medium | Casual users on desktop. Bypassed by OS shortcuts the page cannot see, phone photos, or disabling JS. |
| **7. No right-click/drag, `user-select:none`, no print** | Low | Accidental saving. |
| **8. `noai` / robots / bot blocklist / C2PA research** | Low-Medium | Polite AI/scraper crawlers. |

## Rules for implementers

1. Say it plainly in admin help text and docs: *"These measures deter casual copying. They can't stop a determined person from capturing what is on their screen."* Never claim "screenshot-proof".
2. Never degrade accessibility: keep `alt`, focus order, screen reader names. Protection must not break assistive tech.
3. The guard must be **opt-in per context** (settings: off / light / strict) so the public portfolio stays fast and friendly.
4. Don't store originals in a public bucket. Don't use predictable keys. Don't log full signed URLs.
5. Tokens: HMAC-SHA256 with a server secret, payload `{imageId, width, viewerId, exp}`, constant-time compare, exp <= 5 minutes for protected galleries (refresh via the page's data fetch), <= 1 hour for the public portfolio. Bind to the viewer session when one exists. Rotate secret supports two active keys.
6. Image endpoint checks: method GET, token valid, size allowed list, `Sec-Fetch-*` and `Referer` sanity (soft-fail for privacy-stripped referers on the public portfolio), rate limit by IP+token, `Cache-Control` per policy, no CORS wildcard, `Content-Disposition: inline`, correct content type, `X-Content-Type-Options: nosniff`.
7. Uploads: type sniffing (magic bytes), max size, decompression-bomb protection (`sharp` `limitInputPixels`), strip metadata from public derivatives, never trust file names, store under random ids.
8. Auth: server-side checks everywhere; domain check on ID-token claims; no client-side only gating; CSRF via Server Actions/same-site cookies; strict `Content-Security-Policy`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options`/`frame-ancestors`, HSTS (Vercel handles TLS).
9. Webhooks (Stripe): signature verification, idempotency keys, replay window.
10. Secrets only in env/Vercel; `.env.example` has names only. Add a pre-commit secret scan (e.g. `gitleaks` config or a simple regex hook) if free and quick.
11. Subdomains: staff cookie on `.jerryqiu.com` is `Secure`, `HttpOnly`, `SameSite=Lax`; client cookies (Phase 3) are host-only on `photos.jerryqiu.com`. No CORS between sites except explicit allow-lists. CSP `frame-ancestors` denies embedding of admin and client areas. Beware subdomain takeover: record in the owner checklist that unused subdomains must not dangle in DNS.
12. Dependency hygiene: `pnpm audit` in CI (non-blocking at first), Dependabot config.

## The screenshot popup, precisely

Detectable from a page (best-effort): `PrintScreen` keydown/keyup (Windows/Linux; clipboard overwrite after), `Cmd+Shift+3/4/5` keydown on macOS (the page often sees the `Meta+Shift+digit` keydown even though the capture is OS-level), `Win+Shift+S` (key events may arrive before the overlay steals focus), save/print/view-source/devtools shortcuts. Page `blur`/`visibilitychange` frequently fires when a capture tool takes focus.

**Not detectable:** mobile screenshot gestures (iOS/Android give web pages no event), external cameras, many capture utilities and screen recorders, browser devtools "capture screenshot", extensions.

A possible future hardening is playing protected images through an EME/DRM-protected video pipeline, which makes some browsers/OSes capture a black frame. It is complex and platform-dependent; record as research only, do not build.
