# 10. Design brief (v2)

> Direction comes from [12-vision-v2.md](12-vision-v2.md) (the ten owner answers). The first brief (Squarespace-grade restraint, Phase 1) is archived in [10-design-brief-v1-archive.md](10-design-brief-v1-archive.md). Where that archive disagrees with this file, this file wins.

## Your role

Whoever executes this brief is the **lead UI/UX designer** first and the engineer second: research, concepts, storyboards, motion studies, type and colour decisions with written reasons, then build and iterate by looking at the result in a browser. The deliverable is an **original, flowy interface** that nobody could mistake for Once UI, another kit, or the StuyAviators site.

## Priorities, in order

1. **Memorable and immersive.** Within 15 seconds of scrolling a stranger should feel awe and know who this is. Bold, expressive, cinematic, inventive.
2. **Professional, modern, minimal.** Immersion is built from few, precise elements: depth, light, scale, type. No clutter, no sci-fi kitsch, no gimmicks that do not explain something.
3. **Flow.** One motion language: liquid and light streaks. Scenes melt into each other; there are no hard section boundaries; the cursor disturbs surfaces; transitions between pages and worlds are continuous.
4. **Intuitive without a navbar.** One floating index control, scroll-spy progress, obvious "enter this world" moments.
5. **Resilient and legal.** Fast, accessible, with graceful fallbacks; legal and trust surfaces designed, not bolted on ([11](11-legal-and-compliance.md)).

If two goals conflict, the higher one wins, except that accessibility and the fallbacks are never traded away.

## The shared experience system

Designed once, in the UI package; every world uses it:

- **Stage:** a persistent full-viewport layer (real-time WebGL / shader scene with a fluid simulation and light-streak / halation effects, plus DOM content layered over it) that transforms continuously with scroll. Scenes hand off through liquid transitions instead of section breaks.
- **Motion language (Flow: liquid + light streaks):** one easing and one spring family; shapes condense, spread and melt; type resolves out of liquid and light streaks (long-exposure trails, anamorphic streaks, soft halation glow on highlights); velocity-aware smooth scroll; cursor ripples and magnetic physics; view-transition style page changes. Document the exact curves, durations and the flow/threshold transition recipes.
- **Index control instead of a navbar:** a small floating mark opens a full-screen index of the page's scenes and routes; plus scroll progress and the theme toggle. Inner pages may use the same control and a very quiet header, never a conventional navbar on homes.
- **Closing pattern:** every home ends with its own "Say hello." moment (the hub's version is retained). Photography, music and flying footers add exactly one button back to jerryqiu.com and nothing else about other sites.
- **Quality tiers:** full (3D/fluid stage), reduced (cheaper shaders, lower DPR, fewer particles), static (poster frames, CSS only). Chosen automatically from device capability, battery/Save-Data, `prefers-reduced-motion` and WebGL support; the static tier must still be beautiful and complete.

## The four worlds

Each world needs its own **concept sheet** (mood, metaphor, type character, colour behaviour, stage visuals, signature interaction, storyboard) before it is built.

- **Hub.** Awe, boldness, cinematic scale. A deep stage of liquid and light. Opening scene must say: photographer, builder, drone pilot, musician, New York, with real proof (real photographs and work). Then the three worlds as **space-like dimensions**: thresholds of depth and light you pass through (restrained, geometric, futuristic, professional), each ending in a clear "enter" moment. Then writing: one large featured post flowing into a compact list. Then "Say hello." Blue is the signature accent moment. The hub may link to all three worlds.
- **Photography.** Apple-product-page immersion: pinned scenes, renders and animation accompanied by crafted, unusual words that feel good and mean something (never buzzwords). The photographs are the stage. Sections for photo portfolio and gallery, video portfolio and gallery, project case studies, booking, and an entry to the studio. Red accent moment. Strict-gallery pages keep `ProtectedImage` semantics ([05](05-security-and-image-protection.md)).
- **Music.** Three vibes, one per kind of page: **stage and spotlight** (home: dark, theatrical, a spotlight following the cursor), **typographic score** (compositions and score store: staves and notation as animated typography), **minimal listening room** (recordings: spare, only the player moves). Compositions list; two separate paths per composition: *listen* (only when a performance recording exists; load-on-press; no autoplay) and *score* (preview, price, buy). Yellow accent moment.
- **Flying.** Ascent through atmosphere layers with an altitude readout, cockpit-instrument micro-details (headings, gauges, flight-log readouts), and flight paths drawn as flowing lines on a map of where Jerry has flown (past flights, airport-level, delayed; never live position, no tail numbers by default). A flying journal with writing. A hidden-by-default "instruction" slot for CFI services. Green accent moment.

## Not copied, not Once UI, not StuyAviators

- The UI system is designed from scratch: its own tokens, class/prefix names, component set and prop APIs, spacing rhythm, type scale, shapes and motion. Study references for ideas and for what to avoid; never copy assets, text, layouts or code.
- Keep a written **comparison** (side-by-side screenshots) against Once UI's docs/demo and against StuyAviators in `redesign-brief.md`. If someone could mistake one for another, redesign.
- Fonts: SIL OFL (or properly licensed) only; check each licence for use in a product that is sold.

## Information architecture

```
jerryqiu.com            HUB (main page; may link to the three worlds)
  /                     Navbar-less story: who I am -> the three worlds -> writing -> Say hello
  /about                Longer story, timeline, skills, resume
  /writing, /writing/[slug]   Blog (featured post + list on the home)
  /connect              Contact form (stored in the inbox) + accounts
  /privacy /terms /licensing /accessibility   Legal, canonical here
  (old /work and /work/[slug] redirect to photos.jerryqiu.com)

photos.jerryqiu.com     PHOTOGRAPHY (footer: one button back to jerryqiu.com)
  /                     Immersive product-page style home
  /portfolio, /portfolio/[slug]   Photo galleries
  /video, /video/[slug]           Video gallery
  /work, /work/[slug]             Project case studies (moved from the hub)
  /book                 Booking
  /client               Client portal entry (mock locally; real in Phase 3)
  /studio               Owner dashboard (CMS-adjacent now, business tools mocked, real in Phase 3)

music.jerryqiu.com      MUSIC (footer: one button back)
  /                     Stage and spotlight
  /compositions, /compositions/[slug]   Typographic score; listen and score paths separate
  /listen               Minimal listening room (recordings that exist)
  /scores               Score store: preview, cart, checkout (mock), library (mock)
  /about

flying.jerryqiu.com     FLYING (footer: one button back)
  /                     Ascent
  /log, /log/[slug]     Journal entries
  /map                  Where I've flown
  /aircraft, /about
  /instruction          Hidden by default; placeholder for future CFI services
```

Keep old URLs working with redirects (`/blog` to `/writing`, `/contact` to `/connect`, hub `/work/*` to the photography site). Routes marked mock exist only as locally working mocks until Phase 3.

## Tone and copy guide ("me")

- First person, Jerry's voice, short and specific. Words that feel good and are unusual, not buzzwords or superlatives. Plain facts with context.
- Credit teams, teachers and collaborators by name. State accomplishments once, with context.
- Curious and warm, a little dry humour allowed.
- Claude drafts copy only from facts in the repo, and marks every draft `TODO(owner): rewrite in your voice`. Never fabricate biography, credentials, awards, hours, quotes or prices.

## Design system requirements

- **Accessibility:** WCAG 2.2 AA contrast, visible focus, 44 px targets, full keyboard paths, skip link, landmarks, alt text always present, reduced motion = complete static layout, no autoplaying sound.
- **Performance:** stage code lazy-loaded; DPR capped; paused off-screen; no layout shift; LCP an image or text; mobile Lighthouse performance 90 or better on every home.
- **Tokens and architecture:** the designer chooses (hand-written CSS with tokens is fine). A new package name replaces `@halation/ui` through `pnpm rename`; the owner's suggestion and default is **Halation UI** (halation: the glow that spreads around bright light in film), unless the brief finds a conflict (check by reading only; the owner does trademark and npm checks). Docs site with a demo for every export; tests; changelog.
- **Imagery:** photographs are never degraded by overlays or filters beyond the deliberate effects in a scene; correct colour; fast loading; protected where configured.

## UX heuristics checklist

Clear current-location cue; consistent patterns; visible keyboard focus; inline, human form errors; 44 px touch targets; no horizontal scroll at 320 px; fast perceived loading (blur-up, posters); no dead ends; designed 404 with a way home; every page has a purpose and one primary action; the floating index works with keyboard and screen readers.
