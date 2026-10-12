import { type Database, hitRateLimit, schema } from "@jerryqiu/db";
import { clientIpHash, isAllowedWidth, isBlockedBot, tokenSecrets, verifyImageToken } from "@jerryqiu/protect";
import type { StorageProvider } from "@jerryqiu/storage";
import { and, eq, isNull, sql } from "drizzle-orm";

/**
 * Public image delivery (`/api/img/[id]?w=&v=&t=`). Originals are never reachable from here: only the stripped, downscaled
 * derivatives. Two tiers:
 *  - public (galleries set to off/light, and everything not in a strict gallery): no token, cacheable at the CDN. Ids are
 *    random UUIDs, so files are not guessable, but anyone who has the link can fetch it. This is the portfolio.
 *  - strict (the image is in a gallery whose protection is "strict"): needs a valid, unexpired HMAC token bound to this
 *    image and width, a same-site browser fetch, and passes a rate limit. Never cached by shared caches.
 * AI/bulk-scraper user agents are refused in both tiers.
 */
export type ServeDeps = {
  db: Database;
  store: StorageProvider;
  env?: Record<string, string | undefined>;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const deny = (status: number, why: string) =>
  new Response(null, { status, headers: { "Cache-Control": "no-store", "X-Denied": why } });

/** True when the image is used in any visible gallery whose protection level is strict. */
export async function isStrictImage(db: Database, mediaId: string): Promise<boolean> {
  const r = await db.execute<{ n: number }>(sql`
    select 1 as n from gallery_items gi
    join galleries g on g.id = gi.gallery_id
    where gi.media_id = ${mediaId} and g.protection = 'strict' and g.deleted_at is null
    limit 1`);
  const rows = (Array.isArray(r) ? r : (r as { rows: unknown[] }).rows) as unknown[];
  return rows.length > 0;
}

export function pickDerivative(
  derivatives: { width: number; format: string; key: string }[],
  width: number,
  accept: string,
) {
  const wantAvif = /image\/avif/.test(accept);
  const byFormat = (f: string) => derivatives.filter((d) => d.format === f).sort((a, b) => a.width - b.width);
  const pool = wantAvif && byFormat("avif").length ? byFormat("avif") : byFormat("webp");
  const list = pool.length ? pool : [...derivatives].sort((a, b) => a.width - b.width);
  return list.find((d) => d.width >= width) ?? list[list.length - 1];
}

export async function serveImage(request: Request, id: string, deps: ServeDeps): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") return deny(405, "method");
  if (!UUID.test(id)) return deny(404, "id");
  if (isBlockedBot(request.headers.get("user-agent"))) return deny(403, "bot");
  const url = new URL(request.url);
  const w = Number(url.searchParams.get("w") ?? 960);
  if (!Number.isInteger(w) || w < 16 || w > 2400) return deny(400, "width");
  const { db, store } = deps;

  const [m] = await db
    .select({ derivatives: schema.media.derivatives, kind: schema.media.kind })
    .from(schema.media)
    .where(and(eq(schema.media.id, id), isNull(schema.media.deletedAt)))
    .limit(1);
  if (!m || m.kind !== "image" || !m.derivatives.length) return deny(404, "missing");

  const strict = await isStrictImage(db, id);
  if (strict) {
    const ipHash = clientIpHash(request.headers);
    const limited = await hitRateLimit(db, `img:${ipHash}`, 300, 60);
    const perImage = await hitRateLimit(db, `img:${ipHash}:${id}`, 40, 60);
    if (!limited.allowed || !perImage.allowed) return deny(429, "rate");
    if (!isAllowedWidth(w)) return deny(400, "width");
    const t = verifyImageToken(url.searchParams.get("t"), tokenSecrets(deps.env), { id, width: w });
    if (!t.ok) return deny(403, `token-${t.reason}`);
    // Browser fetch metadata: an <img>/fetch from one of our pages, not a navigation or another site.
    const site = request.headers.get("sec-fetch-site");
    const dest = request.headers.get("sec-fetch-dest");
    if (site && !["same-origin", "same-site"].includes(site)) return deny(403, "site");
    if (dest && !["image", "empty"].includes(dest)) return deny(403, "dest");
    const referer = request.headers.get("referer");
    if (referer) {
      try {
        const ref = new URL(referer);
        const host = request.headers.get("host") ?? url.host;
        const root = host.split(".").slice(-2).join(".");
        if (!(ref.host === host || ref.host.endsWith(`.${root}`) || ref.host === root)) return deny(403, "referer");
      } catch {
        return deny(403, "referer");
      }
    }
  }

  const d = pickDerivative(m.derivatives, w, request.headers.get("accept") ?? "");
  const obj = await store.get(d.key);
  if (!obj) return deny(404, "file");
  const headers: Record<string, string> = {
    "Content-Type": obj.contentType || (d.format === "avif" ? "image/avif" : "image/webp"),
    "Content-Disposition": "inline",
    "X-Content-Type-Options": "nosniff",
    "Content-Length": String(obj.body.byteLength),
    Vary: "Accept",
  };
  if (strict) {
    headers["Cache-Control"] = "private, no-store";
    headers["Cross-Origin-Resource-Policy"] = "same-site";
    headers.Vary = "Accept, Sec-Fetch-Dest, Sec-Fetch-Site";
  } else {
    // `v` changes when an image is replaced in place, so a long cache is safe; a policy change takes up to a day.
    headers["Cache-Control"] = url.searchParams.has("v")
      ? "public, max-age=86400, stale-while-revalidate=604800"
      : "public, max-age=300";
  }
  return new Response(request.method === "HEAD" ? null : Buffer.from(obj.body), { status: 200, headers });
}
