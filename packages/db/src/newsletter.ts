import { createHash, randomBytes } from "node:crypto";
import { and, desc, eq, isNotNull, isNull, sql } from "drizzle-orm";
import type { Database } from "./client";
import { checkEmail } from "./email-check";
import { StudioError } from "./errors";
import * as s from "./schema";

/**
 * The newsletter list: double opt-in (an address counts only after its owner follows the emailed link), one-click
 * unsubscribe, no tracking. One secret token per address serves both links; only its hash is stored. Sending
 * newsletters is not built (it needs a verified sending domain): this keeps a clean, consented list until then.
 */
const hash = (t: string) => createHash("sha256").update(t).digest("hex");

export type Signup = { status: "pending" | "already"; token?: string };

/**
 * Starts a signup. Returns the secret token to put in the confirmation email, or `already` when the address is a
 * confirmed subscriber (nothing is sent, and the caller shows the same message either way so nobody can probe the list).
 * A pending or unsubscribed address gets a fresh token and must confirm again.
 */
export async function subscribe(db: Database, input: { email: string; source?: string }): Promise<Signup> {
  const email = input.email.trim().toLowerCase();
  const check = checkEmail(email);
  if (!check.ok) throw new StudioError(check.message);
  const [have] = await db.select().from(s.studioSubscribers).where(eq(s.studioSubscribers.email, email)).limit(1);
  if (have?.confirmedAt && !have.unsubscribedAt) return { status: "already" };
  const token = randomBytes(24).toString("base64url");
  if (have) {
    await db
      .update(s.studioSubscribers)
      .set({ tokenHash: hash(token), confirmedAt: null, unsubscribedAt: null })
      .where(eq(s.studioSubscribers.id, have.id));
  } else {
    await db
      .insert(s.studioSubscribers)
      .values({ email, tokenHash: hash(token), source: input.source?.slice(0, 80) || null });
  }
  return { status: "pending", token };
}

export async function confirmSubscriber(db: Database, token: string): Promise<boolean> {
  const rows = await db
    .update(s.studioSubscribers)
    .set({ confirmedAt: sql`coalesce(${s.studioSubscribers.confirmedAt}, now())`, unsubscribedAt: null })
    .where(eq(s.studioSubscribers.tokenHash, hash(token)))
    .returning({ id: s.studioSubscribers.id });
  return rows.length > 0;
}

export async function unsubscribe(db: Database, token: string): Promise<boolean> {
  const rows = await db
    .update(s.studioSubscribers)
    .set({ unsubscribedAt: sql`coalesce(${s.studioSubscribers.unsubscribedAt}, now())` })
    .where(eq(s.studioSubscribers.tokenHash, hash(token)))
    .returning({ id: s.studioSubscribers.id });
  return rows.length > 0;
}

export async function listSubscribers(db: Database) {
  return db.select().from(s.studioSubscribers).orderBy(desc(s.studioSubscribers.createdAt));
}

export function subscriberState(r: { confirmedAt: Date | null; unsubscribedAt: Date | null }):
  | "active"
  | "pending"
  | "unsubscribed" {
  return r.unsubscribedAt ? "unsubscribed" : r.confirmedAt ? "active" : "pending";
}

/** The confirmed addresses, for the owner's own use (export). Pending and unsubscribed are never included. */
export async function activeSubscribers(db: Database) {
  return db
    .select({
      email: s.studioSubscribers.email,
      confirmedAt: s.studioSubscribers.confirmedAt,
      source: s.studioSubscribers.source,
    })
    .from(s.studioSubscribers)
    .where(and(isNotNull(s.studioSubscribers.confirmedAt), isNull(s.studioSubscribers.unsubscribedAt)))
    .orderBy(desc(s.studioSubscribers.confirmedAt));
}

export async function deleteSubscriber(db: Database, id: string) {
  await db.delete(s.studioSubscribers).where(eq(s.studioSubscribers.id, id));
}
