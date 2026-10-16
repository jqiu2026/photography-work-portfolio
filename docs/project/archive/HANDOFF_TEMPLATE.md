# HANDOFF template

When pausing (usage ~98%, hard limit, or end of Phase 2), write `docs/project/HANDOFF.md` using this shape, then print it as a fenced block in the final message. It is a prompt for a **fresh chat**, so it must stand alone.

````markdown
You are continuing a multi-phase project in /Users/jerry/Documents/photography-work-portfolio on branch feat/custom-ui-cms.

FIRST: read docs/project/README.md, docs/project/08-operating-rules.md, docs/project/PROGRESS.md, docs/project/QUESTIONS.md, and the current phase doc. Follow the operating rules exactly (no co-author trailers, no push/merge/deploy/publish, never block on questions, compact context at ~30% left, pause at ~98% usage and write a new HANDOFF.md, stop after Phase 2).

STATE (as of <date/time>):
- Phase <n>, last completed milestone: <Mx>. Last commit: <hash> <message>.
- Working tree: <clean | describe uncommitted changes>.
- Dev server: run `pnpm dev` (http://localhost:3000).
- Build/test status: <pass/fail details>.

TODO (ordered, concrete):
1. <next step with file paths and acceptance check>
2. ...
(include every remaining milestone checkbox from PROGRESS.md)

IN-FLIGHT / GOTCHAS:
- <half-done work, known failing test, tricky decision, library quirks discovered>

DECISIONS MADE SINCE THE DOCS (also in 01-decisions): <list>

NEW QUESTIONS FOR OWNER (already appended to QUESTIONS.md): <list>

Begin with step 1. Do not ask the owner anything; use defaults and log questions.
````
