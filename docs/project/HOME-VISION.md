# Home page: the immersive vision

Status: vision and build instructions, 2026-10-18. Replaces the current `HomeJourney` once built. Owner decisions are marked **Decide** and have a default; copy marked TODO(owner) is a draft.

## Why the current page is not immersive

It is a good web page, not an experience. Everything sits in a column on a dark background: small cards, small photographs, headings and paragraphs, mockups in boxes. The photographs are thumbnails inside UI. Motion decorates the layout instead of carrying the visitor anywhere. Nothing fills the screen, nothing has weight, there is no sense of place or time, and the visitor is always reading rather than *being somewhere*.

## The idea in one line

**You spend one night on a shoot with Jerry, from the moment the house lights go down to the print on your wall, and you see it through his camera.**

The site does not describe the process; it *is* the process. The screen is the viewfinder. Scrolling is time passing. Every chapter is one of Jerry's own photographs at full bleed, and the interface is the camera, the darkroom and the gallery around it.

## Principles

1. **The photograph is the room.** In every chapter one photograph fills the whole viewport (edge to edge, behind everything). UI floats over it, never beside it. No photograph is ever smaller than half the screen until the closing grid.
2. **One thing at a time.** Each chapter has one image, one sentence, one gesture. If a screen needs two paragraphs, it is two screens.
3. **The camera is the interface.** Viewfinder marks, the focus point, the exposure meter, the frame counter and the shutter are the site's chrome during the story. They are functional: the frame counter is the chapter number, the meter is scroll progress, the shutter is the transition.
4. **Time moves when you scroll.** Scroll never just "moves the page"; it advances light, focus, the shutter, the developer bath. Stopping scrolling freezes the moment. Nothing important happens on a timer that the visitor cannot control.
5. **Weight and physics.** Prints have paper thickness and shadow, they bend slightly when lifted, they settle with a small overshoot. Light has falloff. Nothing slides linearly.
6. **Silence is the default; sound is a gift.** A shutter click and room tone exist, off until the visitor turns them on.
7. **Real, never invented.** Only Jerry's photographs and real platform features. Illustrative numbers are labelled as examples. No fake EXIF.

## The arc (seven chapters and a coda)

Total scroll length on desktop: about 14 to 16 viewport heights. Each chapter is a pinned stage (`position: sticky`, 100dvh) inside a tall runway; the runway length is given per chapter. `p` is the chapter's scroll progress from 0 to 1.

### 0. Cold open: house lights down (runway 150vh)

- **Arrive:** a black screen. A single line of text fades up in the middle, small, tracked out: `JERRY QIU · NEW YORK`. One second later the darkness lifts from the bottom like a house curtain rising (the Holominimal curtain), revealing a theater photograph (the trombone frame, `theater` subject) at full bleed, very dark, as if the lights are still down.
- **Scroll p 0 to 0.6:** the stage lights come up: the photograph's exposure rises from 15% to 100% (CSS `filter: brightness()`) while a warm spotlight radial gradient sweeps across it, following the pointer slightly. The headline builds word by word over the image, huge, bottom left: **Pictures of people at work.** (the owner's existing line, must stay the page's h1).
- **p 0.6 to 1:** the viewfinder appears: thin corner marks slide in from the four corners, a centre focus box drops in and snaps green, and the frame counter in the top right reads `01`. The headline shrinks into the bottom-left caption position it keeps for the rest of the story.
- **Interaction:** the photograph tilts a few degrees with the pointer (parallax depth on two layers: the photo and a blurred copy behind it). A small "Scroll" cue breathes at the bottom.
- **Accessibility:** the h1 is real text from the first paint. Without JavaScript the photograph is fully exposed and the text is visible.

### 1. The room (runway 200vh): "I'm not the one you're looking at"

Purpose: who Jerry is and how he works, felt rather than told.

- **Stage:** an event photograph (Maker Faire or the open house) full bleed.
- **Scroll:** the camera "walks" through the room: the image scales from 1.25 to 1.0 and pans (Ken Burns driven by scroll, not time). The focus box hunts: it jumps between three faces in the frame (positions set per photograph in data) and each time it lands, the rest of the frame gets a subtle depth-of-field blur (a second blurred copy masked by a radial gradient around the focus point).
- **Copy, one line per focus landing (TODO(owner)):** "I stay out of the way." / "I wait for the half second someone forgets I'm there." / "Then I press the shutter."
- **Shutter:** on the third line the shutter fires: the screen goes black for 80ms from the top and bottom (two black bars meeting in the middle like a focal-plane shutter), a soft white flash, and the frame counter ticks `02`.

### 2. The contact sheet (runway 220vh): "What I photograph"

Purpose: range. This replaces "My work".

- **Transition:** after the shutter, the full-bleed photo shrinks into one frame of a **contact sheet** that zooms out to fill the screen: rows of Jerry's photographs (24 to 36 frames) on black film rebate, with frame numbers and sprocket marks in the margins (pure CSS).
- **Scroll:** the sheet slides diagonally under a **loupe** (a circular magnifier that follows the pointer, or the centre of the screen on touch). Under the loupe the frame is sharp and full colour; outside it the sheet is slightly dimmed.
- **Grease pencil:** as the visitor scrolls, a red grease-pencil stroke draws itself (SVG `stroke-dashoffset` driven by `p`) around one frame per subject: Theater, Event, Dance, Street, Portrait, Aviation, Low light, Macro, Composite. Each circled frame gets its subject name handwritten beside it (a handwriting font, or SVG paths). Each circled frame is a link to that portfolio subject.
- **Exit:** the circled frames lift off the sheet (with shadow) and fly into a row, which becomes the closing subject grid later.
- **Requirements:** this chapter keeps an h2 with the text "By kind" (the static-tier test looks for it) inside the visually hidden heading of the sheet, or as the sheet's printed label `BY KIND · SHEET 2`.

### 3. The night (runway 250vh): "Stage, street, sky"

Purpose: the emotional peak. Pure photographs, almost no words.

- **Sequence:** four full-bleed photographs in a row, one per world: stage (theater), street (snow), sky (aviation), people (portrait). Each is shown for about 60vh of scroll.
- **Transitions between them, all scroll-driven, each different:**
  - stage to street: the stage spotlight narrows to a circle (`clip-path: circle()`) and opens again on the snowy street; snow particles drift across the transition (a light canvas or CSS layer, 60 to 120 flakes, only during this chapter).
  - street to sky: the street photo slides down and the aviation photo rises from below with motion blur (stacked translated copies at low opacity) and a slight camera shake that settles.
  - sky to people: a horizontal wipe like a camera panning to follow the plane, landing on the portrait.
- **Overlay:** only the viewfinder and one word per photo, very large, over the bottom third of the photo with `mix-blend-mode: difference` so it reads on light and dark. Words: `STAGE`, `STREET`, `SKY`, `PEOPLE`. TODO(owner): choose the four photographs and words.
- **Meter:** the exposure meter on the right edge (a vertical scale of ticks, -3 to +3) slides as the visitor scrolls; it is the progress bar for the whole story.

### 4. Working with me (runway 300vh): the six steps, lived

Purpose: how it works, step by step, as a physical sequence rather than a list. Keeps the eyebrow text "Working with me".

Each step is a full-screen moment with one gesture, and a step counter `STEP 1 / 6` in the viewfinder corner.

1. **Pick a package.** The packages arrive as three printed price cards (real `getPublicCatalog` data, $XX while SAMPLE) falling onto a dark table in perspective, fanned, with real paper shadows. Scrolling slides one forward and it flips over (3D `rotateY`) to show what is included. The pointer can lift any card (it tilts toward the pointer). Link: "See the packages".
2. **Book your date.** The table becomes a calendar page; a day is circled in grease pencil as you scroll, then a time is written in. A paper receipt prints out of the bottom of the screen (clip reveal) reading "Deposit · date held". Link: "Book a shoot".
3. **The shoot.** Back to full bleed: a photograph from the actual kind of shoot, with the camera overlay active: focus hunting, the shutter firing three times in rhythm with the scroll (frame counter ticks), the burst leaving three ghosted frames sliding to the left.
4. **The edit.** The screen turns **darkroom red** (a red safelight gradient). The photograph is shown as a dull, flat raw file. Scrolling runs the edit: three slider rails (Light, Colour, Contrast) move on their own, and the image visibly develops (CSS filters interpolated by `p` from flat to final), then a split line reveals before and after. Optional: the developer-tray version, where the print emerges in a liquid tray with a ripple (an SVG turbulence filter).
5. **Your private gallery.** A laptop rises from below the fold in perspective and its screen *becomes the page*: the camera flies into the laptop screen until the gallery fills the viewport, a real-looking client gallery with Jerry's photographs, hearts popping, "Your selection · 12" counting. A phone slides in on the right showing the same photo with Favourite and Download. Copy: a link and a passcode, favourites, your selection.
6. **Download or print.** Out of the gallery, one photograph lifts off the screen, gets a white border and a frame, and the camera pulls back to show it hanging on a wall in a warm room (a lamp light cone, a shadow behind the frame). A download progress bar completes and a "Print ordered" tick pops.

### 5. The finale (runway 120vh): the wall

- All the photographs used in the story assemble into a salon-style wall (mixed sizes, frames, gaps), seen at an angle, and the camera slowly pulls back as the visitor scrolls.
- One line, large and centred: **Book a shoot.** with two buttons: "Start a booking" and "See the portfolio".
- The site dock and top bar arrive here (ChromeReveal, already built) and the viewfinder chrome leaves.

### Coda: everything else (normal page)

After the finale the page becomes an ordinary page in the normal frame: the subject grid ("By kind", from the contact sheet's circled frames), projects, the footer. This is where people who want to browse or skim land.

## The viewfinder layer (the site's chrome during the story)

Fixed, `pointer-events: none` except for its controls, `aria-hidden` for the decorative parts.

- **Corner marks** (four L shapes, 1.5px white at 80%).
- **Focus point** (the green box) driven per chapter.
- **Frame counter** top right: `01` to `07`, the chapter number, monospace, with a red blinking dot while "recording".
- **Exposure meter** right edge: progress through the whole story.
- **Controls** (real buttons, keyboard reachable, visible on focus): "Skip the story" (jumps to the finale), "Sound on/off", "Pause motion" (sets the static composition, stored for the visit).
- **Caption** bottom left: the current chapter title in small caps, plus the h1 once it has shrunk.

## Sound (optional, off by default) **Decide** (default: include, off)

- A sound toggle in the viewfinder. When on: low room tone per chapter (theater hush, street traffic in snow, jet engine far away), a shutter click on each shutter event, paper sounds when prints are handled. Under 300KB total, loaded only after the toggle is turned on. Never autoplay.

## Motion system (how to build it)

- **One scroll engine** (the existing `useScrollStory` in `HomeJourney.tsx` is the base): every chapter is `data-scroll="pin"` and gets `--p`; sub-phases are computed in CSS with `clamp()` (as the current hero does with `--a`/`--b`). Easing: the engine lerps (0.14 per frame); CSS adds springy curves (`--hm-ease-glide`) to discrete events.
- **Discrete events** (shutter, grease pencil complete, card flip) fire when `--p` crosses a threshold: the engine dispatches a `story:event` once per crossing (in both directions), which plays a short keyframe animation and the optional sound.
- **Layers per chapter:** background photograph (ProtectedImage, `fill`), a blurred copy for depth of field, light layers (spotlight, safelight, lamp) as gradients with `mix-blend-mode`, UI layer, viewfinder layer.
- **Pointer:** a shared `--mx`/`--my` (-1 to 1), already built for the hero. Each layer moves by its depth. Holominimal `Cursor` stays (dot-ring, magnetic) but becomes a **focus reticle** shape over photographs (custom `icon` shape: a small square bracket).
- **Particles** (snow, dust in the projector light): one small canvas, created only in chapter 3 and destroyed after, never under reduced motion. It must not draw photographs (image protection).
- **Performance budget:** 60fps on a 2020 MacBook Air; only `transform`, `opacity`, `filter` and `clip-path` animated; at most two full-bleed photographs decoded at once; each chapter preloads the next chapter's photograph when its `p` passes 0.5; `content-visibility: auto` on chapters far away; no layout-triggering properties in scroll handlers.

## Small screens

- Same chapters, shorter runways (60% length), portrait crops of each photograph (`object-position` per photograph in data).
- Pointer effects become device tilt only if the visitor allows motion sensors **Decide** (default: no tilt; use gentle auto drift).
- The loupe on the contact sheet sits in the middle of the screen and the sheet slides under it.
- The dock stays hidden until the finale, as on desktop.

## Accessibility and the rules this must keep

- **Reduced motion:** no pinning, no runways, no particles, no cursor, no shutter flash. Each chapter renders as a full-width section with its photograph and its text in their final state (the page must stay under 9000px tall: `e2e/reduced-motion.spec.ts`). Nothing below 0.5 opacity.
- **No JavaScript:** every chapter shows its final composition; the h1 is "Pictures of people at work."; the texts "By kind" and "Working with me" are present and visible (`e2e/static-tier.spec.ts`).
- **Flashing:** the shutter flash stays under 3 flashes per second and below 25% of the screen at full white (WCAG 2.3.1); default to a dim flash (white at 40%).
- **Contrast:** text over photographs sits on a gradient scrim or in a frosted chip; never animate text opacity (axe measures contrast through it): reveal text with clip, blur and movement instead.
- **Keyboard:** "Skip the story" is the first focusable element. Tab shows the dock (already built). Every chapter link is reachable in reading order.
- **Image protection:** photographs only through `ProtectedImage` (no file URLs, no photographs drawn to canvas, the screenshot guard stays on). `e2e/photo-protection.spec.ts` must keep passing.
- **Gates:** `pnpm lint && pnpm typecheck && pnpm test`, `pnpm test:e2e` (axe on `/` at 1440 and 390), `env -u NEXT_PUBLIC_HUB_URL pnpm test:admin`.

## Assets and data the build needs

| What | Where it comes from | Owner |
|---|---|---|
| One photograph per chapter: cold open (theater, dark), the room (event, with three faces and their positions), four "night" photographs, one per step 3 and step 4, one for the wall | The portfolio (static set or CMS); a small data file `content/home-story.ts` maps chapter to photograph slug plus focus points and crops | **Decide** which photographs (default: the current featured set) |
| Lines of copy per chapter | `content/home-story.ts` | TODO(owner): rewrite in your voice |
| Handwriting style for the grease pencil | A free handwriting font (OFL) or SVG paths | default: Caveat (OFL) |
| Sounds (optional) | Recorded by the owner or CC0 sources, under 300KB | **Decide** |
| Packages | `getPublicCatalog()` (real, SAMPLE shows $XX) | done |

## Build order (each a commit, each shippable)

1. Viewfinder layer and the chapter runway framework (pinned stages, `--p`, story events, skip and pause controls), with chapter 0.
2. Chapter 4 (the six steps) moved into the new framework, since it carries the most information.
3. Chapter 2 (contact sheet, loupe, grease pencil) and the coda grid it feeds.
4. Chapter 1 (the room, focus hunting, shutter) and chapter 3 (the night, transitions, snow).
5. Finale wall and ChromeReveal hand-off.
6. Sound (if chosen), reduced-motion and phone passes, performance pass, tests.

## Acceptance (how to know it is immersive)

- Within one second of arriving, the visitor is looking at one of Jerry's photographs filling the screen, not at a layout.
- At no point before the finale does the visitor see a column of text, a card grid or a form.
- Every chapter has at least one moment that responds directly to the visitor's scroll or pointer (light, focus, shutter, loupe, card, wipe).
- A first-time visitor can say afterwards what Jerry photographs and the six steps of working with him, without having read a paragraph.
- The page passes every gate listed above, and reduced motion gives a calm, complete page.
