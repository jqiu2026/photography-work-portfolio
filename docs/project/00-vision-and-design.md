# 00. Vision and design

Merged 2026-10-15 from the old 00, 10, 12 and design-language docs (archived in `archive/`).

## What this is

A family of sites on one monorepo and one design system, Holominimal (`@holominimal/ui`, prefix `hm`).

| Site | Host | App | Role |
|---|---|---|---|
| Hub | jerryqiu.com | `apps/web` | Who Jerry is, the blog, about, connect, legal pages, and the `/admin` CMS for all sites |
| **Photography** | **photo.jerryqiu.com** (`photos.` redirects) | **`apps/photos`** | **Portfolio, video, case studies, booking, product tour, and the native photo-business platform. Current scope.** |
| Music | music.jerryqiu.com | `apps/music` | See [other-sites.md](other-sites.md) |
| Flying | flying.jerryqiu.com | `apps/flying` | See [other-sites.md](other-sites.md) |
| Make | make.jerryqiu.com | `apps/make` | Placeholder, see [other-sites.md](other-sites.md) |

Cross-site rule (Q45): the hub may link to the others; photography, music and flying show one `jerryqiu.com` return button and no other cross-site links (enforced by `e2e/cross-site.spec.ts`).

## Current scope: the photo site

Build the complete photo.jerryqiu.com as the portfolio **and** the live tour of a platform that replaces ShootProof. Spec: [01-photo-site-spec.md](01-photo-site-spec.md). Do not start the hub, music, flying or make redesigns.

## UI direction for now: modern and plain

The visual redesign is a later, separate pass. Until then:

- Use Holominimal components and tokens: clean, dark-cinema-first with a light theme, red accent for photography, fast and calm.
- **Paused (do not build):** the "v3" design (colossal viewport-size type, parallax, focus pulls, custom cursor labels, full-page effects, WebGL stage, scroll-jacking). Owner feedback on a prototype: the cursor label, image animations and jitter were unacceptable.
- Minimal motion: short fades only, nothing scroll-linked, respect `prefers-reduced-motion`.
- Studio and client areas are dense and calm: 15 px body, hairline tables, status as text plus a dot.
- Structure components so a re-skin touches tokens and CSS only, not logic.
- Reference only: the live component library at `apps/docs` route `/library` (`cd apps/docs && PORT=3010 pnpm dev`; port 3001 on this machine belongs to an unrelated project).

## Principles

1. Photos and work first. 2. Real facts only; unverified copy is `TODO(owner)`; no invented clients, testimonials, EXIF or repertoire. 3. Jerry's first-person voice, short and specific. 4. Accessible by default (WCAG 2.2 AA, keyboard, reduced motion, visible focus, 44 px targets, AA contrast). 5. Performance is a feature (Lighthouse mobile 80+ on photo pages with protected images, CLS under 0.02). 6. Honest security: real defences plus clearly labelled deterrents. 7. Cheap to run (about $20/month). 8. Mock, label, then replace: anything needing a missing key is a real adapter plus a labelled mock behind an interface. 9. Small reversible steps; every commit keeps the gates green or says `wip:`.

## Non-goals

No native apps, no multi-tenant SaaS (a nullable `studio_id` is kept), no live flight tracking, no AI features beyond optional AI-draft replies approved by the owner (OPT).
