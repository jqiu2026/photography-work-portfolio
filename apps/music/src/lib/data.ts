import { getDb } from "@jerryqiu/db";
import * as m from "@jerryqiu/db/music";
import { unstable_cache } from "next/cache";

/**
 * Public reads of the catalog. Cached and tagged "music" so publishing in the studio refreshes them. Without a database (or
 * when it cannot be reached) they return empty results, so the site never breaks without credentials.
 */
async function safe<T>(fallback: T, fn: (db: NonNullable<ReturnType<typeof getDb>>) => Promise<T>): Promise<T> {
  const db = getDb();
  if (!db) return fallback;
  try {
    return await fn(db);
  } catch (error) {
    console.error("[music] database read failed", error);
    return fallback;
  }
}

export const getCatalog = unstable_cache(
  async (filterJson: string) => safe([], (db) => m.listCatalog(db, JSON.parse(filterJson) as m.CatalogFilter)),
  ["music-catalog"],
  { tags: ["music"], revalidate: 600 },
);

export const getWork = unstable_cache(
  async (slug: string) => safe(null, (db) => m.getWorkPage(db, slug)),
  ["music-work"],
  {
    tags: ["music"],
    revalidate: 600,
  },
);

export const getBundles = unstable_cache(
  async () => safe([], (db) => m.listBundles(db, { activeOnly: true })),
  ["music-bundles"],
  { tags: ["music"], revalidate: 600 },
);
