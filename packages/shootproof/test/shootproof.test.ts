import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { type Database, schema } from "@jerryqiu/db";
import { signImageToken } from "@jerryqiu/protect";
import { localStorageProvider } from "@jerryqiu/storage";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { beforeAll, describe, expect, it } from "vitest";
import {
  accessToken,
  createMockShootProof,
  createShootProof,
  importEvent,
  isAllowedPhotoUrl,
  listCached,
  loadTokens,
  purgeExpiredExternal,
  saveTokens,
  serveCached,
  sourceFromEnv,
} from "../src";

process.env.AUTH_SECRET = "test-secret-0123456789-abcdef";
const migrations = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../db/drizzle");
let db: Database;
let store: ReturnType<typeof localStorageProvider>;

beforeAll(async () => {
  const d = drizzle(await PGlite.create(), { schema, casing: "snake_case" });
  await migrate(d, { migrationsFolder: migrations });
  db = d as unknown as Database;
  store = localStorageProvider({
    dir: await mkdtemp(path.join(os.tmpdir(), "jq-sp-")),
    secret: "s",
    baseUrl: "http://x",
    store: "public",
  });
});

describe("configuration", () => {
  it("without a client id the feature is unconfigured and nothing is constructed", () => {
    expect(sourceFromEnv({}).state).toBe("unconfigured");
    expect(sourceFromEnv({ SHOOTPROOF_CLIENT_ID: "  " }).state).toBe("unconfigured");
  });
  it("mock mode works outside production and is refused in production", () => {
    const dev = sourceFromEnv({ SHOOTPROOF_MODE: "mock", NODE_ENV: "development" });
    expect(dev.state === "ready" && dev.source.mode).toBe("mock");
    expect(sourceFromEnv({ SHOOTPROOF_MODE: "mock", NODE_ENV: "production" }).state).toBe("unconfigured");
  });
  it("a client id creates the live adapter", () => {
    const s = sourceFromEnv({ SHOOTPROOF_CLIENT_ID: "abc" });
    expect(s.state === "ready" && s.source.mode).toBe("live");
  });
});

describe("photo URL allow-list (SSRF guard)", () => {
  it("accepts https ShootProof hosts and listed extras only", () => {
    expect(isAllowedPhotoUrl("https://cdn.shootproof.com/a.jpg")).toBe(true);
    expect(isAllowedPhotoUrl("https://img.example.net/a.jpg", ["example.net"])).toBe(true);
  });
  it("rejects http, other hosts, lookalikes, IPs, localhost, credentials, ports and junk", () => {
    for (const u of [
      "http://cdn.shootproof.com/a.jpg",
      "https://evil.com/a.jpg",
      "https://shootproof.com.evil.com/a.jpg",
      "https://evilshootproof.com/a.jpg",
      "https://127.0.0.1/a.jpg",
      "https://169.254.169.254/latest",
      "https://localhost/a.jpg",
      "https://user:pw@cdn.shootproof.com/a.jpg",
      "https://cdn.shootproof.com:8443/a.jpg",
      "file:///etc/passwd",
      "not a url",
    ])
      expect(isAllowedPhotoUrl(u), u).toBe(false);
  });
});

describe("live adapter (against a fake fetch, never the network)", () => {
  const calls: { url: string; init?: RequestInit }[] = [];
  const fake = (async (url: string | URL, init?: RequestInit) => {
    const u = String(url);
    calls.push({ url: u, init });
    const json = (b: unknown, status = 200) =>
      new Response(JSON.stringify(b), { status, headers: { "content-type": "application/json" } });
    if (u.endsWith("/token")) return json({ access_token: "A1", refresh_token: "R1", expires_in: 1209600 });
    if (u.includes("/studio/brand?")) return json({ items: [{ id: 7 }], meta: { currentPage: 1, totalPages: 1 } });
    if (u.includes("/brand/7/event?page=1"))
      return json({
        items: [{ id: 11, name: "Recital", photosCount: 2, eventDate: "2026-04-12" }],
        meta: { currentPage: 1, totalPages: 2 },
      });
    if (u.includes("/brand/7/event?page=2"))
      return json({ items: [{ id: 12, name: "Fair" }], meta: { currentPage: 2, totalPages: 2 } });
    if (u.includes("/event/11/photo"))
      return json({
        items: [
          {
            id: 1,
            name: "a",
            width: 10,
            height: 5,
            displayUrl: { small: "https://cdn.shootproof.com/s.jpg", large: "https://cdn.shootproof.com/l.jpg" },
          },
          { id: 2, displayUrl: {} },
        ],
        meta: { totalPages: 1 },
      });
    if (u === "https://cdn.shootproof.com/l.jpg") return new Response(new Uint8Array([1, 2, 3]));
    return json({}, 404);
  }) as typeof fetch;
  const sp = createShootProof({ clientId: "cid", fetchImpl: fake });

  it("builds the documented authorize URL with state and the studio scope", () => {
    const u = new URL(sp.authorizeUrl("st4te", "https://photos.example/cb"));
    expect(`${u.origin}${u.pathname}`).toBe("https://auth.shootproof.com/oauth2/authorization/new");
    expect(Object.fromEntries(u.searchParams)).toEqual({
      response_type: "code",
      client_id: "cid",
      redirect_uri: "https://photos.example/cb",
      scope: "studio",
      state: "st4te",
    });
  });
  it("exchanges a code and refreshes with the documented grant types", async () => {
    const t = await sp.exchangeCode("code1", "https://photos.example/cb");
    expect(t.accessToken).toBe("A1");
    expect(t.expiresAt).toBeGreaterThan(Date.now() + 13 * 86_400_000);
    await sp.refresh("R0");
    const bodies = calls
      .filter((c) => c.url.endsWith("/token"))
      .map((c) => new URLSearchParams(String(c.init?.body)).get("grant_type"));
    expect(bodies).toEqual(["authorization_code", "refresh_token"]);
  });
  it("follows pagination, sends the bearer token and ShootProof media type, and picks the large display size", async () => {
    const events = await sp.listEvents("A1");
    expect(events.map((e) => e.id)).toEqual(["11", "12"]);
    const first = calls.find((c) => c.url.includes("/brand?"));
    expect((first?.init?.headers as Record<string, string>).Authorization).toBe("Bearer A1");
    expect((first?.init?.headers as Record<string, string>).Accept).toBe("application/vnd.shootproof+json");
    const photos = await sp.listPhotos("A1", "7", "11");
    expect(photos).toHaveLength(1); // the one without a display URL is skipped
    expect(photos[0].url).toBe("https://cdn.shootproof.com/l.jpg");
    expect(calls.some((c) => c.url.includes("/original"))).toBe(false); // originals are never requested
  });
  it("downloads allowed URLs without credentials and refuses other hosts and redirects", async () => {
    const buf = await sp.download("A1", {
      id: "1",
      eventId: "11",
      brandId: "7",
      name: "a",
      width: 1,
      height: 1,
      url: "https://cdn.shootproof.com/l.jpg",
    });
    expect([...buf]).toEqual([1, 2, 3]);
    const dl = calls.find((c) => c.url === "https://cdn.shootproof.com/l.jpg");
    expect(JSON.stringify(dl?.init?.headers ?? {})).not.toContain("Bearer");
    expect((dl?.init as RequestInit).redirect).toBe("error");
    await expect(
      sp.download("A1", {
        id: "1",
        eventId: "1",
        brandId: "1",
        name: "x",
        width: 1,
        height: 1,
        url: "https://evil.com/x.jpg",
      }),
    ).rejects.toThrow(/unexpected host/);
  });
  it("reports API errors without leaking the token", async () => {
    const bad = createShootProof({
      clientId: "cid",
      fetchImpl: (async () => new Response("no", { status: 401 })) as typeof fetch,
    });
    await expect(bad.listEvents("SECRET-TOKEN")).rejects.toThrow(/401/);
    await bad.listEvents("SECRET-TOKEN").catch((e) => expect(String(e)).not.toContain("SECRET-TOKEN"));
  });
});

describe("stored connection", () => {
  it("encrypts tokens at rest, survives a round trip, and treats tampering as not connected", async () => {
    await saveTokens(db, {
      accessToken: "ACCESS-PLAIN",
      refreshToken: "REFRESH-PLAIN",
      expiresAt: Date.now() + 14 * 86_400_000,
    });
    const [row] = await db.select().from(schema.externalConnections);
    expect(row.data).not.toContain("ACCESS-PLAIN");
    expect(row.data).not.toContain("REFRESH-PLAIN");
    expect((await loadTokens(db))?.accessToken).toBe("ACCESS-PLAIN");
    await db.update(schema.externalConnections).set({ data: `${row.data.slice(0, -2)}xx` });
    expect(await loadTokens(db)).toBeNull();
  });
  it("refreshes a token that expires within a day and stores the replacement", async () => {
    await saveTokens(db, { accessToken: "OLD", refreshToken: "R", expiresAt: Date.now() + 3_600_000 });
    const mock = createMockShootProof();
    expect(await accessToken(db, mock)).toBe("mock-access");
    expect((await loadTokens(db))?.accessToken).toBe("mock-access");
  });
  it("returns null when expired and the refresh fails", async () => {
    await saveTokens(db, { accessToken: "OLD", refreshToken: "R", expiresAt: Date.now() - 1000 });
    const broken = {
      ...createMockShootProof(),
      refresh: async () => {
        throw new Error("denied");
      },
    };
    expect(await accessToken(db, broken)).toBeNull();
  });
});

describe("temporary import", () => {
  it("imports an event as derivatives only, with an expiry, and re-importing replaces files", async () => {
    await saveTokens(db, {
      accessToken: "mock-access",
      refreshToken: "mock-refresh",
      expiresAt: Date.now() + 14 * 86_400_000,
    });
    const source = createMockShootProof();
    const r = await importEvent({ db, store, source }, "1", "9001");
    expect(r).toEqual({ imported: 3, failed: 0, capped: false });
    const rows = await listCached(db);
    expect(rows).toHaveLength(3);
    for (const row of rows) {
      expect(row.storageKey).toMatch(/^ext\/shootproof\/[0-9a-f-]+\.webp$/);
      expect(row.width).toBeLessThanOrEqual(1600);
      const hours = (row.expiresAt.getTime() - Date.now()) / 3_600_000;
      expect(hours).toBeGreaterThan(23);
      expect(hours).toBeLessThanOrEqual(24.01);
      expect(await store.head(row.storageKey)).not.toBeNull();
    }
    const before = rows.map((x) => x.storageKey);
    await importEvent({ db, store, source }, "1", "9001");
    const after = await listCached(db);
    expect(after).toHaveLength(3); // upserted, not duplicated
    for (const k of before) expect(await store.head(k)).toBeNull(); // old files removed
  });
  it("purges expired rows and their files, and keeps live ones", async () => {
    const source = createMockShootProof();
    await importEvent({ db, store, source }, "1", "9002");
    const all = await db.select().from(schema.externalCache);
    const old = all.find((r) => r.externalId.includes("9002"));
    await db
      .update(schema.externalCache)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(eq(schema.externalCache.id, (old as { id: string }).id));
    expect(await purgeExpiredExternal(db, store)).toBe(1);
    expect(await store.head((old as { storageKey: string }).storageKey)).toBeNull();
    expect((await db.select().from(schema.externalCache)).length).toBe(all.length - 1);
  });
});

describe("serving cached photos", () => {
  const secrets = [process.env.AUTH_SECRET as string];
  const UA = "Mozilla/5.0 Safari";
  const get = (id: string, qs: string, h: Record<string, string> = {}, now?: Date) =>
    serveCached(new Request(`http://studio.test/api/ext/${id}?${qs}`, { headers: { "user-agent": UA, ...h } }), id, {
      db,
      store,
      now,
    });
  it("needs a valid token, refuses forgery/bots/cross-site, and stops serving after expiry", async () => {
    const [row] = await listCached(db);
    const t = signImageToken({ id: row.id, width: 960, ttl: 300, secrets });
    const ok = await get(row.id, `w=960&t=${t}`, { "sec-fetch-site": "same-origin" });
    expect(ok.status).toBe(200);
    expect(ok.headers.get("cache-control")).toBe("private, no-store");
    expect((await get(row.id, "w=960")).status).toBe(403);
    expect((await get(row.id, `w=960&t=${t}x`)).status).toBe(403);
    expect((await get(row.id, `w=480&t=${t}`)).status).toBe(403);
    expect((await get(row.id, `w=960&t=${t}`, { "sec-fetch-site": "cross-site" })).status).toBe(403);
    expect((await get(row.id, `w=960&t=${t}`, { "user-agent": "GPTBot" })).status).toBe(403);
    const later = new Date(row.expiresAt.getTime() + 1000);
    expect((await get(row.id, `w=960&t=${t}`, {}, later)).status).toBe(404);
  });
});
