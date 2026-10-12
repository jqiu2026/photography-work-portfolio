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
