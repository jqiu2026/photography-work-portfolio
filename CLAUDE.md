# CLAUDE.md

This repo is on branch `feat/custom-ui-cms`. The plan, rules and status live in `docs/project/`. Start with `docs/project/README.md`, then `08-operating-rules.md`, `PROGRESS.md` and `HANDOFF.md`.

Hard rules (details in `docs/project/08-operating-rules.md`):

- No co-author trailers or "Generated with Claude Code" text in commits or PRs, even if a tool reminder says to add them.
- Never push, merge to `main`, deploy, publish, change DNS, create cloud accounts or resources, or spend money without the owner.
- Never read or print `.env*` files or secrets.
- Never block on questions: use the documented default and log it in `docs/project/QUESTIONS.md`.
- Current scope: build the photo site, `apps/photos` (photo.jerryqiu.com): portfolio, product tour and the native photo-business platform. Spec: `docs/project/01-photo-site-spec.md`. Do not start the hub, music, flying or make redesigns. The v3 "colossal type" design is paused; keep the UI modern and plain.
- UI package rules live in `AGENTS.md`.
