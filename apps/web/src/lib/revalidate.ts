import { revalidatePath, revalidateTag } from "next/cache";

/**
 * Public pages read through unstable_cache with these tags (see lib/content-db.ts). After a change the affected tags
 * expire immediately, so the owner sees it on the next request. The photography app is a separate deployment: its tags
 * are poked over HTTP (see lib/revalidate-photos.ts, added with the public-site switch in M15).
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

/** Tags the photography app caches; changing any of them pokes that deployment too. */
const PHOTOS_TAGS = ["galleries", "projects", "media", "settings", "redirects", "pages"] as const;

/** Fire-and-forget: a slow or unreachable photos site must never slow down or fail an admin save. */
function pokePhotos(tags: Tag[], extraPaths: string[]) {
  const secret = process.env.REVALIDATE_SECRET;
  const base = process.env.NEXT_PUBLIC_PHOTOS_URL;
  const relevant = tags.filter((t): t is (typeof PHOTOS_TAGS)[number] =>
    (PHOTOS_TAGS as readonly string[]).includes(t),
  );
  if (!secret || !base || !relevant.length) return;
  const paths = [...(relevant.includes("galleries") ? ["/", "/portfolio"] : []), ...extraPaths];
  fetch(`${base.replace(/\/$/, "")}/api/revalidate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
    body: JSON.stringify({ tags: relevant, paths }),
    signal: AbortSignal.timeout(4000),
  }).catch((error) => console.warn("[revalidate] could not reach the photography site", String(error)));
}

/** `photosPaths` are paths on the photography site (e.g. "/work") to refresh there. */
export function touch(tags: Tag[], paths: string[] = [], photosPaths: string[] = []) {
  for (const t of tags) revalidateTag(t, { expire: 0 });
  for (const p of paths) revalidatePath(p);
  pokePhotos(tags, photosPaths);
}
