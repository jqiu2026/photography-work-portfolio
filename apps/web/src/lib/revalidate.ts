import { revalidatePath, revalidateTag } from "next/cache";

/**
 * Public pages read through unstable_cache with these tags (see lib/content-db.ts). After a change the affected tags
 * expire immediately, so the owner sees it on the next request. The photography, music and flying apps are separate deployments:
 * their tags are poked over HTTP (each has an /api/revalidate route guarded by REVALIDATE_SECRET).
 */
export const TAGS = [
  "posts",
  "projects",
  "profile",
  "timeline",
  "social",
  "galleries",
  "music",
  "flying",
  "pages",
  "settings",
  "redirects",
  "media",
] as const;
export type Tag = (typeof TAGS)[number];

/** Each separately deployed site, the env var that holds its origin, and the tags it caches. */
const SITES = [
  {
    env: "NEXT_PUBLIC_PHOTOS_URL",
    label: "photography",
    tags: ["galleries", "projects", "media", "settings", "redirects", "pages"],
  },
  { env: "NEXT_PUBLIC_MUSIC_URL", label: "music", tags: ["music", "media", "settings", "redirects", "pages"] },
  { env: "NEXT_PUBLIC_FLYING_URL", label: "flying", tags: ["flying", "media", "settings", "redirects", "pages"] },
] as const;

/** Fire-and-forget: a slow or unreachable site must never slow down or fail an admin save. */
function pokeSites(tags: Tag[], photosPaths: string[]) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) return;
  for (const site of SITES) {
    const base = process.env[site.env];
    const relevant = tags.filter((t) => (site.tags as readonly string[]).includes(t));
    if (!base || !relevant.length) continue;
    const isPhotos = site.label === "photography";
    const paths = isPhotos ? [...(relevant.includes("galleries") ? ["/", "/portfolio"] : []), ...photosPaths] : [];
    fetch(`${base.replace(/\/$/, "")}/api/revalidate`, {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
      body: JSON.stringify({ tags: relevant, paths }),
      signal: AbortSignal.timeout(4000),
    }).catch((error) => console.warn(`[revalidate] could not reach the ${site.label} site`, String(error)));
  }
}

/** `photosPaths` are paths on the photography site (e.g. "/work") to refresh there. */
export function touch(tags: Tag[], paths: string[] = [], photosPaths: string[] = []) {
  for (const t of tags) revalidateTag(t, { expire: 0 });
  for (const p of paths) revalidatePath(p);
  // Settings (maintenance mode, SEO, protection) are read by the root layout, so every page under it must refresh.
  if (tags.includes("settings")) revalidatePath("/", "layout");
  pokeSites(tags, photosPaths);
}
