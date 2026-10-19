# Jerry Qiu Photography — The Immersive Homepage

**Status:** Creative direction and implementation brief  
**Date:** October 18, 2026  
**Project:** Replace `HomeJourney` on `jerryqiu.com`  
**Core objective:** Create an immersive, cinematic experience that introduces Jerry's photography, demonstrates his craft, and guides prospective clients through the complete process of working with him.

Owner decisions are identified as **DECIDE**, with recommended defaults. Unfinished owner-supplied copy is marked `TODO(owner)`.

---

## 1. The vision: Enter the world behind the photograph

The photography homepage should not feel like a conventional website with a dark theme, large images, and sophisticated animations.

**It should feel like stepping through a portal into another dimension.**

The broader `jerryqiu.com` domain is a multidimensional personal world, with photography representing one distinct dimension. The visitor should feel that they have crossed into a space with its own atmosphere, visual language, physics, and rhythm. It must feel unmistakably different from an ordinary portfolio, while remaining unmistakably Jerry's work.

The experience begins in darkness. A thin seam of light appears. The visitor crosses a threshold, and the world opens into a photograph that occupies the entire screen. The interface gradually reveals itself as part of this environment, rather than a website placed on top of it.

From there, the visitor follows a continuous journey:

- **Discover:** Enter Jerry's visual world and experience the way he sees.
- **Explore:** Encounter the range of subjects, environments, and moments he photographs.
- **Commission:** See how an inquiry becomes a quote and a confirmed booking.
- **Capture:** Experience the anticipation, timing, and awareness involved in making a photograph.
- **Create:** Enter the editing process and witness an image develop into its final form.
- **Receive:** Step inside the delivered gallery and experience the work as a client would.
- **Keep:** See the photograph become something tangible, shareable, and lasting.
- **Return:** Reach a natural exit into the wider portfolio, booking experience, and the rest of Jerry's digital world.

The homepage should communicate these ideas primarily through images, spatial transitions, interactions, and real examples. Explanatory text is secondary.

### The central creative principle

**Don't tell visitors what Jerry can do. Let them experience the evidence.**

If the photography is compelling enough, the interface should get out of its way. If an interaction can communicate an idea more convincingly than a paragraph, use the interaction. If an effect adds spectacle without revealing anything about the work, remove it.

This is not a game, a cinematic trailer, or a camera-themed marketing template. It is an interactive photographic experience that happens to be a website.

---

## 2. The experience architecture

The experience is one continuous journey, not a collection of independent animated sections.

There are three layers:

1. **The world:** Full-screen photographs, environmental light, depth, spatial transitions, and a consistent sense of place.
2. **The instrument:** A restrained interface that makes the visitor feel like they are looking, focusing, selecting, and moving through images.
3. **The information:** The actual services, booking steps, pricing, deliverables, portfolio links, and calls to action.

The world provides the emotional experience. The instrument makes it interactive. The information makes it useful.

None of these layers should overwhelm the others.

### A continuous visual language

The world should use a consistent set of visual motifs:

- **Thresholds:** Fine seams of light, apertures, and dimensional openings that transition between spaces.
- **Depth:** Photographic layers, atmospheric falloff, restrained parallax, and deliberate foreground/background separation.
- **Light:** Projected light, localized illumination, darkroom reds, and warm light surrounding finished prints.
- **Frames:** Image boundaries that expand, collapse, rotate, and transform into other objects.
- **Physicality:** Paper, glass, film, screens, and framed photographs with believable weight and perspective.
- **Spatial continuity:** Objects should become other objects rather than simply disappear while an unrelated section appears.

The camera and darkroom concepts remain available as visual vocabulary, but they are not mandatory in every chapter. The experience must not look like a camera interface stretched across an entire website.

### The transition rule

Whenever one environment gives way to another, preserve at least one visual element across the transition.

A photograph might become a film frame. The film frame might become a print. The print might become an image in a client gallery. That gallery image might eventually become a framed photograph on a wall.

This continuity is the key to making the site feel like one world.

---

## 3. The journey

Target a cinematic desktop experience of approximately 14–18 viewport heights, with the length determined by the content rather than an arbitrary animation quota.

Use pinned scenes selectively, not everywhere. Each scene should earn its duration by revealing something new. The visitor must always be able to move forward, skip the experience, and reach useful information.

### Chapter 0 — The threshold

**Purpose:** Make the visitor feel that they have entered somewhere new.

**Visual direction**

Begin with a nearly black screen, with a small, restrained identity mark:

`JERRY QIU / PHOTOGRAPHY`

A fine line of light emerges at the center. As the visitor begins to scroll, the line widens into an aperture, revealing a real photograph behind it.

The photograph should not simply fade in. It should feel as though the visitor is seeing a world that already existed on the other side.

The aperture opens until the photograph fills the viewport. Light falls across the image, revealing detail gradually. The page's existing Holominimal visual language may inform the opening transition, but the photography world must establish its own identity.

The title appears as a single, deliberate statement:

**Pictures of people at work.**

This remains the page's actual H1 and must exist in the initial HTML.

The interface arrives afterward: subtle frame corners, a focus indicator, and a small chapter marker. They should feel discovered rather than switched on all at once.

**Interaction**

- Scrolling opens the aperture and reveals the photograph.
- Pointer movement creates subtle spatial depth on desktop.
- A quiet directional cue invites the visitor to continue.
- The opening image and title remain meaningful without JavaScript.

**Avoid:** A long logo animation, a mandatory loading screen, an elaborate intro that delays access to the photography, or a dramatic effect that obscures the first photograph.

### Chapter 1 — Seeing

**Purpose:** Establish Jerry's eye and personality without turning the homepage into an autobiography.

The opening environment expands into a real event photograph. The visitor feels present in the room rather than looking at a small photograph surrounded by UI.

As they scroll, the camera's virtual viewpoint moves through the image. The composition changes subtly through scale, pan, and depth. A focus indicator draws attention to a meaningful detail.

The interaction should help the visitor notice something they might otherwise overlook: a person's expression, a fleeting gesture, the relationship between the subject and their environment.

Three short lines may appear at distinct moments:

- "I stay out of the way."
- "I watch for the moment."
- "Then I press the shutter."

These are provisional copy suggestions, not mandatory narration. Keep only lines that accurately reflect Jerry's approach.

At the end of the sequence, a photographic frame closes around a detail of the image. That frame becomes the first frame of the next environment.

**Important:** Use actual subjects and known focal points from the selected photograph. Do not invent facial tracking, pretend to recognize people, or apply aggressive blur that damages the original composition. If the chosen image does not support this interaction, choose another image or use a different visual gesture.

### Chapter 2 — A world of photographs

**Purpose:** Demonstrate range and make the portfolio discoverable.

The selected frame pulls back into a large photographic contact sheet. This is not a grid of ordinary website cards. It is a spatial field of real photographs, with film-like borders, frame numbers, and restrained annotations.

The visitor sees a world of images extending beyond the viewport.

As they scroll, the contact sheet moves beneath a fixed viewing aperture. Selected images become prominent while the surrounding frames recede. A grease-pencil line traces around several images, revealing subject categories:

- Theater
- Events
- Dance
- Street
- Portraits
- Aviation
- Low light
- Macro
- Composites

Use only categories that have enough strong work to justify their presence.

Each highlighted image is a real link to the corresponding portfolio category. Clicking or tapping it opens that destination normally; the immersive effect must never make navigation ambiguous.

The highlighted frames eventually separate from the contact sheet and form a small collection of floating photographs. These images will reappear later in the experience.

Retain the visible or visually hidden H2 **"By kind"** as required by the existing static-tier tests.

**Mobile:** Replace the desktop contact sheet with a smaller, horizontally navigable sequence or a central viewing aperture. Do not shrink a dense desktop layout until it becomes unusable.

**Avoid:** Showing 36 tiny images that are technically present but visually meaningless. Fewer, stronger images are preferable to a large volume of weak thumbnails.

### Chapter 3 — The worlds I enter

**Purpose:** Deliver the emotional peak and demonstrate photographic range through the work itself.

Move through four photographic environments:

1. **STAGE** — The intensity of performance and controlled light.
2. **STREET** — The unpredictability of a real environment.
3. **SKY** — The geometry, scale, and movement of aviation.
4. **PEOPLE** — The expressions and relationships that make photographs meaningful.

The photographs occupy the full viewport. There are no descriptions, lists, or explanatory paragraphs. The environment, composition, and transition carry the meaning.

Transitions are designed around the actual photographs rather than assigned mechanically:

- Stage to street: a focused pool of light contracts and opens onto the next scene.
- Street to sky: a vertical movement reveals the aircraft and its environment.
- Sky to people: the camera's viewpoint follows a compositional line into the next photograph.

Snow, atmospheric dust, motion blur, or camera movement may be used when they reinforce the image. They are not requirements.

The visitor should feel as though they are moving through distinct worlds, connected by a single visual language.

A restrained chapter indicator tracks progress. Remove the earlier idea of a literal exposure meter with arbitrary EV values unless those values are grounded in actual photographic data. Progress is progress, not exposure.

**Asset selection is critical.** The four images must be among the strongest available photographs. Each should remain compelling when cropped to the intended viewport.

### Chapter 4 — From idea to booking

**Purpose:** Demonstrate the practical process of hiring Jerry, without interrupting the atmosphere with a conventional services section.

The visitor arrives at a dark, physical-feeling workspace. A floating photograph becomes a printed proof, and several pieces of paper emerge around it.

The sequence transforms through four real stages: inquiry, quote, booking, and preparation.

#### 4A. Inquiry

A blank sheet appears, with a few short prompts:

- What are you planning?
- When and where?
- What do you need photographed?

The interface suggests the beginning of an inquiry, but it is not a fake form. The actual inquiry or booking form is a real destination linked from this scene.

CTA: **Tell me about your shoot**

#### 4B. Quote

The inquiry transforms into a quotation. Real packages, services, prices, and deliverables appear from the existing `getPublicCatalog()` data.

The visitor can move between the actual available packages. Each selection changes the information displayed on the paper, rather than merely animating an ornamental card.

Pricing must never be fabricated. If catalog data is unavailable, show a clear unavailability state or direct the visitor to request a quote.

CTA: **Explore packages**

#### 4C. Booking

The quote becomes a calendar or booking document. A date is highlighted, and the relevant booking terms emerge in a small, legible layout.

The sequence should communicate that a shoot is confirmed through the real booking process, not simply because the visitor scrolled past a calendar animation.

Any deposit, payment, cancellation, or date-hold language must match the actual policy.

CTA: **Start a booking**

#### 4D. Preparation

The selected photograph becomes a small collection of reference images, a shot list, or a preparation sheet. These materials suggest the coordination that happens before a shoot.

The visitor then moves through the aperture into the actual shoot environment.

The existing eyebrow **"Working with me"** remains present for compatibility with current tests.

**Design rule:** This is where clarity matters most. Use the physical metaphor to introduce the information, but never sacrifice readable pricing, actual terms, or understandable navigation for a clever animation.

### Chapter 5 — The moment

**Purpose:** Demonstrate craft without claiming that every shoot follows a staged sequence.

Return to full-bleed photography.

The visitor experiences a real photographic moment through a restrained sequence of focus, composition, anticipation, and capture. The scene should be specific to the image selected: a performance gesture, a fleeting expression, a moving aircraft, or a moment in an event.

The shutter effect marks the decisive moment. A brief, dimmed transition connects the photograph to the editing environment.

If multiple images from the same real sequence are available, use them to demonstrate a genuine progression. Do not fabricate a burst, pretend a series of photographs belongs to one shoot, or imply that a staged effect is actual camera telemetry.

The result is a selected photograph that carries into the next chapter.

### Chapter 6 — The darkroom

**Purpose:** Show the editing process as an act of transformation.

The environment shifts into a darkroom-inspired space. A photograph appears with a subdued, unprocessed presentation, and the visitor can see it develop into the finished image.

The effect is not a generic before-and-after slider floating inside a card. The image itself is the environment.

As the visitor scrolls:

- Light and tonal contrast develop.
- Color balance and saturation settle into place.
- Local emphasis and the final crop become apparent.
- The final photograph emerges, filling the screen.

A thin comparison boundary may allow the visitor to inspect before and after. The visitor should be able to move the boundary directly, with keyboard-accessible controls.

Only use authentic before-and-after material from Jerry's workflow. If a raw file cannot be published, use a genuine exported intermediate or an intentionally prepared comparison that is clearly identified. Do not imply that a rendered preview is the actual camera RAW file.

The final image becomes a physical print, carrying its own frame into the next environment.

**Visual direction:** Darkroom red is an accent, not a full-screen filter that makes it impossible to appreciate the photograph. The final color should remain faithful to the delivered work.

### Chapter 7 — Delivered

**Purpose:** Make the client experience tangible and build confidence in the service.

The print transitions into a screen. The visitor moves through the screen into a realistic representation of a delivered client gallery.

This is a demonstration of the actual delivery experience, not a fabricated product interface.

Show the features the real gallery platform supports, such as:

- A private gallery link and access controls, where available.
- Browsing and viewing photographs.
- Favoriting or selecting images, where supported.
- Downloading delivered files.
- Sharing or ordering prints, if genuinely available.

Use actual gallery software and genuine platform features. Clearly distinguish any demo gallery from a live client gallery. Never expose private client images, gallery URLs, access codes, or personal information.

A laptop and phone may appear together to demonstrate responsive delivery, but they should not compete with the photograph itself. The phone is an optional supporting element, not another elaborate animation sequence.

A single concise line communicates the outcome:

**Your photographs, ready to revisit.**

CTA: **See how galleries work**

The gallery interaction should let the visitor do something real: open a public demonstration gallery, explore a safe sample set, or visit the actual gallery platform.

**Do not simulate likes, downloads, or selections with fake counters presented as real activity.**

### Chapter 8 — The photograph stays

**Purpose:** Give the journey an emotional resolution.

The selected photograph leaves the gallery and becomes a physical print. It gains a paper border, thickness, and a believable shadow as it settles into a frame.

The camera pulls back. The image hangs in a quiet room, illuminated by warm ambient light.

The scene recalls the opening: the visitor is no longer looking into a world but looking at something that has emerged from it.

The journey has come full circle: an idea became a booking, a moment became a photograph, the photograph became a finished image, and the finished image became something the client can keep.

A simple final statement appears:

**Let's make something worth keeping.**

The primary CTA is **Book a shoot**.

Secondary CTA: **Explore the portfolio**.

This is the natural handoff point for the site's existing `ChromeReveal` component. The normal site navigation and dock become available, and the viewfinder interface recedes.

The transition should feel like leaving the photography dimension, not like an animated footer suddenly appearing.

### Coda — The rest of the world

After the finale, the page returns to a normal, accessible website layout.

Include:

- The subject grid, retaining the heading **"By kind"**.
- Featured projects.
- A concise introduction and services summary.
- Clear links to pricing, portfolio categories, galleries, and booking.
- The site's established footer and navigation.

This section exists for visitors who prefer to skim, search, navigate directly, or return to a specific destination.

The immersive journey should enhance the site, never hold it hostage.

---

## 4. The interface: a window into the world

The interface must remain consistent throughout the experience.

### Persistent elements

- **Identity:** A small Jerry Qiu / Photography mark.
- **Chapter indicator:** A restrained number or marker indicating the current stage.
- **Directional cue:** A subtle indication that the experience continues.
- **Skip control:** A real, keyboard-accessible button that jumps to the finale or conventional content.
- **Motion control:** A visible way to pause the immersive effects.
- **Sound control:** Optional, off by default.
- **Navigation:** The full site navigation becomes prominent at the finale and remains accessible throughout.

A camera-inspired viewfinder may be used selectively, but the entire page should not be trapped inside a literal camera HUD. Avoid decorative frame counters, arbitrary exposure values, fake recording indicators, and simulated camera readouts that do not serve the visitor.

Every visible interface element must have a clear role.

### The cursor

On desktop, the existing Holominimal cursor may transform into a restrained focus reticle over photographs. It can communicate hover, focus, and image selection.

It must never replace the native cursor's essential functionality, obscure clickable controls, or become the only way to understand an interaction.

On touch devices, use ordinary touch interactions rather than attempting to reproduce a desktop pointer.

---

## 5. Motion, interaction, and physicality

Motion is the connective tissue of the experience, not its primary attraction.

### Scroll

Scrolling advances the journey. It should feel like moving through space, revealing detail, or developing an image rather than simply moving between panels.

Use pinned scenes where a meaningful transformation takes place. Return to ordinary scrolling whenever the visitor is reading, browsing, or making a decision.

### Pointer and touch

Pointer movement can influence the viewpoint, focus, or light direction. These effects must remain subtle and must not interfere with clicks.

Touch devices should have deliberate tap and swipe interactions where appropriate. No interaction may depend exclusively on hover.

### Physics

Use physical behavior sparingly but convincingly:

- Prints settle with slight overshoot.
- Paper objects rotate with believable perspective.
- Light fades with spatial falloff.
- Frames retain visual continuity through transitions.
- Movements ease naturally rather than following a uniform linear trajectory.

Do not animate every element independently. The overall scene should feel coherent.

### Discrete events

Shutter events, print reveals, image selections, and major transitions should occur at intentional points in the story.

They must be reversible or recoverable when the visitor scrolls backward. Re-entering a chapter must not leave stale states, broken animations, or duplicated sound events.

### Sound

**DECIDE — Recommended default: optional sound, off by default.**

If implemented, use a small collection of original or appropriately licensed ambient recordings and restrained sound effects. Load them only after the visitor enables sound.

Never autoplay audio, play overlapping effects on rapid scrolling, or make sound necessary to understand the experience.

---

## 6. Performance and implementation architecture

The experience must be built on the existing application rather than as a disconnected visual prototype.

### Existing foundations

Inspect and reuse the actual implementations of:

- `HomeJourney.tsx`
- `useScrollStory`
- `ProtectedImage`
- Holominimal motion and cursor components
- `ChromeReveal`
- `getPublicCatalog()`
- Portfolio and gallery routing
- Existing static-tier, reduced-motion, accessibility, and image-protection tests

Preserve working functionality and established conventions unless there is a demonstrable reason to change them.

### Scene architecture

Create a data-driven story model, for example `content/home-story.ts`, to map scenes to:

- Scene identifiers and semantic headings.
- Image slugs and protected image sources.
- Focal points and crop positions.
- Transition types and timing thresholds.
- Caption text and navigation destinations.
- Optional scene-specific interactive content.

Keep content separate from rendering logic. Build reusable scene primitives rather than a single enormous component with hard-coded animation conditions.

A scene should own its presentation and local interactions while sharing one story-progress model with the rest of the page.

### Scroll engine

Use the existing `useScrollStory` implementation as the starting point. Inspect its actual behavior before extending it.

Provide normalized progress for each pinned scene and derive animation state from that progress. Avoid adding a second competing scroll engine.

Discrete events should be idempotent, reversible, and safe under rapid scrolling, resizing, navigation, and React lifecycle changes.

Prefer compositor-friendly transforms and opacity. Use filters, masks, and clipping only when their visual benefit justifies their cost.

### Image loading

All photographs must be rendered through `ProtectedImage` in accordance with the existing image-protection architecture.

Never bypass image protection, expose original file URLs, or draw protected photographs to canvas.

Preload only the assets needed for the immediate next scene. Release references to distant scene assets when appropriate, and avoid decoding multiple large full-screen images unnecessarily.

If a transition requires two photographs at once, make that overlap brief and intentional.

### Performance budget

Target a stable 60 FPS on a representative 2020 MacBook Air under ordinary conditions, while gracefully degrading on slower hardware.

- No expensive synchronous work in scroll handlers.
- No layout-triggering animation loops.
- No continuous background effects when a scene is inactive.
- No large particle systems merely for decoration.
- No unnecessary animation libraries or duplicate dependencies.
- No network requests or audio downloads for features the visitor has not activated.

Use real-device and browser profiling to identify bottlenecks. Do not claim a frame-rate target has been met without testing.

---

## 7. Mobile and responsive design

Mobile is a first-class version of the experience, not a scaled-down desktop.

Retain the same narrative and emotional progression, but redesign interactions for a portrait viewport.

- Use portrait-friendly image crops, defined per image.
- Reduce parallax and eliminate hover-dependent behaviors.
- Replace dense contact sheets with a focused, navigable image sequence.
- Simplify layered paper and device scenes when their depth would become cramped.
- Keep captions short and readable.
- Ensure pricing and booking information can be read without zooming.
- Preserve normal scrolling as the fallback for complex pinned sequences.

Shorten scenes only where appropriate. Do not arbitrarily compress the entire story to 60% of its desktop length if that makes the experience rushed.

**DECIDE — Motion sensors:** Default to no device tilt. If ever introduced, require an explicit opt-in.

The story must remain complete and navigable at 390px wide and on common tablet sizes.

---

## 8. Accessibility and graceful degradation

The site must remain a usable photography website even when the immersive effects are unavailable.

### Reduced motion

Respect `prefers-reduced-motion` throughout the experience.

- Disable pinning, parallax, particles, shutter flashes, and elaborate transitions.
- Present each scene in its final, understandable state.
- Use ordinary document flow.
- Keep images and text visible.
- Preserve every important link, pricing detail, and booking path.
- Ensure the resulting page remains under the existing 9,000px reduced-motion test limit.

Provide a manual pause control independently of the operating-system preference.

### No JavaScript

The initial HTML must contain the actual H1, essential content, scene images where appropriate, and working navigation links.

Without JavaScript, the visitor must see a complete, ordinary version of the page. Do not depend on a script to reveal the only copy or remove an opaque overlay.

The required headings **"By kind"** and **"Working with me"** must remain present and visible under the existing static-tier requirements.

### Keyboard access

- Place "Skip the story" first in the interactive page's focus order.
- Ensure every destination is reachable using the keyboard.
- Use real buttons and links.
- Provide visible focus indicators.
- Do not trap keyboard focus inside pinned scenes.
- Do not use scroll position alone to change focus unexpectedly.

### Contrast and readability

Text over photographs must remain readable across different image crops and viewport sizes.

Use scrims, localized gradients, or opaque surfaces when necessary. Never assume a white title will remain legible over every photograph.

Avoid text that is only partially transparent or revealed in a way that causes accessibility tools to report inaccessible contrast.

### Flashing

Avoid full-screen white flashes. A dim, brief shutter transition is preferable.

Respect applicable flashing and animation accessibility requirements; never use a repeated strobe effect.

### Image protection

Preserve the existing image-protection architecture and `e2e/photo-protection.spec.ts` coverage.

No photograph may be exposed through a new unprotected rendering path, canvas extraction, or accidental asset URL leakage.

---

## 9. Authenticity and content requirements

The experience must demonstrate Jerry's real abilities, not invent a story about them.

- Use actual portfolio photographs.
- Use real service offerings and catalog data.
- Link to real portfolio categories and booking destinations.
- Show authentic editing comparisons only where suitable source material exists.
- Demonstrate only gallery features supported by the real platform.
- Never fabricate camera metadata, client activity, testimonials, or deliverables.
- Do not imply that every shoot includes prints, a particular turnaround, or a particular selection process unless that is actually offered.

The visitor should be able to distinguish between a visual metaphor and a real service feature.

### Content file

The story data should support an owner-editable content model containing:

- Selected photograph slug.
- Scene and subject category.
- Focal point and responsive crop.
- Short caption or line of copy.
- Transition style.
- Optional comparison-image references.
- Portfolio and booking destinations.
- Accessibility text.

Do not hard-code specific faces, image positions, prices, or gallery counts into the animation implementation.

---

## 10. Build sequence

Build the experience in complete, testable increments. Do not attempt to implement every cinematic effect before establishing a functioning narrative.

### Phase 1 — Foundation and threshold

- Inspect the existing homepage, story engine, image protection, routing, and tests.
- Establish the story data model and scene framework.
- Implement the threshold and first full-bleed photograph.
- Add shared scene progress, keyboard navigation, skip, and pause controls.
- Verify the no-JavaScript and reduced-motion experiences.

**Deliverable:** A working opening that establishes the visual identity and proves the architecture.

### Phase 2 — Portfolio and visual range

- Build the contact-sheet environment.
- Integrate actual portfolio categories.
- Implement the four-scene photographic sequence.
- Establish the transition language and image-selection rules.

**Deliverable:** A compelling, navigable demonstration of the photography itself.

### Phase 3 — Booking and preparation

- Integrate the real public catalog.
- Connect package selection to actual package information.
- Explain inquiry, quoting, booking, and preparation through the physical-paper sequence.
- Add direct links to real forms and destinations.

**Deliverable:** A visually integrated but genuinely useful path to commissioning a shoot.

### Phase 4 — Editing and delivery

- Implement the darkroom transformation.
- Integrate authentic comparison assets.
- Build the gallery demonstration using actual supported features.
- Connect the final print to the closing environment.

**Deliverable:** A complete, truthful representation of the journey from capture to delivery.

### Phase 5 — Finale and wider site

- Assemble the photographic wall.
- Implement the primary and secondary calls to action.
- Integrate `ChromeReveal`.
- Restore normal site navigation and the coda content.

**Deliverable:** A complete experience with a clear path to booking, browsing, and the rest of the domain.

### Phase 6 — Refinement and verification

- Add optional sound if selected.
- Tune transitions and physical behavior.
- Test desktop, mobile, keyboard, touch, and reduced motion.
- Profile image loading and animation performance.
- Run every existing quality gate.

Required commands:

`pnpm lint && pnpm typecheck && pnpm test`

`pnpm test:e2e`

`env -u NEXT_PUBLIC_HUB_URL pnpm test:admin`

Retain the existing accessibility checks at 1440px and 390px, and ensure photo protection continues to pass.

Each phase should end in a working, reviewable commit. Do not leave the main branch with an incomplete replacement for the existing homepage.

---

## 11. Acceptance criteria

The experience is successful when all of the following are true.

### Creative quality

- The opening feels like crossing into a distinct photographic world.
- The experience has a recognizable visual identity independent of generic dark-mode portfolio conventions.
- Transitions preserve spatial or visual continuity between scenes.
- The photography remains the dominant attraction.
- Motion reveals something meaningful about the photograph, the process, or the space.
- The sequence feels intentional rather than like a collection of animation demos.

### Demonstration

- Visitors encounter strong examples of Jerry's work before they encounter long descriptions.
- The range of photographic subjects is immediately apparent.
- The booking and preparation process is understandable.
- Visitors see how editing transforms an image.
- The delivery chapter demonstrates a real or accurately represented gallery experience.
- The conclusion communicates the value of the finished photographs.

### Usability

- Visitors can skip the experience at any point.
- Pricing and booking destinations are easy to reach.
- Portfolio categories are genuine, working links.
- The page remains useful on mobile and with reduced motion.
- The conventional site remains available to visitors who want direct navigation.

### Technical quality

- Existing tests continue to pass.
- No image-protection regressions are introduced.
- No-JavaScript rendering remains complete.
- Reduced motion removes the immersive motion without removing content.
- Scroll behavior is stable under fast scrolling and viewport resizing.
- Performance is verified rather than assumed.

---

## 12. Final creative direction

Do not treat this document as a checklist of effects to implement literally.

The aperture, viewfinder, contact sheet, darkroom, floating prints, and gallery are creative ingredients. The goal is not to include every ingredient. The goal is to make them work together as one experience.

If an elaborate animation competes with a photograph, simplify it.

If a transition feels disconnected, redesign the transition rather than adding more effects.

If a visitor needs to read a paragraph to understand something that could be shown, show it.

If an interaction makes the real booking process harder to understand, remove the interaction.

If the site looks impressive but does not make someone want to see more of Jerry's work or book him, it has failed.

**The visitor should leave feeling that they have experienced a photographer's world, witnessed how a moment becomes an image, and discovered how to make that process their own.**