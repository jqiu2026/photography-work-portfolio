import { getDb } from "@jerryqiu/db";
import * as q from "@jerryqiu/db/queries";
import { unstable_cache } from "next/cache";

/** Site settings (maintenance switch). Null without a database; callers fall back to defaults. */
export const getSiteSettings = unstable_cache(
  async (site: "hub" | "photos" | "music" | "flying") => {
    const db = getDb();
    if (!db) return null;
    try {
      return await q.getSettings(db, site);
    } catch (error) {
      console.error("[make] settings read failed", error);
      return null;
    }
  },
  ["make-settings"],
  { tags: ["settings"], revalidate: 3600 },
);
