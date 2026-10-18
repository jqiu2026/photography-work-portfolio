# @holominimal/ui

**Holominimal** (holographic + minimal) is a React design system for black, editorial interfaces: near-black surfaces separated by hairlines, white type with gray secondary text, restrained cyan, blue, violet and magenta light, and motion that explains rather than decorates.

- React 19 components with typed props. No runtime dependencies.
- One stylesheet with CSS custom properties (`--hm-*`). Theme any subtree.
- Works with the Next.js App Router. Server-compatible components carry no `"use client"`; interactive ones keep it per file.
- Reduced motion is respected everywhere and can be forced per theme.

## Install

```bash
pnpm add @holominimal/ui
```

Peer dependencies: `react` and `react-dom` 19 or later.

## Use

Import the stylesheet once at the root, then wrap the app in `Theme`:

```tsx
// app/layout.tsx (Next.js) or main.tsx (Vite)
import "@holominimal/ui/styles.css";
import { Theme } from "@holominimal/ui";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Theme theme={{ accent: "violet" }}>{children}</Theme>
      </body>
    </html>
  );
}
```

A dashboard page:

```tsx
import Link from "next/link";
import {
  AppShell, Dock, DockItem, LightField, Page, PageHeader, PageEyebrow, PageTitle,
  StatGroup, Stat, BarChart, Card, CardHeader, CardTitle, DataList, DataListItem,
} from "@holominimal/ui";

export default function Dashboard() {
  return (
    <LightField>
      <AppShell
        sidebar={
          <Dock aria-label="Studio sections">
            <DockItem asChild current><Link href="/">Dashboard</Link></DockItem>
            <DockItem asChild><Link href="/galleries">Galleries</Link></DockItem>
          </Dock>
        }
      >
        <Page>
          <PageHeader>
            <PageEyebrow>Overview</PageEyebrow>
            <PageTitle>Good evening</PageTitle>
          </PageHeader>
          <StatGroup>
            <Stat label="Revenue, 30 days" value="$14,755" detail="Up 12%" trend="up" />
          </StatGroup>
          <BarChart title="Revenue" caption="Last 30 days" data={days} format={{ style: "currency", currency: "USD" }} />
        </Page>
      </AppShell>
    </LightField>
  );
}
```

Render your router's links with `asChild` (on `DockItem`, `Button`, `Surface`, `PageTab`, `GalleryCard`, `DialogTrigger` and `DialogClose`). The library never imports a router.

## Theming

```tsx
<Theme
  theme={{
    scheme: "dark" | "dusk",          // dusk: dark, brighter, ~30% accent tint
    accent: "cyan" | "blue" | "violet" | "magenta" | "green" | "amber" | 0..360,
    light: 0..1.5,              // pointer light, iridescent edges, atmosphere
    surface: "holo" | "glass" | "matte",
    motion: "system" | "reduce" | "full",
    radius: 1,                  // corner scale
    vars: { "--hm-bg": "#030304" }, // any token
  }}
/>
```

Themes nest, so you can recolour one region. `themeStyle(config)` and `themeAttributes(config)` apply a theme to any element without the component. Every token is listed in `src/styles/tokens.css`, and `vars` gives typed references (`vars.color.muted`).

## Surfaces

`Surface` is the base of cards, panels and overlays. All five materials share one implementation:

| variant    | use                                                                            |
| ---------- | ------------------------------------------------------------------------------ |
| `section`  | default: a hairline above and room, no box (page sections)                     |
| `outlined` | a hairline box (side-by-side cards, quick actions, pricing)                    |
| `elevated` | near-black fill (menus, popovers, dialogs)                                     |
| `glass`    | translucent with blur and a lit top edge; solid where `backdrop-filter` is unsupported |
| `holo`     | glass with a thin iridescent edge and pointer light; one or two per view       |

Modifiers: `interactive` (hover lift), `lit` (pointer light), `selected` (iridescent edge), `tilt` (a few degrees of perspective). Pointer light needs a `LightField` ancestor, which uses one delegated listener for the whole region.

## The proximity dock

`Dock` is the signature sidebar. The current entry is the largest and brightest. Entries near a mouse pointer swell and brighten with a Gaussian falloff, distant ones recede, and every change is eased. Keyboard focus lifts the focused entry. Touch devices and reduced motion keep the hierarchy without the magnification. Below 860px it becomes a top strip that scrolls the current entry into view.

The behavior is also available on its own for any list:

```ts
import { createProximity, useProximity } from "@holominimal/ui";
useProximity(ref, { itemSelector: "a", axis: "x", reach: 80 });
```

The engine writes a CSS variable (`--hm-k`, 0 to 1) on each item and never sets React state, so pointer movement causes no re-renders.

## Motion

- Tokens: `--hm-ease-glide`, `--hm-ease-pour`, `--hm-dur-fast|base|slow|scene`, `--hm-stagger`, `--hm-rise`. Under reduced motion the durations become 1ms and the travel 0.
- `.hm-enter` (with `--hm-i` for stagger): fade and rise on mount.
- `Reveal` with `data-hm-reveal` children: reveal on scroll. Content stays visible without JavaScript.
- View transitions: `<ViewTransition enter="hm-in" exit="hm-out">` (React canary or Next.js), or `document.startViewTransition`.
- `AppShell entrance="curtain"`: a one-time arrival (the curtain lifts, the dock slides in, the page rises).

## Components

Foundations: `Theme`, `themeStyle`, `themeAttributes`, `vars`, `Slot`, `cx`.
Layout: `AppShell`, `Page`, `Atmosphere`, `Surface`, `LightField`, `Reveal`, plus the `.hm-grid`, `.hm-stack` and `.hm-cluster` classes.
Navigation: `Dock` (`DockItem`, `DockBrand`, `DockSubnav`, `DockSubItem`), `PageHeader` (`PageEyebrow`, `PageTitle`, `PageDescription`, `PageActions`, `PageTabs`, `PageTab`), `Tabs` (`TabList`, `Tab`, `TabPanel`), `Popover` (`PopoverTrigger`, `PopoverContent`), `Tooltip`, `DropdownMenu` (`DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuLabel`, `DropdownMenuSeparator`), `CommandPalette` (a searchable combobox dialog; `shortcut` opts into Cmd/Ctrl+K), `Breadcrumb`, `Pagination` (`paginationRange`), `Stepper` (`Step`), `SegmentedControl` (`Segment`; single-choice toggle buttons for filters, not panels).
Content: `Card` (`CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`), `StatGroup`/`Stat`, `DataList`/`DataListItem`, `EmptyState`, `Table` (`TableCaption`, `TableHeader`, `TableBody`, `TableRow`, `TableHead` with `sort`/`onSort`, `TableCell`), `Badge`, `Status`, `Tag`, `Carousel`, `Timeline`, `Tree`, `ScrollArea`, `Splitter`, `Avatar`/`AvatarGroup`, `Progress`/`CircularProgress`, `Kbd`, `Separator`, `BarChart`, `LineChart`, `DonutChart`, `Sparkline`, `Gallery*`, `Image` (blur-up placeholder, optional hover zoom), `Lightbox` (controlled full-screen viewer), `Pricing*`.
Input: `Button`, `IconButton`, `Field`, `Input`, `Textarea`, `Select` (a custom dropdown, not the native menu), `Checkbox` (`appearance="switch"`), `RadioGroup` with `Radio`, `Calendar`, `DatePicker`/`DateRangePicker`, `Combobox`, `NumberInput`, `Rating`, `PinInput`, `TagInput`, `FileDropzone`/`FileItem`, `Toggle`/`ToggleGroup`, `Slider` (one thumb or a range, eased).
Overlays and feedback: `Accordion` (`AccordionItem`, `AccordionTrigger`, `AccordionContent`), `Collapsible`, `HoverCard`, `ContextMenu`, `Drawer` (a side-sheet `Dialog`), `Dialog` (`DialogTrigger`, `DialogContent`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `DialogClose`), `Alert` (`AlertTitle`, `AlertDescription`), `ToastProvider` with `useToast()`, `Spinner`, `Skeleton`.

Icons: about 290 hand-drawn icons (`SunIcon`, `CameraIcon`, `ArrowRightIcon`, `InstagramIcon`…) in one line language: a 24-unit grid, a defined 1.75 line weight, round caps, `currentColor`. They are server-compatible and tree-shakeable. `<CameraIcon size="lg" strokeWidth={1.25} title="Camera" />` (without a `title` an icon is `aria-hidden`); `createIcon(name, { d, solid?, faint? })` builds your own in the same style; `SunMoonIcon` morphs between a sun and a moon. Brand marks are simplified drawings, not official logos.

Client modules (`"use client"`): `Dock`, `Tabs`, `SegmentedControl`, `Popover`, `Tooltip`, `DropdownMenu`, `CommandPalette`, `Dialog`, `ToastProvider`, `RadioGroup`, `Slider`, `Image`, `Lightbox`, `BarChart`, `LightField`/`Reveal`, and the hooks. Everything else renders on the server.

## Package entry points

| import                          | contents                                      |
| ------------------------------- | --------------------------------------------- |
| `@holominimal/ui`               | components, hooks, engines, theme helpers (ESM + `.d.ts`) |
| `@holominimal/ui/styles.css`    | all styles, including tokens                  |
| `@holominimal/ui/tokens.css`    | tokens only (for using the variables without the components) |

## Develop

From the repository root:

```bash
pnpm install
pnpm build:lib     # library: vite (ESM, preserveModules) + tsc (declarations) + CSS bundle
pnpm test          # vitest + Testing Library (jsdom)
pnpm typecheck
pnpm dev           # showcase on http://localhost:5180 (serves the library from source)
pnpm pack:dry      # what would be published
```

To try the package in another local project before publishing, use either of these:

```bash
pnpm add /path/to/holominimal/packages/holominimal   # a file: dependency (run pnpm build:lib first)
```

```bash
cd packages/holominimal && pnpm pack                 # then: pnpm add /path/to/holominimal-ui-0.1.0.tgz
```

`examples/next-consumer` is a Next.js App Router app that consumes the built package with no `transpilePackages`. `pnpm --filter next-consumer build` is the compatibility check.

## Versioning and publishing

Semantic versioning. While the version is `0.x`, a minor bump may break the API; from `1.0`, breaking changes need a major. Token renames and removals count as breaking. New tokens and components do not.

Publishing, done only with the owner's approval:

1. Make sure the `@holominimal` npm scope exists and that you can publish to it (create an npm organisation named `holominimal`).
2. Choose a license and set `license` in `package.json`. It is currently `UNLICENSED`.
3. Bump the version: `pnpm --filter @holominimal/ui version <patch|minor|major>`.
4. Run `pnpm build:lib && pnpm test && pnpm --filter next-consumer build && pnpm pack:dry`.
5. Run `cd packages/holominimal && pnpm publish --access public`.
