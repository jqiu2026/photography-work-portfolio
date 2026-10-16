# 07. Naming brainstorm for the UI package

> **2026-10-12: owner suggestion and default: "Halation UI"** (the glow that spreads around bright light in film; fits the Flow / light-streak motion language). Candidates below are history unless a conflict forces a change. Availability not checked (npm, GitHub, domain, trademark): the owner does that.

**Current placeholder: `@halation/ui` / `Halation` / `--hl-*`.** One config file and `pnpm rename` swap it later.

Availability below is for the *unscoped* npm name `<word>-ui` as of the check on 2026-10-12 (a 404 from `npm view` means the name is currently unused). A scoped name (`@word/ui`) needs the npm org `word` to be free; **not checked**. GitHub org/repo, domain, and trademark availability are also unchecked. Do a proper search before committing.

| Name | Idea | `<name>-ui` on npm |
|---|---|---|
| **Halide** | Silver halide, the light-sensitive crystals in film | free |
| **Penumbra** | The soft edge of a shadow; gentle, atmospheric | free |
| **Gamut** | Range of colors a device can show | free |
| **Kelvin** | Color temperature of light | free |
| **Focal** | Focal length; short and crisp | free |
| **Emulsion** | The light-sensitive layer of film | free |
| **Solstice** | Peak light; evokes golden hour | free |
| **Shutterline** | Shutter + design line | free |
| **Bokeh** | Soft out-of-focus blur; recognizable, a bit common | free |
| Lumen | Unit of light | taken |
| Aperture | The lens opening (also an old Apple app name) | taken |
| Vesper | Evening light | taken |
| Luma | Brightness channel | taken |

More ideas to check: **Exposure**, **Parallax**, **Daylight**, **Gelatin**, **Contact** (contact sheet), **Darkroom**, **Reticle**, **Iris**, **Prism**, **Monochrome**, **Grain**, **Tessar** (a lens design), **Rangefinder**, **Fixer**, **Latent** (latent image), **Vignette**.

## Planner's shortlist

1. **Halide** (note: "Halide" is also a well-known iPhone camera app, which may cause confusion/trademark friction)
2. **Penumbra** (distinctive, elegant, fits "soft, futuristic")
3. **Kelvin** (short, techy, easy to type; check conflicts with other "Kelvin" projects)
4. **Latent** (short, mysterious, design-y; check `latent-ui`)

Pick criteria: pronounceable, short, `@name/ui` org free on npm, `name` free on GitHub, a domain like `name-ui.dev` available, no conflicting trademark in software/photography.
