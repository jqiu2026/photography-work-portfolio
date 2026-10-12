# 12. Owner vision v2 (2026-10-12)

**This document is the source of truth for look, feel, structure and scope. Where it disagrees with 00, 01, 02, 10 or design-language.md, this wins; those files were rewritten to match.** It records the owner's answers to ten questions plus earlier direction. Phase 2 (CMS, protection, bridge) is done and stays; this vision drives "Phase 2.5" (redesign and split), described in [HANDOFF.md](HANDOFF.md).

## One sentence

jerryqiu.com is one immersive, scroll-driven story about a person, and photography, music and flying are three more worlds of the same making: each its own dimension, all moving the same way. The best and most immersive personal website there is, still professional, modern and minimal.

## The ten answers

| # | Question | Owner's answer | What it means |
|---|---|---|---|
| 1 | Feeling in the first 15 seconds of the hub | A mix of **awe, bold, expressive, cinematic, inventive** | Large, confident, memorable. Cinematic light and scale, expressive type, inventive interaction. Not quiet, not quirky-cute. |
| 2 | Motion metaphor that ties the family together | **Flow**: liquid, light streaks | Everything flows: content condenses out of liquid, scenes melt into each other, light streaks trail across the stage and the cursor drags them (a photographer's long exposure; halation glow around bright points). One motion language across all four sites. |
| 3 | How the hub introduces photography, music and flying | **"Space" dimensions**: cool, not too fantastical; futuristic but professional, modern, minimal | The three sites appear as dimensions you pass into (depth, space, thresholds). Restraint: clean geometry, depth and light, no sci-fi kitsch. |
| 4 | Where the blog sits on the hub | **After the three worlds**, as a **featured post plus list** | Order: who I am, the three worlds, writing (one large featured post flowing into a compact list), then "Say hello." |
| 5 | Photography: what makes it cooler | **Apple-product-page immersion**: animations and renders with text that is unique and feels good, not buzzwords. A photo portfolio/gallery, a video portfolio/gallery, and a photo dashboard / business management service: **our own native platform built around the site** | Product-page choreography for photography. Words are crafted and specific. The site is the front of a studio platform (Phase 3 scope, see below). |
| 6 | Music site | **Stage/spotlight + typographic score + minimal listening room**, "each page can have a different vibe". List compositions; **listen** when a performance recording exists; **preview the score and buy** it; buying scores and listening are **separate** | Three vibes mapped to pages. A catalogue of compositions with two independent paths: listen (recordings) and score (preview, purchase). |
| 7 | Flying site | **Ascent through layers + cockpit instruments + map and flight paths**, all combined. Documents flying, involvement, writing about what was done; a **map of where I've flown** (later, something like Flighty); purpose still open, possibly advertising **CFI services** one day | A flying journal and map with instrument-like details. Keep a quiet, switched-off slot for future instruction services. |
| 8 | Technical ambition | **Everything. The best, most immersive website ever; make it perfect** | Use the strongest techniques (real-time 3D/WebGL stage, shaders, fluid simulation, scroll choreography, view transitions). Quality guardrails stay (performance tiers, fallbacks, accessibility) because perfect includes working everywhere. |
| 9 | Scope of commerce and business tools | **Design now, build later, but mock everything so it works locally** (close to expected). APIs, databases and real services come in Phase 3 | The redesign designs the whole studio and the score store, and ships working local mocks behind interfaces. No real money, no live third-party calls. |
| 10 | Voice | **"Me."** | Copy is first person, in Jerry's voice, short and specific. Drafts are written from real facts only and marked `TODO(owner)` for his edit. Never invented claims. |

## Structure (decided)

- **Hub (jerryqiu.com)** is the main page and the only place that introduces the other sites. It may link to all three (as dimensions inside its own flow). It carries the blog. No navbar on its home page.
- **Photography, music and flying** each have a navbar-less home on the same shared experience system, each a distinct world. They contain **no reference** to each other or to any other section. The only cross-site element is **one button in the footer back to jerryqiu.com**. No site switcher, no "More from me", no previews. (Legal pages live on the hub; the footer button is the route.)
- **Photography and video work** (including project case studies) lives on the photography site. The blog stays on the hub. The hub's old `/work` URLs redirect to the photography site.
- **Shared experience system** (built once in the UI package): a persistent scene stage, flowing transitions (liquid and light streaks) between scenes, one text/reveal grammar, one cursor behaviour, one floating index control instead of a navbar, one closing pattern. A visitor who learns one world already knows the others. Each world has its own stage visuals, typography weight/width, accent and signature interaction.
- **"Say hello."** on the hub stays (the owner likes it) and is echoed in each world's own voice.

## The four worlds

| World | Mood | Signature | Content |
|---|---|---|---|
| Hub | Awe, bold, cinematic, inventive. Liquid and light streaks on a deep stage; the three dimensions as space-like thresholds. Blue accent moment. | Light streaks resolving into type; the cursor drags the flow; passing through a threshold to a world. | Who I am (photographer, builder, drone pilot, musician, New York), the three worlds, the blog (featured post + list), Say hello. |
| Photography | Apple-product-page immersion, cinematic dark, photographs as the stage (depth, light, grain, flowing reveals); crafted, unusual words. Red accent. | Subject-to-subject scroll "cuts", pinned renders, hover reveals; each section feels like a product reveal for a kind of photograph. | Photo portfolio and gallery, video portfolio and gallery, project case studies, booking; the studio platform behind it (below). |
| Music | Three vibes on different pages: **stage and spotlight** (home), **typographic score** (compositions and score store), **minimal listening room** (recordings). Yellow accent. | Spotlight that follows the cursor; staves and notation that animate as type; a spare room where only the player moves. | Compositions list; listen (when a performance recording exists, load-on-press, no autoplay); score preview and purchase, kept separate from listening. |
| Flying | Ascent through atmosphere layers + cockpit instrument details + flight paths and a map. Green accent. | Scroll as climb with an altitude readout; routes drawn as liquid lines; instrument micro-details. | Flying journal and writing, involvement (StuyAviators and more), aircraft, a map of past flights (airport-level, delayed, never live), and a hidden-by-default slot for CFI services. |

## Scope: what is designed, what is mocked, what stays Phase 3

The owner wants the whole vision designed now and "working as expected" locally; real services come later. The redesign chat therefore:

1. **Designs everything**: public pages of all four sites, the photo studio dashboard and business flows (galleries, clients, bookings, contracts, invoices), the music score store (catalogue, preview, cart, checkout, library), and the flying map and services slot.
2. **Builds working local mocks** behind clean interfaces (`PaymentProvider`, `ScoreDelivery`, `ClientPortal`, `FlightSource`, storage already abstracted) with seeded fake data, so every flow can be clicked through locally: mock checkout (Stripe test-mode shape, never a live key), mock score delivery of a watermarked preview and a placeholder file, mock client gallery, mock invoice. Every mock is labelled in the UI and in code (`MOCK`), and disabled in production builds.
3. **Does not build real services**: no live payments, no real emails to customers, no real e-signature provider, no real flight-tracking API. Those are Phase 3 and wait for the owner's go-ahead (see [PHASE-3-KICKOFF.md](PHASE-3-KICKOFF.md)). Hard rules in [08-operating-rules.md](08-operating-rules.md) still apply (never spend money, never deploy, never publish).

## Guardrails that stay (perfect includes working everywhere)

- Performance tiers: the 3D/fluid stage runs at full quality on capable devices and degrades through reduced quality to a static, beautiful poster on low power, Save-Data, no WebGL, reduced motion or no JavaScript. Mobile Lighthouse performance target 90 or better on every home with the stage lazy-loaded; no layout shift; LCP is an image or text.
- WCAG 2.2 AA, full keyboard use, skip link, landmarks, visible focus, reduced motion gives a complete static page, alt text always present, no autoplaying sound.
- Photographs are never degraded by effects; image protection semantics in [05](05-security-and-image-protection.md) stay.
- Real facts only. Privacy for flying: no live location, no tail numbers by default, nobody identifiable without permission ([11](11-legal-and-compliance.md)).
- The UI package is original (not derived from Once UI or any existing kit), has its own name (default proposal: **Halation UI**, chosen by the owner; see Q33), and is prepared to be sold: the owner does the publishing and selling.
