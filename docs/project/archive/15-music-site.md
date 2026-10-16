# 15. Music site (music.jerryqiu.com)

Merged 2026-10-15 from the owner's separate plan. Phase tags: P1 launch, P2 next, P3 later, OPT optional. Mocked first (score store, cart and delivery mocks exist in `@jerryqiu/mocks`, Q47). Real payments, tax and delivery are Phase 3 work and need the owner.

## 1. Stack and cost
- Own Vercel project under the same Pro team (selling sheet music is commercial, so not Hobby). Adds well under $1/month of its own.
- Vercel Blob for audio, scores and images (about 2 GB, an estimate; NOT VERIFIED price of $0.023/GB-month).
- Neon Postgres free tier for pieces, products, orders, licenses. Stripe Checkout for payment; Resend for receipts and download links.
- Stripe's fee falls on small sales (2.9% + 30 cents is about 9% on $5; rates NOT VERIFIED), so use price floors and a cart. Fees are passed to buyers (Q56).
- Video: embed (YouTube or Vimeo, one more vendor) or self-host from Blob. Open.

## 2. Catalog
- P1 Piece page: title, year, instrumentation, duration, difficulty, program notes, score preview, audio or video, buy link.
- P1 Filters (choral, piano, violin, guitar, ensembles; original vs arrangement), sort, search.
- P2 Featured and related pieces; collections and sets; lyrics and translations.
- P3 Premiere and performance history; version history.

## 3. Listening
- P1 Player on each piece, persistent across pages; recordings tagged by type (own pieces by you, own pieces by others, your performances of others' works); performer credits.
- P2 Playlists, queue, score-following view, share links with preview cards, embeddable player.
- P3 Free audio downloads; concert calendar.
- Playing music appears only when a performance recording exists, separate from score preview and purchase (Phase 2.5 rule).

## 4. Sheet music store
- P1 PDF score and parts (sold separately or bundled); personal license; instant download plus email; time-limited links with a download limit; watermark with buyer name, date and copies; cart; price floors; free first-page preview; tax calculated at checkout only (Q52).
- P1 Buyer account (password or magic link, Q53) with order history and re-downloads.
- P2 MusicXML, MIDI, native notation files, backing audio, bundles; ensemble and studio licenses; license PDF per order; per-page license key on choir editions; update emails for revised editions; discount codes; commission inquiry.
- OPT Transposed editions; interactive downloads; print-on-demand (not researched).

## 5. Rights
- P1 Rights type on every piece: original, public-domain arrangement, or arrangement of a copyrighted work. The store button is disabled for the third type until a license is on file.
- P1 Copyright notice on every score and piece page; buyer license terms page matching the watermark.
- P2 License record per piece; performer release before posting someone else's recording; public-domain checklist per piece (edition may be copyrighted).
- A mechanical license covers audio, not printing sheet music. Arrangements of popular songs need a print or arrangement license. Posting your own performance of a copyrighted piece may need separate permission: not researched. Not legal advice; see [11](11-legal-and-compliance.md).

## 6. About and contact
- P1 About, credentials, CV (PDF), selected projects, contact form (Resend).
- P2 Commission page, press kit, news, newsletter (own stream, one-click unsubscribe), testimonials with permission.
- Instrument and repertoire claims stay out until the owner supplies facts (Q42).

## 7. Site-wide and back office
- P1 Mobile-first, shared branding with the hub, SEO basics, share cards, accessibility (player keyboard control, captions), legal pages, privacy-friendly analytics (Vercel Web Analytics price NOT VERIFIED).
- P1 Admin for the owner only: piece and product editors, orders list with resend, refunds in Stripe that revoke links.
- P2 Sales reports, expense CSV (shared books with photography if wanted), draft and publish, version manager.
- P3 Bulk upload, backup export, second language.

## 8. Build order and open questions
1. Catalog, piece pages with audio, About, contact. 2. PDF store with checkout, downloads, watermark, license PDF. 3. More file types, bundles, ensemble licenses, codes. 4. Performances, playlists, video. 5. Commissions, newsletter, press kit, collections.

Open: video delivery; originals and public domain only, or copyrighted arrangements too; refunds (final or windowed); shared Stripe account and expenses with photography; marketplace listing; printed copies or digital only.
