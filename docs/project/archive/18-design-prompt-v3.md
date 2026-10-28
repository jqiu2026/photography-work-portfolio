# 18. Design prompt v3: hub, music and photo (2026-10-15, rev. 3)

Paste or point a build session at this file. It replaces the visual direction in (an earlier brief, removed) and (an earlier brief, removed) for **jerryqiu.com (hub), music.jerryqiu.com and photo.jerryqiu.com**. Flying and Make are not part of this pass. Where this file and older docs disagree, this file wins, **except** [08-operating-rules.md](08-operating-rules.md) and CLAUDE.md, which always win (including on commits, see 5.8). This pass is a visual redesign inside the Phase 2.5 boundary; do not start Phase 3 work. Rev. 3 changes are listed in section 7. Hard rules from [08-operating-rules.md](08-operating-rules.md) still apply: no co-author trailers or "generated with" text, no push or deploy, no spending, log defaults in QUESTIONS.md.

**The brief in one line:** *massive, dreamy and experiential, built from photographs and type, not from shader effects.* Scale does the drama (type the size of the viewport, images that fill it), softness does the dream (focus pulls, slow dissolves, ambient colour taken from the photograph itself), and depth does the experience (layers that move at different speeds, sections that stack and part). Everything must still be a finished page without JavaScript.

## 0. What to remove, what to keep, what is new

**Remove completely (do not repair, do not hide behind a flag)**
- The background light trail: streaks, the cursor streak, the fluid-dye layer, old-kit bloom, and the full-page WebGL/canvas "stage". No WebGL or `<canvas>` background on these three sites.
- The aperture / iris: the iris scene, the aperture glyph in the index control, f-stop readouts as decoration, the word "Aperture" as a concept.
- The hub corridor / threshold / portal (dolly through three frames). Replaced by the stacking rooms in section 2.
- Scroll-jacking. Scroll always moves at the user's hand speed. **Sticky scenes are allowed** (native `position: sticky`, content scrolls through them, the page is never frozen and never exceeds 400vh for one scene); wheel/touch events are never intercepted and the scrollbar is never hidden.

**Keep**
- Dark cinematic photo site, real photographs first, the page set (home, portfolio, work, video, about, book, client, studio) and routes, the music and hub content model.
- Real photographs are never filtered by effects *as final pixels*: blur, dissolve and parallax are only allowed as transitions and ambient layers, and every photograph ends fully sharp, unmasked and unrecoloured at rest.
- Tokens in the old UI kit, WCAG 2.2 AA, keyboard, `prefers-reduced-motion`, the "Calm" choice, protected-image rules, one jerryqiu.com return button on photo and music, privacy and fact rules from [11](11-legal-and-compliance.md) and [12](12-vision-v2.md). Real facts only; drafts marked `TODO(owner)`.

**New building blocks (all DOM + CSS, optional tiny JS)**
1. **Colossal type:** words set at 14 to 28 vw, cropped by the viewport edge on purpose.
2. **Focus pull:** a photograph enters soft and resolves sharp over 1400 ms as it crosses 20 to 60% of the viewport. **Implementation: no animated `filter`.** Stack the blur-up placeholder (a 32 px-wide blurred derivative, scaled to fill) above the sharp image and fade the placeholder's `opacity` 1 to 0 while the sharp image goes `scale(1.06)` to `scale(1)`. It looks like a focus pull, costs only opacity and transform, and works for any number of images at once. A real `filter: blur()` animation is allowed only on the single hero or lightbox image.
3. **Slow dissolve:** full-bleed images cross-fade (900 to 1200 ms), never cut or slide.
4. **Ambient wash:** a pre-blurred derivative of the *current photograph* (generated at build time, 48 px wide, then scaled up with `object-fit: cover`; **no runtime `filter: blur(120px)`**, which is expensive on phones) at 30 to 40% opacity sits behind its section so the page glows in that photo's colours. It is a static image layer that cross-fades when the photograph changes, not an animated light effect, and it sits below text, and every text-on-wash pair is checked at AA in the worst case (the brightest photograph in the set), with the wash opacity lowered per section until it passes.
5. **Depth layers:** 2 to 4 layers of one scene move at different scroll speeds (see section 1.4), transform only.
6. **Sticky stack:** panels that pin one after another and are covered by the next, each 100vh.
7. **Cursor label:** a 72 px circular text label (e.g. "View", "Listen", "Drag") follows the pointer over large imagery on fine pointers only. Native cursor stays visible; the label is a 200 ms-lagging follower. Not shown on touch.
8. **Marquee line:** one slow line of colossal type drifting horizontally (60 s per loop), paused under reduced motion.

## 1. Shared system

### 1.1 Grid, spacing, scale
- 12 columns, max content width 1440 px for text and grids; **imagery is full-bleed (100vw) by default**. Gutters 24 px (mobile 16). Base unit 8 px.
- Section vertical padding: `clamp(96px, 16vh, 220px)`. Sections are generous; empty space is part of the design.
- Hairlines: 1 px `rgba(ink, .14)`.

### 1.2 Type
- **Colossal markup:** the real text lives in the heading (`<h1>Jerry Qiu</h1>` with a visually hidden text node) and the cropped display words are `aria-hidden` spans inside it. Never `aria-label` on a non-interactive element. Decorative colossal words (footer, marquee) are `aria-hidden` and not in the tab order.
- **Colossal:** Anybody, width 100 to 125 (width may widen by 8 percent as the element crosses the viewport, once, no scroll-velocity stretch), weight 400, tracking -0.04em, line-height .86, sizes `clamp(5rem, 18vw, 22rem)` (marquee up to 28vw). Uppercase never for display type (Martian Mono data labels stay uppercase). Confirm the installed Anybody file really has the `wdth` axis; if it does not, drop the width effects (hover widen, load widen) silently instead of faking them with `scaleX`.
- **H1:** `clamp(3rem, 8.5vw, 9rem)`, weight 400, tracking -0.03em, line-height .95. **H2:** `clamp(2rem, 4.5vw, 4.5rem)`. Reveals split by line (not by character), each line masked by `overflow: hidden` and rising 105% over 900 ms with a 80 ms stagger.
- **Voice:** Newsreader italic, 24 to 36 px for statements, up to 96 px for pull quotes.
- **Body:** Hanken Grotesk 17/1.6 (18 at 1280+), measure 62 characters. **Data:** Martian Mono 12 px, tracking .08em, uppercase, tabular.
- Fonts: `font-display: swap` for text. Colossal display type is **preloaded** with `swap` and a metric-adjusted fallback (`size-adjust`, `ascent-override`) so there is no layout shift; do not use `optional`, which can leave first-time visitors with the fallback in the hero.

### 1.3 Colour
- Field: night `#07080c`, cinema (photo) `#050506`, day `#f3f1ec`. Ink/dim from (an earlier brief, removed).
- Accents (hub blue, photo red, music amber) appear **only** as: link underline/hover, focus ring, primary button fill, 1 px rules, small markers (dots, numerals), the cursor label background. Never as a gradient, glow or panel.
- Dreamy colour comes from photographs through the ambient wash, plus two neutral gradients allowed per page: a 0 to 60% black scrim under text on imagery, and a 40 vh field-to-transparent fade at section edges.
- No grain overlay, no drop shadows, no glass.

### 1.4 Depth and motion rules
- **Easing:** arrive `cubic-bezier(.22,1,.36,1)`, travel `cubic-bezier(.65,0,.35,1)`, exit `cubic-bezier(.5,0,.9,.4)`. **Durations:** hover 180 ms, reveal 900 ms, focus pull 1400 ms, dissolve 1000 ms, marquee 60 s.
- **Parallax:** layer speed multipliers from -0.15 to +0.25 of scroll distance, capped so a layer never moves more than 18vh relative to its section; transform: translate3d only. Use CSS scroll-driven animations (`animation-timeline: view()`) where supported, with an IntersectionObserver + `requestAnimationFrame` fallback; if neither runs, layers sit at rest. (Browser support NOT VERIFIED: treat as progressive enhancement and test in Chromium, Firefox and WebKit.)
- **Budget:** only `transform`, `opacity` and (on the hero or lightbox image only, never in a list) `filter: blur` animate. No animated `box-shadow`, `width`, `top`. Never more than 6 simultaneously animated layers per viewport, counting opacity-only focus-pull layers; a scene that needs more must stagger or drop the far layers first. Target 60 fps on a mid-range phone; if the frame probe averages under 40 fps for 2 s, switch to the **reduced tier** (no parallax, no focus pull, dissolves become 300 ms fades).
- **Tiers:** *full* (default on capable devices), *reduced* (battery saver, Save-Data, slow probe), *static* (`prefers-reduced-motion`, "Calm", no JS: no motion at all, content simply present, the ambient wash fixed, marquees static and wrapped). The static tier is built first and must look finished.
- **No page transitions;** navigation is instant, scroll resets to top, focus moves to the new `<h1>`.

### 1.5 Header, footer, controls
- **Header:** 72 px, transparent over hero, after 80 px of scroll it gains a solid field-colour background at 92% and a hairline (no backdrop blur: it contradicts the no-glass rule in 1.3 and costs paint time). Over imagery the text keeps AA via the scrim. Left wordmark (Anybody 500, 20 px). Right: text links (14 px), a 44 px theme button, and on mobile a menu button that opens a full-screen sheet (focus trapped, Esc closes, focus returns to the menu button, body scroll locked only while open) with links set in **H1 size**, each line rising in with an 80 ms stagger. The current link has an accent underline. No progress ring, no index control, no aperture glyph. A skip link comes first.
- **Footer:** an oversized site name in colossal type bleeding off the bottom edge (cropped at 55% of its height, `aria-hidden`, with the real text in the usual footer), above four small columns. Photo and music keep a single "jerryqiu.com" return button and no other cross-site links (Q45).
- **Buttons:** primary 52 px tall, 28 px padding, 6 px radius, accent fill; secondary 1 px ink outline; both gain an arrow that slides 6 px on hover. Text links underline with offset 5 px and animate the underline from left over 240 ms.
- **Cursor label** per building block 7. **Scroll cue:** a 1 px, 48 px tall line under hero text that scales Y 0 to 1 on a 2.4 s loop (static under reduced motion).

### 1.6 Imagery
- Full-bleed hero and room images are served as AVIF/WebP derivatives at 1280, 1920 and 2880 px wide with blur placeholders and explicit dimensions (no layout shift). Only the first image of a page is `priority`.
- Use the focus pull for images entering below the fold; the hero uses the dissolve only.
- Captions: Martian Mono 12 px, place and year, bottom-left under or on the image; never invented EXIF.

## 2. Hub: jerryqiu.com, "Overture"

**Feeling.** Opening a very large, very quiet book: your name at the size of the sky, photographs surfacing out of soft focus, three rooms that you walk into by scrolling, and nothing you have to learn.

**Scene 1: Name (min-height 100svh, not pinned)**
- Field is `#07080c`. The word **JERRY** and below it **QIU.** in colossal type at 24vw, left-aligned, cropped by the right edge (the "Q" and "U" may be partly cut off; this is intentional and `aria-label="Jerry Qiu"` carries the real name).
- Behind the name, 4 real photographs as **depth layers**: far (small, 22vw wide, blurred 6 px, dim, speed -0.12), mid (30vw, speed +0.06), near (38vw, speed +0.2, sharp). They sit around the type, partly behind and partly in front of the letters (z-index between letter rows), arranged in an asymmetric scatter. On load they dissolve in staggered 200 ms apart. On pointer move (fine pointers) each layer shifts up to 14 px opposite the pointer (depth parallax, 800 ms lag). No streak, no trail.
- Bottom-left: mono line "PHOTOGRAPHER · BUILDER · DRONE PILOT · MUSICIAN · NEW YORK" (wraps to two lines on mobile). Bottom-right: scroll cue.
- Static tier: the same composition with layers at rest.

**Scene 2: Statement (sticky text over a changing image, 300vh)**
- Left 6 columns sticky: Newsreader italic 40 to 56 px statement that changes in three steps as the user scrolls (cross-fade 600 ms): (1) "I take pictures of people at work." (2) "I build the tools I wish existed." (3) "I fly small things and write music." (all TODO(owner), kept to real facts).
- Right 6 columns: a tall photograph (4:5, 78vh) that **dissolves** to the next as each step takes over, with the focus pull on arrival. The ambient wash behind the whole scene follows the current photograph. Progress is shown by three mono numerals "01 02 03", the current one in accent.
- Mobile: statement above, image below, both sticky as one unit at 90svh.

**Scene 3: The rooms (replaces the portal; sticky stack, 3 x 100vh)**
- Three full-viewport panels stack: each pins at the top while the next rises over it (the lower panel slides up with `translateY`, covering the one beneath, which dims to 70% and scales .96). Each panel is a **normal link** (`<a>` wrapping the panel's call to action, plus a full-panel click target) to photo., music. and flying.
- Panel anatomy: full-bleed real photograph (photo: a strong frame; music: a performance or instrument photograph, else a warm-black field with the colossal numeral "II"; flying: an aircraft/sky frame), a 55% black scrim only under the text, colossal word at 20vw bottom-left (**PHOTO**, **MUSIC**, **FLYING**), a Newsreader italic line (one sentence, TODO(owner)), mono index "01/03", and a **"Enter →"** button in the room's accent. Cursor label "Enter" on fine pointers.
- On hover/focus of a panel the image scales 1.03 over 1400 ms and the colossal word's width axis widens 6 percent. That is the whole effect.
- No 3D, no custom page transition, no JavaScript required: without JS the three panels simply stack and scroll.

**Scene 4: Selected work (horizontal drift, 100vh, native scroll)**
- A heading "Work" (H1 size) above a horizontal track of 4 case-study cards, each 62vw wide (desktop) / 82vw (mobile), 16:10 image, mono tags, title in H2, one line. The track is a native horizontally scrollable region (`overflow-x: auto`, scroll-snap `proximity`, visible scrollbar styled thin, keyboard focusable and arrow-key operable, labelled "Selected work"). Cursor label "Drag" on fine pointers. A mono counter "01 / 04" updates.

**Scene 5: Writing**
- Featured post as a 100vw image (60vh) with the title in H1 size overlapping its lower edge (title half over image, half over field) and the date and reading time in mono. Below: the next four posts as full-width rows: date (mono) · title in H2 size · arrow; on hover the row's title shifts 12 px right and a thumbnail (180 px) follows the pointer (fine pointers only).

**Scene 6: Say hello (100svh)**
- Centered, the words **Say hello.** in colossal type (18vw). Under it one sentence, the primary button (mailto or /connect) and the social links as text. The marquee line (the five roles repeated, outline-less, 8vw, 60 s loop) drifts under it at 12% ink.
- **Footer** per 1.5.

**Mobile (390).** Name at 26vw on two lines; layers reduce to 3 and sit above/below the name; rooms stack identically (each 100svh); work track at 82vw; statement scene becomes the sticky unit described; footer word bleeds. No horizontal page scroll (only the work track).

**Other hub pages.** /about: a 100vw portrait with focus pull, then a two-column story (Newsreader italic first paragraph at 36 px), the timeline as a vertical list with a thin vertical line and mono dates. /writing: giant "Writing" H1, rows as in Scene 5. /writing/[slug]: cover full-bleed, 62-character measure, 20 px body, pull quotes in Newsreader italic 56 px that bleed 8vw outside the text column, ambient wash from the cover. /connect: giant "Say hello." and a form with visible labels, 56 px fields.

**Hub acceptance.** Name, roles, photographs and three working links all visible within 2 screens; the rooms work with JS off and by keyboard (Tab goes panel to panel; Enter follows); Lighthouse mobile performance 85+; CLS < 0.02; no console errors.

## 3. Photo: photo.jerryqiu.com, "Long Take"

**Feeling.** A dark screening room. One photograph at a time, enormous, held longer than feels polite, then dissolving to the next. Type is huge and rare.

**Theme.** Cinema `#050506`, ink `#ecece8`, accent red `#ff6a5e` (day `#b3251e`). Light "Print" theme `#f3f1ec` for the portfolio only if the user chooses it.

**Scene 1: Opening (100svh, hero reel)**
- Full-bleed photograph, `object-fit: cover`, with focal points per image. A reel of 6 featured photographs **dissolves** (1200 ms) every 7 s; each image drifts a slow Ken Burns of at most 4 percent scale and 1.5 percent translate over its 7 s (transform only; pauses on hover, focus, hidden tab, reduced motion). The ambient wash is *not* used here (the image is the page).
- Bottom-left, over a 0 to 55% scrim: mono "PHOTOGRAPHY · NEW YORK", the H1 **Pictures of people at work.** in H1 size, and two buttons (View portfolio, Book a shoot). Bottom-right: the frame's caption and a mono counter "02 / 06" with previous, pause/play and next buttons (44 px). Colossal type is not used here; the photograph is the colossal element.
- Static tier: first photograph only, no drift.

**Scene 2: Series index (the big list)**
- Each series is one line set in colossal type (`clamp(4rem, 13vw, 15rem)`, weight 400), stacked, with the mono count and year at the right edge ("48 · 2025"). The lines rest at a tone that is at least 3:1 against the field (large text; about 45% ink on cinema, check it, do not guess); on hover/focus the line goes to 100% ink and the series' cover photograph appears as a **full-bleed backdrop behind the whole list** (dissolve 700 ms, with the ambient wash fading in at 35%), so the page becomes that photo. Cursor label "Open". On touch, each line expands inline to show its cover (4:3) instead.
- Lines link to `/portfolio/[series]`. Without JS the list is plain colossal links.

**Scene 3: Selected frames (the reel-wall, sticky, 250vh)**
- A sticky 100vh stage showing a **film strip** of 5 large photographs side by side (each 62vw wide, 8vw apart) that translates horizontally **as the user scrolls vertically** (scroll distance 250vh maps to the strip's width). Each frame enters with the focus pull and keeps full sharpness at rest; frames not at the centre are at 60% opacity. Captions in mono appear under the centred frame only. This is native scroll scrubbing, not an intercepted wheel; users can also Tab to a frame; focus must scroll the page to the scroll position that centres that frame (compute it from the frame index), arrow keys move frame to frame, and the strip never traps focus. Mobile: the stage becomes a horizontal native scroller with snap.

**Scene 4: Long exposure of work (case studies)**
- Four projects, each a full-viewport section (100svh): 100vw photograph, title in H1 size at bottom-left over a scrim, one line, mono year and role, "Read the case study →" (red). Sections are separated by 1 px hairlines and the image uses the focus pull. Deliberately slow rhythm.

**Scene 5: Moving pictures**
- 16:9 poster row of videos, click to load (never autoplay), colossal "Video" label at 14vw behind them at 8% ink; honest empty state until videos exist (Q46).

**Scene 6: Book (100svh, split)**
- Left half: a tall photograph (sticky) with a dissolve between 3 frames every 8 s. Right half: **Book a shoot.** in H1 size; three short lines (what I shoot, how long until delivery, how it works); the packages as three large rows, each with name, deliverables list (mono), and price shown as **"$XX"** placeholder (Q61); then the compact inquiry form (name, email, date, what you need, consent line, 56 px fields, one submit button).

**Scene 7: Say hello. + footer** (colossal "Say hello." at 18vw with the jerryqiu.com return button, then the bleeding footer word **PHOTO** per 1.5).

**Portfolio and series pages**
- /portfolio: giant "Portfolio" H1 (colossal size), the series list from Scene 2 reused, then "Everything" as a justified grid (row height 360 px desktop / 220 mobile, 6 px gaps), "Load more" button (no automatic infinite scroll).
- /portfolio/[series]: 100svh opener (cover photograph full-bleed, series name colossal bottom-left, count and years in mono), then the grid with the focus pull on row entry.
- **Lightbox ("Theatre"):** opening zooms the clicked image from its grid rect to fit the viewport over 500 ms (transform-only FLIP), field becomes `#000` at 97%, image contained uncropped, caption bottom-left, counter bottom-right, previous/next at the edges and by swipe/arrow keys, Esc closes, focus is trapped, next image preloaded, ambient wash from the photograph at 25% behind the black. Protection behaviour (tokens, strict tier, no right-click) unchanged.
- **Studio/client area:** same typography but dense and calm: no colossal type or parallax, 15 px body, hairline tables, status as mono text with a dot. Mocks labelled MOCK/SAMPLE.

**Photo acceptance.** First screen is one photograph and one sentence; every other effect is a dissolve, a focus pull or a native-scroll-driven strip; hero dissolve stops under reduced motion; LCP < 2.5 s and CLS < 0.02 on mobile throttling; everything operable by keyboard; complete with JS off (hero = first photograph, strip = vertical stack).

## 4. Music: music.jerryqiu.com, "Resonance"

**Feeling.** A hall after the audience leaves: large warm dark, a single amber lamp's worth of colour, the title of a piece set so big you hear it. Slow, resonant, gentle.

**Theme.** "Programme" dark: field `#0d0b09`, ink `#f1ebe0`, dim `#b3a994`; light "Manuscript": field `#f6f1e7`, ink `#17130e`. Accent amber `#ffcb47` (day `#7a5c00`). Titles in Newsreader italic colossal (`clamp(5rem, 16vw, 20rem)`); labels in Martian Mono; body in Hanken Grotesk.

**Motif (the only graphic): large staff.** Five 1 px lines, 28 px apart (scaled by 1.6 at 1440+), spanning the full viewport width, drawn at 22% dim ink. Titles sit **on** the staff (the baseline of the title rests on the third line). The staff drifts 6 vh against the page (parallax -0.08) as one depth layer. A thin amber 1 px vertical marker (a "bar line") marks each new section and each piece row. Static SVG/CSS, no moving playhead, no spotlight.

**Scene 1: Hush (100svh)**
- Full-width staff; the colossal H1 **Music.** sits on it (Newsreader italic, 20vw). Beside the lower-right corner a real photograph (instrument or performance, 4:5, 34vw wide) surfaces with the focus pull; if no photograph exists, omit it and let the staff and title carry the page (do not invent). The ambient wash behind the hero uses that photograph (amber-tinted by nature, not by filter).
- A Newsreader italic line 32 px ("Things I wrote, and sometimes played." TODO(owner)), primary button "Listen" only when a performance recording exists, otherwise "Browse pieces"; mono "NEW YORK · EST. TODO" omitted until real.

**Scene 2: Pieces (sticky numeral, 100vh per 3 rows)**
- Left 4 columns sticky: the current piece's catalogue numeral in colossal Newsreader italic (`16vw`, e.g. "03"), cross-fading as rows pass the viewport centre. Right 8 columns: one row per piece: title in H2 size (Newsreader italic), then instrumentation and year (dim, 16 px), duration (mono), and two small actions "Listen" (only if a recording exists) and "Score" (only if a score exists). A bar-line marker precedes each row. Hovering a row dims the other rows to 35% and shows the cursor label "Open". Without JS: simple stacked rows with the numeral inline.
- Five pieces on the home; "All pieces →" below.

**Scene 3: The listening room (shown only when a recording exists)**
- A full-viewport quiet section: huge waveform (precomputed peaks as an SVG of 240 bars, 40vh tall, amber at 35%) that fills left to right to the playhead as the audio plays; the unplayed bars slowly "breathe" (opacity 0.30 to 0.40, 6 s loop, off when paused or reduced motion). Title and performer credit above in Newsreader italic. Play is a 96 px round button with a visible Stop; no autoplay; audio loads on press; the global bottom player (56 px: play/pause, title, scrubber, elapsed/total mono, volume) persists across pages once started. Keyboard: Space toggles, arrows seek 5 s, "m" mutes. Without JS: a link to the recording embed.

**Scene 4: Scores**
- Two columns on a hairline: left a short Newsreader italic paragraph on what is for sale and three licence types (personal, ensemble, studio) as mono rows; right three score cards, each with a watermarked first-page preview (the image gets the focus pull), title, instrumentation, difficulty, price placeholder "$XX" (Q61) and "Preview" and "Add to cart". Score and recording are always presented as two separate things.

**Scene 5: Say hello. + footer** (colossal "Say hello." italic at 16vw on the staff; the footer word **MUSIC** bleeds; single jerryqiu.com return button).

**Piece page.** Full-width staff, the piece title colossal on it; mono meta line (year · instrumentation · duration · difficulty); program notes at a 62-character measure with a Newsreader italic drop-line first sentence at 32 px; two panels side by side (stacked on mobile) **Listen** (embed or "No performance recording exists yet.") and **Score** (preview, licence selector, price placeholder, Add to cart); rights type and copyright notice beneath. The ambient wash comes from the piece's cover image if there is one, otherwise none.

**Store pages** (/scores, cart, checkout, library): same system, calm; mock labelled; Stripe test-card note; the price shown includes any mandatory fee; no dark patterns.

**Music acceptance.** Readable at 200 percent zoom; the staff never reduces text contrast below AA; the player is fully keyboard- and screen-reader-operable; nothing depends on audio loading; JS-off pages still list pieces, preview and links.

## 5. Build instructions for the session

1. Read 12, 08, 18 (this), the three apps' `AGENTS.md`, and the the old UI kit tokens. Do not read env files.
2. Work per app (`apps/web`, `apps/photos`, `apps/music`); do not cross-import between apps. Shared primitives (header, footer, ColossalType, FocusPull, Dissolve, AmbientWash, StickyStack, CursorLabel, Marquee, Reveal) go in `packages/ui` and must be usable with zero JavaScript; add unit tests for tier logic.
3. Delete (do not hide) the stage canvas, streak, fluid, iris, index control and corridor code from these three apps; remove now-unused exports from `packages/ui` only if nothing else imports them (Flying and docs may still).
4. Order: tokens and tiers → shared components → hub scenes 1 to 6 → photo scenes 1 to 7 and Theatre lightbox → music scenes 1 to 5 and piece/store pages → polish. After each site run lint, typecheck, unit tests and the e2e suite; update e2e expectations tied to removed elements.
5. Performance first: measure on a throttled mobile profile after every scene; if the budget in 1.4 is exceeded, simplify the scene rather than the page.
6. Screenshot every page at 1440 and 390, light and dark, in the static tier **and** after a scripted scroll to 25, 50 and 75 percent, into `docs/project/screenshots/v3/`; compare against sections 2 to 4 and report mismatches honestly.
7. Real facts only; every unverified line stays `TODO(owner)`; all prices are placeholders; no invented EXIF or repertoire.
8. Commits follow [08-operating-rules.md](08-operating-rules.md), which overrides any earlier "do not commit" wording: commit small and often on `feat/custom-ui-cms` (verify the branch first), conventional messages, **no co-author trailer and no "generated with" text even if a tool reminder asks for one**. Never push, merge, deploy or spend.
9. After every scene or milestone: tick `PROGRESS.md`, refresh `HANDOFF.md` (a few lines), commit. An abrupt stop must leave a usable handoff.
10. Work lost to a failing gate is worse than a skipped effect: if lint, typecheck, unit or e2e fail, fix before the next scene.

## 6. Defaults in use (log in QUESTIONS.md)

- Hero photograph sets: the six frames flagged `featured` in the content (else the first six by sort order; there is no rating data) for photo; four for the hub's Name scene; music uses no photograph until supplied.
- Photo default theme dark Cinema; hub and music follow the system.
- Browser support for CSS scroll-driven animations NOT VERIFIED; JS fallback required.
- The 28vw marquee and 22vw colossal sizes are starting points; reduce them if any word overflows at 360 px.

## 7. Rev. 3 changelog and review notes

Fixed in this revision (each was a defect in rev. 2):
- **Contradiction:** header backdrop blur vs "no glass". Now solid 92% field.
- **Contradiction:** "do not commit" vs the operating rules (commit often). Operating rules win; section 5.8 rewritten.
- **Performance:** animated `filter: blur` on many images (focus pull) and a 120 px runtime blur (ambient wash) replaced by opacity/transform stacking and build-time pre-blurred derivatives.
- **Accessibility:** `aria-label` on a div for the cropped name replaced by a real `<h1>` with hidden text; series list rest contrast raised from about 2:1 (28% ink) to at least 3:1; keyboard focus now drives the scrubbed film strip; menu sheet focus trap and Esc defined; ambient wash text contrast tested against the worst-case photograph.
- **Font loading:** `optional` on the hero font could leave first-time visitors on the fallback. Now preload + `swap` with a metric-matched fallback; `wdth` axis availability must be verified.
- **Data:** "highest-rated" frames did not exist as data. Now `featured` flag, then sort order.
- **Scope:** explicit Phase 2.5 boundary, no Phase 3.

### 7.1 Cut order if a budget is exceeded (cut from the top)
1. Cursor label. 2. Hover-follow thumbnails on the writing rows. 3. Pointer depth parallax on the hub name. 4. Scroll parallax layers (keep one). 5. Ken Burns drift. 6. Marquee. Never cut: the static tier, focus (keyboard) behaviour, contrast, real photographs.

### 7.2 Definition of done per site
- Static tier screenshots (1440 and 390, light and dark) match sections 2 to 4 with mismatches listed in `docs/project/screenshots/v3/REPORT.md`.
- Lint, typecheck, unit (tier logic included) and e2e pass; e2e covers JS-off render, `prefers-reduced-motion`, keyboard path through the rooms/strip/list, and "no `<canvas>`, no `stage`, no `iris`, no `corridor` in the DOM or bundle" for the three apps.
- Axe finds no serious or critical issues on home, one inner page and the lightbox.
- Mobile throttled Lighthouse: performance 85+, LCP < 2.5 s, CLS < 0.02; numbers recorded honestly, with the cause if missed.
- `PROGRESS.md`, `QUESTIONS.md` and `HANDOFF.md` updated; stop with a short `V3-SUMMARY.md` and do not begin Phase 3.

### 7.3 Open points for the owner (defaults in use, logged)
- Real copy for the three statements, the three room lines and the music line (all `TODO(owner)`).
- Whether Flying should later adopt this language (out of scope here; its panel on the hub links to its current look).
- Which photographs are `featured`; whether a music photograph exists.

