import { getImage } from "@/lib/images";

/**
 * The static portfolio (Phase 1). Slugs match private/opt/gallery/manifest.json (made by scripts/optimize-images.mjs).
 * Categories come from the original site. Phase 2 moves this into the CMS.
 * TODO(owner): replace the generic alt text with a real description of each photograph.
 */
export type Category = { slug: string; name: string; blurb?: string };

export const categories: Category[] = [
  { slug: "theater", name: "Theater" },
  { slug: "event", name: "Event" },
  { slug: "dance", name: "Dance" },
  { slug: "street", name: "Street" },
  { slug: "portrait", name: "Portrait" },
  { slug: "aviation", name: "Aviation" },
  { slug: "low-light", name: "Low light" },
  { slug: "macro", name: "Macro" },
  { slug: "composite", name: "Composite" },
];

const entries: [id: string, category: string][] = [
  ["10-19-2025-maker-faire-coney-island-2025-129-1", "event"],
  ["10-19-2025-maker-faire-coney-island-2025-51-1", "event"],
  ["10-19-2025-maker-faire-coney-island-2025-98-1", "event"],
  ["2026-01-17-snow-7", "street"],
  ["2026-01-17-snow-8", "street"],
  ["2026-01-17-snow-9", "macro"],
  ["2026-03-25-stuyopenhouse-20", "event"],
  ["2026-03-25-stuyopenhouse-30", "event"],
  ["2026-03-25-stuyopenhouse-4", "event"],
  ["2026-03-25-stuyopenhouse-60", "event"],
  ["2026-03-25-stuyopenhouse-9", "dance"],
  ["gf4a9402-2-3", "portrait"],
  ["jetblue-a220-300-1", "aviation"],
  ["jetblue-a321neo-1", "aviation"],
  ["jry0011", "composite"],
  ["jry0022-enhanced-nr", "theater"],
  ["jry0126-enhanced-nr", "low-light"],
  ["jry0159", "dance"],
  ["jry0473", "theater"],
  ["jry0697", "theater"],
  ["jry0837", "theater"],
  ["jry1082", "theater"],
  ["jry1117", "theater"],
];

const name = (slug: string) => categories.find((c) => c.slug === slug)?.name ?? slug;

export const photos = entries.map(([slug, category], i) => ({
  slug,
  category,
  ...getImage(slug),
  alt: `${name(category)} photograph ${i + 1}`,
}));

export function photosIn(slug: string) {
  return photos.filter((p) => p.category === slug);
}

/** Featured on the home page, in order. */
export const featured = [
  "jry0473",
  "gf4a9402-2-3",
  "2026-03-25-stuyopenhouse-20",
  "jry1082",
  "2026-01-17-snow-7",
  "jetblue-a220-300-1",
  "jry0022-enhanced-nr",
  "jry0126-enhanced-nr",
  "10-19-2025-maker-faire-coney-island-2025-98-1",
].map((slug) => photos.find((p) => p.slug === slug)!);
