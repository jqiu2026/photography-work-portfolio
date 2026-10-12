# 00. Vision and principles

> The current, detailed vision is [12-vision-v2.md](12-vision-v2.md). This file keeps the stable frame: what the project is, the phases, and the principles.

## What this is

Jerry Qiu's site began as a Next.js portfolio on Once UI with MDX content. It is now **a family of four sites on one codebase and one original design system**, each on its own hostname, designed as one immersive, scroll-driven experience with four distinct worlds:

| Site | Domain | Role |
|---|---|---|
| **Hub** | `jerryqiu.com` | The main page and the only place that introduces the others. A cinematic, navbar-less story of who Jerry is (photographer, builder, drone pilot, musician, New York), then the three worlds as dimensions you pass into, then the blog (a featured post flowing into a list), then "Say hello." It also carries about, connect and the legal pages. |
| **Photography** | `photos.jerryqiu.com` | Photo and video portfolio and gallery, project case studies, booking, and the studio platform behind it (galleries, clients, contracts, invoices; built in Phase 3, designed and mocked first). Apple-product-page immersion with crafted, unusual words. ShootProof serves this hostname until the owner switches DNS after Phase 3 is verified. |
| **Music** | `music.jerryqiu.com` | Compositions; listen when a performance recording exists; preview and buy scores, kept separate from listening. Each page has its own vibe: stage and spotlight, typographic score, minimal listening room. |
| **Flying** | `flying.jerryqiu.com` | A flying journal: involvement, writing, aircraft, a map of past flights, instrument-like details; a quiet, off-by-default slot for CFI services someday. |

**Cross-site rule:** the hub may point at the three. Photography, music and flying contain no reference to each other or to anything else in the family; their only cross-site element is one footer button back to jerryqiu.com. No site switcher, no "More from me", no preview cards.

More sites can be added by registering a hostname in `packages/sites`.

## The phases

1. **Phase 1 (done).** First UI package and rebuild (superseded visually by the redesign).
2. **Phase 2 (done).** CMS (Google login, `@jerryqiu.com` only), media pipeline, image protection, inbox, settings, public sites on the database, studio shell and ShootProof bridge (mocked). See [PHASE-2-SUMMARY.md](PHASE-2-SUMMARY.md).
3. **Phase 2.5 (current, owner-requested).** Split blog and photography; redesign all four sites and the UI package from scratch as an original, sellable system; design the whole studio and score store and build **working local mocks** of them. Plan: [HANDOFF.md](HANDOFF.md).
4. **Phase 3 (not started).** Real services: payments, e-signatures, client portal backends, real delivery, ShootProof replacement go-live. Waits for the owner. See [PHASE-3-KICKOFF.md](PHASE-3-KICKOFF.md).

## Taste bar

Read [10-design-brief.md](10-design-brief.md). In one line: **the most immersive personal website there is, awe and boldness with cinematic polish and inventive interaction, Flow (liquid and light streaks) throughout, still professional, modern and minimal, accessible and fast on any device.**

The StuyAviators site is an **engineering reference only**; this site must not look like it ([09](09-reference-stuyaviators.md)). The UI package must not look like Once UI or any other kit.

## Principles

1. **Photos and work first.** Effects serve the images and the story, never fight them. Colour accuracy and fidelity beat decoration.
2. **Spectacular on purpose, resilient by design.** The immersive stage is the product. It degrades through quality tiers to a static, beautiful page on low power, Save-Data, no WebGL, reduced motion or no JavaScript.
3. **Show who I am, in my own voice.** Copy is first person, short, specific, and Jerry's: never invented facts, no superlatives or buzzwords. Drafts are marked `TODO(owner)`.
4. **One system, four worlds.** Shared motion grammar and index control; unique stage, type character, accent moment and interaction per world.
5. **Intuitive despite no navbar.** A visitor reaches any part within two moves via the floating index; skip link, landmarks and keyboard paths always exist.
6. **Performance is a feature.** Mobile Lighthouse performance 90 or better on every home with the stage lazy-loaded, no layout shift.
7. **Accessible by default.** WCAG 2.2 AA, full keyboard use, reduced motion = complete experience, no autoplaying sound.
8. **Legally sound.** Privacy, terms, licensing, accessibility, takedown contact, honest analytics posture ([11](11-legal-and-compliance.md)). No legal advice; sample text is marked for professional review.
9. **Honest security.** Real defences plus clearly labelled deterrents ([05](05-security-and-image-protection.md)).
10. **Cheap to run.** Vercel Pro plus about $5 a month of extras; anything else is free-tier or justified ([06](06-cost-analysis.md)).
11. **Original and sellable.** The UI package has its own name, tokens, components and docs; nothing copied from any kit. The owner decides on licence, publishing and selling; Claude only prepares.
12. **Mock, label, then replace.** Anything that needs a real service (payments, e-signatures, delivery, flight data) is built locally as a clearly labelled mock behind an interface, disabled in production builds, and replaced in Phase 3.
13. **Small, reversible steps.** The sites run locally after every milestone; every commit leaves the gates green or says `wip:`.

## Non-goals

- No native mobile apps. No multi-tenant SaaS (keep the nullable `studio_id`). No AI features beyond optional free alt-text autofill.
- No live flight tracking or real-time location, ever (privacy).
- No real payment, e-signature or email-to-customers integrations before Phase 3 is approved.
- The hub itself does not sell anything; selling happens on music (scores) and photography (studio services).

## Status note (2026-10-12, end of Phase 2.5)
Phase 2.5 is built: the blog stays on the hub and case studies live on the photography site; Halation UI (stage, Flow, index control, tiers) drives all four homes; local mocks exist for the studio, client portal, score store and flight map. See [PHASE-2.5-SUMMARY.md](PHASE-2.5-SUMMARY.md), [redesign-brief.md](redesign-brief.md) and [design-language.md](design-language.md).
