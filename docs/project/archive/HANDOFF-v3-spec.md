# Handoff: the old UI kit v3 library, then photo.jerryqiu.com

State (2026-10-15): owner stopped the hub rebuild and asked for the the old UI kit library first.

DONE
- Spec: docs/project/18-design-prompt-v3.md (rev. 3).
- Library code: packages/ui/src/v3 (components, Runtime, Dissolve, StickyStory/HScroller, header/footer chrome, tier logic + tests), styles in packages/ui/src/styles/v3.css (imported by index.css), export the old UI kit.
- Live view: apps/docs route /library. Run `cd apps/docs && PORT=3010 pnpm dev` then open http://localhost:3010/library (port 3001 on this machine is a different project). Controls in its top bar: accent (hub/photo/music), motion tier (static/reduced/full), theme.
- Parked (NOT applied): the hub home rebuild and the v3 SiteShell are saved in (an earlier brief, removed)/ (patch + files). Apps are back to their previous code.

WAITING ON THE OWNER: green light that the library looks right. Do not start the photo site before that.

NEXT (after green light): rebuild photo.jerryqiu.com (apps/photos) per section 3 of the spec, then book/studio/client features per docs 04/13. Use the library components. Placeholders for keys (Stripe, Resend, ShootProof, e-sign) as TODO(owner) + QUESTIONS.md; never live calls. Commit small, no trailers, no push.
