# 09. Reference: the StuyAviators repo (engineering reference only)

Local path: `/Users/jerry/Documents/stuyaviators.github.io` (live: https://stuyaviators.vercel.app). It is a sibling project by the same owner, already shipped. **Read it; do not modify it.**

> **This is an engineering reference, not a visual one.** The owner showed it as an example of what they can build. The new site must **not** look like it or be a variation of it (see [10](10-design-brief.md), "NOT the StuyAviators site"). Reuse its auth, database, upload, admin and testing patterns, and the *structure* of its token system and motion primitives. Do not reuse its palette, fonts, logos, copy, layout, scene scripts, or aviation/club metaphors. Re-tune ported motion code (timing, easing, purpose) to the new design language.

## Stack there (pin to the same working versions when sensible)

pnpm 10, Next 16.3, React 19, Tailwind 4, `motion` 14, Drizzle ORM + Neon (`@neondatabase/serverless`), Auth.js (`next-auth` 5.0.0-beta.32) with Google, `@vercel/blob`, `zod` 4, `sharp`, `markdown-it`, React Email, Vitest, `@electric-sql/pglite` for local DB, Prettier + xo. `AGENTS.md` warns that this Next version has breaking changes: read `node_modules/next/dist/docs/`.

## What to reuse

| Need | Look at |
|---|---|
| Structure of a token system (light/dark, CSS variables). **Structure only, not the values.** | `src/styles/globals.css` |
| Motion primitives | `src/components/motion/`: `PinnedScene`, `Parallax`, `RevealText`, `StackingCards`, `TiltCard`, `StepSequence`, `HorizontalShowcase`, `InView`, `CountUp`, `ScrollHighlight`, `BackgroundVideo` |
| Page transitions | `src/components/TransitionProvider.tsx`, `TakeoffArrival.tsx`, `template.tsx` |
| UI atoms | `src/components/ui/` (`Button`, `Section`, `PageHero`...) |
| Header/Footer/hero patterns | `Header.tsx`, `HeaderOverlay.tsx`, `Hero.tsx`, `HeroMedia.tsx`, `Footer.tsx` |
| Lightbox / gallery | `Lightbox.tsx`, `dashboard/GalleryManager.tsx`, `src/lib/gallery.ts` |
| Copy protection (basic) | `MediaGuard.tsx` (context menu and drag blocking) |
| Auth + allow-list + roles | `src/auth.ts`, `src/lib/users.ts`, `session.ts`, `permissions.ts`, `action-guard.ts`, `open-signin.ts`, `docs/google-oauth-setup.md` |
| Admin dashboard | `src/app/dashboard/`, `src/components/dashboard/` (`ui.tsx`, `fields.tsx`, `Toast`, `Confirm`, `TrashList`, `BlockList`, `PermissionMatrix`) |
| DB schema + migrations + seed | `src/db/`, `drizzle/`, `scripts/seed.ts` |
| Uploads | `src/app/api/upload/route.ts`, `src/lib/client-upload.ts`, `blob-upload.ts`, `blob-cleanup.ts`, `uploads.ts` |
| Image optimization scripts | `scripts/optimize-images.ts`, `scripts/photo-specs.ts` |
| Rate limiting / crypto / ICS / OG | `src/lib/rate-limit.ts`, `crypto.ts`, `ics.ts`, `og.tsx` |
| Trash, ordering, ownership | `src/lib/trash.ts`, `reorder.ts`, `ownership.ts` |
| Newsletters (optional) | `src/lib/newsletter/`, `src/emails/` |
| Docs style | `docs/phase-4-handoff.md`, `docs/phase-6-ideas.md`, `docs/google-oauth-setup.md` |

## What not to copy

Anything club-specific (meetings, Epsilon integration, crew, careers, scholarships), stuyaviators branding, color values, fonts, logos, page layouts, copy, and the "$0 rule" wording. Do not copy secrets or `.env.local`.
