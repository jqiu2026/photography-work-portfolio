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

export function touch(tags: Tag[], paths: string[] = []) {
  for (const t of tags) revalidateTag(t, { expire: 0 });
  for (const p of paths) revalidatePath(p);
}
