# 01. Decisions and assumptions

The owner will not be around while this runs. **Never block on a question.** Use the default below, record it in [QUESTIONS.md](QUESTIONS.md) if it is not already listed, and keep going. Every default here is reversible.

## Decided by the owner

| # | Decision |
|---|---|
| D1 | Own UI package, open source, with docs. Name is a placeholder for now. |
| D2 | Three phases (see [02](02-phase-1-ui-package-and-redesign.md), [03](03-phase-2-cms-and-protection.md), [04](04-phase-3-photo-business-platform.md)). Phase 1 flows into Phase 2 automatically. **Stop after Phase 2.** |
| D3 | Look: modern, minimalist, professional, sleek, elegant, intuitive, legal. Squarespace-grade polish with a restrained Apple-style motion layer (scroll sequences, WebGL hero). Details in [10](10-design-brief.md). |
| D4 | Full ShootProof replacement in Phase 3 (galleries, contracts, invoices, payments). About 30 GB of photos today. |
| D5 | Login is Google OAuth restricted to `@jerryqiu.com` Workspace accounts. |
| D6 | Budget: Vercel Pro (accepted). Up to about **$5/month** for extra storage. Avoid every other recurring cost. |
| D7 | Screenshot "prevention" is a popup shown when screenshot or save key combos are pressed (like Snapchat's warning), plus blurring protected content. Treated as deterrence. |
| D8 | ShootProof can be a temporary external image source through its API (Phase 2 bridge). |
| D9 | Work on branch `feat/custom-ui-cms`. Live preview at `http://localhost:3000`. |
| D10 | Commits have **no co-author trailer**. |
| D11 | **A family of sites on subdomains, one monorepo, one design system.** `jerryqiu.com` is the personal hub ("ME"), a profile-style home. Dedicated worlds live on subdomains: `photos.jerryqiu.com` (photography portfolio now, the full studio/ShootProof replacement in Phase 3; ShootProof sits there today), `music.jerryqiu.com`, `flying.jerryqiu.com`. More can be added later with little work. |
| D12 | **Do not duplicate StuyAviators.** It was shown only as an example. Reuse its engineering patterns, not its look, copy or identity. See [09](09-reference-stuyaviators.md), [10](10-design-brief.md). |
| D13 | Legal soundness is a requirement ([11](11-legal-and-compliance.md)). Draft the pages and mechanisms; flag all legal text for professional review; give no legal advice. |
| D14 | ShootProof keeps serving `photos.jerryqiu.com` until the owner changes DNS after Phase 3 migration is verified. **Never touch DNS or Vercel domains.** |

## Defaults chosen by the planner (change freely)

| # | Question | Default | Why |
|---|---|---|---|
| A1 | CMS: Payload, custom, or git-backed? | **Custom admin built on our own UI package**, using the pattern already working in the stuyaviators repo (Auth.js v5 + Google, Drizzle ORM, Neon Postgres, Server Actions, permission matrix, trash). | The owner already built and shipped this pattern. It dogfoods the UI package. Payload would save days but leaves the admin looking like Payload. **This revises an earlier suggestion of Payload.** |
| A2 | Monorepo? | **pnpm workspace**: `apps/web` = the hub **plus the music and flying sites**, served from one deployment by host-based routing (:3000); `apps/photos` = the photography site/studio, its own deployment because it will hold clients, payments and a separate session (:3002); `apps/docs` = UI docs (:3001); `packages/ui` (open source); `packages/config`; and from Phase 2 private shared packages `packages/db`, `packages/auth`, `packages/storage`, `packages/protect`, `packages/sites` (site registry, theme presets, cross-site links). | Music and flying are small content sites that share the hub's CMS, so one app serves several hostnames. Photos is a product and stays separate. Two Vercel projects under the one Pro plan (document, do not create). |
| A3 | Package manager | **pnpm** (same as stuyaviators). | Consistency. |
| A4 | Styling | **Tailwind CSS v4** at build time, compiled to one shipped stylesheet. **All theming through CSS variables** so consumers don't need Tailwind. | Matches stuyaviators. Variables keep the package framework-agnostic. |
| A5 | Motion | **`motion`** (the Framer Motion successor) for components. Port stuyaviators' `PinnedScene`, `Parallax`, `RevealText`, `StackingCards`, `TiltCard`, `StepSequence`, `HorizontalShowcase`, `InView`, `CountUp`. | Proven, already written by the owner. |
| A6 | Smooth scroll | **Lenis**, opt-in provider, off under reduced motion. | Standard for Apple-style scroll. |
| A7 | WebGL | **`ogl`** (about 30 KB) for the hero shader/scene, shipped as an optional subpath export `.../webgl`, lazy-loaded, with a static-image fallback. Use three.js only if a specific feature needs it. | Keeps the bundle small. |
| A8 | Image sequences | `ImageSequence` component draws frames to `<canvas>` scrubbed by scroll. Frames come from a script (`scripts/make-sequence.ts`, ffmpeg + sharp). Until the owner supplies footage, generate a **placeholder sequence** from existing portfolio photos (slow zoom/crossfade). | No footage available yet. |
| A9 | Docs site | **Our own Next.js MDX docs site** (`apps/docs`, port 3001) built with the UI package itself. No Storybook at first. | Dogfooding, one fewer tool. |
| A10 | Testing | Vitest + Testing Library (unit/component), Playwright (e2e, runs against `apps/web`), `axe` for accessibility checks. | Standard, free. |
| A11 | Versioning and release | **Changesets**. License **MIT**. **Do not publish to npm.** Prepare so that publishing is one command. | Publishing is outward-facing; the owner decides. |
| A12 | Content in Phase 1 | Keep MDX files as the content source, in typed content modules. Phase 2 migrates content into Postgres with an import script. | Keeps Phase 1 small and the site working. |
| A23 | Content model for the hub | Generic **projects** with a `type` (photography, software, design, writing, other), not photography-only. Plus `posts`, `galleries` (portfolio showcase), `pages`, `settings` (including `socials`), and a **`timeline_entries`** table (category: work, education, leadership, volunteering, flying, music, photography, other) that powers the profile-style About/home, the interest pages and the CV. Interest sections (`music_items`: recordings/performances, `flight_entries`: milestones/aircraft/flights) extend it. Existing school-event photography projects become `type: photography`. | The hub is about the whole person. |
| A24 | Cross-site auth | Staff session (owner/editors) uses Auth.js with a cookie scoped to `.jerryqiu.com` **in production only**, so one sign-in covers `/admin` (hub app, manages all sites' content) and `/studio` (photos app). In dev, apps on different ports share `localhost` cookies. **Client** sessions (Phase 3) use a different, host-only cookie on `photos.jerryqiu.com` so a client session never reaches other subdomains. Same `AUTH_SECRET` in both projects. | Convenience for the owner, isolation for clients. Log as Q14. |
| A25 | What lives where | **Hub app (`apps/web`)**: hub pages, music site, flying site, `/admin` (the CMS for *all* sites). **Photos app (`apps/photos`)**: Phase 1 public photography portfolio (moved from the old site: showcase, galleries, about the photographer, "book/contact"), Phase 2 reads portfolio content from the DB plus a `/studio` admin shell and the ShootProof bridge, Phase 3 client galleries, store, booking, contracts, invoices. The hub keeps only a photography *preview* that links out. | Matches how the owner thinks about the sites. |
| A26 | Local dev hosts | No `/etc/hosts` edits. Hub on `localhost:3000`, photos on `localhost:3002`. The music and flying sites are reachable in dev both by path (`localhost:3000/music`, `localhost:3000/flying`) and by subdomain in Chrome/Firefox (`music.localhost:3000`, `flying.localhost:3000`, which resolve to loopback). Cross-site links come from the site registry in `packages/sites`, which reads env (`NEXT_PUBLIC_*_URL`) and defaults to the localhost URLs in dev and the real subdomains in production. | No system changes needed. |
| A27 | Design direction | Chosen in Phase 1 via the `/_design` exploration (see [10](10-design-brief.md)), not copied from StuyAviators. Winner and rationale recorded in `design-language.md` and Q3. | Evidence-based while the owner is away. |
| A29 | Sites and nav | Hub nav: Work, Writing, About, and a **Sites** group (Photos, Music, Flying) plus a Connect button. Every site shares a header with a small **site switcher** ("Jerry Qiu ▾" listing all sites) and a footer "More from me" row, so the family feels like one person with several rooms. Each site has its own accent/hero/theme preset from the same design system. See [10](10-design-brief.md). |
| A30 | Facts about the owner | Claude must **never invent** biography, ratings, flight hours, awards, quotes or performances. Use `TODO(owner):` placeholders and clearly fake sample data in dev only; production hides empty fields. Existing content (blog posts, projects, about copy in `src/resources/content.tsx`) is real and may be reused. | Honesty, and the non-boastful goal. |
| A31 | Social/account links | Stored in CMS settings (label, URL, icon, order, show-in-header/footer). Seed with placeholders; real URLs found in the existing `content.tsx` (it has a social list) are imported as-is. `rel="me"` + `Person` JSON-LD `sameAs`. | Profile-style home needs them. |
| A32 | Embeds | Click-to-load facades for Spotify/SoundCloud/YouTube/Bandcamp/Instagram; no third-party script or cookie loads before consent-by-click. | Privacy, speed, legal posture. |
| A33 | Host routing | `apps/web` has a `proxy.ts` (Next 16's replacement for `middleware.ts`; **verify in the installed docs**) that maps the request host through `packages/sites` and rewrites `music.jerryqiu.com/x` -> `/music/x`, `flying.jerryqiu.com/x` -> `/flying/x`. In production, `jerryqiu.com/music` and `/flying` 308-redirect to the subdomains (one canonical URL per page); in dev the path form works. Sitemaps, robots, OG images and canonical URLs are host-aware. | One deployment, several domains, clean URLs, no duplicate SEO. |
| A34 | Subdomain identity | Each site picks a theme preset (accent, hero treatment, sometimes display type) from the design system; layout, components, motion language and legal pages are shared. Presets are data in `packages/sites`, editable later in the CMS settings. | Distinct rooms, consistent house. |
| A28 | Legal text | Drafted from real data flows, marked for lawyer review, with placeholders for entity, address, jurisdiction. | See [11](11-legal-and-compliance.md). |
| A13 | Hosting and domain | Vercel Pro. Domain `jerryqiu.com` (already owned). Do not deploy or change DNS. | Outward-facing. |
| A14 | Database | **Neon Postgres** via the Vercel integration (free tier first). Local dev uses PGlite or a local Postgres, like stuyaviators. | Already used by the owner, cheap. |
| A15 | Object storage | A `StorageProvider` interface with two implementations: **Cloudflare R2** (private originals, free egress, about $0.015/GB/month) and **Vercel Blob** (public derivatives, already used in stuyaviators). 30 GB on R2 is about $0.30/month. Local dev uses the filesystem. | Cheapest for large private files; keeps code portable. Verify current prices when implementing. |
| A16 | Email | **Resend** free tier (3,000/month) for notifications; React Email templates (already used in stuyaviators). | Free at this volume. |
| A17 | Payments | **Stripe** (pay-as-you-go fees, no monthly cost). Build behind a `PaymentProvider` interface. Test mode only until the owner adds live keys. | Standard. |
| A18 | E-signature | Built in: typed name + drawn signature, timestamp, IP, user agent, document hash, audit trail PDF. | Free. Add a "have a lawyer review the templates" note. Not legal advice. |
| A19 | Placeholder package name | `@placeholder/ui`, brand `PlaceholderUI`, CSS variable prefix `--ph-`. All occurrences come from **one config file** and a `pnpm rename` script so the real name is a 5-minute swap. | Owner is still choosing a name. |
| A20 | Branding for the hub | Brand is **Jerry Qiu** (personal), not "Jerry Qiu Photography"; photography branding lives on the studio. Palette, type and identity come from the `/_design` exploration, **not** from StuyAviators. Photos need neutral surroundings. | The hub is about the whole person. |
| A21 | Analytics | Keep `@vercel/analytics` and `@vercel/speed-insights` (already installed). No other trackers. | Already paid for with Pro. |
| A22 | Git push / PRs / deploy | **Never** without the owner. Local commits only. | Outward-facing. |

## Known risks

- **ShootProof API access is gated.** Third-party summaries say the API is OpenAPI 3.0 with three-legged OAuth 2.0 at `developer.shootproof.com`, but the client ID must be requested from ShootProof support, and there is no sandbox. The bridge must be built against the docs and mocks, and work end-to-end only after the owner obtains credentials. Note this in [QUESTIONS.md](QUESTIONS.md). Verify against the live docs.
- **Next.js 16 has breaking changes** relative to older training data. Before writing Next code, read the guides in `node_modules/next/dist/docs/` (the stuyaviators repo says the same in its `AGENTS.md`). Same for Auth.js v5 beta and Tailwind v4.
- **Auth.js v5 is still beta** (`5.0.0-beta.x`). Pin the exact version that works in stuyaviators.
- **Photography ToS and payments.** Taking payments and storing signed contracts has legal and tax implications for the owner. Build the tools, flag it in docs, do not give legal advice.
- **Image sequences are heavy.** Cap frame count and weight; ship WebP/AVIF frames, load progressively, and fall back to a poster on slow connections and mobile data-saver.
