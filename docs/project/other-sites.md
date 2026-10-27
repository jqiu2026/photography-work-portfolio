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

- Journal, involvement, aircraft, and a map of past flights. Privacy default (Q43): month precision, airport level, published 7+ days after landing, never live. The owner has said logging tail numbers is acceptable if wanted; keep the default until they choose.
- The newer plan (tools plus text timeline: METAR/TAF, weight and balance, crosswind, density altitude, trip planner) is the owner's second plan; Q60 records that the stricter privacy default wins until resolved. Not a navigation tool: every tool carries a learning-only notice. A hidden CFI slot stays off by default (Q36, Q49).

## Make (make.jerryqiu.com, `apps/make`, port 3005)

- Placeholder page. Planned: a curated showcase of 3 to 5 projects with write-ups and demos and a Now log; workshop vocabulary (Bench, Shelf, Scrap bin, Tool wall) as a styling layer that never hides content; screenshots checked for secrets and member data; first name or handle only. Open: which projects (Q59).
