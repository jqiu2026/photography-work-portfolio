import { getDb } from "@jerryqiu/db";
import * as q from "@jerryqiu/db/queries";
import { unstable_cache } from "next/cache";

/** Cached, tagged reads of the CMS. `null` means no database: callers fall back to the repository portfolio. */
export const getGalleries = unstable_cache(
  async () => {
    const db = getDb();
    if (!db) return null;
    try {
      return await q.listGalleries(db, "photos");
    } catch (error) {
      console.error("[content] database read failed, using repository content", error);
      return null;
    }
  },
  ["galleries"],
  { tags: ["galleries", "media"], revalidate: 3600 },
);

export const getSiteSettings = unstable_cache(
  async () => {
    const db = getDb();
    if (!db) return null;
    try {
      return await q.getSettings(db, "photos");
    } catch (error) {
      console.error("[content] settings read failed", error);
      return null;
    }
  },
  ["settings-photos"],
  { tags: ["settings"], revalidate: 3600 },
);

export const getProjects = unstable_cache(
  async () => {
    const db = getDb();
    if (!db) return null;
    try {
      return await q.listProjects(db, "photos");
    } catch (error) {
      console.error("[content] database read failed, using repository content", error);
      return null;
    }
  },
  ["projects-photos"],
  { tags: ["projects", "media"], revalidate: 3600 },
);

/** Not cached: counts a hit. Only runs on 404s. */
export async function lookupRedirect(path: string) {
  const db = getDb();
  if (!db) return null;
  try {
    return await q.findRedirect(db, "photos", path);
  } catch (error) {
    console.error("[content] redirect lookup failed", error);
    return null;
  }
}
