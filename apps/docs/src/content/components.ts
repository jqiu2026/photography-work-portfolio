/**
 * The documented Holominimal components. `test/coverage.test.ts` checks every entry is a real export of
 * `@holominimal/ui` and that entries marked `live` have a demo in components/Demos.tsx.
 */
export type Doc = {
  name: string;
  group: string;
  summary: string;
  props: [name: string, type: string, note: string][];
  a11y: string;
  whenNot: string;
  code: string;
  live?: boolean;
};

const d = (
  name: string,
  group: string,
  summary: string,
  props: Doc["props"],
  a11y: string,
  whenNot: string,
  code: string,
  live = true,
): Doc => ({ name, group, summary, props, a11y, whenNot, code, live });

export const docs: Doc[] = [
  // Foundations
  d("Theme", "Foundations", "Sets the tokens for a subtree: accent hue, density, motion.", [["theme", "{ accent, density, motion }", "Partial; the rest falls back to the defaults."]], "Reduced motion is honoured and can be forced with `motion: \"reduce\"`.", "To restyle one component (pass a className).", '<Theme theme={{ accent: "violet" }}>…</Theme>', false),
  d("AppShell", "Foundations", "The page frame: a sidebar slot, a stage and an optional atmosphere behind.", [["sidebar", "ReactNode", "Usually a Dock."], ["backdrop", "ReactNode", "Atmosphere or nothing."]], "Provides the skip link and the main landmark.", "Inside another AppShell.", "<AppShell sidebar={<Dock>…</Dock>}>…</AppShell>", false),
  d("Dock", "Foundations", "The quiet vertical navigation of an AppShell; items light their current page.", [["aria-label", "string", "Names the navigation."]], "A nav landmark; the current item carries aria-current.", "For actions (use buttons).", "<Dock aria-label=\"Main\"><DockItem current>Home</DockItem></Dock>", false),
  d("Container", "Foundations", "A centred column with a maximum width and side gutters.", [["size", '"sm" | "md" | "lg" | "xl" | "full"', "Maximum width."]], "Plain element; pass `as` for a landmark.", "Nested inside another Container.", '<Container size="md">…</Container>'),
  d("Stack", "Foundations", "A vertical flex column on the space scale.", [["gap", "space token", "Distance between children."]], "Presentational only.", "For grids (use Grid).", "<Stack gap={4}>…</Stack>"),
  d("Inline", "Foundations", "A horizontal row that wraps.", [["gap", "space token", ""], ["align", "start | center | end", ""]], "Presentational only.", "For long reflowing content (use Stack).", "<Inline gap={3}>…</Inline>"),
  // Type
  d("Heading", "Type", "A heading: the level sets the element and a default size.", [["level", "1–6", "Element and default size."], ["size", "text size", "Override."]], "Keep one h1 a page and do not skip levels.", "For body text (use Text).", "<Heading level={2}>Galleries</Heading>"),
  d("Text", "Type", "Text on the type scale with tone, weight and an eyebrow style.", [["size", "2xs … 3xl", ""], ["tone", "default | soft | muted | accent …", ""], ["eyebrow", "boolean", "Small caps label."]], "Muted text meets AA on black.", "For headings (use Heading).", '<Text tone="muted">Quiet text</Text>'),
  d("Kbd", "Type", "A keyboard key.", [], "Read as text.", "For code (use code).", "<Kbd>⌘K</Kbd>"),
  // Actions
  d("Button", "Actions", "One quiet primary per view; secondary, ghost and danger recede.", [["variant", "primary | secondary | ghost | danger", ""], ["size", "sm | md | lg", ""], ["loading", "boolean", "Spinner and aria-busy."], ["asChild", "boolean", "Style a link as a button."]], "Native button, visible focus, 44px target.", "Navigation without `asChild` (use a link).", "<Button>Save</Button>"),
  d("IconButton", "Actions", "A square button holding one icon.", [["aria-label", "string", "Required."]], "The label is the accessible name.", "When text fits (use Button).", '<IconButton aria-label="Close"><XIcon /></IconButton>'),
  d("SegmentedControl", "Actions", "A small set of mutually exclusive choices in one control.", [["value", "string", ""], ["onValueChange", "(v) => void", ""]], "A radio group with arrow keys.", "For more than five choices (use Select).", '<SegmentedControl value="day">…</SegmentedControl>'),
  d("Toggle", "Actions", "A pressed / not pressed button.", [["pressed", "boolean", ""]], "aria-pressed.", "For settings that save (use Checkbox appearance switch).", "<Toggle>Bold</Toggle>"),
  // Forms
  d("Field", "Forms", "Label, hint and error around one control, wired together.", [["label", "ReactNode", "Required."], ["hint", "ReactNode", ""], ["error", "ReactNode", "Announced."]], "Programmatic label; the error is an alert.", "Checkboxes (they carry their own label).", '<Field label="Email"><Input type="email" /></Field>'),
  d("Input", "Forms", "A text input in the control style.", [["…", "input attributes", ""]], "Use inside Field.", "Several lines (use Textarea).", "<Input />"),
  d("Textarea", "Forms", "Multi-line text; can grow with its content.", [["autoGrow", "boolean", ""]], "Use inside Field.", "One line (use Input).", "<Textarea autoGrow />"),
  d("Select", "Forms", "A listbox select; posts its value with a form.", [["options", "SelectOption[]", "Or option children."], ["name", "string", "Form field name."]], "Listbox with type-ahead and arrow keys.", "Two choices (use SegmentedControl).", '<Select name="size" options={[{ value: "s", label: "Small" }]} />'),
  d("Checkbox", "Forms", "A checkbox with its label; `appearance=\"switch\"` for settings.", [["label", "ReactNode", "Required."], ["appearance", "checkbox | switch", ""]], "Native input; the label is clickable.", "One of several (use RadioGroup).", '<Checkbox label="Show captions" />'),
  d("Slider", "Forms", "A range control.", [["min / max / step", "number", ""]], "Arrow keys and Page Up/Down.", "For exact numbers (use NumberInput).", '<Slider aria-label="Volume" defaultValue={40} />'),
  // Feedback
  d("Badge", "Feedback", "A small label for a state, plan or count.", [["tone", "neutral | accent | success | warning | danger | muted | info", "Colour carries meaning only."]], "Plain text; do not rely on colour alone.", "For actions (use Button).", '<Badge tone="success">Live</Badge>'),
  d("Alert", "Feedback", "An inline message about the page.", [["tone", "info | success | warning | danger", ""]], "role=status or alert by tone.", "For short-lived results (use a toast).", "<Alert><AlertTitle>Saved</AlertTitle></Alert>"),
  d("Progress", "Feedback", "A thin bar for progress; indeterminate without a value.", [["value", "number", ""], ["aria-label", "string", "Required."]], "role=progressbar with its value.", "For loading a page (use Skeleton).", '<Progress value={40} aria-label="Upload" />'),
  d("Spinner", "Feedback", "A small busy indicator.", [], "Label it with nearby text.", "For long tasks (use Progress).", "<Spinner />"),
  d("Skeleton", "Feedback", "A placeholder while content loads.", [], "Hidden from assistive tech.", "For empty states (use EmptyState).", '<Skeleton style={{ height: 24 }} />'),
  d("ToastProvider", "Feedback", "Corner toasts for action results; `useToast()` raises them.", [["position", "bottom-right | bottom-center | top-right", ""]], "A polite live region.", "For errors that block the form (use Field error).", 'toast({ title: "Saved", tone: "success" })'),
  // Surfaces
  d("Card", "Surfaces", "A raised surface for one item.", [], "A plain group; give it a heading.", "To lay out a page (use Container).", "<Card><CardHeader><CardTitle>…</CardTitle></CardHeader></Card>"),
  d("Stat", "Surfaces", "A number with its label and trend.", [["label", "string", ""], ["value", "ReactNode", ""], ["trend", "up | down", ""]], "The trend is also written out.", "For tables of numbers (use Table).", '<Stat label="Revenue" value="$14,755" />'),
  d("EmptyState", "Surfaces", "What to show when there is nothing yet, with the next step.", [], "A heading and a single action.", "For errors (use Alert).", '<EmptyState>No galleries yet.</EmptyState>'),
  d("Tabs", "Surfaces", "Panels behind a row of tabs.", [["defaultValue", "string", ""]], "Tablist with arrow keys.", "For navigation between pages (use links).", '<Tabs defaultValue="a"><TabList><Tab value="a">A</Tab></TabList></Tabs>'),
  d("Accordion", "Surfaces", "Sections that open one or many at a time.", [["type", "single | multiple", ""]], "Buttons with aria-expanded.", "For a few lines (show them).", "<Accordion>…</Accordion>"),
  // Overlays
  d("Dialog", "Overlays", "A modal for one task; focus stays inside until it closes.", [["open / onOpenChange", "", "Controlled."]], "Focus trap, Escape closes, the title names it.", "For long forms (use a page).", "<Dialog><DialogTrigger>Open</DialogTrigger><DialogContent>…</DialogContent></Dialog>"),
  d("Drawer", "Overlays", "A panel that slides in from an edge.", [["side", "left | right | bottom", "On DrawerContent."]], "A dialog with focus management.", "For confirmations (use Dialog).", '<Drawer><DrawerContent side="left">…</DrawerContent></Drawer>', false),
  d("Tooltip", "Overlays", "A short label on hover and focus.", [["content", "ReactNode", ""]], "Shown on focus too; never the only way to learn something.", "For essential information (show it).", '<Tooltip content="Copy">…</Tooltip>'),
  d("DropdownMenu", "Overlays", "A menu of actions from a button.", [], "Menu with arrow keys and type-ahead.", "For navigation (use links).", "<DropdownMenu>…</DropdownMenu>", false),
  // Motion
  d("Animate", "Motion", "Plays one of the named entrance animations on mount or in view.", [["animation", "fade-up, zoom-in, pop …", "A named preset."], ["trigger", "mount | view | hover | click", ""]], "Skipped under reduced motion.", "For loops that never stop.", '<Animate animation="fade-up">…</Animate>'),
  d("Typewriter", "Motion", "Types and erases phrases.", [["text", "string | string[]", ""], ["loop", "boolean", ""]], "The full text is available to screen readers.", "For important copy that must be read at once.", '<Typewriter text={["photographs", "music"]} loop />'),
  d("CountUp", "Motion", "Counts to a number when it comes into view.", [["value", "number", ""]], "The final number is announced.", "For numbers that change often.", "<CountUp value={240} />"),
  d("Marquee", "Motion", "A slow horizontal loop of content.", [], "Pauses on hover and under reduced motion.", "For content people must read.", "<Marquee>…</Marquee>"),
];

export const groups = [...new Set(docs.map((x) => x.group))];
export const bySlug = (slug: string) => docs.find((x) => x.name.toLowerCase() === slug);
