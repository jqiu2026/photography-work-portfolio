import type { ExtEvent, ExtPhoto, ExternalGallerySource, Tokens } from "./types";

/**
 * ShootProof Studio API adapter, written against the published OpenAPI document (developer.shootproof.com/oas/studio.json)
 * and the authorization guide: three-legged OAuth 2.0 (authorization code), refresh tokens, 2-week access tokens,
 * `Accept: application/vnd.shootproof+json`, paged collections `{ items, meta }`.
 *
 * It is never constructed without a client id (requested from support@shootproof.com) and has not been run against the
 * live service: see docs/shootproof-bridge.md for what to verify at first connection.
 */
const AUTH = "https://auth.shootproof.com/oauth2/authorization";
const API = "https://api.shootproof.com/studio";
const MEDIA = "application/vnd.shootproof+json";
export const MAX_DOWNLOAD_BYTES = 25 * 1024 * 1024;

/** Only https, and only hosts we expect photo files to live on (ShootProof's own domains plus an explicit env list). */
export function isAllowedPhotoUrl(raw: string, extraHosts: string[] = []): boolean {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  if (u.protocol !== "https:" || u.username || u.password || u.port) return false;
  const host = u.hostname.toLowerCase();
  if (/^[\d.]+$/.test(host) || host.includes(":") || host === "localhost") return false;
  const ok = ["shootproof.com", ...extraHosts.map((h) => h.toLowerCase())];
  return ok.some((h) => host === h || host.endsWith(`.${h}`));
}

type Page<T> = { items?: T[]; meta?: { currentPage?: number; totalPages?: number } };

export function createShootProof(opts: {
  clientId: string;
  scope?: string;
  extraHosts?: string[];
  fetchImpl?: typeof fetch;
}): ExternalGallerySource {
  const f = opts.fetchImpl ?? fetch;
  const scope = opts.scope ?? "studio";

  async function token(body: Record<string, string>): Promise<Tokens> {
    const res = await f(`${AUTH}/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams({ client_id: opts.clientId, scope, ...body }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error(`ShootProof token request failed (${res.status})`);
    const j = (await res.json()) as { access_token?: string; refresh_token?: string; expires_in?: number };
    if (!j.access_token || !j.refresh_token) throw new Error("ShootProof returned an unexpected token response");
    return {
      accessToken: j.access_token,
      refreshToken: j.refresh_token,
      expiresAt: Date.now() + (j.expires_in ?? 1_209_600) * 1000,
    };
  }

  async function get<T>(accessToken: string, path: string): Promise<T> {
    const res = await f(`${API}${path}`, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: MEDIA },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) throw new Error(`ShootProof API error ${res.status} for ${path.split("?")[0]}`);
    return (await res.json()) as T;
  }

  /** All pages of a collection, capped so a huge studio cannot make one request unbounded. */
  async function all<T>(accessToken: string, path: string, maxPages = 10): Promise<T[]> {
    const out: T[] = [];
    for (let page = 1; page <= maxPages; page++) {
      const j = await get<Page<T>>(accessToken, `${path}${path.includes("?") ? "&" : "?"}page=${page}&rows=100`);
      out.push(...(j.items ?? []));
      if (!j.meta?.totalPages || page >= j.meta.totalPages) break;
    }
    return out;
  }

  return {
    id: "shootproof",
    mode: "live",
    authorizeUrl(state, redirectUri) {
      const u = new URL(`${AUTH}/new`);
      u.search = new URLSearchParams({
        response_type: "code",
        client_id: opts.clientId,
        redirect_uri: redirectUri,
        scope,
        state,
      }).toString();
      return u.toString();
    },
    exchangeCode: (code, redirectUri) => token({ grant_type: "authorization_code", code, redirect_uri: redirectUri }),
    refresh: (refreshToken) => token({ grant_type: "refresh_token", refresh_token: refreshToken }),
    async listEvents(accessToken) {
      const brands = await all<{ id: string | number }>(accessToken, "/brand");
      const events: ExtEvent[] = [];
      for (const b of brands) {
        const items = await all<{ id: string | number; name?: string; photosCount?: number; eventDate?: string }>(
          accessToken,
          `/brand/${encodeURIComponent(String(b.id))}/event`,
        );
        for (const e of items)
          events.push({
            id: String(e.id),
            brandId: String(b.id),
            name: e.name ?? `Event ${e.id}`,
            photosCount: e.photosCount ?? 0,
            date: e.eventDate ?? undefined,
          });
      }
      return events;
    },
    async listPhotos(accessToken, brandId, eventId) {
      const items = await all<{
        id: string | number;
        name?: string;
        width?: number;
        height?: number;
        displayUrl?: Record<string, string | null | undefined>;
      }>(accessToken, `/brand/${encodeURIComponent(brandId)}/event/${encodeURIComponent(eventId)}/photo`);
      const photos: ExtPhoto[] = [];
      for (const p of items) {
        const d = p.displayUrl ?? {};
        // Prefer a large display size; never the original (a separate endpoint we do not call).
        const url = d.large ?? d.mediumLarge ?? d.medium ?? d.small;
        if (!url) continue;
        photos.push({
          id: String(p.id),
          eventId,
          brandId,
          name: p.name ?? String(p.id),
          width: p.width ?? 0,
          height: p.height ?? 0,
          url,
        });
      }
      return photos;
    },
    async download(_accessToken, photo) {
      if (!isAllowedPhotoUrl(photo.url, opts.extraHosts))
        throw new Error("Refusing to download from an unexpected host");
      // Display URLs are public CDN links: no Authorization header is sent to them.
      const res = await f(photo.url, { redirect: "error", signal: AbortSignal.timeout(30_000) });
      if (!res.ok || !res.body) throw new Error(`Photo download failed (${res.status})`);
      const declared = Number(res.headers.get("content-length") ?? 0);
      if (declared > MAX_DOWNLOAD_BYTES) throw new Error("Photo is too large");
      const chunks: Uint8Array[] = [];
      let size = 0;
      for await (const chunk of res.body as unknown as AsyncIterable<Uint8Array>) {
        size += chunk.byteLength;
        if (size > MAX_DOWNLOAD_BYTES) throw new Error("Photo is too large");
        chunks.push(chunk);
      }
      return Buffer.concat(chunks);
    },
  };
}
