import { createHmac, randomBytes } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import type { Database } from "./client";
import { StudioError } from "./errors";
import * as s from "./schema";

/**
 * Outgoing webhooks: the owner adds an https address and picks events; each time one happens the studio POSTs a small
 * JSON message signed with that endpoint's secret (header `X-Studio-Signature: t=<unix>,v1=<hex hmac of "t.body">`),
 * so the other side can check it is genuine and fresh. Addresses that point inside a network (localhost, private
 * ranges) are refused so a webhook cannot be used to probe the machine it runs on. Failures are logged, never thrown.
 */
export const WEBHOOK_EVENTS = [
  { id: "inquiry.created", label: "A new inquiry arrives" },
  { id: "payment.succeeded", label: "A payment succeeds" },
  { id: "gallery.published", label: "A gallery goes live" },
  { id: "order.paid", label: "A shop order is paid" },
] as const;
export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number]["id"];

const PRIVATE_HOST =
  /^(localhost|.*\.local|.*\.internal|.*\.localhost|0\.0\.0\.0|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1\]?$|\[?f[cd][0-9a-f]{2}:|\[?fe80:)/i;

/** True for an https address that is not a name or number inside a private network. */
export function safeWebhookUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    return u.protocol === "https:" && !u.username && !u.password && !PRIVATE_HOST.test(u.hostname);
  } catch {
    return false;
  }
}

export const sign = (secret: string, timestamp: number, body: string) =>
  createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");

export async function addWebhook(db: Database, input: { url: string; events: string[] }) {
  if (!safeWebhookUrl(input.url))
    throw new StudioError("Use an https address that is on the internet, not a private one.");
  const events = input.events.filter((e) => WEBHOOK_EVENTS.some((x) => x.id === e));
  if (!events.length) throw new StudioError("Pick at least one event.");
  const secret = `whsec_${randomBytes(24).toString("base64url")}`;
  const [row] = await db.insert(s.studioWebhooks).values({ url: input.url.trim(), secret, events }).returning();
  return row as s.StudioWebhook;
}
export async function listWebhooks(db: Database) {
  return db.select().from(s.studioWebhooks).orderBy(desc(s.studioWebhooks.createdAt));
}
export async function setWebhookActive(db: Database, id: string, active: boolean) {
  await db.update(s.studioWebhooks).set({ active }).where(eq(s.studioWebhooks.id, id));
}
export async function deleteWebhook(db: Database, id: string) {
  await db.delete(s.studioWebhooks).where(eq(s.studioWebhooks.id, id));
}
export async function recentDeliveries(db: Database, limit = 30) {
  return db
    .select({
      id: s.studioWebhookDeliveries.id,
      event: s.studioWebhookDeliveries.event,
      status: s.studioWebhookDeliveries.status,
      error: s.studioWebhookDeliveries.error,
      at: s.studioWebhookDeliveries.at,
      url: s.studioWebhooks.url,
    })
    .from(s.studioWebhookDeliveries)
    .innerJoin(s.studioWebhooks, eq(s.studioWebhooks.id, s.studioWebhookDeliveries.webhookId))
    .orderBy(desc(s.studioWebhookDeliveries.at))
    .limit(limit);
}

/**
 * Sends `event` to every active endpoint that asked for it, in parallel with a 5 second limit each, and logs the answer.
 * `fetchImpl` is injectable for tests. Never throws: a broken endpoint must not break the thing that happened.
 */
export async function emit(
  db: Database,
  event: WebhookEvent,
  data: Record<string, unknown>,
  fetchImpl: typeof fetch = fetch,
  now = new Date(),
): Promise<number> {
  let hooks: s.StudioWebhook[] = [];
  try {
    hooks = (await listWebhooks(db)).filter((h) => h.active && h.events.includes(event));
  } catch {
    return 0;
  }
  const body = JSON.stringify({ event, at: now.toISOString(), data });
  const t = Math.floor(now.getTime() / 1000);
  await Promise.all(
    hooks.map(async (h) => {
      let status: number | null = null;
      let error: string | null = null;
      try {
        if (!safeWebhookUrl(h.url)) throw new Error("The address is not allowed.");
        const res = await fetchImpl(h.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Studio-Event": event,
            "X-Studio-Signature": `t=${t},v1=${sign(h.secret, t, body)}`,
          },
          body,
          signal: AbortSignal.timeout(5000),
          redirect: "manual",
        });
        status = res.status;
        if (res.status >= 300) error = `The endpoint answered ${res.status}.`;
      } catch (e) {
        error = e instanceof Error ? e.message.slice(0, 200) : "Failed.";
      }
      await db
        .insert(s.studioWebhookDeliveries)
        .values({ webhookId: h.id, event, status, error })
        .catch(() => {});
    }),
  );
  return hooks.length;
}
