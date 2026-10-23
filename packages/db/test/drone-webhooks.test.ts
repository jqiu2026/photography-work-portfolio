import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { beforeAll, describe, expect, it } from "vitest";
import type { Database } from "../src/client";
import * as drone from "../src/drone";
import * as schema from "../src/schema";
import * as st from "../src/studio";
import * as hooks from "../src/webhooks";

const here = path.dirname(fileURLToPath(import.meta.url));
let db: Database;
let jobId: string;
beforeAll(async () => {
  const d = drizzle(await PGlite.create(), { schema, casing: "snake_case" });
  await migrate(d, { migrationsFolder: path.join(here, "../drizzle") });
  db = d as unknown as Database;
  const c = await st.createClient(db, { name: "Drone Client", email: "drone@example.com" });
  jobId = (await st.createJob(db, { clientId: c.id, title: "Roof inspection" })).id;
});

describe("drone go or no-go", () => {
  it("is a go inside the limits, careful when the wind is up, and no-go for gusts, rain or low visibility", () => {
    expect(drone.droneVerdict({ windMph: 8, gustMph: 12, visibilityMi: 10 }).decision).toBe("go");
    expect(drone.droneVerdict({ windMph: 17, visibilityMi: 10 }).decision).toBe("caution");
    expect(drone.droneVerdict({ windMph: 21 }).decision).toBe("no-go");
    expect(drone.droneVerdict({ windMph: 5, gustMph: 30 }).decision).toBe("no-go");
    expect(drone.droneVerdict({ windMph: 5, visibilityMi: 2 }).decision).toBe("no-go");
    expect(drone.droneVerdict({ windMph: 5, precipitation: true }).decision).toBe("no-go");
    expect(drone.droneVerdict({}).decision).toBe("caution");
  });
  it("a go needs every item done and weather that is not a no-go", async () => {
    const items = drone.DRONE_ITEMS.map((text) => ({ text, done: true }));
    await expect(
      drone.saveChecklist(db, jobId, { items: [{ text: "x", done: false }], weather: { windMph: 5 }, decision: "go" }),
    ).rejects.toThrow("every checklist item");
    await expect(drone.saveChecklist(db, jobId, { items, weather: { windMph: 30 }, decision: "go" })).rejects.toThrow(
      "no-go",
    );
    await expect(drone.saveChecklist(db, jobId, { items, weather: { windMph: 500 } })).rejects.toThrow("between");
    const ok = await drone.saveChecklist(db, jobId, {
      items,
      weather: { windMph: 6, visibilityMi: 10 },
      decision: "go",
    });
    expect(ok?.decision).toBe("go");
    expect(ok?.decidedAt).toBeInstanceOf(Date);
    // saving again replaces it
    const again = await drone.saveChecklist(db, jobId, { items, weather: { windMph: 6 }, decision: null });
    expect(again?.decision).toBeNull();
    expect((await drone.getChecklist(db, jobId))?.items).toHaveLength(items.length);
  });
});

describe("outgoing webhooks", () => {
  it("only https addresses on the internet are accepted", () => {
    for (const u of ["https://example.com/hook", "https://hooks.zapier.com/abc"])
      expect(hooks.safeWebhookUrl(u)).toBe(true);
    for (const u of [
      "http://example.com",
      "https://localhost/x",
      "https://127.0.0.1/x",
      "https://10.0.0.5/x",
      "https://192.168.1.2/x",
      "https://172.16.0.1/x",
      "https://169.254.169.254/latest",
      "https://[::1]/x",
      "https://thing.local/x",
      "https://user:pw@example.com/x",
      "not a url",
    ])
      expect(hooks.safeWebhookUrl(u)).toBe(false);
  });
  it("sends a signed message to endpoints that asked for the event, and logs each answer", async () => {
    const h = await hooks.addWebhook(db, { url: "https://example.com/hook", events: ["inquiry.created"] });
    await hooks.addWebhook(db, { url: "https://example.org/other", events: ["payment.succeeded"] });
    expect(h.secret.startsWith("whsec_")).toBe(true);
    const seen: { url: string; headers: Record<string, string>; body: string }[] = [];
    const fake = (async (url: string, init: RequestInit) => {
      seen.push({ url, headers: init.headers as Record<string, string>, body: String(init.body) });
      return new Response("ok", { status: 200 });
    }) as unknown as typeof fetch;
    const now = new Date("2027-03-01T12:00:00Z");
    expect(await hooks.emit(db, "inquiry.created", { name: "Pat" }, fake, now)).toBe(1);
    expect(seen).toHaveLength(1);
    const first = seen[0] as (typeof seen)[number];
    expect(first.url).toBe("https://example.com/hook");
    const t = Math.floor(now.getTime() / 1000);
    expect(first.headers["X-Studio-Signature"]).toBe(`t=${t},v1=${hooks.sign(h.secret, t, first.body)}`);
    expect(JSON.parse(first.body)).toMatchObject({ event: "inquiry.created", data: { name: "Pat" } });
    expect((await hooks.recentDeliveries(db))[0]).toMatchObject({ event: "inquiry.created", status: 200, error: null });
  });
  it("a failing endpoint is logged and never throws; a switched-off one is skipped", async () => {
    const [h] = (await hooks.listWebhooks(db)).filter((x) => x.events.includes("inquiry.created"));
    const boom = (async () => {
      throw new Error("connection refused");
    }) as unknown as typeof fetch;
    await expect(hooks.emit(db, "inquiry.created", {}, boom)).resolves.toBe(1);
    expect((await hooks.recentDeliveries(db))[0]).toMatchObject({ status: null, error: "connection refused" });
    const bad = (async () => new Response("no", { status: 500 })) as unknown as typeof fetch;
    await hooks.emit(db, "inquiry.created", {}, bad);
    expect((await hooks.recentDeliveries(db))[0]).toMatchObject({ status: 500 });
    await hooks.setWebhookActive(db, (h as { id: string }).id, false);
    expect(await hooks.emit(db, "inquiry.created", {}, boom)).toBe(0);
  });
  it("refuses bad input", async () => {
    await expect(hooks.addWebhook(db, { url: "http://example.com", events: ["inquiry.created"] })).rejects.toThrow(
      "https",
    );
    await expect(hooks.addWebhook(db, { url: "https://example.com/x", events: ["nope"] })).rejects.toThrow(
      "at least one",
    );
  });
});
