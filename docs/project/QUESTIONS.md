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

