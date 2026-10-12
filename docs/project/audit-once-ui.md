# Audit: Once UI in the current site

Written at M2 from the code in `apps/web` (pinned to `@once-ui-system/core` 1.5.6). Decision for each item: **port** (reimplement in our UI package), **redesign**, or **drop**.

## Once UI components in use (import counts across `src`)

| Component | Where | Decision |
|---|---|---|
| `Column`, `Row`, `Flex`, `Grid` | everywhere | Replace with `Stack`/`Row`/`Grid`/`Container` in `@placeholder/ui` |
| `Text`, `Heading` | everywhere | Port (`Text`, `Heading`, fluid scale) |
| `Button`, `IconButton`, `ToggleButton` | header, forms, share | Port (`Button`, `IconButton`) |
| `SmartLink` | content, footer | Port (`Link`) |
| `Media` | work, blog, about | Redesign into `media/Image` |
| `MasonryGrid` | gallery | Redesign into `media/Gallery` + `Lightbox` |
| `RevealFx`, `Fade`, `TypeFx`, `Background` | layout, home | Drop; replaced by motion package (`RevealText`, `InView`, hero) |
| `Avatar`, `Card`, `Line`, `List/ListItem`, `Spinner` | about, cards | Port (`Avatar`, `Card`, `Separator`, `Prose`, `Spinner`) |
| `Input`, `PasswordInput`, `Toast` | Mailchimp, RouteGuard | Port (`Input`, `Toast`) |
| `Meta`, `Schema` | page metadata, JSON-LD | Replace with Next metadata helpers + our `Person` JSON-LD (in `apps/web/src/lib/seo`) |
| `Theme`/`ThemeToggle`/`ScrollToTop` | providers | Port (`ThemeProvider`, `ThemeToggle`) |

## Tokens
- `src/resources/once-ui.config.ts`: dark default, neutral gray, brand cyan, accent red, Geist for all four font roles, effects (gradient, dots, grid, lines mask). **All dropped.** New tokens (`--ph-*`) come from the design exploration, not from these values.
- `src/resources/custom.css`: only comments. Dropped.

## Pages and content sources
| Route | Source | Decision |
|---|---|---|
| `/` | `content.tsx` `home` + latest posts/projects | Redesign: profile-forward hub home (M6) |
| `/about` | `content.tsx` `about` (intro, work, studies, technical skills) | Redesign as profile timeline; **reuse the real copy** (Monroe YABC TA role, Stuyvesant, skills list: Adobe CC, Part 107 drone pilot, graphic design, social media, Python/Lua/Java). Placeholders stay `TODO(owner)`: college name, role text. |
| `/work`, `/work/[slug]` | MDX in `app/work/projects` (5 projects: Maker Faire, Stuy Open House, Stuy SING, StuyPA CNY dinner, IWD run). Most bodies are "TBA". | Port; hide "TBA" sections in production |
| `/blog`, `/blog/[slug]` | MDX in `app/blog/posts` (2 posts) | Move to `/writing` with `/blog` redirect |
| `/gallery` | static list in `content.tsx` (23 photos in `public/images/gallery`) | Move to `apps/photos` portfolio; hub `/gallery` redirects |
| `/api/rss` | blog posts | Keep (`/writing` feed) |
| `/api/og/generate`, `/fetch`, `/proxy` | OG image generation | Keep generate; drop fetch/proxy unless needed (SSRF surface; review) |
| `/api/authenticate`, `/api/check-auth`, `RouteGuard` | env password for one protected project | Keep the mechanism, port to the new UI; replaced by real auth in Phase 2 |
| `robots.ts`, `sitemap.ts`, `not-found.tsx` | | Port, make host-aware, add links/search to 404 |
| `Mailchimp.tsx` (newsletter, `display: false`) | | Drop for now (third-party form, off today) |

## Social links found in `content.tsx` (real, reuse)
LinkedIn `https://www.linkedin.com/in/jqiu2026/`, Instagram `https://ig.jerryqiu.com`, YouTube `https://www.youtube.com/@jqiu2026`, email `hello@jerryqiu.com`. Also `bookings@jerryqiu.com` (calendar link on About). Managed Instagram accounts and the Roblox Shipping Lanes wiki are listed in the skills section.

## Real facts available (A30)
Name, location (America/New_York), languages (English, Mandarin Chinese, French), Stuyvesant HS (class of June 2026), planned B.S. Aerospace Engineering (college `[TBD]`), Monroe YABC drone class TA (Feb-Jun 2025), Part 107 certified drone pilot, FPV exploring, StuyAviators Instagram management since Apr 2024. Everything else is `TODO(owner):`.

## Other findings
- Layout wraps every page in Once UI `Background`/`RevealFx` effects and a client-side `RouteGuard` that 404s any route not in config. The new layout has no such guard (route existence is Next's job).
- `next.config.mjs` allows several remote image hosts (cloudfront, nordangliaeducation, instagram, ytimg) used by OG proxy; revisit when dropping the proxy.
- Photos total 84 MB in `public/` (original JPEGs, some PNGs in projects). Optimization script comes in M4/M7.
