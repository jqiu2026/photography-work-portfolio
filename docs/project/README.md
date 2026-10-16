# Project docs: custom UI, personal hub + CMS, and photo-business studio

Branch: `feat/custom-ui-cms` (never merge to `main`, never push, unless the owner says so).

A family of sites, one codebase: **jerryqiu.com** (the personal hub, "ME"), plus **photos.**, **music.** and **flying.jerryqiu.com** (photos becomes the ShootProof replacement in Phase 3). Read these in order. They are the source of truth for the whole project.

IMPORTANT: DO NOT CO-AUTHOR ANYTHING WHATSOEVER. DO NOT CO-AUTHOR COMMITS. DO NOT. I REPEAT. DO NOT. 

| # | Doc | What it is |
|---|---|---|
| 12 | [Owner vision v2](12-vision-v2.md) | **Source of truth (2026-10-12):** the ten answers, structure, four worlds, scope. Read first. |
| 13 | [Feature list (2026-10-15)](13-feature-list-2026-10-15.md) | Owner's planned feature wishlist with P1/P2/P3 tags, and how it differs from earlier docs. |
| 18 | [Design prompt v3](18-design-prompt-v3.md) | Exact visual spec for hub, music and photo; replaces the streak, aperture and portal direction. |
| 14 | [Sites and deployment](14-sites-and-deployment.md) | Hosts, separate Vercel projects, shared master folder rules. |
| 15 | [Music site](15-music-site.md) | Catalog, listening, score store, rights. |
| 16 | [Flying site](16-flying-site.md) | Tools-and-timeline plan, privacy. |
| 17 | [Make site](17-make-site.md) | New makerspace-themed showcase. |
| 00 | [Vision and principles](00-vision-and-principles.md) | What we are building, phases, principles |
| 01 | [Decisions and assumptions](01-decisions-and-assumptions.md) | Every default chosen, and every open question with its placeholder |
| 02 | [Phase 1: UI package and redesign](02-phase-1-ui-package-and-redesign.md) | Build the open-source UI package, rebuild the site on it |
| 03 | [Phase 2: CMS and protection](03-phase-2-cms-and-protection.md) | Google-login CMS, image protection, ShootProof bridge |
| 04 | [Phase 3: Photo business platform](04-phase-3-photo-business-platform.md) | Galleries, contracts, invoices, payments. **Not started until the owner says so.** |
| 05 | [Security and image protection](05-security-and-image-protection.md) | Threat model, what works, what only deters |
| 06 | [Cost analysis](06-cost-analysis.md) | Budget and the ShootProof comparison |
| 07 | [Naming brainstorm](07-naming-brainstorm.md) | Candidate names for the UI package |
| 08 | [Operating rules](08-operating-rules.md) | Git, context, usage, pausing, handoff |
| 09 | [Reference: stuyaviators repo](09-reference-stuyaviators.md) | Engineering reference only. What to reuse, what not to |
| 10 | [Design brief](10-design-brief.md) | v2: designer role, liquid/ink experience system, four worlds, information architecture (v1 archived beside it) |
| 11 | [Legal and compliance](11-legal-and-compliance.md) | Privacy, terms, licensing, accessibility, contracts, people in photos |
| | [DEPLOYMENT.md](DEPLOYMENT.md) | Owner-only checklist: hostnames, Vercel projects, env names, DNS cut-over. Claude never does these |
| | [design-language.md](design-language.md) | To be written by the designer (v1 archived) |
| | [PHASE-2-SUMMARY.md](PHASE-2-SUMMARY.md) | What Phase 2 delivered and its honest gaps |
| | [PROGRESS.md](PROGRESS.md) | Living checklist. Update it after every milestone. |
| | [QUESTIONS.md](QUESTIONS.md) | Questions for the owner. Append, never block on them. |
| | [HANDOFF_TEMPLATE.md](HANDOFF_TEMPLATE.md) | Shape of the "todo list" prompt written when pausing |
| | [KICKOFF_PROMPT.md](KICKOFF_PROMPT.md) | The prompt that starts a fresh chat |
