# QUESTIONS for the owner

Never block on these. Each has a default already being used. Append new ones at the bottom.

| # | Question | Default in use | If you choose otherwise |
|---|---|---|---|
| Q1 | Final UI package name? | `@placeholder/ui` (see [07](07-naming-brainstorm.md)) | Run `pnpm rename` |
| Q2 | Path to real footage for the hero image sequence / WebGL scene? | Generated placeholder sequence from existing photos | Run `scripts/make-sequence.ts` on the video |
| Q3 | Brand accent color and typeface? | Planner's pick, recorded in `design-language.md` | Change tokens in one file |
| Q4 | Which CMS approach? | Custom admin on our UI package, patterned on stuyaviators | Payload would be a rewrite of Phase 2 |
| Q5 | ShootProof API client ID? (must be requested from ShootProof support) | Bridge built against mocks/fixtures | Add credentials in env, test live |
| Q6 | Stripe account and live keys (Phase 3)? | Test mode | Add live keys |
| Q7 | Google OAuth client for `@jerryqiu.com` (create in Google Cloud, internal app) | Dev-only open sign-in locally | Follow `docs/google-oauth-setup.md` |
| Q8 | Neon database + R2 bucket + Resend key to create? | Local PGlite + filesystem storage | Create resources, set env |
| Q9 | Lint/format tool: keep Biome? | Biome | Switch to Prettier+xo like stuyaviators |
| Q10 | Publish the UI package to npm / GitHub public repo? | Not published, prepared only (`PUBLISHING.md`) | Follow `PUBLISHING.md` |
| Q11 | Real facts for the profile, music and flying sites (bio, timeline, ratings, hours, aircraft, recordings, performances, social URLs)? | `TODO(owner):` placeholders; real content already in the repo is reused; production hides empty fields | Fill in via `/admin` after Phase 2 |
| Q12 | Which of the three `/_design` directions? | Planner's pick with reasons in `design-language.md`; others kept as presets | Change one token file |
| Q13 | Legal review of privacy/terms/licensing/contract templates; legal entity, address, jurisdiction | Draft text with placeholders, marked for review | Lawyer review, fill placeholders |
| Q14 | Single sign-in across subdomains via `.jerryqiu.com` cookie? | Yes, for staff only, production only | Host-only cookies per site (separate logins) |
| Q15 | Vercel projects and domains for `jerryqiu.com`, `music.`, `flying.`, `photos.` | Documented checklist in `docs/project/DEPLOYMENT.md`, nothing created | Owner creates projects and DNS |
| Q16 | Should `music.` and `flying.` be separate Vercel projects instead of served by the hub app? | One app with host routing | Split later; code is route-grouped to make it easy |
| Q17 | Pinned Once UI 1.5.6 and react-icons 5.5.0 (newer versions break the old site) | Pinned until Once UI is removed in M7 | none |
| Q18 | Hub design direction (Q3/Q12 answered) | Hub = A Gallery white, photos = B Midnight cinema, music = C Soft neutral, flying = cool sans (see design-language.md) | Change preset in `packages/sites` / one token file |
| Q19 | UI package styling: Tailwind v4 compiled (A4) or handwritten CSS variables? | Handwritten CSS (`ph-*` classes, `--ph-*` tokens) | Port to Tailwind later; tokens stay the same |
| Q20 | Alt text for the 23 portfolio photographs (old site only had category names) | Generic "<Category> photograph N" with a TODO | Write real descriptions (CMS alt field in Phase 2) |
| Q21 | ShootProof gallery login URL for the /client button | Hidden unless `NEXT_PUBLIC_SHOOTPROOF_URL` is set | Set the env var |
| Q22 | Music: the trombone photo used on the music site is a portfolio photo; I did not claim it is you | Used with neutral alt text | Replace with your own performance photo |
| Q23 | Hub headline/intro/skills copy is the original About text lightly arranged; first-person rewrite needed | Marked TODO(owner) in source | Rewrite in your voice |
| Q24 | The About page says "Class of 2026" and the college is unknown | College hidden until supplied | Add via about content / CMS |
| Q25 | Visual identity (owner feedback: first pass ugly) | Switched to Geist sans on neutral grayscale + red/blue/green/yellow dashes (hub blue, photos red, music yellow, flying green) | Edit `packages/ui/src/styles/themes.css` |
| Q26 | Sitemaps for `music.` and `flying.` | Only the hub and photos publish sitemaps; music and flying URLs are not listed (a cross-host sitemap would need Search Console verification) | Add per-host sitemap rewrites in the proxy after DNS exists |
| Q27 | Do public images in a gallery that was later switched to strict stay reachable? | Cached public copies can live up to 24 hours (`Cache-Control: public, max-age=86400`); then the token is required | Shorten the cache in `packages/media/src/serve.ts` |
| Q28 | ShootProof API client ID and permission to cache display copies for 24 hours | Bridge is mocked; terms not found anywhere public, so the design caches derivatives only for 24 hours, owner-only | Email support@shootproof.com (steps in `docs/shootproof-bridge.md`) and set `SHOOTPROOF_CLIENT_ID` |
| Q29 | Resend, Turnstile and `CONTACT_FROM_EMAIL` | Contact messages are stored in the admin inbox; no email is sent and no Turnstile check runs until the keys are set | Set `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` (sender verified in Resend), optionally `TURNSTILE_SECRET_KEY` |
| Q30 | `CRON_SECRET` and `REVALIDATE_SECRET` (16+ random characters) in Vercel | Both routes refuse to run when unset: no trash purge, no ShootProof expiry cron, and the photography site refreshes only on its 1-hour cache | Set the same `REVALIDATE_SECRET` in the hub and photos projects, and `CRON_SECRET` in both |
| Q31 | Legal text for the contact form changed from "mailto, nothing stored" to "stored in the inbox" | Privacy page updated; still a draft for lawyer review (Q13) | Review the text; retention is "until you delete it" |
| Q32 | Licence for the new UI package, now that it is meant to be sold | Repo stays MIT-compatible only in dependencies; the package's own licence is undecided (prepare a commercial/source-available option and keep MIT as the alternative) | Owner picks; update `PUBLISHING.md`/`SELLING.md` |
| Q33 | New UI package name | Designer proposes a shortlist from `07-naming-brainstorm.md` (plus new ideas) with reasons and a default; applied with `pnpm rename` | Owner confirms; trademark and npm checks are the owner's |
| Q34 | Music: composition metadata, score file formats, prices, licence terms for performance/arrangement rights | Mock catalogue with clearly fake titles and prices; real compositions entered by the owner in the CMS | Owner supplies real works, PDFs/audio and prices |
| Q35 | Flying map: which past flights, how much detail (airport-level only, delayed) | Mock sample routes labelled sample; real data only entered by the owner; never live | Owner supplies flights; confirm privacy level |
| Q36 | Flying purpose: will CFI services be offered | Hidden `/instruction` slot, off by default, inquiry-only | Owner turns on when relevant |
| Q37 | Photography business platform details (pricing, contract text, invoice details, tax, jurisdiction) | Mock data and template text marked for review | Owner and a lawyer/accountant fill in |
| Q38 | Hub copy in the owner's first-person voice | Claude drafts from facts in the repo, every line marked `TODO(owner)` | Owner rewrites |
| Q39 | Video portfolio source (self-hosted files, YouTube/Vimeo embeds, or both) | Click-to-load embeds plus optional self-hosted clips; sample clips generated or placeholder posters | Owner supplies videos |

