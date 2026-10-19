/**
 * The home story (docs/project/HOME-VISION.md): the chapters, their pacing for the automatic mode, the photograph each
 * scene wants, and every line of scene copy. Owner-editable; the components hold no copy, faces or positions.
 *
 * TODO(owner): all copy here is a draft. Rewrite it in your voice, and check the focal points (the point of each
 * photograph the camera moves toward) against the photographs that actually land in each slot.
 */

export type StoryPhoto = {
  id?: string;
  width: number;
  height: number;
  color?: string;
  blur?: string;
  alt: string;
  category: string;
  caption?: string;
  files?: { width: number; src: string }[];
  /** Where the camera looks in this photograph (percent from its top left); see FOCAL_BY_SLUG. */
  focal?: readonly [number, number];
};

/** Chapters in page order. `seconds` is how long the automatic mode spends in the chapter. */
export const CHAPTERS = [
  { id: "threshold", label: "Threshold", seconds: 5 },
  { id: "seeing", label: "Seeing", seconds: 9 },
  { id: "range", label: "My past work", seconds: 9 },
  { id: "booking", label: "Booking", seconds: 20 },
  { id: "moment", label: "The moment", seconds: 8 },
  { id: "darkroom", label: "Darkroom", seconds: 9 },
  { id: "delivered", label: "Delivered", seconds: 9 },
  { id: "keep", label: "Keep", seconds: 7 },
] as const;
export type ChapterId = (typeof CHAPTERS)[number]["id"];

/** Where the camera looks in a photograph, as percentages from its top left. Keyed by category (a default). */
export const FOCAL: Record<string, readonly [number, number]> = {
  theater: [50, 40],
  dance: [50, 38],
  event: [46, 42],
  street: [50, 55],
  portrait: [50, 36],
  aviation: [50, 45],
  "low-light": [50, 50],
  macro: [50, 50],
  composite: [50, 50],
};
/** Known focal points of specific photographs of the shipped set (by slug). CMS photographs use their category's. */
export const FOCAL_BY_SLUG: Record<string, readonly [number, number]> = {
  "10-19-2025-maker-faire-coney-island-2025-51-1": [38, 45],
  jry0473: [34, 45],
  "2026-01-17-snow-7": [50, 60],
  "jetblue-a220-300-1": [55, 50],
  "2026-03-25-stuyopenhouse-20": [45, 40],
  "jry0022-enhanced-nr": [33, 42],
  "jry0126-enhanced-nr": [60, 45],
  "gf4a9402-2-3": [50, 40],
  jry0011: [50, 50],
};
export const focalOf = (p?: StoryPhoto): readonly [number, number] =>
  p?.focal ?? FOCAL[p?.category ?? ""] ?? ([50, 45] as const);

/** Owner's picks for each scene, by slug of the shipped set (the first match wins; otherwise a category pick is used). */
export const PICKS = {
  threshold: "10-19-2025-maker-faire-coney-island-2025-98-1",
  seeing: "10-19-2025-maker-faire-coney-island-2025-51-1",
  moment: "jry0022-enhanced-nr",
  // TODO(owner): choose the photograph for the edit comparison (one whose edit shows).
  darkroom: "jry0126-enhanced-nr",
  finale: "jry0011",
} as const;

export const SEEING_LINES = ["I stay out of the way.", "I watch for the moment.", "Then I press the shutter."] as const;

export const THRESHOLD = {
  mark: "Jerry Qiu / Photography",
  title: "Pictures of people at work.",
  cue: "Scroll, or let it play",
} as const;

export const RANGE = {
  title: "My past work",
  /** Only categories with enough work are shown (the page filters on this). */
  minPhotos: 1,
  all: "All photographs",
} as const;

export const BOOKING = {
  eyebrow: "Working with me",
  title: "From the first message to a confirmed date.",
  stages: [
    { id: "inquiry", label: "Inquiry", n: "01" },
    { id: "quote", label: "Quote", n: "02" },
    { id: "booking", label: "Booking", n: "03" },
    { id: "prep", label: "Preparation", n: "04" },
  ],
  inquiry: {
    heading: "Tell me what you are planning",
    prompts: ["What are you planning?", "When and where?", "What do you need photographed?"],
    cta: { label: "Tell me about your shoot", href: "/contact" },
  },
  quote: {
    heading: "A quote with the real packages",
    empty: "The packages are being updated. Ask for a quote and I will reply myself.",
    cta: { label: "Explore packages", href: "/packages" },
  },
  booking: {
    heading: "Book the date",
    note: "Example calendar. Dates are chosen in the real booking form.",
    terms: "A deposit holds your date. The contract and invoice arrive by email, signed and paid online.",
    cta: { label: "Start a booking", href: "/book" },
  },
  prep: {
    heading: "Before the day",
    note: "Example sheet.",
    items: ["Where, and when the light is right", "Who matters most on the day", "The few pictures that must happen"],
  },
} as const;

export const MOMENT = {
  phases: ["Focus", "Compose", "Wait", "Press"],
} as const;

export const DARKROOM = {
  title: "Every frame is edited by hand.",
  steps: ["Light and contrast", "Colour balance", "Crop and detail"],
  before: "Before",
  after: "After",
  note: "A prepared comparison for illustration. The left side is not a camera RAW file.",
  control: "Move the before and after line",
} as const;

export const DELIVERED = {
  line: "Your photographs, ready to revisit.",
  demo: "Example gallery",
  points: [
    "A private link, with a passcode only you share",
    "Mark favourites and send me your selection",
    "Download full size, or order prints",
  ],
  cta: { label: "See how galleries work", href: "/galleries" },
} as const;

/** One photograph, many sizes and formats (our own mockup: nothing here is a product listing or a price). */
export const KEEP = {
  title: "Download it, or hang it.",
  note: "One photograph, shown in a few sizes and formats. Illustration only.",
  cta: { label: "About prints", href: "/prints" },
  items: [
    { id: "wall", label: "Large framed print" },
    { id: "frame", label: "Framed, mid size" },
    { id: "canvas", label: "Canvas" },
    { id: "small", label: "Small print" },
    { id: "phone", label: "On your phone" },
    { id: "file", label: "Full size download" },
  ],
} as const;

export const END = {
  line: "Let's make something worth keeping.",
  primary: { label: "Book a shoot", href: "/book" },
  secondary: { label: "Explore the portfolio", href: "/portfolio" },
  faq: "Questions before you book",
  allFaq: "All questions",
} as const;

export const HUD = {
  skip: "Skip the story",
  auto: "Playing",
  manual: "You are in control",
  paused: "Paused",
  done: "End of the story",
  resume: "Resume auto",
  pause: "Pause",
  play: "Play",
} as const;

/** The photographs for each scene, chosen from the portfolio by category (never the same twice while there are enough). */
export type StorySlots = {
  threshold?: StoryPhoto;
  seeing?: StoryPhoto;
  sheet: StoryPhoto[];
  moment?: StoryPhoto;
  darkroom?: StoryPhoto;
  delivered: StoryPhoto[];
  finale?: StoryPhoto;
  prep: StoryPhoto[];
};

export function pickSlots(source: StoryPhoto[]): StorySlots {
  const slugOf = (p: StoryPhoto) => (p as { slug?: string }).slug;
  // never send a file name to the browser; keep only what a scene needs
  const all: StoryPhoto[] = source.map((p) => {
    const slug = slugOf(p);
    return {
      id: p.id,
      width: p.width,
      height: p.height,
      color: p.color,
      blur: p.blur,
      alt: p.alt,
      category: p.category,
      caption: p.caption,
      files: p.files,
      focal: slug ? FOCAL_BY_SLUG[slug] : undefined,
    };
  });
  const slugs = source.map(slugOf);
  const used = new Set<number>();
  const take = (cats: readonly string[], n = 1, nth = 0, slug?: string): StoryPhoto[] => {
    const out: StoryPhoto[] = [];
    if (slug) {
      const i = slugs.indexOf(slug);
      if (i >= 0 && !used.has(i)) {
        used.add(i);
        return [all[i] as StoryPhoto];
      }
    }
    const pool = all
      .map((p, i) => ({ p, i }))
      .filter((x) => (!cats.length || cats.includes(x.p.category)) && !used.has(x.i));
    for (let j = 0; j < n && pool.length; j++) {
      const [x] = pool.splice(Math.min(pool.length - 1, (nth + j * 2) % pool.length), 1);
      if (!x) break;
      used.add(x.i);
      out.push(x.p);
    }
    // fewer than wanted in those categories: top up from anywhere
    if (out.length < n && cats.length) out.push(...take([], n - out.length));
    return out;
  };
  const threshold = take(["event", "theater", "dance"], 1, 1, PICKS.threshold)[0];
  const seeing = take(["event", "theater", "portrait"], 1, 0, PICKS.seeing)[0];
  const moment = take(["dance", "theater", "aviation"], 1, 1, PICKS.moment)[0];
  const darkroom = take(["low-light", "portrait", "event"], 1, 0, PICKS.darkroom)[0];
  const finale = take(["composite", "street", "aviation"], 1, 0, PICKS.finale)[0];
  const delivered = take([], 6, 0);
  const prep = take([], 3, 0);
  // the contact sheet shows the whole portfolio: one frame per subject in turn, so the subjects are spread through it
  const byCat = new Map<string, StoryPhoto[]>();
  for (const p of all) byCat.set(p.category, [...(byCat.get(p.category) ?? []), p]);
  const sheet: StoryPhoto[] = [];
  for (let round = 0; sheet.length < 15 && round < 6; round++)
    for (const list of byCat.values()) {
      const p = list[round];
      if (p && sheet.length < 15) sheet.push(p);
    }
  // never leave a scene empty on a small portfolio: reuse from the start
  const any = all[0];
  return {
    threshold: threshold ?? any,
    seeing: seeing ?? any,
    sheet,
    moment: moment ?? any,
    darkroom: darkroom ?? any,
    delivered: delivered.length >= 4 ? delivered : all.slice(0, 6),
    finale: finale ?? any,
    prep: prep.length ? prep : all.slice(0, 3),
  };
}
