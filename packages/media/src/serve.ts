import { type Database, hitRateLimit, schema } from "@jerryqiu/db";
import { readSetting } from "@jerryqiu/db/settings";
import {
  clientIpHash,
  isAllowedWidth,
  isBlockedBot,
  mintAllWidths,
  tokenSecrets,
  verifyImageToken,
} from "@jerryqiu/protect";
import type { StorageProvider } from "@jerryqiu/storage";
import { createHash } from "node:crypto";
import { and, eq, isNull, sql } from "drizzle-orm";
import { applyWatermark } from "./watermark";

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
  /** Which site's protection settings (watermark) apply to images served by this deployment. */
  site?: "hub" | "photos";
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
  let obj = await store.get(d.key);
  if (!obj) return deny(404, "file");
  const mark = await watermarkFor(deps);
  if (mark && (d.format === "webp" || d.format === "avif")) {
    // Baked once per (text, position, opacity, source file) and cached beside the derivatives.
    const tag = createHash("sha256").update(`${mark.text}|${mark.position}|${mark.opacity}`).digest("hex").slice(0, 12);
    const wmKey = `wm/${tag}/${d.key}`;
    const cached = await store.get(wmKey);
    if (cached) obj = cached;
    else {
      const baked = await applyWatermark(obj.body, d.format, mark);
      await store.put(wmKey, baked, { contentType: obj.contentType }).catch(() => {});
      obj = { body: baked, contentType: obj.contentType };
    }
  }
  const headers: Record<string, string> = {
    "Content-Type": obj.contentType || (d.format === "avif" ? "image/avif" : "image/webp"),
    "Content-Disposition": "inline",
    "X-Content-Type-Options": "nosniff",
    "X-Robots-Tag": "noai, noimageai",
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

async function watermarkFor(deps: ServeDeps) {
  if (!deps.site) return null;
  const rows = await deps.db
    .select({ value: schema.settings.value })
    .from(schema.settings)
    .where(and(eq(schema.settings.site, deps.site), eq(schema.settings.key, "protection")))
    .limit(1);
  const p = readSetting("protection", rows[0]?.value);
  return p.watermark && p.watermarkText
    ? { text: p.watermarkText, position: p.watermarkPosition, opacity: p.watermarkOpacity }
    : null;
}

/**
 * `POST /api/img/token`: a fresh set of signed tokens for a strict image, for a page that has been open longer than the
 * token lifetime. Same trust as loading the page (any visitor gets one), but only for same-origin browser requests, never
 * for known scrapers, and rate limited. Only strict images get tokens; everything else needs none.
 */
export async function handleTokenRequest(request: Request, deps: ServeDeps): Promise<Response> {
  const json = (status: number, body: unknown) =>
    Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
  if (request.method !== "POST") return json(405, { error: "method" });
  if (isBlockedBot(request.headers.get("user-agent"))) return json(403, { error: "bot" });
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  let sameOrigin = false;
  try {
    sameOrigin = Boolean(origin && host && new URL(origin).host === host);
  } catch {}
  const site = request.headers.get("sec-fetch-site");
  if (!sameOrigin || (site && site !== "same-origin")) return json(403, { error: "origin" });
  const body = (await request.json().catch(() => null)) as { id?: unknown } | null;
  const id = typeof body?.id === "string" ? body.id : "";
  if (!UUID.test(id)) return json(400, { error: "id" });
  const ipHash = clientIpHash(request.headers);
  if (!(await hitRateLimit(deps.db, `imgtok:${ipHash}`, 120, 60)).allowed) return json(429, { error: "rate" });
  if (!(await isStrictImage(deps.db, id))) return json(404, { error: "not protected" });
  const secrets = tokenSecrets(deps.env);
  if (!secrets.length) return json(503, { error: "not configured" });
  return json(200, { tokens: mintAllWidths({ id, secrets }) });
}
