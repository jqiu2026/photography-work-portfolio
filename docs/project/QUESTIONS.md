# QUESTIONS for the owner

Never block on these. Each has a default already being used. Append new ones at the bottom.

| # | Question | Default in use | If you choose otherwise |
|---|---|---|---|
| Q1 | Final UI package name? | `@halation/ui` (see [07](07-naming-brainstorm.md)) | Run `pnpm rename` |
| Q2 | Path to real footage for the hero image sequence / WebGL scene? | Generated placeholder sequence from existing photos | Run `scripts/make-sequence.ts` on the video |
| Q3 | Brand accent color and typeface? | Planner's pick, recorded in `design-language.md` | Change tokens in one file |
| Q4 | Which CMS approach? | Custom admin on our UI package, patterned on stuyaviators | Payload would be a rewrite of Phase 2 |
| Q5 | **CANCELLED 2026-10-15:** ShootProof bridge removed | n/a | n/a |
| Q6 | Stripe account and live keys (Phase 3)? | Test mode | Add live keys |
| Q7 | Google OAuth client for `@jerryqiu.com` (create in Google Cloud, internal app) | Dev-only open sign-in locally | Follow `docs/google-oauth-setup.md` |
| Q8 | Neon database + Blob store + Resend key to create? (R2 dropped, Q51) | Local PGlite + filesystem storage | Create resources, set env |
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
| Q19 | UI package styling: Tailwind v4 compiled (A4) or handwritten CSS variables? | Handwritten CSS (`ph-*` classes, `--hl-*` tokens) | Port to Tailwind later; tokens stay the same |
| Q20 | Alt text for the 23 portfolio photographs (old site only had category names) | Generic "<Category> photograph N" with a TODO | Write real descriptions (CMS alt field in Phase 2) |
| Q21 | **CANCELLED:** ShootProof URL | n/a | n/a |
| Q22 | Music: the trombone photo used on the music site is a portfolio photo; I did not claim it is you | Used with neutral alt text | Replace with your own performance photo |
| Q23 | Hub headline/intro/skills copy is the original About text lightly arranged; first-person rewrite needed | Marked TODO(owner) in source | Rewrite in your voice |
| Q24 | The About page says "Class of 2026" and the college is unknown | College hidden until supplied | Add via about content / CMS |
| Q25 | Visual identity (owner feedback: first pass ugly) | Switched to Geist sans on neutral grayscale + red/blue/green/yellow dashes (hub blue, photos red, music yellow, flying green) | Edit `packages/ui/src/styles/themes.css` |
| Q26 | Sitemaps for `music.` and `flying.` | Only the hub and photos publish sitemaps; music and flying URLs are not listed (a cross-host sitemap would need Search Console verification) | Add per-host sitemap rewrites in the proxy after DNS exists |
| Q27 | Do public images in a gallery that was later switched to strict stay reachable? | Cached public copies can live up to 24 hours (`Cache-Control: public, max-age=86400`); then the token is required | Shorten the cache in `packages/media/src/serve.ts` |
| Q28 | **CANCELLED:** ShootProof API | n/a | n/a |
| Q29 | Resend, Turnstile and `CONTACT_FROM_EMAIL` | Contact messages are stored in the admin inbox; no email is sent and no Turnstile check runs until the keys are set | Set `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` (sender verified in Resend), optionally `TURNSTILE_SECRET_KEY` |
| Q30 | `CRON_SECRET` and `REVALIDATE_SECRET` (16+ random characters) in Vercel | Both routes refuse to run when unset: no trash purge, no photo-site cron jobs, and the photography site refreshes only on its 1-hour cache | Set the same `REVALIDATE_SECRET` in the hub and photos projects, and `CRON_SECRET` in both |
| Q31 | Legal text for the contact form changed from "mailto, nothing stored" to "stored in the inbox" | Privacy page updated; still a draft for lawyer review (Q13) | Review the text; retention is "until you delete it" |
| Q32 | Licence for the new UI package, now that it is meant to be sold | Repo stays MIT-compatible only in dependencies; the package's own licence is undecided (prepare a commercial/source-available option and keep MIT as the alternative) | Owner picks; update `PUBLISHING.md`/`SELLING.md` |
| Q33 | New UI package name | **Default: "Halation UI"** (reading check 2026-10-12: `halation-ui` and `@halation/ui` free on npm, unscoped `halation` is an unrelated project; shortlist in redesign-brief section 7; owner's suggestion; halation = the glow around bright light in film). Designer may add a shortlist but keeps this default unless a conflict is found by reading; applied with `pnpm rename` | Owner confirms; trademark and npm checks are the owner's |
| Q34 | Music: composition metadata, score file formats, prices, licence terms for performance/arrangement rights | Mock catalogue with clearly fake titles and prices; real compositions entered by the owner in the CMS | Owner supplies real works, PDFs/audio and prices |
| Q35 | Flying map: which past flights, how much detail (airport-level only, delayed) | Mock sample routes labelled sample; real data only entered by the owner; never live | Owner supplies flights; confirm privacy level |
| Q36 | Flying purpose: will CFI services be offered | Hidden `/instruction` slot, off by default, inquiry-only | Owner turns on when relevant |
| Q37 | Photography business platform details (pricing, contract text, invoice details, tax, jurisdiction) | Mock data and template text marked for review | Owner and a lawyer/accountant fill in |
| Q38 | Hub copy in the owner's first-person voice | Claude drafts from facts in the repo, every line marked `TODO(owner)` | Owner rewrites |
| Q39 | Video portfolio source (self-hosted files, YouTube/Vimeo embeds, or both) | Click-to-load embeds plus optional self-hosted clips; sample clips generated or placeholder posters | Owner supplies videos |
| Q40 | Headless accessible primitives (Radix Primitives, MIT) inside the "original" UI package | Allowed for focus trap, dialog, menu, tabs only; no visuals/APIs from Radix Themes, shadcn or others; disclosed in THIRD_PARTY_LICENSES and SELLING.md | Owner can ask for a primitives-free build (more accessibility risk and work); `packages/ui` |
| Q41 | Fonts: Anybody (display), Hanken Grotesk (text), Newsreader (voice), Martian Mono (data), all assumed SIL OFL 1.1 | Used self-hosted; **per-family `OFL.txt` verified 2026-10-12** (copies in `packages/ui/licenses/fonts/`; METADATA says license OFL for all four; not modified); fallbacks Bricolage Grotesque, Figtree, Source Serif 4, JetBrains Mono | Owner does the final licence check (SELLING.md); `THIRD_PARTY_LICENSES.md`, font loader in `packages/ui` |
| Q42 | Which instrument Jerry plays (the music photo shows a trombone, see Q22) and what repertoire to claim | Copy says "musician" and "things I wrote and sometimes played" only; no instrument or repertoire claimed | Owner supplies facts; music copy and CMS |
| Q43 | Flight map privacy defaults | Month precision, published at least 7 days after landing, airport level, no tail numbers, no live data; samples labelled `SAMPLE` | Owner confirms (also Q35); `FlightSource` interface and flying settings |
| Q44 | Owner idea: design a custom typeface for the family ("perhaps make my own font? Tbd") | Not started. Ship with the four OFL families (Q41) behind `--hl-font-*` tokens so a custom font drops in later without component changes; a custom font would also make the sold package fully original and licence-clean | Owner decides; font loader and tokens in `packages/ui` |
| Q45 | Legal pages and the cross-site rule: photos, music and flying footers now carry only the jerryqiu.com button (no legal links, no socials) | Photography has its own short `/privacy` (draft) so the booking form's consent line stays on-site; music and flying get their own legal pages in R4 from shared text; the hub keeps the canonical full set | Owner/lawyer review of the per-site privacy text (Q13); `apps/photos/src/app/privacy`, `packages/sites/src/SiteShell.tsx` |
| Q46 | Video portfolio content (Q39) | `/video` on photography is an honest empty state until videos are supplied; R4 designs the gallery with click-to-load embeds | Owner supplies videos; `apps/photos/src/app/video` |
| Q47 | Mocks in production | Disabled: mock routes 404 and navigation hides them unless `ENABLE_MOCKS=true` (for a preview demo only; there are no live keys anywhere) | Phase 3 replaces each interface (`PaymentProvider`, `ESignProvider`, `ClientPortal`, `ScoreDelivery`, `FlightSource`); `packages/mocks/src/guard.ts` |
| Q48 | Flight map land outline | Natural Earth 110m (public domain), bundled at `apps/web/src/components/flying/land.json`; no tile service | Owner may want a finer outline; credit is in the page footer notes |
| Q49 | Instruction slot switch | `/flying/instruction` is a 404 unless the setting `flying.instruction.enabled` is true (or `FLYING_INSTRUCTION=on` locally); no admin toggle yet | Add the toggle to Pages & settings when the owner wants the slot |
| Q50 | Font loading for the display and voice faces | `font-display: optional` (with preload) so a late font swap never re-measures the hero headline (LCP) or shifts layout; on a very slow first view the metric-adjusted fallback shows instead, the font is cached for the next view | Switch back to `swap` in `apps/*/src/lib/fonts.ts` if you prefer the font on every first view over LCP |
| Q51 | Storage for client galleries | **Decided 2026-10-15: Vercel Blob only.** Vercel Pro included usage should cover it, so Cloudflare R2 is dropped from the plan. `StorageProvider` interface stays (Blob implementation first; R2 implementation not built) | Re-check Blob quotas and per-GB cost against real library size before the first real upload |
| Q56 | Cost model | **Decided: website-only costs up to about $20/month** (Vercel Pro). Resend and Neon on free tiers; no R2. Stripe and WHCC fees are passed to the client, never out of pocket. Rekognition not enabled | Fee pass-through must be built into prices or shown as a disclosed line; a credit-card surcharge stays P2 and default off because of card-network and state rules (see 13). Re-verify vendor prices |
| Q52 | Payments, invoices and tax | **Decided:** own invoices, quotes and payment records in our database; Stripe only for payment (Checkout/embedded, webhooks); Stripe Invoicing not used. Tax calculated at checkout only; nothing after collection (no filing, IRS reporting, tax prep). Stripe fees passed to clients | Payment plans built on our side; confirm Stripe Tax registration states with the owner/accountant |
| Q53 | Client login | **Decided:** password account and magic link both; gallery passcode link stays | Hashing, reset and rate limits in the portal milestone |
| Q54 | WHCC | **Decided:** set up fully with placeholder base URL, keys and product IDs (marked PLACEHOLDER), behind `PrintProvider` and a mock; no credentials, no live calls | Owner requests WHCC credentials; confirm cancellation rules, drop-ship minimum, billing terms |
| Q55 | Face search | **Decided:** set up consent flow, per-gallery flag (off), consent log, retention and delete jobs, and a `FaceSearchProvider` mock with placeholder links; no AWS integration | Legal check on biometric laws before any Rekognition integration |
| Q57 | Photography host | **Done in code 2026-10-15:** `photo.jerryqiu.com` canonical; `apps/photos` redirects `photos.` to it. Internal id `photos` and `NEXT_PUBLIC_PHOTOS_URL` kept | Owner adds `photos.` as an alias domain on the photo project |
| Q58 | Deployment layout | **Done in code 2026-10-15:** `apps/web` (hub), `apps/photos`, `apps/music`, `apps/flying`, `apps/make`, each a separate Vercel project by Root Directory; shared `packages/` one-way. Hub revalidates the others over HTTP | Owner creates the Vercel projects; verify the outside-root-directory setting (NOT VERIFIED) |
| Q59 | Make site | `apps/make` is a placeholder page (hub theme, no data). Content and theme not built | Owner picks the 3 to 5 projects and handle vs name |
| Q60 | Flying and music plans from the owner's second plan (docs 15, 16) vs Phase 2.5 worlds in doc 12 | Docs 15 and 16 are merged as the newer wishlist; Phase 2.5 privacy defaults for flying stay stricter (Q43) | Owner resolves differences, for example flight-map vs tools-only |
| Q61 | Prices | All package, add-on, extension, print and score prices are placeholders (`$XX` / labelled SAMPLE) | Owner supplies real prices |

## Design prompt v3 rev. 3 review (2026-10-15)

| # | Question | Default chosen | Impact if otherwise | Where |
|---|---|---|---|---|
| Q-v3-1 | "Improve the prompt" read as editing docs/project/18-design-prompt-v3.md, not building the sites | Spec revised only; no app code touched | Owner can say "build it" and a session follows section 5 | docs/project/18-design-prompt-v3.md |
| Q-v3-2 | Hero sets use `featured` flag (no rating data exists) | featured, else sort order | Different frames in heroes | section 6 |

## Photo site build (2026-10-15 onward)

| # | Question | Default chosen | Impact if otherwise | Where |
|---|---|---|---|---|
| Q62 | The photo-site handoff said "remove ShootProof completely"; older Q5/Q21/Q28/Q30 mention it | Those rows are marked CANCELLED; archive docs keep the history | none | this file, `archive/shootproof-bridge.md` |
| Q63 | Image protection tiers: `off`/`light` removed | One strict policy for every photograph; non-photograph UI illustrations (sample-data screenshots) are the only plain images | Owner may want a public-portfolio exception (higher CDN cache hit) | spec section 4 |
| Q64 | Docs set reduced from about 45 files to 8 live docs | Old docs moved with `git mv` to `docs/project/archive/` | restore by moving back | `docs/project/` |
| Q65 | `@jerryqiu/email`, `prints`, `facesearch` new packages | Created as shared packages, each with a real adapter plus mock | none | `packages/` |
| Q66 | Link-preview (Open Graph) images from photographs | Removed on the photo site (no unprotected photograph path); a generated text card replaces it in PHOTO-M11 | Owner may accept a small watermarked preview exception | `apps/photos/src/app/layout.tsx` |
| Q67 | Markdown images from the CMS on the photo site | Only `media:UUID` images render (protected); plain https images are dropped | none | `packages/render/src/markdown.tsx` |
| Q68 | Gallery link visibility | Two choices: passcode only, or anyone with the link (view and shop; proofing stays with the passcode). No link-plus-passcode mix | Owner may want a visitor passcode too | `gallery-shop.ts` |
| Q69 | Prices in the shop | Starter price list marked SAMPLE (shown as SAMPLE in the shop and the price list) until the owner saves a real price | Owner sets real prices in Money, Shop | `studio_products` |
| Q70 | Shipping for prints | Flat SAMPLE rate ($8 plus $2 per extra print, US/CA/MX) until a lab quote replaces it; the amount is computed on the server | Real lab shipping quote | `shippingFor` |
| Q71 | Shop orders and billing | A shop order is an invoice of kind "shop" under the gallery's job, paid on the existing pay page; it is excluded from client reminders (no due date) | A separate checkout later | `placeOrder` |
| Q72 | Album nesting | One level of sub-albums (parent and child), enforced in the db layer | Deeper trees | `galleries.ts` |
| Q73 | Order links | Derived (`order id` + HMAC) so the payment webhook and the receipt email produce the same link; the id alone opens nothing | Stored tokens | `lib/order-link.ts` |

