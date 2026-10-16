# 14. Sites, hosts and deployment layout (decided 2026-10-15)

## 1. Sites and hosts

| Site | Host | Folder | Doc |
|---|---|---|---|
| Hub ("ME") | jerryqiu.com | `apps/web` (hub and `/admin` CMS) | [12](12-vision-v2.md) |
| Photography + studio | photo.jerryqiu.com (`photos.` redirects to it) | `apps/photos` | [04](04-phase-3-photo-business-platform.md), [13](13-feature-list-2026-10-15.md) |
| Music | music.jerryqiu.com | `apps/music` | [15](15-music-site.md) |
| Flying | flying.jerryqiu.com | `apps/flying` | [16](16-flying-site.md) |
| Make (new) | make.jerryqiu.com | `apps/make` (placeholder page) | [17](17-make-site.md) |

## 2. Deployment rules (owner decision)

- One Git repo. **Each site is its own Vercel project and its own deployment**, with Root Directory set to its app folder. A failed build or bad env var in one project blocks only that project.
- Shared code lives in one **master shared folder** (`packages/`, today `@halation/ui`, `@jerryqiu/render`, `@jerryqiu/mocks`, payments and others). Apps may read from it. **The shared folder never imports from an app, and apps never import from each other.** A deployment can only see its own app folder plus the shared folder.
- Each app has its own `.env.local` and a `.env.example` listing names only. Secrets are never committed, pasted or read by Claude.
- Changes to a shared package can affect several apps, so a shared change must pass every app's gates before it is merged.
- Vercel Pro is one team: about $20/month, the only fixed cost target ([06](06-cost-analysis.md), Q56). Set a spend budget of about $10 with pausing on.

## 3. Open points (NOT VERIFIED)

- Whether Vercel lets a project with Root Directory `apps/photos` build from `packages/` outside that folder (the "include files outside the Root Directory" setting) and how it behaves with pnpm workspaces. Check Vercel's docs before the first split.
- Vercel's project-per-repo limits (the pasted notes said 150 on Pro, 25 on Hobby) and Web Analytics pricing.
- Per-project "ignored build step" settings so a docs-only or other-app change does not rebuild everything.

## 4. Status (2026-10-15)

Done in code, locally (no Vercel projects, DNS or deploys were touched):

- Host rename to `photo.jerryqiu.com` everywhere in code and docs; `apps/photos` redirects `photos.jerryqiu.com` to it (host redirect in `next.config.mjs`). Env var names and the internal site id (`photos`) are unchanged.
- `apps/web` split: `apps/music` (port 3003) and `apps/flying` (3004) are standalone apps with their own copies of the few helper files they need (same pattern as `apps/photos`). The hub redirects `/music` and `/flying` (308) to their hosts and its proxy only guards `/admin`.
- The hub CMS now pokes the photo, music and flying sites over `/api/revalidate` (shared `REVALIDATE_SECRET`) after a change.
- `apps/make` (port 3005) is a placeholder page; it has no database, preset or registry entry yet.
- Ports: hub 3000, photo 3002, music 3003, flying 3004, make 3005 (e2e: 4000, 4001 docs, 4002, 4003, 4004).
- Verified: lint (one earlier, unrelated error in `apps/photos/.../studio/actions.ts`), typecheck, unit tests, production build of every app, `test:e2e` 208 passed. `test:admin`: 51 passed, 1 failed (`studio.spec.ts` Stripe webhook test, in a file that already had uncommitted edits before this change).

## 5. Still to do

1. Per-project Vercel setup by the owner (Root Directory, env vars, domains, `photos.` alias); verify the outside-root setting on the first project.
2. Optional per-project "Ignored Build Step" so a change in one app does not rebuild the others (NOT VERIFIED).
3. Give Make its own theme preset, content and (if needed) registry entry.
4. Rename the internal site id `photos` and `NEXT_PUBLIC_PHOTOS_URL` to `photo` (cosmetic, not needed for the hostname).
