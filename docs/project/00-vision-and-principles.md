# 00. Vision and principles

## What this is

Jerry Qiu's site today is a Next.js portfolio built on Once UI (`@once-ui-system/core`, "Magic Portfolio" template) with MDX content in `src/app/blog/posts` and `src/app/work/projects`, and a static gallery (the ShootProof integration was abandoned, commit `55a8d8a`).

It becomes **a family of sites that share one codebase and one design system**, each on its own hostname:

| Site | Domain | Purpose |
|---|---|---|
| **The hub ("ME")** | `jerryqiu.com` | A personal site about Jerry as a whole person: a **profile-style home** (a glorified LinkedIn-like page that is his own, not LinkedIn) with who he is, what he has done and is doing, and where to find him online (social links on the home page, footer and `/connect`). Also work/projects, writing, about, contact. It introduces the other sites with preview cards. The goal is to show who he is, **warmly and without boasting**: specific, plain and honest rather than promotional. It must work for someone who has never heard of any of the sub-sites. |
| **Photography** | `photos.jerryqiu.com` | The photography side: the public portfolio now; client galleries, proofing, downloads, store, booking, contracts and invoices in Phase 3 (the ShootProof replacement). ShootProof serves this hostname today, and keeps doing so until the owner switches DNS after Phase 3 is verified. |
| **Music** | `music.jerryqiu.com` | What he plays, recordings, performances, listen-in embeds. |
| **Flying** | `flying.jerryqiu.com` | The flying journey: ratings and milestones, aircraft, memorable flights, cockpit photos, the StuyAviators connection. |

More sites can be added later by registering a hostname in `packages/sites`. The sites link to each other through a shared header **site switcher** and a "More from me" footer row. Photography, music and flying each get a compact preview card on the hub home page.

## The three phases

1. **Phase 1.** An open-source UI package of our own (placeholder name, see [07](07-naming-brainstorm.md)), with real docs, and the hub, the photography portfolio, and the music and flying sites rebuilt or built on it.
2. **Phase 2.** A CMS (Google login, `@jerryqiu.com` only) so the owner manages posts, projects, portfolio, music, flying, timeline, social links, pages and settings for all sites without touching code. Image protection. The photography app gets a studio admin shell and the temporary ShootProof bridge.
3. **Phase 3.** `photos.jerryqiu.com` becomes a full ShootProof replacement. Not started until the owner says so.

## Taste bar

Read [10-design-brief.md](10-design-brief.md). In one line: **modern, minimalist, professional, sleek, elegant, intuitive, and legally sound**, with the polish of a well-designed Squarespace site and a restrained, somewhat futuristic layer of Apple-style motion on top.

The sibling StuyAviators site (https://stuyaviators.vercel.app) is an **engineering reference only**: it was shown as an example of what the owner can ship. This site must **not** look like it. See [09](09-reference-stuyaviators.md).

## Principles

1. **Photos first.** Never let UI or motion fight the images. Fidelity, color accuracy and fast loading beat effects.
2. **Calm by default, spectacular on purpose.** Most of the site is quiet, refined and fast. A few moments (home hero, one or two scenes) carry the wow. Motion always has a purpose and always degrades gracefully.
3. **Show who I am, not how great I am.** Copy is first person, concrete and modest: facts with context, credit to others, no superlatives ("award-winning", "passionate", "world-class"). Let the work, photos and details speak. See the tone guide in [10](10-design-brief.md).
4. **Intuitive.** A first-time visitor finds work, writing, about and contact within two clicks with no instructions. Familiar patterns over clever ones. No mystery-meat navigation.
5. **Performance is a feature.** Mobile Lighthouse performance >= 90 on the home page *with* the motion. Heavy things (WebGL, image sequences) lazy-load and have lightweight fallbacks.
6. **Accessible by default.** WCAG 2.2 AA. Full keyboard use. `prefers-reduced-motion` gives a calm, complete experience, not a broken one.
7. **Legally sound.** Privacy, terms, copyright and licensing, accessibility statement, takedown contact, honest cookie/analytics posture, third-party license compliance. See [11](11-legal-and-compliance.md). We build the pages and mechanisms; we do not give legal advice, and sample legal text is marked for professional review.
8. **Honest security.** The web cannot truly block screenshots. We build real defenses (no originals exposed, expiring URLs, watermarks, traceability) plus deterrents (popup on screenshot keys, no right-click), and we say plainly which is which. See [05](05-security-and-image-protection.md).
9. **Cheap to run.** Owner pays for Vercel Pro and up to about $5/month of extras. Anything else must be free-tier or justified. See [06](06-cost-analysis.md).
10. **Open source quality.** The UI package is a public product: semver, changelog, docs, tests, contribution guide, MIT license, no secrets or personal photos in its repo history.
11. **Small, reversible steps.** The site must run at `localhost:3000` after every milestone. Migrate Once UI out piece by piece, not in one big bang.
12. **Own your dependencies.** Few, well-maintained libraries; write down why each non-trivial one was chosen.

## Non-goals (for now)

- No native mobile apps.
- No multi-photographer / multi-tenant SaaS. One owner (keep a nullable `studio_id` so tenancy *could* be added, but do not build it).
- No AI features beyond optional free alt-text autofill.
- No e-commerce on the hub. Selling happens on the studio (Phase 3).
