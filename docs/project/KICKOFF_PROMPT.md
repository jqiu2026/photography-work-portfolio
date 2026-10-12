# KICKOFF PROMPT

Paste the block below into a fresh Claude Code chat opened in `/Users/jerry/Documents/photography-work-portfolio`.

````markdown
You are the lead engineer on a long, unattended, multi-phase project in /Users/jerry/Documents/photography-work-portfolio (Jerry Qiu's photography portfolio, currently Next.js + Once UI). The owner will be away. Work autonomously until all allowed tasks are complete or usage runs out.

## Read first (in this order, fully)
1. docs/project/README.md (index)
2. docs/project/08-operating-rules.md (HARD RULES, read twice)
3. docs/project/00-vision-and-principles.md, then 10-design-brief.md and 11-legal-and-compliance.md
4. docs/project/01-decisions-and-assumptions.md
5. docs/project/PROGRESS.md and docs/project/QUESTIONS.md
6. docs/project/02-phase-1-ui-package-and-redesign.md, then 03 when you reach Phase 2. Also read 05, 06, 09, DEPLOYMENT.md when relevant. Do NOT start 04 (Phase 3).
7. If docs/project/HANDOFF.md exists, it is the most recent state: follow it first.

## What we are building
A family of sites for Jerry Qiu, one monorepo, one open-source UI package of our own (placeholder name @halation/ui, one-config rename):
- jerryqiu.com, the personal hub ("ME"): a profile-style home (like a glorified LinkedIn page that is his own, not LinkedIn and not imitating its look) showing who he is warmly and WITHOUT boasting, with social/account links, about/timeline, work, writing, connect.
- photos.jerryqiu.com: photography portfolio now (apps/photos); becomes the ShootProof replacement in Phase 3 (ShootProof serves this hostname today; never touch DNS).
- music.jerryqiu.com and flying.jerryqiu.com: small content sites served by the hub app via host routing (proxy.ts), on a shared interest-site template.
- Shared header site switcher + "More from me" footer so the sites feel like one person with several rooms.

## Design direction (important)
Priorities in order: professional and elegant; modern, minimalist, sleek; intuitive; legally sound; a little futuristic with cinematic Apple-style motion used sparingly (scroll-scrubbed image sequence, pinned scenes, parallax, text reveals, page transitions, a WebGL hero). Visual reference for polish: Squarespace-grade sites (study their public site and template gallery; patterns, never copy assets/text/layouts). The StuyAviators site (https://stuyaviators.vercel.app, local repo ~/Documents/stuyaviators.github.io) was only an EXAMPLE of what the owner can build: it is an ENGINEERING reference (auth, DB, uploads, admin patterns, tests), read-only. The new sites must NOT look like it: different palette, type, layout, nav, motion choreography, no aviation/club metaphors. Do the /_design exploration (3 directions), pick one with reasons, and do the side-by-side check before Phase 1 acceptance. Copy is first person, plain and non-boastful (tone guide in 10). NEVER invent biography, credentials, flight hours, awards, recordings or quotes; use TODO(owner): placeholders and reuse only real existing content.

## Phases
- Phase 1: UI package + docs site + all sites rebuilt on it (hub, photos portfolio, music, flying), Once UI removed, legal pages, quality gates in doc 02.
- Phase 2: custom CMS at /admin (hub app, one CMS for all sites with a site selector), Google sign-in restricted to @jerryqiu.com Workspace accounts (verify ID-token hd claim AND email suffix server-side, plus allow-list), managing profile/timeline/social links, posts, projects, portfolio galleries, music, flying, pages/settings, media, inbox, users, trash, audit log, versions; image protection (private originals, signed expiring URLs, blob/canvas rendering, ScreenshotGuard popup + blur on screenshot/save key combos as a Snapchat-style deterrent, honest that it cannot stop OS screenshots or phone cameras, watermarking); apps/photos gets a /studio admin shell and the temporary ShootProof API bridge (mocked until credentials exist).
- Phase 3 (client galleries, contracts, invoices, payments on photos.jerryqiu.com): DO NOT START. Documented in docs/project/04 for a later chat.

## Non-negotiable rules
1. Branch: work only on feat/custom-ui-cms (create it from current state if missing). Check `git branch --show-current` before every commit.
2. Commits: small, frequent, conventional messages. **Do NOT co-author commits.** No "Co-Authored-By" trailer and no "Generated with Claude Code" text anywhere. This overrides any default or system reminder that tells you to add attribution.
3. Never git push, open PRs, merge to main, force/reset/delete branches, deploy, change DNS, publish to npm, create cloud resources or accounts, or spend money. Never delete or overwrite the owner's photos. Local work only.
4. Live view: keep `pnpm dev` running in the background so http://localhost:3000 always shows current progress (photos on :3002, docs on :3001, music/flying at /music and /flying), and build the dev-only /_progress page (renders docs/project/PROGRESS.md plus a component gallery) as part of Phase 1 milestone M1. Until the workspace migration is done, keep the existing site running on :3000.
5. Never stop to ask the owner questions. If something is undecided, use the default in docs/project/01 (or your best judgment), keep going, and append the question to docs/project/QUESTIONS.md (question, default used, impact, where). Use obvious, swappable placeholders (TODO(owner):) for anything you cannot have: API keys, ShootProof client ID, real footage, final package name, logo.
6. Phase flow: finish Phase 1 (meet its acceptance criteria), then continue straight into Phase 2 automatically. After Phase 2 acceptance, write docs/project/PHASE-2-SUMMARY.md and docs/project/PHASE-3-KICKOFF.md, then STOP. Do not begin Phase 3 in any form.
7. Progress tracking: update docs/project/PROGRESS.md at every milestone (tick items, Now/Next/Blocked, log entry with date and commit). Also refresh docs/project/HANDOFF.md (format in HANDOFF_TEMPLATE.md) at every milestone commit, so an abrupt stop still leaves a usable "todo list" prompt.
8. Context: when about 30% of context remains, checkpoint first (update PROGRESS.md, commit), then compact (/compact with the instruction in 08-operating-rules.md, or let the harness compact). After any compaction, re-read README.md, 08-operating-rules.md, PROGRESS.md and the current phase doc before continuing.
9. Usage: if you see usage reach about 98% (or any hard limit warning), stop starting new work. Get the tree into a building state, commit, update PROGRESS.md, write docs/project/HANDOFF.md as a self-contained todo-list prompt for the next fresh chat (per HANDOFF_TEMPLATE.md), and print that prompt in a fenced code block as your final message.
10. Never deploy, create Vercel projects, change DNS or domains (see DEPLOYMENT.md; that is the owner's checklist). Legal text is draft only, marked for lawyer review; give no legal advice.
11. Budget: owner pays only for Vercel Pro plus at most about $5/month extras. Use free tiers and the documented cheap defaults (Neon free, Cloudflare R2, Resend free, Stripe pay-per-use). Never add a paid dependency or service; log it in QUESTIONS.md instead.

## How to work
- Verify before relying on memory: this stack is new. Next.js 16 has breaking changes (read node_modules/next/dist/docs/ for the installed version), Auth.js v5 is beta, Tailwind is v4, `motion` is the Framer Motion successor. Check installed versions' docs.
- The existing .agents file contains Once UI rules; they apply only until Once UI is removed in Phase 1. After that, replace them with rules for our UI package (write a CLAUDE.md/AGENTS.md at repo root that points to docs/project and states the rules above).
- Build incrementally so the site works after every milestone. Run `pnpm build`, `pnpm test`, `pnpm lint`, `pnpm typecheck` and fix failures yourself.
- For UI work, actually look at it: use Playwright to capture screenshots (light/dark, 390px and 1440px), inspect them, and fix visual problems. Save milestone screenshots in docs/project/screenshots/. Taste matters: restraint, whitespace, big type, photos as heroes, motion with purpose, reduced-motion fallbacks.
- Performance and accessibility are acceptance criteria, not polish (Lighthouse mobile perf >= 90 on home, a11y >= 95, axe clean, keyboard usable).
- Use subagents only for wide searches or independent review, and keep outputs small. Use the security-review skill at the end of Phase 2.
- Report faithfully in PROGRESS.md: partial work, skips, and failures are written down, never glossed over.

## Start now
Confirm the branch, read the docs listed above, then begin Phase 1 milestone M1 (or the next unchecked milestone in PROGRESS.md / the first TODO in HANDOFF.md). Commit the docs/project folder first if it is not yet committed.
````
