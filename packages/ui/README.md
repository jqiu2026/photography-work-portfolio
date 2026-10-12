# @halation/ui

A small, calm React UI kit: neutral design tokens, quiet accessible components, and an optional cinematic motion layer (scroll scenes, reveals, a WebGL glitch hero, image sequences) that always degrades to a complete static page. The name is a placeholder; see the repository's `scripts/rename.mjs`.

```bash
pnpm add @halation/ui
```

```tsx
import "@halation/ui/styles.css";
import { ThemeProvider, ThemeScript, Button } from "@halation/ui";

export default function App() {
  return (
    <ThemeProvider preset="hub">
      <Button>Hello</Button>
    </ThemeProvider>
  );
}
```

- **No Tailwind, no CSS-in-JS.** Plain CSS with `--hl-*` variables; themes switch on `[data-theme]` and `[data-preset]`.
- **Entry points:** `@halation/ui` (primitives), `/motion`, `/media`, `/webgl` (lazy, `ogl`), `/styles.css`, `/tokens`.
- **Accessible by default:** WCAG 2.2 AA target, keyboard use, reduced-motion fallbacks.
- 88 components, each with a docs page (live example, props, accessibility notes, when not to use).

Fonts are supplied by your app: set `--font-sans` and `--font-mono`. MIT licensed.
