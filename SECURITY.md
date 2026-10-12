# Security policy

## Reporting a vulnerability

Please do not open a public issue. Email TODO(owner): security contact (also published at `/.well-known/security.txt` on the live site) with steps to reproduce. You will get a reply within a few days.

## Scope and honesty

- The UI package ships no network code besides lazy `ogl` and click-to-load embeds.
- Image "protection" in this project (right-click and drag blocking, screenshot-key warnings, watermarks) is a deterrent. It cannot stop screenshots or photos of a screen. Real protection is not exposing originals at all (see `docs/project/05-security-and-image-protection.md`).
- Secrets must never be committed. Use `.env.local`.
