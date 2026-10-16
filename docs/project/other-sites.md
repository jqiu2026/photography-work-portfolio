# Other sites: music, flying, make

Merged 2026-10-15 from the old docs 15, 16 and 17 (archived). **Not in the current scope**: do not build these until the owner says so. Rules that still hold are listed here so nothing is lost.

## Music (music.jerryqiu.com, `apps/music`, port 3003)

- Catalogue of compositions; **listen** only when a performance recording exists; **score preview and purchase** are separate from listening. Mock score store exists in `@jerryqiu/mocks` (labelled, off in production, Q47).
- Planned (P1): piece pages, filters, player, PDF score store with watermark and licence, buyer account, rights type per piece (store button disabled for arrangements of copyrighted works until a licence is on file), admin. P2: more file types, bundles, ensemble licences, commissions, newsletter. Prices are placeholders (Q61); Stripe fees passed to buyers (Q56).
- Claim no instrument or repertoire until the owner supplies facts (Q42). Own Vercel project; Blob for files; Neon free tier.

## Flying (flying.jerryqiu.com, `apps/flying`, port 3004)

- Journal, involvement, aircraft, and a map of past flights. Privacy default (Q43): month precision, airport level, published 7+ days after landing, never live. The owner has said logging tail numbers is acceptable if wanted; keep the default until they choose.
- The newer plan (tools plus text timeline: METAR/TAF, weight and balance, crosswind, density altitude, trip planner) is the owner's second plan; Q60 records that the stricter privacy default wins until resolved. Not a navigation tool: every tool carries a learning-only notice. A hidden CFI slot stays off by default (Q36, Q49).

## Make (make.jerryqiu.com, `apps/make`, port 3005)

- Placeholder page. Planned: a curated showcase of 3 to 5 projects with write-ups and demos and a Now log; workshop vocabulary (Bench, Shelf, Scrap bin, Tool wall) as a styling layer that never hides content; screenshots checked for secrets and member data; first name or handle only. Open: which projects (Q59).
