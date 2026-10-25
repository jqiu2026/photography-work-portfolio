# Selling the UI package: checklist (owner steps; Claude only prepares)

Nothing here has been done. Status: **prepared, not published, not for sale.** Name default: Halation UI (Q33). Licence: commercial / source-available (owner decision 2026-10-23, Q32); open core is the fallback. See [redesign-brief.md](redesign-brief.md) section 7 and [PUBLISHING.md](PUBLISHING.md).

## 1. Decide
- [ ] Name confirmed (Halation UI by default). Search: npm (`halation-ui`, `@halation/ui` were free on 2026-10-12; unscoped `halation` is an unrelated project), GitHub org/repo, a domain, USPTO/WIPO trademark search in software and photography classes. Claude has not done trademark checks.
- [x] Licence model chosen 2026-10-23: **C source-available / commercial** (A and B dropped). Pick, then replace the draft in `packages/ui` (`LICENSE`, `LICENSE-COMMERCIAL.draft.md` when R7 adds it).
- [ ] Copyright holder and legal entity (individual or company) written into `LICENSE`, `package.json` (`author`, `repository`, `homepage`, `bugs`), the docs footer.
- [ ] Price points and tiers (single developer, team, agency; updates for 12 months). Not decided by Claude.

## 2. Legal
- [ ] Have a lawyer review the licence, EULA, refund policy and terms of sale (drafts are marked `TODO(owner): have a lawyer review`).
- [ ] Sales tax/VAT: use a merchant of record (e.g. Lemon Squeezy, Paddle, Gumroad) or register yourself; the choice and the account are yours.
- [ ] Privacy notice for the sales/support channel and the docs site (the docs site must stay cookieless).
- [ ] Third-party licences: `pnpm` script `node scripts/licenses.mjs` fails on copyleft; `THIRD_PARTY_LICENSES.md` lists every dependency. Fonts are SIL OFL 1.1 (Anybody, Hanken Grotesk, Newsreader, Martian Mono): the OFL allows bundling in software that is sold, but fonts may not be sold on their own, licence texts and copyright lines must ship with the package, and modified fonts must be renamed. **Verify each family's `OFL.txt` before release** (not yet confirmed per family).
- [ ] Headless primitives (Radix Primitives, MIT) are a disclosed dependency (Q40); keep their licence notices.
- [ ] Trademark use: do not use "Once UI", "Radix", "shadcn", "Tailwind", "Apple" or "Stripe" in marketing as if affiliated. The comparison page may name them factually.

## 3. Content hygiene
- [ ] No personal photographs, names, emails or school content in the package or the demo site (docs use generated imagery from `scripts/make-demo-images.mjs`).
- [ ] No fake claims (downloads, customers, testimonials). Benchmarks only with the method published.
- [ ] Clean public repo or `git subtree split` of `packages/ui` so personal history is not exposed.

## 4. Product readiness
- [ ] Docs site complete: every export has a page and demo (enforced by `apps/docs/test/coverage.test.ts`); a quick start; a "tiers and fallbacks" guide; an accessibility statement with honest gaps; the comparison page.
- [ ] Demo site: hosted separately from the personal sites, labelled as a demo, mocks clearly marked.
- [ ] Versioning and changelog (changesets), support policy (response time, supported React/Next versions), security contact, upgrade guide.
- [ ] Tests green in CI: unit, a11y, e2e, tier selection, `scripts/test-example.sh`.
- [ ] Packaging check: `pnpm pack --dry-run` includes only `dist`, README, LICENSE, `package.json`; subpath exports work from a clean Vite and a clean Next app.

## 5. Selling channel (owner accounts; Claude creates none)
- [ ] Choose: npm (public core) plus a private registry or licence-key download for Stage; or a storefront with downloads.
- [ ] Licence delivery and licence-key validation approach (none is built; if you want one it is Phase 3 work).
- [ ] Terms of sale, refund policy, support email, receipts.
- [ ] Analytics: privacy-friendly only.

## 6. Launch
- [ ] Publish steps in [PUBLISHING.md](PUBLISHING.md) (`npm login` with 2FA is the step that goes public).
- [ ] Announce only after the owner's checks above. Never claim anything this checklist has not verified.
