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
11. Subdomains: staff cookie on `.jerryqiu.com` is `Secure`, `HttpOnly`, `SameSite=Lax`; client cookies (Phase 3) are host-only on `photo.jerryqiu.com`. No CORS between sites except explicit allow-lists. CSP `frame-ancestors` denies embedding of admin and client areas. Beware subdomain takeover: record in the owner checklist that unused subdomains must not dangle in DNS.
12. Dependency hygiene: `pnpm audit` in CI (non-blocking at first), Dependabot config.

## The screenshot popup, precisely

Detectable from a page (best-effort): `PrintScreen` keydown/keyup (Windows/Linux; clipboard overwrite after), `Cmd+Shift+3/4/5` keydown on macOS (the page often sees the `Meta+Shift+digit` keydown even though the capture is OS-level), `Win+Shift+S` (key events may arrive before the overlay steals focus), save/print/view-source/devtools shortcuts. Page `blur`/`visibilitychange` frequently fires when a capture tool takes focus.

**Not detectable:** mobile screenshot gestures (iOS/Android give web pages no event), external cameras, many capture utilities and screen recorders, browser devtools "capture screenshot", extensions.

A possible future hardening is playing protected images through an EME/DRM-protected video pipeline, which makes some browsers/OSes capture a black frame. It is complex and platform-dependent; record as research only, do not build.

## As built in Phase 2 (M16)

What exists, where, and the honest limits.

| Piece | Where | Behaviour |
|---|---|---|
| Private originals, public derivatives | `packages/media` (`ingestImage`), `packages/storage` | Originals live in the private store and are never served. Only AVIF/WebP derivatives (480/960/1600/2400 px, GPS and personal EXIF stripped) are reachable. |
| Image route | `packages/media/src/serve.ts`, mounted at `/api/img/[id]` in the hub and photos apps | `GET ?w=&v=&t=`. Refuses unknown ids, widths outside 16..2400, known scraper/AI user agents and requests with no user agent. Negotiates AVIF/WebP. Sends `nosniff`, `Content-Disposition: inline`, `X-Robots-Tag: noai, noimageai`. |
| Two tiers | same | **Public** (galleries set to off/light, and every image not in a strict gallery): no token, `Cache-Control: public` so the CDN serves it, random UUID ids. Anyone with the link can fetch it, as with any portfolio. **Strict** (the image is in a gallery whose protection is strict): needs a valid HMAC token bound to this image and width (5 minute life), a same-site browser fetch (`Sec-Fetch-Site`, `Sec-Fetch-Dest`, `Referer`), and passes per-IP and per-image rate limits. `Cache-Control: private, no-store`, `Cross-Origin-Resource-Policy: same-site`. Forged, expired, wrong-width, wrong-image and missing tokens all return 403. |
| Token refresh | `POST /api/img/token` | Same-origin browser requests only, no scrapers, rate limited, only for strict images. Lets a page that has been open longer than 5 minutes keep working. |
| `ProtectedImage` | `packages/ui/src/media` | Strict: the server HTML carries only an opaque id, tokens and a blur placeholder. The browser fetches the bytes, shows a `blob:` URL (revoked on unmount), and a transparent shield sits over the picture. No file URL is in the page source (Playwright asserts this). Alt text always present. Without JavaScript only the blurred placeholder shows. |
| `ScreenshotGuard` | same | `off` does nothing. `light` blocks the context menu and drag on images and disables selection on them. `strict` also reacts to PrintScreen, Cmd+Shift+3/4/5/6, Win+Shift+S, Ctrl/Cmd+S, P, U, Ctrl+Shift+I/J/C, F12 and Cmd+Opt+I/J/C: media is hidden, a polite dialog appears (about 3 s or until dismissed), Ctrl/Cmd+S and P are cancelled, and PrintScreen clears the clipboard (best effort). Media is also hidden while the window or tab loses focus. `@media print` hides protected media. Every combination is unit tested and exercised in Playwright with synthetic key events. |
| Watermark | `packages/media/src/watermark.ts` | Per-site setting (text, position, opacity) baked into derivatives with `sharp` on first request and cached beside them. |
| Policy | Admin: Pages & settings (site default) and each gallery | off / light / strict. Strict galleries appear only on their own page, never in the home page, hero or the all-photos view. |
| Anti-scraping | `robots.txt` (AI crawlers disallowed), `noai, noimageai` meta and header, bot user-agent refusal on the image route | Polite crawlers stay away; bots that identify themselves are refused. Vercel Firewall rules are a manual owner step (see DEPLOYMENT.md). |

**Limits, stated plainly.** Anything displayed can be captured. This cannot see OS-level screenshots taken without the browser noticing, phone screenshot gestures, cameras or screen recorders, and it does nothing if JavaScript is off. The light tier is public by design, and a public image that was cached before a gallery was switched to strict can stay reachable from CDN caches for up to 24 hours. A determined person with developer tools can still read the bytes the page fetched. The measures raise the effort for casual copying and make bulk scraping and hot-linking harder; the real protection is that previews are small and, optionally, visibly watermarked.

**C2PA / content credentials:** research only. They prove origin rather than prevent copying, need signing infrastructure, and are not built here.

## Phase 2.5 note
The redesign did not change protection semantics. `ProtectedImage`, `ProtectedGallery`, `ScreenshotGuard` and `GuardScope` are unchanged in `@jerryqiu/render/media`. Stage effects never draw over a photograph except inside a named scene (the Aperture scene on the photography home blurs and vignettes by design, with photographs from non-strict galleries only); gallery and portfolio pages use the pure-black Cinema field and apply no effect. Client galleries and score previews in the mocks use generated sample frames and SVG previews, never originals.
