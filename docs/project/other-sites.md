# Other sites: music, flying, make

Merged 2026-10-15 from the old docs 15, 16 and 17 (archived). Music was built on the owner's request (Q125); flying and make are **not in the current scope**: do not build them until the owner says so. Rules that still hold are listed here so nothing is lost.

## Music (music.jerryqiu.com, `apps/music`, port 3003)

**Built 2026-10-27 (branch `claude/music-site`, Q125 to Q135).** What exists: [PROGRESS.md](PROGRESS.md) "Music site".

- Catalog of compositions with filters (instrument, style, difficulty, for sale, has a recording) and search; **listen** only when a recording exists (click-to-play embeds: YouTube, Spotify, SoundCloud, Bandcamp; nothing loads from the provider until play is pressed); **score preview and purchase** are separate from listening.
- Store: score files (PDF, MIDI, MusicXML, audio, ZIP) kept private; free preview of the first pages (marked PREVIEW, the rest never leaves the server); products are a score at a license tier (personal, ensemble, institution) at a price; bundles; cart; checkout with Stripe (labeled MOCK page in development and previews); receipt email with an order link; buyer library with a one-time sign-in link (no password); every downloaded PDF is stamped per buyer (name and license number on each page, license page at the end), a download cap per license (default 10), refunds end the license.
- Rights type per piece: original, arrangement of a public-domain work, arrangement of a copyrighted work. A copyrighted arrangement is not for sale until "license on file" is ticked (`@jerryqiu/scores` `canSell`, checked in the catalog, on the piece page and when the order is made).
- Commissions (inquiry form, studio list with statuses), newsletter with double opt-in and a send form in the studio, studio at `/studio` (pieces, files, products, bundles, recordings and performances, orders with refunds, commissions, newsletter, reports on the overview).
- Prices are placeholders (Q61); Stripe's fee is passed to the buyer as its own line (Q56); license wording is a draft for a lawyer (Q129). Claim no instrument or repertoire until the owner supplies facts (Q42). Own Vercel project; Blob for files; Neon free tier.
- Not built: uploaded audio files played on the site (recordings are embeds), site search across pages, buyer-set passwords, multi-currency, tax. Each is a documented default in QUESTIONS.md.

## Flying (flying.jerryqiu.com, `apps/flying`, port 3004)

**Built 2026-10-27 (branch `claude/other-sites`, Q136 to Q142).** On Holominimal, like photo and music.

- Journal and involvement (log entries, certificates, club, aircraft flown and photographed) come from the hub admin as before; the **map and the flight list** come from the flying studio (`/studio`): airports (code, name, coordinates) and past flights (from, to, the day it landed, aircraft TYPE, a note).
- Privacy (Q43, enforced in `@jerryqiu/aviation` `publishable` and `packages/db/src/flying.ts`, not in the UI): airport level only, month precision (the day is never sent to the browser), published at least 7 full days after landing, never live, and no tail numbers: there is no field for a registration, and a registration-like text in a type or note is refused.
- **Tools** (`/tools`, all client-side, each with the learning-only notice): crosswind and headwind for a runway and a wind (with gusts and the pilot's own limit); pressure and density altitude; a METAR and TAF decoder (paste a report, or look one up: NOAA Aviation Weather Center in a production build, labeled SAMPLE data in development, `FLYING_WEATHER=live|off` to override); a leg-by-leg trip estimate (wind triangle, ground speed, time, fuel with a 30, 45 or 60 minute reserve); weight and balance against an envelope the visitor types in (SAMPLE numbers only until they replace them). The maths is in `packages/aviation` with 47 tests.
- A hidden instruction page (Q36) stays off unless the setting `flying.instruction.enabled` or `FLYING_INSTRUCTION=on` is set.
- Not built: a navigation or flight-planning product, airspace, terrain, NOTAMs, a CFI booking flow, an airport database (the owner types the airports they have used).

## Make (make.jerryqiu.com, `apps/make`, port 3005)

**Built 2026-10-27 (same branch, Q143 to Q146).** On Holominimal.

- A curated showcase: at most 5 published projects (the studio refuses a sixth), each with a Markdown write-up (no raw HTML, https links only), tools, links (demo, source, write-up), my part, and what I learned.
- **Screenshots are checked before they show**: an upload is re-encoded (width 1800 at most, all metadata removed) and kept hidden until someone describes it and ticks "checked: no secrets or private data". The public image route returns 404 for anything unchecked. First name or handle only for other people (a note in the studio form).
- The workshop words (Bench: building now, Shelf: finished and working, Scrap bin: stopped, with what I learned, Tool wall: the tools used) are a naming and texture layer: every one is shown next to its plain meaning and carries a title, and nothing is hidden behind the metaphor.
- A "now" log, shown on the home page, `/now` and the project it belongs to; studio at `/studio`.
- Which projects to publish is the owner's call (Q59): only labeled SAMPLE demo data exists in development.

## Hub (jerryqiu.com, `apps/web`)

**Public site moved to Holominimal 2026-10-27 (Q147).** Home (name, roles, a few photographs, what I do, the four rooms, writing, say hello), about (profile, timeline, skills from the CMS), connect (links, email, a contact form that posts to the inbox), writing (CMS posts and the repository MDX posts), the four legal pages (CMS text replaces the draft) and a 404, with the same CMS content, redirects, RSS and navigation settings as before. The admin (`/admin`) is unchanged and still uses the old UI kit. The hub is the one place that lists the other rooms (cross-site rule).

**Home is the Nexus (2026-10-27, owner request, Q170 to Q176).** The first screen is a painted portal hub on one canvas behind the page (smooth light and gradients; no pixel look, owner 2026-10-27): a stone platform in a void under aurora, a core crystal in a column of light, and four block-framed portals on a ring, one per site, each showing its world live inside. The ring turns with the arrow keys, the gate buttons or a click; stepping through dives into the world full screen (Exposure: daylight terraces, photography; Resonance: the violet void where pillars light up like an equalizer, music; Altitude: above the cloud sea, flying; Forge: the lava cavern and the anvil, make), with a link on to the site and Back to the Nexus (Escape, the back button). `/#forge` and friends open a world directly; inside a world, ← and → (or the neighbour buttons) hop straight to the next world through a portal. Look around hides the panel to see a world clean; a key, a click or Show the panel brings it back. On touch screens a sideways swipe turns the ring or hops. Pointing at a portal names it. Ambient sound is generated in the browser and off until asked for. Code: `apps/web/src/components/home/Nexus.tsx` and `home/nexus/` (`paint.ts` the worlds, `hub.ts` the Nexus, `realms.ts` names and colours, `sound.ts`, `nexus.css`). The old "Four rooms" cards are gone (the portals replace them); the rest of the home page scrolls over the Nexus as before.

