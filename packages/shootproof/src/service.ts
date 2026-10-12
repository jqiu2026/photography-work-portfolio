import { randomBytes, randomUUID } from "node:crypto";
import { type Database, hitRateLimit, schema } from "@jerryqiu/db";
import { processImage } from "@jerryqiu/media";
import {
  clientIpHash,
  decrypt,
  encrypt,
  isAllowedWidth,
  isBlockedBot,
  tokenSecrets,
  verifyImageToken,
} from "@jerryqiu/protect";
import type { StorageProvider } from "@jerryqiu/storage";
import { and, eq, gt, lt } from "drizzle-orm";
import { createMockShootProof } from "./mock";
import { createShootProof } from "./shootproof";
import type { ExternalGallerySource, Tokens } from "./types";

const PROVIDER = "shootproof";
export const DEFAULT_TTL_HOURS = 24;
export const MAX_PHOTOS_PER_IMPORT = 60;

export type SourceState = { state: "unconfigured" } | { state: "ready"; source: ExternalGallerySource };

/**
 * Which source is available. No client id and no mock flag means the feature shows "Not connected" with setup steps and
 * the live API is never contacted. The mock source (generated fixtures) is refused in production builds.
 */
export function sourceFromEnv(env: Record<string, string | undefined> = process.env): SourceState {
  if (env.SHOOTPROOF_MODE === "mock" && env.NODE_ENV !== "production")
    return { state: "ready", source: createMockShootProof() };
  const clientId = env.SHOOTPROOF_CLIENT_ID?.trim();
  if (!clientId) return { state: "unconfigured" };
  return {
    state: "ready",
    source: createShootProof({
      clientId,
      scope: env.SHOOTPROOF_SCOPE?.trim() || undefined,
      extraHosts: (env.SHOOTPROOF_IMAGE_HOSTS ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    }),
  };
}

export const newOAuthState = () => randomBytes(24).toString("base64url");

/* ---------- encrypted tokens ---------- */

export async function saveTokens(db: Database, t: Tokens) {
  const data = encrypt(JSON.stringify(t));
  await db
    .insert(schema.externalConnections)
    .values({ provider: PROVIDER, data })
    .onConflictDoUpdate({ target: schema.externalConnections.provider, set: { data, updatedAt: new Date() } });
}

export async function loadTokens(db: Database): Promise<Tokens | null> {
  const [row] = await db
    .select()
    .from(schema.externalConnections)
    .where(eq(schema.externalConnections.provider, PROVIDER))
    .limit(1);
  if (!row) return null;
  const plain = decrypt(row.data);
  if (!plain) return null; // tampered, or AUTH_SECRET changed: treat as not connected
  try {
    const t = JSON.parse(plain) as Tokens;
    return typeof t.accessToken === "string" && typeof t.refreshToken === "string" ? t : null;
  } catch {
    return null;
  }
}

export async function disconnect(db: Database) {
  await db.delete(schema.externalConnections).where(eq(schema.externalConnections.provider, PROVIDER));
}

/** A usable access token, refreshing (and storing the replacement refresh token) when it expires within a day. */
export async function accessToken(
  db: Database,
  source: ExternalGallerySource,
  now = Date.now(),
): Promise<string | null> {
  const t = await loadTokens(db);
  if (!t) return null;
  if (t.expiresAt - now > 86_400_000) return t.accessToken;
  try {
    const next = await source.refresh(t.refreshToken);
    await saveTokens(db, next);
    return next.accessToken;
  } catch {
    return t.expiresAt > now ? t.accessToken : null;
  }
}

/* ---------- temporary import ---------- */

export type ImportResult = { imported: number; failed: number; capped: boolean };

/**
 * Pulls one event's photos as downscaled derivatives for temporary display. Only a single WebP (up to 1600 px) is kept per
 * photo, never an original, and each row expires (default 24 hours) and is purged by the cron route.
 */
export async function importEvent(
  deps: { db: Database; store: StorageProvider; source: ExternalGallerySource; ttlHours?: number; now?: number },
  brandId: string,
  eventId: string,
): Promise<ImportResult> {
  const { db, store, source } = deps;
  const token = await accessToken(db, source);
  if (!token) throw new Error("ShootProof is not connected");
  const now = deps.now ?? Date.now();
  const expiresAt = new Date(now + (deps.ttlHours ?? DEFAULT_TTL_HOURS) * 3_600_000);
  const all = await source.listPhotos(token, brandId, eventId);
  const photos = all.slice(0, MAX_PHOTOS_PER_IMPORT);
  let imported = 0;
  let failed = 0;
  for (const photo of photos) {
    try {
      const bytes = await source.download(token, photo);
      const p = await processImage(bytes);
      const webp = p.derivatives
        .filter((d) => d.format === "webp" && d.width <= 1600)
        .sort((a, b) => b.width - a.width)[0];
      if (!webp) throw new Error("no derivative");
      const externalId = `${brandId}:${eventId}:${photo.id}`;
      const key = `ext/shootproof/${randomUUID()}.webp`;
      await store.put(key, webp.buffer, { contentType: "image/webp" });
      const [prev] = await db
        .select()
        .from(schema.externalCache)
        .where(and(eq(schema.externalCache.provider, PROVIDER), eq(schema.externalCache.externalId, externalId)))
        .limit(1);
      const height = Math.round((p.height / p.width) * webp.width);
      await db
        .insert(schema.externalCache)
        .values({
          provider: PROVIDER,
          externalId,
          title: photo.name,
          storageKey: key,
          width: webp.width,
          height,
          expiresAt,
        })
        .onConflictDoUpdate({
          target: [schema.externalCache.provider, schema.externalCache.externalId],
          set: { title: photo.name, storageKey: key, width: webp.width, height, expiresAt },
        });
      if (prev) await store.delete(prev.storageKey).catch(() => {});
      imported++;
    } catch (error) {
      console.error("[shootproof] could not import a photo", String(error));
      failed++;
    }
  }
  return { imported, failed, capped: all.length > photos.length };
}

export async function listCached(db: Database, now = new Date()) {
  return db
    .select()
    .from(schema.externalCache)
    .where(and(eq(schema.externalCache.provider, PROVIDER), gt(schema.externalCache.expiresAt, now)))
    .orderBy(schema.externalCache.externalId);
}

/** Removes expired rows and their files. Returns how many were purged. */
export async function purgeExpiredExternal(db: Database, store: StorageProvider, now = new Date()): Promise<number> {
  const rows = await db.select().from(schema.externalCache).where(lt(schema.externalCache.expiresAt, now));
  for (const r of rows) {
    await store.delete(r.storageKey).catch(() => {});
    await db.delete(schema.externalCache).where(eq(schema.externalCache.id, r.id));
  }
  return rows.length;
}

export async function removeCached(db: Database, store: StorageProvider, id: string) {
  const [row] = await db.select().from(schema.externalCache).where(eq(schema.externalCache.id, id)).limit(1);
  if (!row) return false;
  await store.delete(row.storageKey).catch(() => {});
  await db.delete(schema.externalCache).where(eq(schema.externalCache.id, id));
  return true;
}

/* ---------- serving cached photos ---------- */

/**
 * `GET /api/ext/[id]?w=&t=`: always strict. A valid token bound to this id, same-site fetch metadata, rate limit, no
 * scrapers, and the row must not have expired. Private, uncacheable.
 */
export async function serveCached(
  request: Request,
  id: string,
  deps: { db: Database; store: StorageProvider; env?: Record<string, string | undefined>; now?: Date },
): Promise<Response> {
  const deny = (status: number, why: string) =>
    new Response(null, { status, headers: { "Cache-Control": "no-store", "X-Denied": why } });
  if (request.method !== "GET") return deny(405, "method");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return deny(404, "id");
  if (isBlockedBot(request.headers.get("user-agent"))) return deny(403, "bot");
  const url = new URL(request.url);
  const w = Number(url.searchParams.get("w"));
  if (!isAllowedWidth(w)) return deny(400, "width");
  const limited = await hitRateLimit(deps.db, `ext:${clientIpHash(request.headers)}`, 300, 60);
  if (!limited.allowed) return deny(429, "rate");
  const t = verifyImageToken(url.searchParams.get("t"), tokenSecrets(deps.env), { id, width: w });
  if (!t.ok) return deny(403, `token-${t.reason}`);
  const site = request.headers.get("sec-fetch-site");
  const dest = request.headers.get("sec-fetch-dest");
  if (site && !["same-origin", "same-site"].includes(site)) return deny(403, "site");
  if (dest && !["image", "empty"].includes(dest)) return deny(403, "dest");
  const [row] = await deps.db
    .select()
    .from(schema.externalCache)
    .where(and(eq(schema.externalCache.id, id), gt(schema.externalCache.expiresAt, deps.now ?? new Date())))
    .limit(1);
  if (!row) return deny(404, "missing");
  const obj = await deps.store.get(row.storageKey);
  if (!obj) return deny(404, "file");
  return new Response(Buffer.from(obj.body), {
    headers: {
      "Content-Type": "image/webp",
      "Content-Disposition": "inline",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, noai, noimageai",
      "Cross-Origin-Resource-Policy": "same-site",
    },
  });
}
