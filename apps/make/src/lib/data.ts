import { getDb } from "@jerryqiu/db";
import * as mk from "@jerryqiu/db/make";
import { unstable_cache } from "next/cache";

/** Public reads, cached and tagged "make"; empty when there is no database so the site never breaks without credentials. */
async function safe<T>(fallback: T, fn: (db: NonNullable<ReturnType<typeof getDb>>) => Promise<T>): Promise<T> {
  const db = getDb();
  if (!db) return fallback;
  try {
    return await fn(db);
  } catch (error) {
    console.error("[make] database read failed", error);
    return fallback;
  }
}

export const getProjects = unstable_cache(async () => safe([], (db) => mk.listPublic(db)), ["make-projects"], {
  tags: ["make"],
  revalidate: 600,
});
export const getProject = unstable_cache(
  async (slug: string) => safe(null, (db) => mk.getPublicProject(db, slug)),
  ["make-project"],
  {
    tags: ["make"],
    revalidate: 600,
  },
);
export const getNow = unstable_cache(async () => safe([], (db) => mk.listNow(db, 30)), ["make-now"], {
  tags: ["make"],
  revalidate: 600,
});
