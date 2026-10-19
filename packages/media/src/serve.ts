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
import { codeHex, embedViewerCode, viewerCode } from "./forensic";
import { applyWatermark } from "./watermark";

/**
 * Image delivery (`/api/img/[id]?w=&t=`). Originals are never reachable from here: only the stripped, downscaled
 * derivatives. On the photo site EVERY photograph needs a valid, unexpired HMAC token bound to this image and width, a
 * same-site browser fetch, and passes a rate limit. Client-gallery photographs additionally need a token bound to a
 * viewer (a client session), get an invisible per-viewer watermark and are logged. AI/bulk-scraper agents are refused.
 * (`publicTier` keeps the old tokenless tier for the hub only.)
 */
export type ImageSource = {
  derivatives: { width: number; format: string; key: string }[];
  get(key: string): Promise<{ body: Uint8Array; contentType: string } | null>;
};

export type ServeDeps = {
  /** Optional: images bundled with the app (no database row). They are always token-gated and never in a studio gallery. */
  resolveStatic?: (id: string) => ImageSource | null;
  db?: Database | null;
  store: StorageProvider;
  env?: Record<string, string | undefined>;
  /** Which site's protection settings (watermark) apply to images served by this deployment. */
  site?: "hub" | "photos";
  /**
   * Hub only (legacy): keep the old public tier for images that are not in a strict or client gallery. The photo site
   * never sets this: every photograph needs a token.
   */
  publicTier?: boolean;
  /**
   * Token endpoint for client-gallery photographs: returns the viewer id when the request carries a valid client
   * session that may see this image, otherwise null (no token is minted).
   */
  studioViewer?: (request: Request, id: string) => Promise<string | null>;
};

const memory = new Map<string, { n: number; t: number }>();
async function hit(db: Database | null | undefined, key: string, limit: number, windowSec: number) {
  if (db) return hitRateLimit(db, key, limit, windowSec);
  const now = Date.now();
  const cur = memory.get(key);
  const row = !cur || now - cur.t > windowSec * 1000 ? { n: 1, t: now } : { n: cur.n + 1, t: cur.t };
  memory.set(key, row);
  if (memory.size > 5000) for (const [k, v] of memory) if (now - v.t > 120_000) memory.delete(k);
  return { allowed: row.n <= limit, count: row.n };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const deny = (status: number, why: string) =>
  new Response(null, { status, headers: { "Cache-Control": "no-store", "X-Denied": why } });

/**
 * True when the image is used in any visible gallery whose protection level is strict, or in ANY client (studio)
 * gallery: client photographs are private by default and never served from the public tier.
 */
export async function isStrictImage(db: Database, mediaId: string): Promise<boolean> {
  const r = await db.execute<{ n: number }>(sql`
    select 1 as n from gallery_items gi
    join galleries g on g.id = gi.gallery_id
    where gi.media_id = ${mediaId} and g.protection = 'strict' and g.deleted_at is null
    union all
    select 1 as n from studio_gallery_items sgi
    join studio_galleries sg on sg.id = sgi.gallery_id
    where sgi.media_id = ${mediaId} and sg.deleted_at is null
    limit 1`);
  const rows = (Array.isArray(r) ? r : (r as { rows: unknown[] }).rows) as unknown[];
  return rows.length > 0;
}

/** True when the image is in ANY client (studio) gallery: those photographs need a viewer-bound token. */
export async function isStudioImage(db: Database, mediaId: string): Promise<boolean> {
  const r = await db.execute<{ n: number }>(sql`
    select 1 as n from studio_gallery_items sgi
    join studio_galleries sg on sg.id = sgi.gallery_id
    where sgi.media_id = ${mediaId} and sg.deleted_at is null limit 1`);
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
  const { store } = deps;
  const db = deps.db ?? null;

  let source: ImageSource | null = deps.resolveStatic?.(id) ?? null;
  const fromStatic = Boolean(source);
  if (!source) {
    if (!db) return deny(404, "missing");
    const [m] = await db
      .select({ derivatives: schema.media.derivatives, kind: schema.media.kind })
      .from(schema.media)
      .where(and(eq(schema.media.id, id), isNull(schema.media.deletedAt)))
      .limit(1);
    if (!m || m.kind !== "image" || !m.derivatives.length) return deny(404, "missing");
    source = { derivatives: m.derivatives, get: (k) => store.get(k) };
  }

  const studio = !fromStatic && db ? await isStudioImage(db, id) : false;
  const needsToken = !deps.publicTier || studio || (!fromStatic && db ? await isStrictImage(db, id) : false);
  let viewer = "";
  if (needsToken) {
    const ipHash = clientIpHash(request.headers);
    const limited = await hit(db, `img:${ipHash}`, 900, 60);
    const perImage = await hit(db, `img:${ipHash}:${id}`, 60, 60);
    if (!limited.allowed || !perImage.allowed) return deny(429, "rate");
    if (!isAllowedWidth(w)) return deny(400, "width");
    const t = verifyImageToken(url.searchParams.get("t"), tokenSecrets(deps.env), { id, width: w });
    if (!t.ok) return deny(403, `token-${t.reason}`);
    viewer = t.payload.v;
    if (studio && !viewer) return deny(403, "token-viewer");
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

  const d = pickDerivative(source.derivatives, w, request.headers.get("accept") ?? "");
  let obj = await source.get(d.key);
  if (!obj) return deny(404, "file");
  const mark = db ? await watermarkFor({ ...deps, db }) : null;
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
  if (studio && db && viewer && (d.format === "webp" || d.format === "avif") && request.method === "GET") {
    const code = viewerCode(viewer);
    obj = { body: await embedViewerCode(obj.body, code, d.format), contentType: obj.contentType };
    const seen = await hit(db, `view:${viewer}:${id}`, 1, 3600);
    if (seen.allowed)
      await db
        .insert(schema.studioViewEvents)
        .values({ mediaId: id, viewer, code: codeHex(code), ipHash: clientIpHash(request.headers) })
        .catch(() => {});
  }
  const headers: Record<string, string> = {
    "Content-Type": obj.contentType || (d.format === "avif" ? "image/avif" : "image/webp"),
    "Content-Disposition": "inline",
    "X-Content-Type-Options": "nosniff",
    "X-Robots-Tag": "noai, noimageai",
    "Content-Length": String(obj.body.byteLength),
    Vary: "Accept",
  };
  if (needsToken) {
    // Studio photographs are never cached; other photographs only privately and briefly (the URL carries a token).
    headers["Cache-Control"] = studio || deps.publicTier ? "private, no-store" : "private, max-age=120";
    headers["Cross-Origin-Resource-Policy"] = "same-site";
    headers.Vary = "Accept, Sec-Fetch-Dest, Sec-Fetch-Site";
  } else {
    // Hub legacy tier. `v` changes when an image is replaced in place, so a long cache is safe.
    headers["Cache-Control"] = url.searchParams.has("v")
      ? "public, max-age=86400, stale-while-revalidate=604800"
      : "public, max-age=300";
  }
  return new Response(request.method === "HEAD" ? null : Buffer.from(obj.body), { status: 200, headers });
}

async function watermarkFor(deps: ServeDeps & { db: Database }) {
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
 * `POST /api/img/token` with `{ ids: [uuid, ...] }` (up to 40) or `{ id }`: signed tokens, one per allowed width, for
 * pages that render photographs without tokens in their HTML (the page stays cacheable) or that have been open longer
 * than a token lives. Same-origin browser requests only, never known scrapers, rate limited. Photographs in client
 * galleries only get tokens when `studioViewer` recognizes a client session for them, and those tokens are viewer-bound.
 * Response: `{ tokensById: { [id]: { [width]: token } } }`, plus `{ tokens }` for a single `id`.
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
  const body = (await request.json().catch(() => null)) as { id?: unknown; ids?: unknown } | null;
  const ids = Array.isArray(body?.ids)
    ? (body.ids as unknown[]).filter((x): x is string => typeof x === "string")
    : typeof body?.id === "string"
      ? [body.id]
      : [];
  if (!ids.length || ids.length > 40 || ids.some((i) => !UUID.test(i))) return json(400, { error: "id" });
  const db = deps.db ?? null;
  const ipHash = clientIpHash(request.headers);
  if (!(await hit(db, `imgtok:${ipHash}`, 600, 60)).allowed) return json(429, { error: "rate" });
  const secrets = tokenSecrets(deps.env);
  if (!secrets.length) return json(503, { error: "not configured" });
  const tokensById: Record<string, Record<number, string>> = {};
  for (const id of new Set(ids)) {
    if (deps.publicTier) {
      if (db && (await isStrictImage(db, id))) tokensById[id] = mintAllWidths({ id, secrets });
      continue;
    }
    if (deps.resolveStatic?.(id)) {
      tokensById[id] = mintAllWidths({ id, secrets });
      continue;
    }
    if (!db) continue;
    if (await isStudioImage(db, id)) {
      const viewer = await deps.studioViewer?.(request, id);
      if (viewer) tokensById[id] = mintAllWidths({ id, viewer, secrets });
      continue;
    }
    const [m] = await db
      .select({ id: schema.media.id })
      .from(schema.media)
      .where(and(eq(schema.media.id, id), isNull(schema.media.deletedAt)))
      .limit(1);
    if (m) tokensById[id] = mintAllWidths({ id, secrets });
  }
  if (!Object.keys(tokensById).length) return json(404, { error: "not protected" });
  const only = ids.length === 1 ? tokensById[ids[0]] : undefined;
  return json(200, { tokensById, ...(only ? { tokens: only } : {}) });
}
