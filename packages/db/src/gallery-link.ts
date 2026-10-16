import { eq } from "drizzle-orm";
import type { Database } from "./client";
import * as s from "./schema";
import { newToken } from "./studio-crypto";

/** A gallery's address: /g/<slug>. 3 to 48 characters: lower-case letters, digits and dashes. */
export const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,46}[a-z0-9])$/;
export const slugify = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
export const RESERVED_SLUGS = new Set(["new", "admin", "studio", "client", "api", "shop", "order", "orders"]);

/** A free address close to `wanted` (adds -2, -3 and so on). `except` is the gallery that may keep its own. */
export async function freeSlug(db: Database, wanted: string, except?: string): Promise<string> {
  const base = slugify(wanted) || "gallery";
  for (let i = 0; i < 50; i++) {
    const cand = i === 0 ? base : `${base.slice(0, 36)}-${i + 1}`;
    if (RESERVED_SLUGS.has(cand) || !SLUG_PATTERN.test(cand)) continue;
    const [hit] = await db
      .select({ id: s.studioGalleries.id })
      .from(s.studioGalleries)
      .where(eq(s.studioGalleries.slug, cand));
    if (!hit || hit.id === except) return cand;
  }
  return `${base.slice(0, 30)}-${newToken()
    .token.slice(0, 6)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "x")}`;
}
