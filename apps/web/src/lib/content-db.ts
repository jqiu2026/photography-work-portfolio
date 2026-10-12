import { getDb } from "@jerryqiu/db";
import * as q from "@jerryqiu/db/queries";
import { unstable_cache } from "next/cache";

/**
 * Public pages read the CMS through these cached functions. Each is tagged (see lib/revalidate.ts TAGS) so publishing in
 * the admin expires exactly what changed. They return `null` when no database is configured or it cannot be reached;
 * callers then fall back to the content that ships in the repository, so the site never breaks without credentials.
 */
async function safe<T>(fn: (db: NonNullable<ReturnType<typeof getDb>>) => Promise<T>): Promise<T | null> {
  const db = getDb();
  if (!db) return null;
  try {
    return await fn(db);
  } catch (error) {
    console.error("[content] database read failed, using repository content", error);
    return null;
  }
}

const cached = <A extends unknown[], T>(name: string, tags: string[], fn: (...a: A) => Promise<T | null>) =>
  unstable_cache(fn, [name], { tags, revalidate: 3600 });

export const getPosts = cached("posts", ["posts", "media"], () => safe((db) => q.listPosts(db, "hub")));
export const getProjects = cached("projects", ["projects", "media"], () => safe((db) => q.listProjects(db, "hub")));
export const getProfile = cached("profile", ["profile", "social", "timeline", "settings"], () =>
  safe((db) => q.getProfile(db)),
);
export const getMusic = cached("music", ["music", "media"], () => safe((db) => q.listMusic(db)));
export const getFlying = cached("flying", ["flying", "media"], () => safe((db) => q.getFlying(db)));
export const getSiteSettings = cached("settings", ["settings"], (site: "hub" | "photos" | "music" | "flying") =>
  safe((db) => q.getSettings(db, site)),
);
export const getLegalPage = cached("legal", ["pages"], (slug: string) =>
  safe((db) => q.getPublishedPage(db, "hub", slug)),
);

/** Not cached: counts a hit. Only runs on 404s. */
export async function lookupRedirect(site: "hub" | "photos" | "music" | "flying", path: string) {
  return safe((db) => q.findRedirect(db, site, path));
}
