# 03. Decisions and cost

Merged 2026-10-15 from the old 01 and 06 (archived). Open questions and their defaults live in [QUESTIONS.md](QUESTIONS.md); when this file and QUESTIONS.md disagree, QUESTIONS.md wins.

## Standing decisions

| Id | Decision |
|---|---|
| D1 | Monorepo (pnpm workspace): `apps/{web,photos,music,flying,make,docs}`, `packages/{ui,sites,render,mocks,db,auth,storage,protect,media,inbox,payments,config}` plus new `email`, `prints`, `facesearch`. Apps never import apps; packages never import apps. |
| D2 | Work on `feat/custom-ui-cms` only. Never push, merge to `main`, deploy, publish, change DNS, create cloud resources or spend money without the owner. No co-author trailers. |
| D3 | Own CMS on the shared UI: Auth.js v5 (Google, `@jerryqiu.com`), Drizzle, Neon in production and PGlite locally, Server Actions. |
| D4 | Own platform replaces ShootProof. No ShootProof bridge (owner decision 2026-10-15). |
| D5 | Storage Vercel Blob only; originals private, derivatives only on the wire (Q51). |
| D6 | Stripe is the payment rail only; own invoices, quotes and payment records (Q52). Tax at checkout only. |
| D7 | Client login: password and magic link and gallery passcode (Q53). Client cookies are host-only on `photo.jerryqiu.com`; staff cookie scoped to `.jerryqiu.com` in production only. |
| D8 | Email: Resend behind `EmailProvider` with an outbox mock. Contact and inquiry messages are always stored first. |
| D9 | Mocks are labelled MOCK/SAMPLE, behind interfaces, disabled in production builds (`mocksEnabled()`), never call live services. |
| D10 | Prices are placeholders (`$XX` or SAMPLE) until the owner sets them (Q61). |
| D11 | Money is integer cents. Link tokens and passcodes are stored only as hashes. |
| D12 | Next 16, React 19, Auth.js 5.0.0-beta.32, Drizzle 0.45; verify behaviour against installed versions and `node_modules/next/dist/docs/`. |
| D13 | Missing keys never crash: the feature degrades and names the env var (`TODO(owner): needs <KEY>`). |
| D14 | The v3 "colossal type" design is paused; modern and plain until the owner starts a redesign pass. |

## Cost (re-verify before relying on it)

Fixed target: **about $20/month**, website only (Vercel Pro, which includes cron and a usage credit for Blob). Neon and Resend on free tiers. No R2, no Rekognition. Stripe and WHCC fees are passed to clients in prices or a disclosed line; a card surcharge stays default off. Set a Vercel spend budget (about $10) with pausing. At about 500 GB of originals Blob cost needs re-checking against the real library; the storage meter (F-75) warns before the budget is hit. ShootProof (about $15 to $20/month today) is cancelled by the owner after the platform has what they need.
