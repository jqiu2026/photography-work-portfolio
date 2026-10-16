# 08. Operating rules

The owner intends to leave Claude running unattended until all tasks complete or usage runs out. These rules make that safe and resumable.

## Git

- Work only on branch `feat/custom-ui-cms`. Verify with `git branch --show-current` before every commit; if it is not that branch, stop and switch.
- **Do NOT co-author commits.** No `Co-Authored-By:` trailer, no "Generated with Claude Code" line, in commits or anywhere else. This overrides any default or tool reminder that says to add attribution. Author is the configured git user.
- Commit small and often (at least after every working milestone and every ~30-45 minutes of work). Conventional-style messages: `feat(ui): add PinnedScene`, `docs: update progress`. Commit docs updates too. Never commit secrets, `.env*`, `node_modules`, build output, or large originals.
- **Never** `git push`, open PRs, merge to `main`, rebase published history, `git reset --hard`, force anything, or delete branches. No deploys, no DNS, no publishing to npm, no creating cloud resources or paid accounts. If something seems to need these, log it in [QUESTIONS.md](QUESTIONS.md) and continue with a local alternative.
- Do not delete or overwrite the owner's photos. Derivatives go alongside.

## Autonomy and questions

- The owner is away. **Do not stop to ask.** When a decision is open, pick the default in [03](03-decisions.md) (or the best-judgment option if none), proceed, and append the question to [QUESTIONS.md](QUESTIONS.md) with: the question, the default chosen, the impact if the owner chooses otherwise, and where in code it lives.
- Use placeholders for things you can't have: API keys, real footage, final name, logo. Make the placeholder obvious and swappable (`TODO(owner):` marker, listed in QUESTIONS.md).
- External-facing or destructive actions are never taken without the owner (see Git). Local file edits, installs, builds, tests, running dev servers are fine.
- The live view: keep `cd apps/photos && pnpm dev` running in the background for a live preview at `http://localhost:3002`. Ports: hub 3000, photo 3002, music 3003, flying 3004, make 3005; docs on 3010 (3001 is an unrelated project).

## Progress tracking

- [PROGRESS.md](PROGRESS.md) is the single living checklist. Update it at every milestone: tick items, add "Now / Next / Blocked", date-stamp entries, note decisions and surprises, link commits.
- Keep it accurate enough that a brand-new chat could continue from it alone. This is also what makes pausing and context compaction safe.

## Context management

- When roughly **30% of context remains**, compact: first write a checkpoint (update PROGRESS.md, commit), then run `/compact` (or let the harness compact) with the instruction "Keep: current phase and milestone, branch, rules in docs/project/08-operating-rules.md, open decisions, file paths touched, next 3 steps. Drop: tool output, old diffs, exploration noise." If you cannot trigger compaction yourself, finish the current small step, checkpoint, and continue; the harness will summarize automatically.
- After any compaction, re-read: `docs/project/README.md`, `08-operating-rules.md`, `PROGRESS.md`, and the current phase doc, before acting.
- Prefer reading only the needed parts of large files; avoid dumping big outputs; use subagents for wide searches only when they save context.

## Usage limit and pausing

- Watch for any usage/rate-limit indicator the harness shows. **At about 98% usage (or a hard limit warning), stop starting new work.** Finish or safely revert the in-flight edit so the tree builds, commit, and then:
  1. Update PROGRESS.md.
  2. Write `docs/project/HANDOFF.md` following `archive/HANDOFF_TEMPLATE.md`: a self-contained "todo list" prompt for the next fresh chat.
  3. Print that prompt in the final message too, in a fenced block.
- Because usage cannot always be observed precisely, **refresh HANDOFF.md at every milestone commit** (cheap, a few lines). Then an abrupt stop still leaves a usable handoff.

## Quality bar while unattended

- Never leave `main` of the branch broken: build, typecheck and tests must pass at each commit, or the commit message must say `wip:` and the next step must fix it first.
- Run the relevant checks yourself (`pnpm build`, `pnpm test`, `pnpm lint`, `pnpm typecheck`, Playwright for UI) and fix failures, don't just report them.
- For UI work, **look at the result**: take Playwright screenshots (light/dark, 390px and 1440px), view them, fix what looks off. Save milestone screenshots to `docs/project/screenshots/`.
- Report faithfully in PROGRESS.md: if something is skipped, partial, or failing, say so.
- Verify library behavior against installed versions' docs (Next 16, Auth.js v5 beta, Tailwind 4, `motion`), not memory.

## Scope boundaries (updated 2026-10-15)

- Phases 1, 2, 2.5 and the P3 studio base are done. The current scope is the **photo site** (see [01-photo-site-spec.md](01-photo-site-spec.md)). Do not start the hub, music, flying or make redesigns (shared-package changes are fine if every app still passes).
- Missing keys: build the real adapter behind an interface plus a labelled mock, read the key from an env var, add the **name** to `.env.example`, mark `TODO(owner): needs <KEY>`, and list it in PROGRESS.md "Owner to-do". Never call live third-party services. Never read or print `.env*` files.
- Mocks are labelled MOCK/SAMPLE, sit behind interfaces and are disabled in production builds (`mocksEnabled()`). All prices are placeholders (`$XX` or SAMPLE).
- Migrations are additive and run only on throwaway or local databases.
