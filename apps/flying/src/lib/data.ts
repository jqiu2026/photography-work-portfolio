import { getDb } from "@jerryqiu/db";
import * as fl from "@jerryqiu/db/flying";
import { unstable_cache } from "next/cache";

/** Public reads, cached and tagged "flying"; empty without a database. Dates become strings in the cache: only months are shown. */
export const getPublicFlights = unstable_cache(
  async () => {
    const db = getDb();
    if (!db) return { flights: [], airports: [] };
    try {
      return await fl.publicFlights(db);
    } catch (error) {
      console.error("[flying] database read failed", error);
      return { flights: [], airports: [] };
    }
  },
  ["flying-flights"],
  { tags: ["flying"], revalidate: 600 },
);
