import { type Database, getDb, hitRateLimit, schema } from "@jerryqiu/db";
import { clientIpHash } from "@jerryqiu/protect";
import { sql } from "drizzle-orm";
import { z } from "zod";

type Site = "hub" | "photos" | "music" | "flying";

export const TOPICS = ["General", "Photography", "Music", "Flying", "Licensing a photograph", "Booking"] as const;

export const contactSchema = z.object({
  name: z.string().trim().min(1, "Please tell me your name.").max(120),
  email: z
    .string()
    .trim()
    .max(200)
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "That doesn't look like an email address."),
  topic: z.string().trim().max(60).default("General"),
  message: z.string().trim().min(5, "Say a little more so I know how to help.").max(5000),
  /** Honeypot: real visitors never see or fill this. */
  website: z.string().max(500).optional().default(""),
  turnstileToken: z.string().max(4000).optional(),
});
export type ContactInput = z.input<typeof contactSchema>;

export type ContactResult =
  | { ok: true }
  | { ok: false; status: number; error: string; fieldErrors?: Record<string, string> };

const linkCount = (s: string) => (s.match(/https?:\/\//gi) ?? []).length;

/** Cheap, explainable spam signals. Flagged messages are stored as `spam` (never emailed), not silently lost. */
export function looksLikeSpam(m: { message: string; name: string }): boolean {
  return linkCount(m.message) > 2 || /<\s*a\s+href|\[url=/i.test(m.message) || linkCount(m.name) > 0;
}

/** Strips CR/LF so user text can never inject mail headers. */
export const oneLine = (s: string) => s.replace(/[\r\n]+/g, " ").trim();

export async function verifyTurnstile(token: string | undefined, ip?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // optional: off unless configured
  if (!token) return false;
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip) body.set("remoteip", ip);
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body });
    const j = (await r.json()) as { success?: boolean };
    return j.success === true;
  } catch {
    return false;
  }
}

/** Email the owner through Resend when configured. Never throws and never blocks storing the message. */
export async function notifyOwner(m: { name: string; email: string; topic: string; message: string; site: Site }) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL;
  if (!key || !to || !from) return false;
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: m.email,
        subject: oneLine(`[${m.site}] ${m.topic}: ${m.name}`).slice(0, 200),
        text: `${m.message}\n\n-- ${oneLine(m.name)} <${m.email}>\nSent from the ${m.site} site contact form. Reply in the admin inbox or by email.`,
      }),
    });
    if (!r.ok) console.error("[inbox] Resend rejected the notification", r.status);
    return r.ok;
  } catch (error) {
    console.error("[inbox] notification failed", error);
    return false;
  }
}

export async function submitContact(
  db: Database,
  raw: unknown,
  ctx: { site: Site; ipHash: string; ip?: string },
): Promise<ContactResult> {
  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0] ?? "form")] ??= i.message;
    return { ok: false, status: 400, error: "Please check the form.", fieldErrors };
  }
  const v = parsed.data;
  if (v.website) return { ok: true }; // bot: pretend it worked, store nothing
  const limited = await hitRateLimit(db, `contact:${ctx.ipHash}`, 5, 600);
  const global = await hitRateLimit(db, "contact:all", 300, 3600);
  if (!limited.allowed || !global.allowed)
    return { ok: false, status: 429, error: "Too many messages. Please try again later." };
  if (!(await verifyTurnstile(v.turnstileToken, ctx.ip)))
    return { ok: false, status: 400, error: "The spam check failed. Reload the page and try again." };

  const spam = looksLikeSpam(v);
  await db.insert(schema.inboxMessages).values({
    site: ctx.site,
    name: v.name,
    email: v.email.toLowerCase(),
    topic: v.topic,
    message: v.message,
    status: spam ? "spam" : "new",
    ipHash: ctx.ipHash,
  });
  if (!spam) await notifyOwner({ ...v, site: ctx.site });
  return { ok: true };
}

const MAX_BODY = 24_000;

/** Route handler body shared by every site: `export const POST = (r) => handleContactRequest(r, "hub")`. */
export async function handleContactRequest(request: Request, site: Site): Promise<Response> {
  const json = (status: number, body: unknown) =>
    Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin) {
    let ok = false;
    try {
      ok = new URL(origin).host === host;
    } catch {}
    if (!ok) return json(403, { error: "Not allowed." });
  }
  if (!(request.headers.get("content-type") ?? "").includes("application/json"))
    return json(415, { error: "Send JSON." });
  const text = await request.text();
  if (text.length > MAX_BODY) return json(413, { error: "Message is too long." });
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return json(400, { error: "Invalid request." });
  }
  const db = getDb();
  if (!db)
    return json(503, { error: "Messages can't be stored right now. Please email me directly.", fallback: "mailto" });
  const ipHash = clientIpHash(request.headers);
  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || undefined;
  try {
    const r = await submitContact(db, body, { site, ipHash, ip });
    return r.ok ? json(200, { ok: true }) : json(r.status, { error: r.error, fieldErrors: r.fieldErrors });
  } catch (error) {
    console.error("[inbox] submit failed", error);
    return json(500, { error: "Something went wrong. Please try again." });
  }
}

/** Privacy tool: permanently deletes every stored message from an email address. Returns how many were removed. */
export async function deleteContactData(db: Database, email: string): Promise<number> {
  const e = email.trim().toLowerCase();
  if (!e) return 0;
  const res = await db
    .delete(schema.inboxMessages)
    .where(sql`lower(${schema.inboxMessages.email}) = ${e}`)
    .returning({ id: schema.inboxMessages.id });
  return res.length;
}
