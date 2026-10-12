# 10. Design brief

## Priorities, in order

1. **Professional and elegant.** Looks like it was made by a good design studio. Restraint over decoration.
2. **Modern, minimalist, sleek.** Generous whitespace, few elements per screen, large confident type, hairline details, soft depth.
3. **Intuitive.** Obvious structure and familiar patterns. Nothing to learn.
4. **Legal.** The legal and trust surface is designed, not bolted on (see [11](11-legal-and-compliance.md)).
5. **A little futuristic, with cinematic moments.** Apple-style scroll choreography, used sparingly and always purposeful.

If two goals conflict, the higher one wins. When in doubt, remove something.

## Reference direction: Squarespace-grade polish

The owner admires the look of Squarespace sites. Study (browse, read, take notes; never copy assets, text or exact layouts):

- Squarespace's own marketing site and its public template gallery, especially portfolio, photography and personal-brand templates.
- What makes them feel premium: editorial typography, large imagery with a lot of air, consistent vertical rhythm, a very quiet header, slow elegant hover states, full-bleed image sections alternating with narrow text columns, small tasteful captions, restrained color.
- Apple product pages for the **motion** layer: pinned scenes, scroll-scrubbed sequences, big type reveals.

Write what you learned (patterns, not pixels) in `docs/project/design-language.md`.

## NOT the StuyAviators site

The owner showed stuyaviators.vercel.app only as an example of the kind of site they can build. **This site must be visibly its own thing.** Concretely:

- **Different identity:** palette, typeface, logo treatment, iconography, corner radii, shadow style, button shape, nav layout and footer structure are all newly designed. No aviation metaphors, no boarding-pass cards, no departure boards, no sky imagery, no "waypoints".
- **Different layout language:** that site is bright, blue-accented and card-heavy. This one is quieter and more editorial: large type, big images, text columns with generous margins, minimal chrome.
- **Different motion choreography:** reuse the *techniques* (pinned scenes, parallax, reveal) with new timing, easing and purpose. Do not reuse its scene scripts or copy.
- **What may be reused:** engineering (auth, DB, upload, admin patterns, rate limiting, test setup) and the *structure* of a token system. See [09](09-reference-stuyaviators.md).
- Final check before Phase 1 acceptance: put screenshots of both sites' home pages side by side. If someone could mistake one for the other, redesign.

## Design exploration step (Phase 1, before building pages)

The owner is away, so decide, but decide with evidence:

1. Build a dev-only `/_design` page in `apps/web` with **three** directions for the home hero, type pairing and palette, each as a real rendered screen (light and dark): e.g. A "Gallery white" (warm off-white, high-contrast serif display + clean sans), B "Midnight cinema" (near-black, one cool accent, large grotesk), C "Soft neutral" (stone/greige, understated serif + mono details).
2. Score each against the priorities above (and check AA contrast, loading weight). Pick one, record the reasoning in `design-language.md`, log it as Q3 in [QUESTIONS.md](QUESTIONS.md) with the alternates preserved as theme presets so the owner can switch by changing one token file.
3. Every choice (fonts, images) must have a license that allows the use: prefer SIL OFL fonts via `next/font`, own photos for imagery.

## Design system requirements

- **Color:** neutral scale with warm or cool bias chosen in exploration, one restrained accent, semantic colors, light and dark, plus a pure-black "cinema" surface for galleries. AA contrast.
- **Type:** at most two families (a display face with character, and a highly legible text sans, optionally a mono for details). Fluid scale; tight tracking on large sizes; consistent measure (60-75ch) for reading.
- **Layout:** 12-column grid, a few container widths, strong vertical rhythm on a 4/8 px base, full-bleed image utilities, consistent section spacing.
- **Components:** quiet. Underline links, ghost and solid buttons with subtle press states, hairline borders, soft shadows, optional glass header. Hover states are slow and graceful (200-400 ms).
- **Motion tokens:** one signature easing curve and one spring, shared durations, `prefers-reduced-motion` always honored, and a global switch to tone motion down.
- **Imagery:** treat photos as the hero: correct color, no heavy filters or overlays on images, captions in small type.

## Information architecture: a family of sites

One design system, one person, several rooms. Each is a separate hostname (see [01](01-decisions-and-assumptions.md) A2, A33).

```
jerryqiu.com            THE HUB ("ME")
  /                     Profile-forward home: profile header, short intro, "now", selected work,
                        preview cards for Photography / Music / Flying, latest writing
  /about                Longer story, timeline (work, school, leadership, flying, music),
                        education, skills & interests, resume/CV
  /work, /work/[slug]   Everything built or made, filterable by type
  /writing, /writing/[slug]   Blog (keep /blog as a redirect)
  /connect              All social accounts + contact form + email (keep /contact as redirect)
  /privacy /terms /accessibility /licensing   Legal, canonical here (see 11)

photos.jerryqiu.com     PHOTOGRAPHY (apps/photos)
  /                     Cinematic portfolio home, categories
  /portfolio/[slug]     Curated galleries with lightbox
  /about                About the photographer
  /book                 Booking/inquiry (Phase 1: form + mailto; Phase 3: full booking + deposit)
  /client               Client galleries login (placeholder in Phase 1-2 linking to ShootProof)
  /studio               Owner admin (Phase 2 shell, Phase 3 full)

music.jerryqiu.com      MUSIC
  /                     Hero, story, instruments, featured recordings
  /listen               Recordings and performances (click-to-load embeds)
  /performances         Dates, venues, ensembles
  /about                Background, repertoire

flying.jerryqiu.com     FLYING
  /                     Hero, the journey in plain terms
  /log                  Milestones and memorable flights with photos
  /aircraft             Aircraft flown
  /about                Ratings and background, StuyAviators connection
```

**Site switcher:** every site has a quiet header control (the "Jerry Qiu" wordmark with a small chevron) that lists all sites with a one-line description, and a footer "More from me" row. This is how the family stays navigable and feels like one thing. Registry and links come from `packages/sites`.

**Hub nav:** Work, Writing, About, a **Sites** group (Photos, Music, Flying), and a **Connect** button. Each sub-site has its own simple nav (3-5 links) in the same header component. Keep old URLs working with redirects (`/blog` -> `/writing`, `/gallery` -> photos site, `/contact` -> `/connect`).

**Identity per site:** each site chooses a theme preset (accent, hero treatment, sometimes display type) from the same design system. Photos: neutral cinema black/white and the images do the talking. Music: warmer, more textural. Flying: cooler, airy, precise. Presets are subtle; layout, components, motion language and legal pages are shared. Do **not** reuse StuyAviators' sky/aviation visual identity for Flying; it is Jerry's own flying story, designed fresh.

### The profile idea ("LinkedIn, but not LinkedIn")

The home page and `/about` borrow what makes a good professional profile useful, and none of LinkedIn's chrome, feed, branding, blue, or layout. Do not imitate LinkedIn's look.

- **Profile header:** portrait, name, one-line headline, location, a short "currently" line, and a row of **social/account links** (icons with labels, from CMS settings: e.g. LinkedIn, GitHub, Instagram, YouTube, Spotify/SoundCloud, email; verified with `rel="me"`). The same links appear in the footer and on `/connect`.
- **Sections that read like a profile but look like editorial design:** About (short), Experience & involvement (timeline of work, leadership, volunteering), Education, Projects, Skills & interests (as quiet tags), Currently / Now, and an optional "Kind words" strip (testimonials) only if the owner supplies real ones.
- **One profile, many facets:** photography, music and flying are their own sites (subdomains) and each gets a compact preview card on the home page (a photo, one sentence, a link out). They sit beside work and writing as equals.
- **Structured data:** `Person` JSON-LD with `sameAs` for the social accounts, so search engines connect the profiles.
- **CV:** downloadable PDF resume generated from the same timeline data (Phase 2), plus a print stylesheet.

### Site specifics (build the structure; the owner supplies the facts)

- **Music (`music.jerryqiu.com`):** what he plays, a short story, featured recordings and performances (cards with date, venue/ensemble, note), click-to-load embeds (Spotify, SoundCloud, YouTube, Bandcamp; no third-party scripts load until clicked, for privacy and speed), optional audio player for self-hosted clips, repertoire list, upcoming performances if any. Photos/video from performances.
- **Flying (`flying.jerryqiu.com`):** the journey in plain terms: how it started, certificates and ratings, aircraft flown, a few memorable flights with photos from the cockpit, involvement with the StuyAviators club, safety-minded tone. **Never invent facts**: hours, ratings, dates and aircraft are `TODO(owner):` placeholders until supplied (shown as clearly fake sample values only in dev, never in production builds; production hides empty fields). Do not publish real-time location, tail numbers or exact times of flights.
- **Photography (`photos.jerryqiu.com`):** curated portfolio, then booking and client galleries (Phase 3). The hub only previews it.
- Music and Flying share one **interest-site template** (hero, intro, highlights, timeline, media) so they stay consistent and the CMS stays simple.

### Tone and copy guide (non-boastful)

- First person, plain sentences, specific details over adjectives. "I started flying in 2024 and have flown X" beats "I'm a passionate aviator".
- No superlatives or self-promotion words. Credit teams, teachers and collaborators by name.
- State accomplishments once, with context, in the timeline, not repeated as banners or badges.
- Curious and warm, a little dry humor allowed. Avoid corporate jargon and buzzwords.
- Sample copy written by Claude is **placeholder**: mark with `TODO(owner): rewrite in your voice`. Never fabricate biography, credentials, awards, hours, or quotes.

## UX heuristics checklist (run at M8)

Clear current-location indicator; consistent patterns; visible keyboard focus; forms with inline, human error messages; 44 px touch targets; no horizontal scroll at 320 px; fast perceived loading (blur-up, skeletons); no dead ends; 404 with search and links home; every page has a purpose and one primary action.
