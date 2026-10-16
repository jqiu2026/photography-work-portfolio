# Redesign brief (Phase 2.5, R0)

Written by the lead designer on 2026-10-12. Direction comes from [12-vision-v2.md](12-vision-v2.md); this file turns it into decisions the build (R1 to R5) follows. Where this brief and the code disagree, fix the code or amend this brief with a dated note. Nothing here is copied from another site, kit or asset: references are studied for patterns and for what to avoid.

Contents: 1 Where we start (audit) · 2 Research notes · 3 The shared experience system · 4 The four worlds (concept sheets and storyboards) · 5 The hub's first-15-seconds test · 6 Type and colour · 7 Package name, licence, selling · 8 Comparison with Once UI and other kits · 9 Studio, store and map: design notes for the mocks · 10 Budgets and test plan · 11 Open items

---

## 1. Where we start (audit of the current build, 390 and 1440 wide, dark)

Screenshots: [screenshots/r0/](screenshots/r0/) (`hub-1440.png`, `hub-390.png`, `photos-1440.png`, `music-1440.png`, `flying-1440.png`, downscaled).

What is wrong, plainly:

| Where | Observation | Verdict |
|---|---|---|
| All homes | A conventional top bar (brand, three links, "Connect" button, theme toggle, hamburger at 390). | Contradicts decision V5. This is the single most Once-UI-looking element. |
| Hub | Hero is "Hello, I'm Jerry." in a heavy grotesque, then a framed photo, then a profile card (avatar, name, two buttons, social row), then a lead paragraph, then a full-bleed photo with a headline. It is the standard "portfolio template" order. Roughly 60% of the 11,100 px page is empty black bands where lazy sections had not revealed. | Static, template-like, no stage, no depth. Nothing tells you what is special. |
| Hub | Visible placeholder copy ("Test headline", "TODO(owner): one line about what you're doing right now") in the dev build. | Fine in dev, but the new copy must be real or hidden in production. |
| Photography | A shader hero over one portrait, then "Recent work" as a justified grid, a before/after slider, and a "By subject" tile grid. | The best of the four, but it is still a gallery template. Photographs sit in boxes; nothing is choreographed. |
| Music, Flying | The same layout twice: eyebrow, huge word, one sentence, one button, one photo at right; then a shaded band; then "More from me" and footer. | They look identical, so they are not worlds. "More from me" breaks the cross-site rule. Almost no content. |
| 390 px | Same stack, single column, hamburger. Good basics (no overflow), zero choreography of its own. | Needs its own touch composition, not a squeezed desktop. |
| Everything | Type is one family at one personality; accents are 6 px dashes; surfaces are flat rectangles with 1 px borders; motion is fade-and-rise. | This is what "Once-UI-like" means here: neutral tokens, rectangular cards, no signature. |

What to keep: the real photographs and their derivatives, the media pipeline, protection semantics, CMS, content layer, the "Say hello." section, the accessibility discipline (axe, keyboard, reduced-motion tests), the `ogl` + `lenis` + `motion` dependency choices (all MIT), the ShaderHero idea (it becomes part of the stage).

---

## 2. Research notes (patterns, not pixels)

Studied from memory of well-known work and from current platform documentation; no assets, text, layouts or code are taken. Each line says what to learn and what to avoid.

**Immersive product pages (Apple-style launches).**
- *Learn:* a pinned scene where scroll is a playhead (one idea per pin, 100 to 300 vh of travel); text arrives in short lines with a verb; the object stays centre while copy moves; numbers and specs as typographic features; the page is silent and calm between peaks.
- *Avoid:* canvas frame sequences that cost 5 to 30 MB; text that fights the image; the same "zoom into device" trick on every scene; scroll-jacking (hijacking the wheel or fighting native momentum). We keep native scrolling and add smoothing only.
- *Our take:* the object is the photograph and the lens. Scroll is aperture (section 4.2).

**Studio and agency portfolios with WebGL (curated Awwwards-style winners, studio sites).**
- *Learn:* one persistent canvas behind the DOM rather than a canvas per section; images that become planes in the same scene as the type; scroll velocity driving a shader uniform (stretch, displacement); a loader that is also the first scene; cursor as a light source.
- *Avoid:* heavy loaders (the first 3 seconds must be content); custom cursors that hide the native cursor (accessibility, trust); text rendered into WebGL (not selectable, not translatable, not indexable); illegible type over busy images; scroll-hijacked carousels; motion that cannot be turned off.
- *Our take:* DOM text always; the canvas is a stage behind it; every effect has a static equivalent.

**Fluid and light effects.**
- *Learn:* stable-fluids style simulation (semi-Lagrangian advection, divergence-free projection) at a low simulation resolution with a higher dye resolution looks liquid at a fraction of the cost; a curl-based "vorticity confinement" step gives the swirl; anamorphic streaks (thresholded highlights stretched along one axis) and halation (a warm, wide bloom that bleeds from highlights, red-biased like film) are cheap as post passes.
- *Avoid:* full-screen sim at DPR 2 on phones; sim that never settles (burns battery); rainbow dye (kitsch). Dye colours come from the world's palette, never hue-cycling.
- *Our take:* write our own small solver (the technique is public; we do not copy any existing implementation), 4 passes plus 2 post passes, three resolutions for three tiers.

**Scroll choreography and platform support (checked 2026-10-12).** CSS scroll-driven animations (`animation-timeline: scroll()/view()`) and View Transitions (same-document and cross-document `@view-transition`) are reported as available in current Chromium, Firefox and Safari 26 in 2026 articles, but the sources disagree on Firefox details and are not authoritative. Decision: treat both as **progressive enhancement**. Primary driver is one JS scroll store (rAF, Lenis-smoothed) that feeds both CSS custom properties and shader uniforms; CSS scroll-driven animations are used only for effects that can be absent without harm. Before relying on a feature in R2, verify it on MDN/Can I use and in Playwright (Chromium, WebKit, Firefox).

**Where the family differs from references.** A scroll story that is *one stage across four sites*, with a deliberate rule (no cross-links) that makes each world a closed room, is unusual; the hub is the only place where the rooms are shown side by side.

**Interaction research that shapes the cursor and index.** Magnetic hover works for primary calls to action only (it harms precision on lists); a visible focus ring and a real `button`/`a` beneath every effect keep it accessible; character-key shortcuts (WCAG 2.1.4) are avoided, so the index opens by button, never by a bare letter key.

---

## 3. The shared experience system ("Flow")

The system is built once in the UI package (name in section 7) and used by all four worlds. A visitor who learns one world knows the others.

### 3.1 Principles of Flow

1. **Nothing cuts.** Content condenses out of the stage and dissolves back into it. No hard section edges; sections overlap by 12 vh of shared stage.
2. **Light is the material.** Hierarchy comes from luminance, scale and depth, not from boxes and borders. Surfaces are glass and air; edges are light.
3. **One physics.** One easing family, one spring, one reveal grammar, one cursor behaviour, everywhere.
4. **Content first, stage behind.** The DOM is complete and readable with no JS and no WebGL. The stage is a performance, not the only copy.
5. **Photographs are never filtered by the effects.** The stage never draws over a photograph's pixels except in a named transition frame, and then for under 900 ms.

### 3.2 Tokens for motion (all `--hl-*`, see design-language.md)

| Token | Value | Use |
|---|---|---|
| `--hl-ease-glide` | `cubic-bezier(0.22, 1, 0.36, 1)` | Arrivals: things entering, condensing, settling. The default. |
| `--hl-ease-pour` | `cubic-bezier(0.65, 0, 0.35, 1)` | Scene-to-scene and page-to-page, symmetric in and out. |
| `--hl-ease-drain` | `cubic-bezier(0.5, 0, 0.9, 0.4)` | Exits that should leave quickly after a slow start. |
| `--hl-dur-blink` | 120 ms | Press feedback, focus ring. |
| `--hl-dur-short` | 280 ms | Hover, small state changes, toasts. |
| `--hl-dur-medium` | 640 ms | Text reveals, panels, index sheet. |
| `--hl-dur-long` | 1100 ms | Page transitions, threshold crossing. |
| `--hl-dur-scene` | 1600 ms | Stage palette hand-off between scenes. |
| Spring `settle` | stiffness 120, damping 22, mass 1 (critically damped, no overshoot) | Scroll smoothing, parallax layers, cursor follower, anything that should feel like liquid with no bounce. |
| Spring `droplet` | stiffness 220, damping 18, mass 1 (one soft overshoot, about 8%) | Magnetic targets and the index button only. |
| Velocity stretch | `wdth = base + clamp(|v| · 0.012, 0, 22)` (variable width axis), decays through `settle` | Headlines get wider as you scroll faster, like liquid stretching. Capped; off under reduced motion. |
| Stagger | 60 ms per line, 24 ms per word inside a line; never per character | Reveal grammar. |

Why these: `glide` is a quint-out shape (fast start, long tail) so content seems to *settle into place* like liquid finding level; `pour` is a gentle in-out so the stage never lurches. Springs are critically damped on purpose; bounce reads as playful, and the owner asked for bold and cinematic.

### 3.3 The stage

One fixed, full-viewport `<canvas>` behind everything (`z-index: -1`, `pointer-events: none`, `aria-hidden`), driven by one scene graph written on `ogl` (already a dependency; `three.js` is rejected for bundle size).

Layers, back to front: **sky/field** (per-world procedural background shader: night field, spot cone, atmosphere gradient) → **fluid dye** (the liquid) → **light streaks** (anamorphic lines, from the cursor trail and from scene "beats") → **halation pass** (threshold, wide blur, red-biased tint, additive 0.12 to 0.35) → grain (static blue-noise texture, 2% opacity so banding never shows) → DOM on top.

The stage reads three inputs only: `scroll.progress` (0..1 per scene, plus velocity), `pointer` (position, velocity, down), and `palette` (the current scene's colours). It writes nothing. A "scene" is a record `{ id, start, end, palette, params }`; the choreography file for each world lists scenes and the stage interpolates parameters between neighbours with the `pour` curve over `--hl-dur-scene`. Palette hand-off is a *liquid wipe*: the new colours enter as dye from the side the user is moving toward.

Fluid solver (own implementation): velocity and pressure grids, semi-Lagrangian advection, curl and vorticity confinement, Jacobi pressure solve (fewer iterations at lower tiers), dye at higher resolution than velocity, damping so the sim goes to rest in about 4 s after the last input. Sim pauses when the tab is hidden, the stage is off-screen, or the sim has been at rest for 1 s (zero GPU cost at rest).

### 3.4 Quality tiers and how they are chosen

| Tier | What runs | Where it applies |
|---|---|---|
| **full** | Fluid sim (velocity 128², dye 512²), streaks, halation, per-world field shader, DPR cap 1.5, 60 fps target | Capable desktop/laptop, recent phones that pass the probe |
| **reduced** | Fluid at 64² / dye 256², no vorticity, single-pass halation, DPR 1, 30 fps cap, fewer streak segments | Mid-range phones, low memory/cores, low battery, thermal throttling |
| **static** | No canvas. Pre-rendered poster per scene (AVIF/WebP) and CSS gradients; CSS-only streaks that are a single slow transform, and **none at all** under reduced motion | `prefers-reduced-motion`, Save-Data, 2g/3g, no WebGL2, no JS, failed probe, user choice ("Calm" in the index control) |

Selection runs once after first paint (never before LCP), in this order, first match wins:

1. `prefers-reduced-motion: reduce` → static (and all motion off, not only the stage).
2. `navigator.connection.saveData` or `effectiveType` in `slow-2g|2g|3g` → static.
3. No WebGL2 (`canvas.getContext('webgl2')` fails) or `WEBGL_lose_context` seen → static.
4. User preference stored in `localStorage` (try/catch; "Calm" = static, "Full" = capability result) → apply.
5. `navigator.getBattery` (where it exists) at under 20% and not charging → reduced.
6. `deviceMemory <= 2` or `hardwareConcurrency <= 4` on a touch device → reduced.
7. Probe: render 45 frames of the full scene offscreen; if the 75th-percentile frame time is over 24 ms → reduced; if reduced also misses (over 40 ms) → static.
8. Otherwise → full.

A runtime governor keeps watching: if the 60-frame moving average exceeds 28 ms for 2 s the tier drops one step permanently for the session (and the stage cross-fades; never a pop). The tier is exposed as `data-hl-tier` on `<html>` so CSS and tests can see it. The no-JS state is the static tier by construction: the server renders posters, and the stage script is the only thing that upgrades.

Loading: the stage chunk is imported after `requestIdleCallback` (with a 1.2 s timeout) *and* only once the tier probe permits; first paint contains the poster so there is no layout shift. Budget in section 10.

### 3.5 Scroll choreography

- Native scroll stays the source of truth. Lenis smooths the *visual* scroll (`lerp` ≈ 0.09, wheel multiplier 1) on pointer devices at tier full and reduced; **off** on touch (native momentum is better), under reduced motion, and while a form field or dialog has focus. Anchor links, find-in-page and keyboard scrolling keep working because the scroll position is real.
- Pinned scenes use `position: sticky` inside a tall wrapper (never `position: fixed` hacks), so they degrade to a normal stacked page without JS.
- A scene's local progress `p` (0..1) is written to `--hl-p` on the scene element; children read it in CSS (`calc`) or JS. This one mechanism drives both the stage and DOM effects, so they never drift.
- Scroll story length budget: hub 9 scenes in about 10 screens of travel, each home at most 12 screens at 390 px.

### 3.6 Reveal grammar (text)

Three reveals, no others:

1. **Condense** (headlines): each line goes from blur 14 px, opacity 0, `wdth` +24, translateY 14 px to sharp; `glide`, `medium`, 60 ms stagger by line. The words are real DOM text (split by words at render, not characters), so screen readers read it normally and selection works.
2. **Streak** (hero statements, once per page): a luminous bar sweeps left to right (`pour`, 900 ms); the headline is revealed *behind* it by a `clip-path` mask that follows the bar, then the bar fades. In the static tier the bar is not drawn and the text is simply present.
3. **Settle** (body copy, captions, readouts): opacity 0 → 1 and translateY 8 px → 0, `glide`, `short`, 24 ms word stagger capped at 8 words (the rest appears at once).

Under reduced motion, no-JS and static tier: everything is present, in place, from the first paint (`data-hl-reveal` content is never `opacity: 0` in CSS unless the script has added `.hl-js`; this was the Phase 1 LCP lesson).

### 3.7 Cursor (pointer devices only)

- The native cursor always stays. A **light streak** trails it: 24-point ring buffer, Catmull-Rom smoothed, width tapers 3 px to 0, colour = world accent at 55% with a halation glow, fades out over 700 ms; it exists in the stage (full tier) and as a CSS-masked trail (reduced tier, 10 points); not at all in static.
- The pointer injects force into the fluid (strength proportional to speed, capped) so streaks and dye *flow after* you. Idle for 1.5 s: the trail dissolves and the sim relaxes.
- **Magnetic** (`droplet` spring) on primary calls to action only: pull radius 72 px, max displacement 10 px, label counter-moves 40%. Never on lists, form fields or navigation targets.
- Touch: a finger drag leaves a streak; a tap on a threshold fires its transition. No hover-only information anywhere.
- Hover on photographs reveals (caption and fullscreen affordance); it never filters the photograph.

### 3.8 The index control (replaces every navbar)

One cluster, fixed bottom-right (bottom-centre above the safe area on 390 px): `[ ring+index ] [ theme ]`.

- The ring is an SVG circle around an 52 px (touch 56 px) round button; its stroke is **scroll progress**; the icon is a small aperture of six blades whose opening is the same progress (closed at 0, open at 1; static glyph under reduced motion).
- Activating it (click, Enter, Space) opens a full-screen **index** (a modal dialog, focus trapped, Esc closes, focus returns to the button). Two columns on desktop, one on phone: **On this page** (the scenes, in order, with the current one marked and a one-line label) and **Elsewhere on this site** (the world's own routes; on the hub also the three worlds). Plus two small switches: *Theme* (system / light / dark) and *Motion* (Full / Calm).
- Footer of the sheet on photography, music and flying carries **only** the `jerryqiu.com` return button (same as the page footer). Nothing else about other sites.
- Keyboard and screen readers: it is a real `<button aria-expanded aria-controls>`; the sheet is `role="dialog" aria-modal` with a heading; scenes are real links to real anchors (`#scene-id`); the page also has a **skip link** first in the tab order and a visually hidden "table of contents" landmark (`<nav aria-label="On this page">`) in the DOM so assistive tech has a navigation landmark even though no visible navbar exists. Visible focus ring: 2 px accent + 2 px offset of the surface colour.
- Inner pages: the same cluster plus a *very quiet header*: world mark (left, text link to the world's home) and nothing else; it fades to 40% on scroll. Never a nav list.
- The theme toggle sits beside the ring and is always visible, so the owner's "theme toggle" requirement holds without opening the sheet.

### 3.9 Transitions

**Flow (page to page inside one site)** — the "pour". Uses the View Transitions API where available (same-document through the framework's router; falls back to the manual recipe below when unsupported):

| t (ms) | What happens |
|---|---|
| 0 | Click. Link target gets a 120 ms press response (scale 0.98, accent edge). |
| 0 to 180 | A streak crosses the stage left to right (`pour`), brightness peak at 90 ms. Fluid gets a curl impulse along the same line. |
| 60 to 440 | Outgoing content: blur 0 → 12 px, opacity 1 → 0, translateY 0 → -24 px, `drain`. |
| 360 to 1100 | Incoming content condenses (section 3.6, no stagger beyond 3 blocks); stage palette moves to the new page's palette via liquid wipe. |
| 1100 | Interactive well before this: input is accepted from 300 ms; focus moves to the new page's `<h1>` (programmatic focus, no outline flash). |

Under reduced motion: instant swap with a 120 ms opacity cross-fade; focus still moves to `<h1>`.

**Threshold (hub to a world, and any "enter" moment)** — "dolly through a frame". On the hub each world is a luminous rectangular frame in the corridor. On activate: the frame scales to the viewport via a shared-element transition (`pour`, 700 ms) while eight streaks converge on the vanishing point and disperse (a "warp" of at most 900 ms total), the stage palette becomes the world's, and the browser navigates (cross-origin, so a real navigation: the exit animation plays first, with a 1.2 s safety timeout that navigates anyway). The destination plays its **arrival** (a 900 ms intro: streak, halation bloom, headline condenses) on the first load of a session and skips it on repeat visits (sessionStorage guarded with try/catch). The destination page never reads or displays where the visitor came from (cross-site rule). Static tier: a 160 ms cross-fade, no warp.

**Leaving a world** (the footer button to jerryqiu.com) is an ordinary link with the `pour` exit; the hub's arrival plays its own intro. No special state.

### 3.10 Closing pattern

Every home ends in the same three beats: (1) the stage settles to a quiet field in the world's accent; (2) a **"Say hello."** moment in the world's own voice, one primary action (mail link or the form), one line of text; (3) a minimal footer: legal links (hub pages, canonical), copyright, and on photography/music/flying **the single button "jerryqiu.com"** and nothing more. The hub's footer has the three world links, the social row and the legal row.

### 3.11 Sound

None by default, never autoplay. Music's listening room plays audio only after a press, and the page shows a visible stop control.

---

## 4. The four worlds

Common to all: first person ("me"), short, specific, real facts only, each draft line carries `TODO(owner): rewrite in your voice` in source (dev-only visible). Real facts the repo supports: Jerry Qiu; New York; Stuyvesant High School, class of 2026 (college unknown, Q24); photographer for events, theatre and street; started in 2025 with the Media & Memory crew of SING! 2025; photos and videos as a child with his dad's cameras in Hong Kong and Beijing; second place in the 2016 NAE Global Campus photography competition at age 8; FAA Part 107 remote pilot; runs the StuyAviators Instagram; projects: Stuyvesant SING! 2026, Maker Faire Coney Island 2025, Stuyvesant Open House (March 2026), IWD Run 2026, StuyPA Chinese New Year dinner 2026, and a January 2026 snow set; aviation shots of JetBlue A220 and A321neo. Not confirmed, so not claimed: the instrument Jerry plays (the music photo shows a trombone, Q22), college, any prices.

### 4.1 Hub: "Past the threshold" (jerryqiu.com)

**Mood.** Awe, bold, cinematic, inventive; professional and minimal. A dark stage of liquid and light, big type, a deep corridor.
**Metaphor.** A long exposure of a person: streaks of light resolving into a face, a trade, and then doors to three rooms.
**Type.** Display in a wide variable grotesque at light-to-medium weight and wide `wdth` (breathing, confident, never shouty); body in a clean grotesque; serif italic only for the quoted voice lines; mono for the small instrument-like readouts (see 6).
**Colour behaviour.** Night field (`#07080c`), text near-white, a single *blue* accent used as halation and streak colour; the three worlds borrow their own accents only on their frames (red, yellow, green at the edge of each threshold). Light theme ("Day"): warm paper field, ink text, blue accent darkened to pass AA.
**Stage.** Opening: a long-exposure field of horizontal blue-white streaks drifting slowly; fluid dye reacts to the cursor. Mid: the field narrows to a corridor with a vanishing point; thin luminous frames recede in depth. End: the corridor opens into a calm, almost empty field for writing and "Say hello."
**Signature interaction.** Light streaks that resolve into type (the Streak reveal) and the cursor that drags the flow; passing through a threshold.

**Scroll storyboard** (desktop 1440; ≈ 10 screens). Each row is a scene; `p` is local progress.

| # | Scene | What the visitor sees | Motion (Flow) | Words (draft; TODO(owner): rewrite in your voice) |
|---|---|---|---|---|
| 0 | **Ignition** (0 to 1 screen) | Black → one blue-white streak sweeps across; halation blooms; "Jerry Qiu." condenses in wide display type; beneath, five roles appear in a line: photographer · builder · drone pilot · musician · New York. Real photo strip (5 frames) begins to drift in at the bottom edge | Streak reveal (once). Fluid follows the cursor. Role words Settle with a 120 ms offset | "Jerry Qiu." / "I take photographs, build websites, fly drones and make music. I'm in New York." |
| 1 | **Proof** | The photo strip rises to centre as five layered planes (parallax at 5 depths); each frame brightens as it passes the centre line, lit by the streak; captions are mono readouts: place and date | Velocity stretch on the caption type; planes on the `settle` spring; no filter on the photographs | "SING! 2026 · Maker Faire Coney Island · snow, January · the Open House · a JetBlue A220 on approach" |
| 2 | **What I do** | Four short statements, one per beat, on the stage; each pairs with one real fact | Condense, one at a time, pinned for ≈ 2 screens | "Photography is how I started, and it is still how I pay attention." (existing owner text) · "I fly drones with a Part 107 certificate." · "I built this site." · "I run the StuyAviators Instagram." |
| 3 | **Dimensions** (the corridor) | The field narrows to a vanishing point. Three tall luminous frames stand in depth: each is a thin outline with its accent at the edge and a live miniature of that world's stage (poster at static tier). Camera moves forward on scroll; each frame in turn is large and legible | Perspective dolly over 3 screens; frames on `settle`; the near frame tilts 3° toward the cursor; hover brightens its edge | "Three rooms. Each one is quiet in its own way." then per frame: "Photography: pictures of people at work." / "Music: things I wrote and played." / "Flying: where I've been, from above." |
| 4 | **Threshold** (per frame) | A single clear control "Enter photography" / "Enter music" / "Enter flying" under each frame | Threshold transition (3.9) | — |
| 5 | **Writing** | The corridor dissolves. One large featured post (cover image, title, summary, date) in a calm field; below, a compact list of other posts (title and date on one line each) that slide up out of the featured card's shadow | Featured card Condenses; list rows Settle; row hover draws a streak under the title | "Writing" / the featured post's own title and summary |
| 6 | **Say hello.** | The existing section, kept: the heading "Say hello." large, one sentence, the primary action, social links. Streaks slow to nothing; a last blue halation breath | Streak reveal (second and last) | Existing copy |
| 7 | **Footer** | Legal links, the three world links, socials, copyright | Settle | — |

**Mobile (390).** Same scenes with their own composition: the corridor becomes a vertical stack of three full-width frames that you *fall through* (each pinned for 80 vh, the next rising from below); the photo strip is a single column of three staggered planes; the cursor streak is replaced by a touch streak; stage at reduced tier by default on phones that fail the probe.

**Static tier.** Poster of the night field behind the hero, the five roles on one line, the photo strip as a simple row, the four statements stacked, three framed cards (poster + words + "Enter"), featured post and list, Say hello. Complete, beautiful, no motion.

**Wording samples** (all `TODO(owner)`): "Photography is how I started, and it is still how I pay attention." · "I like the moment a rehearsal turns into a show." · "Three rooms. Knock on any." · "Say hello." / "If something here made you curious, tell me. I read everything."

### 4.2 Photography: "Aperture" (photos.jerryqiu.com)

**Mood.** Cinematic dark theatre; the feeling of a product reveal where the product is a photograph. Controlled, precise, a little hushed.
**Metaphor.** The lens itself. Scroll is the aperture: from wide open (blurred, luminous, f/1.4) to stopped down (everything sharp, f/16). An iris of nine blades is the pinned object.
**Type.** Same display family at tighter width and medium weight; exposure data (f-stop, shutter, ISO-like readouts) in mono; crafted headlines are short and strange in a good way.
**Colour.** Black field, warm white text, **red** accent (safelight red) as the iris rim and streaks; photographs carry all other colour; light theme "Daylight print" inverts to paper with red darkened for AA.
**Stage.** A 9-blade iris SDF in a shader, lit from within by the photograph behind it; bokeh discs (the out-of-focus highlights of the *current photograph*) drift as soft shapes; halation warm-red on highlights. In the portfolio, the stage dims to near-black so images carry the page.
**Signature interaction.** Scroll opens and closes the aperture; a photo in the pin sharpens as the f-number rises; hover on a photograph shows its caption in mono; a "contact sheet" mode that lays frames in a grid and lets you drag a loupe.

**Scroll storyboard.**

| # | Scene | What | Words (draft) |
|---|---|---|---|
| 0 | **Open** | Iris wide open, a single portrait blurred to light; "f/1.4" in mono; the headline condenses | "I make pictures of people at work, then spend a long time trying to make them honest." |
| 1 | **Stage light** (pin ≈ 3 screens) | Iris closes as the theatre frames (SING!, dance) come into focus one after another; mono caption "f/2.8 · 1/250 · rehearsal light" is *illustrative only, not real EXIF unless the photo's metadata has it* | "Rehearsal light is the honest kind. Nobody is performing yet." |
| 2 | **Held** | A still moment: Maker Faire, Open House; the frame holds while words move around it | "Most of this job is waiting for the half second where someone forgets I'm there." |
| 3 | **Cold** | The January snow set; the stage turns to blue-white; streaks slow | "Snow edits the city for free." |
| 4 | **Close** | The holly macro; bokeh discs pass through; f/16 reached | "Close enough that the world becomes a texture." |
| 5 | **Wings** | The JetBlue A220 and A321neo; a streak crosses at the plane's speed | "Planes are patient. I'm not, but I try." |
| 6 | **Work** | Four project cards (case studies) as large frames, each opens `/work/[slug]` | "Projects" / one line each (the existing summaries) |
| 7 | **Moving pictures** | Video poster reel (click-to-load, no autoplay) | "Video" |
| 8 | **Book** | A calm field: two lines and the booking entry; "Studio" entry (clients' gallery, mock) | "Book a shoot." |
| 9 | **Say hello.** + footer | Closing pattern; single `jerryqiu.com` button | "Say hello." |

Photography copy rules: unusual but meaningful words ("afterimage", "umbra", "held", "latent", "reciprocity"), never "stunning", "elevate", "capture moments", "passionate". Every line must be something Jerry could say out loud.

**Mobile.** The iris is a centred disc that fills the viewport width; scenes are pinned for 70 vh; the contact-sheet loupe becomes a swipeable strip. **Static tier.** Poster of the iris at two stops, photographs in a clean sequence with captions, no motion.

### 4.3 Music: "Three rooms" (music.jerryqiu.com)

One world, **three page vibes**:

| Page | Vibe | What it is |
|---|---|---|
| Home `/` | **Stage and spotlight** | Dark theatre. A soft cone of warm light follows the cursor (touch: the last tap or drag), revealing large typographic staves and the names of the pieces as if they were set on a stage floor. Everything outside the cone is 12% luminance but still legible text (no content hidden in darkness). |
| `/compositions`, `/compositions/[slug]`, `/scores` | **Typographic score** | Paper-light or ink-dark; five staff lines are real SVG rules that become the baselines for text; titles sit on the staff; a silent animation "plays" the page as you scroll (a marker moves along the staff). Two clearly separated actions on every composition: **Listen** (appears only if a performance recording exists) and **Score** (preview, price, add to cart). |
| `/listen` | **Minimal listening room** | Almost empty, calm, one column; only the player moves (a waveform from precomputed peaks, a slow-breathing halation behind the title). No autoplay; load-on-press; a visible Stop; no stage canvas at all (static tier by design), which also makes it the lowest-power page of the family. |

**Type.** Serif italic (Newsreader) for titles and the quoted voice, wide grotesque for labels, mono for bar numbers and catalogue numbers. **Colour.** Warm black and cream; **yellow** (stage-light amber) accent as the spotlight and the marker; light theme "Manuscript" uses darkened yellow for text only where AA passes.
**Signature interaction.** The spotlight; the marker moving along the staff; "bar numbers" as a scroll index.

**Home storyboard.** 0 **Dark stage** (spotlight finds a headline) → 1 **Pieces** (three to five titles lit as the cone passes; each is a link) → 2 **A room for listening** (one line; goes to `/listen` only if a recording exists, otherwise this scene is omitted) → 3 **Scores** (one line and a link into `/scores`) → 4 **Say hello.** + footer with the one `jerryqiu.com` button.
Words (draft; TODO(owner)): "Music" · "Things I wrote, and sometimes played." · "The score and the recording are two different things. Pick the one you came for."
**Facts note.** Which instrument Jerry plays and what he has written are not in the repo (Q22, Q34); the mock catalogue uses clearly fake titles labelled `MOCK`/`SAMPLE`; real works come from the CMS. No page claims a repertoire.

**Mobile.** Spotlight follows touch; staves stay horizontal and scroll sideways within a section (a deliberate, accessible horizontal scroller with keyboard support). **Static tier.** Poster of the stage with fixed spotlight; staves as static SVG.

### 4.4 Flying: "Ascent" (flying.jerryqiu.com)

**Mood.** Calm precision; the quiet of altitude; engineering honesty (it documents, it does not boast). 
**Metaphor.** A climb through atmosphere layers, with the instruments that tell you where you are.
**Type.** Same display at narrow width and light weight for headlines; instrument readouts in mono (tabular figures); notes in a readable serif for journal entries.
**Colour.** The page field changes with altitude: ground haze (dusk grey-blue) → low cloud (soft white noise) → clear (deep blue) → high (near-black blue). **Green** (instrument green) is the accent for readouts, route lines and focus rings. Light theme "Daylight" is the same climb on a lighter palette with green darkened for AA.
**Stage.** Layered noise shaders for cloud decks that the camera passes through (parallax: near layers move faster); a horizon line that drops as you climb; thin grid ticks. At static tier: four posters, one per layer.
**Signature interaction.** Scroll = climb with a live **altitude readout** and a **heading tape**; routes are drawn as liquid lines (a glowing stroke that draws itself with a particle at its head); an artificial-horizon micro-detail in the index control's corner.

**Storyboard.**

| # | Scene | What | Words (draft) |
|---|---|---|---|
| 0 | **Ground** | Dusk field; readout "ALT 0" (a metaphor, not a real altitude) | "Flying" · "I'm learning to read the sky." |
| 1 | **Climb** | Altimeter drum rolls; low cloud passes | "I hold a Part 107 certificate, so I've started with drones. TODO(owner): your path to aircraft." |
| 2 | **Log** | Journal teasers as flight-strip rows: date (month precision), place (airport code), a one-line note | Entries from the CMS (flying entries need the "safe to publish" flag) |
| 3 | **Map** | A dark map of past flights; arcs draw themselves | "Where I've been, a little late on purpose." |
| 4 | **Aircraft** | Aircraft cards without tail numbers | — |
| 5 | **Involvement** | "StuyAviators": I run the club's Instagram (existing real fact) | "I run the StuyAviators Instagram." |
| 6 | **Instruction** (hidden by default) | Only rendered when the setting is on (Q36); inquiry only | "TODO(owner): if you turn this on, write your own line." |
| 7 | **Altitude** | Clear air above; stage quiet | "Say hello." + footer with one `jerryqiu.com` button |

**Privacy (hard rules, from 11).** No live location; flights shown at airport level, published after a delay (default: month precision and at least 7 days after landing, Q35); no tail numbers by default; no people identifiable without permission; every map demo is labelled `SAMPLE`.
**Map technique.** No third-party tile service (no keys, no calls, no cost, no tracking): a bundled simplified public-domain land outline (Natural Earth, public domain) drawn with our own projection and great-circle arcs on a 2D canvas/SVG. Pan and zoom with keyboard. An accessible table of the same flights sits under the map.
**Mobile.** The altimeter becomes a slim vertical gauge at the screen edge; the map is full-bleed with a bottom sheet for the flight list. **Static tier.** Layer posters, the map as a static SVG with arcs already drawn, the list as a table.

---

## 5. The hub's first-15-seconds test

A stranger who has never heard of Jerry scrolls the hub at a normal pace. Within **15 seconds** (about 3 screens) they must be able to say: (a) his name; (b) that he is a photographer, a builder, a drone pilot, a musician; (c) that he is in New York; (d) that there is real work behind it (they saw real photographs); (e) that there are three more places to go. And they must have *felt* something: the first streak and halation bloom (0 to 2 s), the photo strip locking into depth (3 to 7 s), the corridor opening (10 to 15 s).

Procedure (R3/R6): a Playwright script scrolls at 600 px/s and saves frames at 0, 2, 4, 6, 8, 10, 12 and 15 s at 1440 and 390; the contact sheet goes to `screenshots/`. Pass checklist (every item must be true in the frames): name visible by 1 s · five role words visible by 3 s · at least four real photographs visible by 8 s · a frame with an accent edge and "Enter" visible by 15 s · no placeholder text · no layout shift · LCP is the headline or the first photograph · the page is usable (a link works) the whole time. The test is recorded in PROGRESS.md with the images. A second pass runs it in the static tier and with reduced motion: the same facts must be visible without motion.

---

## 6. Type and colour decisions

### 6.1 Typefaces (all SIL Open Font License 1.1, loaded self-hosted, never from a font CDN at runtime)

| Role | Family | Why | Notes |
|---|---|---|---|
| Display | **Anybody** (Etcetera Type; variable weight 100 to 900 and **width 50 to 150**) | The width axis is the Flow idea in type: headlines can *stretch with scroll velocity* and condense into place like liquid. Distinctive, not a default grotesque. | Use at weights 300 to 600 and widths 90 to 130; heaviest weights are too playful for "professional". Verify metrics and a fallback (`size-adjust`) to avoid layout shift. |
| Text and UI | **Hanken Grotesk** (variable) | Quiet, sturdy, excellent small sizes, distinct from Geist and Instrument Sans used earlier. | |
| Voice and journal | **Newsreader** (variable, optical size, italic) | Warm serif for the first-person lines, journal entries and music titles; carries "typographic score". | |
| Instrument and data | **Martian Mono** (variable weight and width) | Tabular readouts: altitude, f-stop, bar numbers, catalogue numbers. | Tabular numerals on; used small and sparingly. |

Loading: `next/font` self-hosted subsets (latin), `font-display: swap`, display font preloaded only on homes, others on demand, `size-adjust` fallbacks; total font budget ≤ 120 KB transferred on a home. If any variable axis file is too heavy, subset the axes in the build (documented in design-language.md).

**Licence check for a product that is sold.** The SIL OFL permits bundling and embedding the fonts in software that is sold, provided the fonts are not sold on their own, the licence text and copyright notices ship with them, and any modified font is renamed (we do not modify them). A 2026-10-12 web search of the OFL FAQ text confirmed the bundling rule in general; it did **not** confirm the licence of each of the four families. **Action for R2 (before shipping):** read each family's `OFL.txt` and `METADATA.pb` in its upstream repository or the installed font package, record the exact licence file, version and copyright line in `THIRD_PARTY_LICENSES.md`, and replace any family whose licence is not OFL 1.1. Fallback candidates if a check fails: Bricolage Grotesque or Familjen Grotesk (display), Figtree (text), Source Serif 4 (voice), JetBrains Mono (mono). The owner does a final check (SELLING.md).

### 6.2 Colour

Principle: **surfaces are neutral and cool-tinted; accents are signature moments**, used for light (streaks, halation, edges, focus), never as paint on large areas. Three themes: *Night* (default, cinematic), *Day* (warm paper), plus **Cinema** (pure black, for photography portfolio and gallery pages, so photographs are the brightest thing).

| Token (Night) | Hex | Day | Hex |
|---|---|---|---|
| `--hl-field` | `#07080c` | | `#f3f1ec` |
| `--hl-surface` | `#0e1118` | | `#e9e6df` |
| `--hl-ink` | `#eceff5` | | `#0b0d12` |
| `--hl-dim` | `#a2a9ba` | | `#545a68` |
| `--hl-blue` (hub) | `#6f9bff` | | `#1d48c9` |
| `--hl-red` (photography) | `#ff6a5e` | | `#b3251e` |
| `--hl-amber` (music) | `#ffcb47` | | `#7a5c00` |
| `--hl-green` (flying) | `#4fe0a0` | | `#0a6b46` |

Contrast against the field (WCAG formula, computed 2026-10-12; the build's `scripts/contrast.mjs` is updated to include these and must stay green): Night: ink 17.38, dim 8.50, blue 7.44, red 7.13, amber 13.24, green 11.92. Day: ink 17.22, dim 6.12, blue 6.59, red 5.81, amber 5.54, green 5.81. Every pairing used for text is at least 4.5:1; large text and non-text (focus rings, streak lines that carry meaning) at least 3:1. Effects that carry no meaning (glow) are exempt but never reduce the contrast of text over them: text sits on a `--hl-field` scrim whenever it crosses a bright stage area.

Halation tint: accent mixed 70% with `#ff5a3c` (film's red-orange bleed) for the bloom only.

---

## 7. Package name, licence, selling

### 7.1 Name (Q33)

Shortlist, checked 2026-10-12 by reading only (`npm view`, no accounts, no purchases): 

| Name | Idea | `<name>-ui` / `@name/ui` on npm | Notes |
|---|---|---|---|
| **Halation UI** (default) | The glow that bleeds around bright light in film; *is* the system's signature effect | `halation-ui` free; `@halation/ui` free (org not claimed; unscoped `halation` exists as an unrelated React framework, version 0.1.0, which is not a conflict for `halation-ui` but could confuse searches) | Short, distinctive, says what it does. Owner's own suggestion. |
| Penumbra | The soft edge of a shadow | `penumbra-ui` free; `@penumbra/ui` free | Elegant but describes shadow, not light/flow. |
| Afterglow | Light that lingers after the source is gone | `afterglow-ui` **taken**; `@afterglow/ui` free | Taken name is a hard conflict. |
| Latent | The unseen image on exposed film | `latent-ui` **taken** | Taken. |
| Streak | Light streaks | `streak-ui` free | Generic; "Streak" is a well-known CRM product. |

**Default: Halation UI** (`@halation/ui`, brand `Halation`, CSS prefix `hl`, custom properties `--hl-*`). No conflict found by reading, so the default stands. The owner does the trademark, npm-org, GitHub and domain checks. Applied with `pnpm rename` in R2 (the script and its test are updated for the new name). Logged as Q33 (update).

### 7.2 Licence (Q32) and selling (full checklist in [SELLING.md](SELLING.md))

Because the package is meant to be sold, MIT-for-everything would give the product away. Options prepared, owner decides:

| Option | Shape | Pros | Cons |
|---|---|---|---|
| A. Commercial licence for everything | Per-developer or per-project licence, source delivered to licensees, demo site public | Simple, protects the product | Smaller reach, no community |
| **B. Open core (recommended default to prepare)** | Core tokens, layout, forms and overlays under MIT; **Stage** (WebGL fluid engine, flow transitions, index control, studio and store kits) under a commercial licence | Visibility from the free core, revenue from the part that is hard to build | Two licences to maintain |
| C. Source-available | Public repo, free for personal/non-commercial use, paid for commercial | Easy to try | Not "open source"; some people avoid it |

Until the owner picks, the repo keeps its current licence and the package gets a **draft** commercial licence file marked `TODO(owner): have a lawyer review` (R7). Nothing is published or sold by Claude.

---

## 8. Candid comparison with Once UI and other kits

What the previous site used: Once UI (SCSS design system with neutral/brand token scales, `Flex/Column/Row` layout primitives, flat cards with hairline borders, a generic hero → grid → footer rhythm). The Phase 1 package we wrote was cleaner but sat in the same family of looks (neutral grayscale, rectangular surfaces, fade-and-rise motion), which is exactly the owner's complaint. The screenshots in section 1 are the "before".

| | Once UI | shadcn/Radix Themes | Chakra | MUI | Tailwind UI | Geist/Vercel, Apple, Stripe sites | **Halation UI (this)** |
|---|---|---|---|---|---|---|---|
| Goal | General app and marketing UI | General app UI | General app UI | Enterprise app UI (Material) | Marketing/app templates | Their own brand systems | One family of immersive, scroll-driven sites |
| Motion | Minimal CSS transitions | Minimal | Minimal | Material ripple, transitions | Minimal | Bespoke per page | A system: Flow curves, springs, reveal grammar, transitions, cursor |
| Stage / 3D | None | None | None | None | None | Bespoke | Persistent WebGL stage with fluid and light, tiers, fallbacks |
| Navigation | Navbar | Navbar/sidebar | Navbar | App bar | Navbar | Navbar | No navbar: index control + landmarks |
| Surfaces | Cards with hairlines | Cards | Cards | Elevation shadows | Cards | Varies | Light and air; edges are light, not borders |
| Type | One family | One family | One family | Roboto | Inter | Own | Four roles, variable width tied to scroll velocity |
| Photographs | Plain `<img>` | Plain | Plain | Plain | Plain | n/a | Protected, tiered images, never filtered by effects |
| Business kit | None | None | None | Data grid etc. | None | None | Studio, score store, flight map kits (mocks first) |

Where others are better, honestly: ecosystem size, years of accessibility and browser testing, component breadth (data grids, date pickers, rich selects), documentation polish, and design tooling. We are not trying to win there; we cover only what these sites need. What would be a legitimate overlap: native-like primitives (button, dialog, menu, tabs) behave the same everywhere because user expectations and WCAG patterns fix them; we keep behaviours identical and make *tokens, shapes, motion, composition and naming* ours.

**Originality guardrails.** Own names (Stage, Scene, Threshold, Index, Streak, Halo, Condense, Iris, Altimeter, Contact sheet), own prop APIs, own CSS architecture (`@layer` order: reset, tokens, base, parts, worlds, utilities; `hl-` prefix; no utility classes), own motion tokens, own layout shapes (frames are *outlined by light*, radii come from an aperture-like superellipse, not from a uniform 8 px). The accessible primitives that are hard to get right (focus trap, menu, tabs, dialog) may be built on **headless, unstyled** Radix Primitives (MIT); no visual or API design from Radix Themes, shadcn or any other kit is used. This is a disclosed dependency, logged as Q40 (the owner can ask for a primitives-free build later at the cost of accessibility risk). Before anything ships, side-by-side screenshots of Once UI's public demo and our hub are saved in `screenshots/` and compared against this table: if anyone could mistake them, redesign.

---

## 9. Studio, score store and flight map: design notes for the mocks (R5)

All mocks wear a persistent, quiet banner `MOCK · local only · Phase 3 replaces this with real services`, are behind interfaces (`PaymentProvider`, `ScoreDelivery`, `ClientPortal`, `FlightSource`, `ESignProvider`), seeded with plainly fake data (people and titles invented and obviously fake, e.g. "Sample Client A"), and are compiled out or return 404 in production builds.

- **Studio (photography, owner only).** Dashboard (today, upcoming shoots, unpaid invoices, new inquiries) → Clients → Shoots (status steps: inquiry, booked, shot, editing, delivered, paid) → Client galleries (passcode or magic link, favourites, download request) → Contracts (template, mock e-sign with typed name and timestamp) → Invoices (line items, mock Stripe-test-shaped payment) → Bookings (calendar list). Visual language: the same system in its *quiet* mode (no stage canvas; the field shader replaced by a flat `--hl-field`); data in mono; status as light dots, not coloured pills.
- **Client portal entry (`/client`).** One field for passcode or an email for a mock magic link (shown on-screen, never emailed); then the client's gallery with favourites and a mock invoice/contract panel.
- **Score store (music).** Catalogue → composition page (listen and score are separate buttons) → watermarked score preview (server-rendered image pages, never the PDF) → cart → mock checkout (Stripe-test-shaped, a `4242 4242 4242 4242`-style fake card accepted only by the mock) → mock library with a placeholder file delivered through `ScoreDelivery`.
- **Flight map.** `FlightSource` returns seeded `SAMPLE` flights (past, airport-level, month precision); the real source is Phase 3 (owner-entered). Instruction slot renders only when the setting is on.

## 10. Budgets and test plan

| Budget | Value |
|---|---|
| Home first-load JS (before the stage) | ≤ 90 KB gzip |
| Stage chunk (lazy, after LCP, only when the tier permits) | ≤ 70 KB gzip (ogl ≈ 25 KB plus our shaders) |
| Fonts on a home | ≤ 120 KB |
| Images | derivatives only; hero ≤ 160 KB; AVIF/WebP |
| CLS | 0 on every route, with and without the stage |
| Lighthouse mobile | performance ≥ 90; accessibility, best-practices, SEO ≥ 95 (gaps documented) |
| Frame budget | full tier ≤ 16.7 ms p75 on a mid-range laptop; governor drops tiers above 28 ms moving average |

Tests added in R6: every route × light/dark × 390/1440; axe; keyboard (skip link, index control open/close/focus return, every scene link); reduced motion and no-JS static tier (content complete, no `opacity: 0` text); tier selection unit tests for each signal in 3.4; first-15-seconds frame test (section 5); cross-site rule (photos, music, flying: the only link to another family site is the footer `jerryqiu.com` button; no switcher, no "more from me", no previews); hub `/work` 301 redirects; mocks absent in production builds.

## 11. Open items logged (QUESTIONS.md)

Q32 licence (options A to C above), Q33 name (Halation UI; checks are the owner's), Q40 headless primitives dependency, Q41 fonts (four OFL families; licence files to be verified in R2), Q42 the instrument Jerry plays and whether to say "musician" only (default: "musician" only), Q43 flight-data delay and precision defaults (month precision, 7 days).
