import { and, asc, desc, eq, gt, isNull, sql } from "drizzle-orm";
import type { Database } from "./client";
import { StudioError } from "./errors";
import * as s from "./schema";
import { hashPassword, hashToken, newToken, passwordProblem, verifyPassword } from "./studio-crypto";

/**
 * Client portal accounts. A client signs in with a password, with a one-time emailed link, or (separately) with a gallery
 * passcode. Tokens are random, stored as hashes, single use and short lived. The responses never reveal whether an email has
 * an account. Repeated wrong passwords lock the account briefly.
 */
const MAX_FAILED = 8;
const LOCK_MINUTES = 15;
const TTL = { magic: 15, invite: 60 * 24 * 7, reset: 60 } as const;

const emailOf = (v: string) => v.trim().toLowerCase();
const isEmail = (v: string) => /^\S+@\S+\.\S+$/.test(v.trim());

/** Creates the portal account for a client (idempotent) and returns it. */
export async function ensureAccount(db: Database, clientId: string) {
  const [c] = await db
    .select()
    .from(s.studioClients)
    .where(and(eq(s.studioClients.id, clientId), isNull(s.studioClients.deletedAt)));
  if (!c) throw new StudioError("Unknown client.");
  const [existing] = await db.select().from(s.clientAccounts).where(eq(s.clientAccounts.clientId, clientId));
  if (existing) return existing;
  const [row] = await db
    .insert(s.clientAccounts)
    .values({ clientId, email: emailOf(c.email) })
    .onConflictDoNothing()
    .returning();
  if (row) return row;
  const [again] = await db.select().from(s.clientAccounts).where(eq(s.clientAccounts.clientId, clientId));
  return again;
}

export async function accountByEmail(db: Database, email: string) {
  const [a] = await db
    .select()
    .from(s.clientAccounts)
    .where(eq(s.clientAccounts.email, emailOf(email)));
  if (a) return a;
  // A client with that email who has no account yet gets one on first request (so a magic link works for anyone I invoiced).
  const [c] = await db
    .select()
    .from(s.studioClients)
    .where(and(eq(s.studioClients.email, emailOf(email)), isNull(s.studioClients.deletedAt)));
  return c ? ensureAccount(db, c.id) : null;
}

async function issueToken(db: Database, accountId: string, kind: keyof typeof TTL, now: Date) {
  const { token, hash } = newToken();
  await db
    .insert(s.clientLoginTokens)
    .values({ accountId, kind, tokenHash: hash, expiresAt: new Date(now.getTime() + TTL[kind] * 60_000) });
  return token;
}

/** Returns the token to email, or null when there is nothing to send (callers answer the same either way). */
export async function requestMagicLink(
  db: Database,
  email: string,
  now = new Date(),
): Promise<{ token: string; account: typeof s.clientAccounts.$inferSelect } | null> {
  if (!isEmail(email)) return null;
  const a = await accountByEmail(db, email);
  if (!a) return null;
  return { token: await issueToken(db, a.id, "magic", now), account: a };
}
export async function requestPasswordReset(db: Database, email: string, now = new Date()) {
  if (!isEmail(email)) return null;
  const a = await accountByEmail(db, email);
  if (!a) return null;
  return { token: await issueToken(db, a.id, "reset", now), account: a };
}
export async function inviteClient(db: Database, clientId: string, now = new Date()) {
  const a = await ensureAccount(db, clientId);
  return { token: await issueToken(db, a.id, "invite", now), account: a };
}

/** Uses a one-time token (any kind that signs in). Single use: only one caller can win it. */
export async function consumeToken(db: Database, token: string, kinds: (keyof typeof TTL)[], now = new Date()) {
  const rows = await db
    .update(s.clientLoginTokens)
    .set({ usedAt: now })
    .where(
      and(
        eq(s.clientLoginTokens.tokenHash, hashToken(token)),
        isNull(s.clientLoginTokens.usedAt),
        gt(s.clientLoginTokens.expiresAt, now),
        sql`${s.clientLoginTokens.kind} in (${sql.join(
          kinds.map((k) => sql`${k}`),
          sql`, `,
        )})`,
      ),
    )
    .returning();
  if (!rows.length) return null;
  const [a] = await db.select().from(s.clientAccounts).where(eq(s.clientAccounts.id, rows[0].accountId));
  return a ? { account: a, kind: rows[0].kind as keyof typeof TTL } : null;
}
/** The account a token belongs to, without using it (so a reset can check the password first and only then spend the token). */
export async function tokenAccount(db: Database, token: string, kinds: (keyof typeof TTL)[], now = new Date()) {
  const [t] = await db
    .select()
    .from(s.clientLoginTokens)
    .where(eq(s.clientLoginTokens.tokenHash, hashToken(token)));
  if (!t || t.usedAt || t.expiresAt <= now || !kinds.includes(t.kind as keyof typeof TTL)) return null;
  const [a] = await db.select().from(s.clientAccounts).where(eq(s.clientAccounts.id, t.accountId));
  return a ?? null;
}

/** Checks a token without using it (so a reset page can show its form). */
export async function peekToken(db: Database, token: string, kinds: (keyof typeof TTL)[], now = new Date()) {
  const [t] = await db
    .select()
    .from(s.clientLoginTokens)
    .where(eq(s.clientLoginTokens.tokenHash, hashToken(token)));
  return Boolean(t && !t.usedAt && t.expiresAt > now && kinds.includes(t.kind as keyof typeof TTL));
}

export async function markLogin(db: Database, accountId: string, now = new Date()) {
  await db
    .update(s.clientAccounts)
    .set({ lastLoginAt: now, failedAttempts: 0, lockedUntil: null })
    .where(eq(s.clientAccounts.id, accountId));
}

export type PasswordLogin = { ok: true; account: typeof s.clientAccounts.$inferSelect } | { ok: false; error: string };
export async function loginWithPassword(
  db: Database,
  email: string,
  password: string,
  now = new Date(),
): Promise<PasswordLogin> {
  const generic: PasswordLogin = { ok: false, error: "That email and password do not match." };
  const [a] = isEmail(email)
    ? await db
        .select()
        .from(s.clientAccounts)
        .where(eq(s.clientAccounts.email, emailOf(email)))
    : [];
  if (a?.lockedUntil && a.lockedUntil > now) {
    await verifyPassword(password, null);
    return { ok: false, error: "Too many tries. Try again in a few minutes, or use an emailed sign-in link." };
  }
  const ok = await verifyPassword(password, a?.passwordHash);
  if (!a || !ok) {
    if (a) {
      const failed = a.failedAttempts + 1;
      await db
        .update(s.clientAccounts)
        .set({
          failedAttempts: failed,
          lockedUntil: failed >= MAX_FAILED ? new Date(now.getTime() + LOCK_MINUTES * 60_000) : null,
        })
        .where(eq(s.clientAccounts.id, a.id));
    }
    return generic;
  }
  await markLogin(db, a.id, now);
  return { ok: true, account: a };
}

export async function setPassword(db: Database, accountId: string, password: string) {
  const [a] = await db.select().from(s.clientAccounts).where(eq(s.clientAccounts.id, accountId));
  if (!a) throw new StudioError("Unknown account.");
  const problem = passwordProblem(password, a.email);
  if (problem) throw new StudioError(problem);
  await db
    .update(s.clientAccounts)
    .set({ passwordHash: await hashPassword(password), failedAttempts: 0, lockedUntil: null })
    .where(eq(s.clientAccounts.id, accountId));
}

export async function changePassword(db: Database, accountId: string, current: string, next: string) {
  const [a] = await db.select().from(s.clientAccounts).where(eq(s.clientAccounts.id, accountId));
  if (!a) throw new StudioError("Unknown account.");
  if (a.passwordHash && !(await verifyPassword(current, a.passwordHash)))
    throw new StudioError("Your current password is not right.");
  await setPassword(db, accountId, next);
}

export async function savePrefs(db: Database, accountId: string, prefs: s.PortalPrefs) {
  await db.update(s.clientAccounts).set({ prefs }).where(eq(s.clientAccounts.id, accountId));
}

export async function accountById(db: Database, id: string) {
  const [a] = await db.select().from(s.clientAccounts).where(eq(s.clientAccounts.id, id));
  return a ?? null;
}

/* ---------- messages ---------- */
export async function postMessage(
  db: Database,
  m: { clientId: string; jobId?: string | null; direction: "in" | "out"; body: string },
) {
  const body = m.body.trim();
  if (body.length < 2) throw new StudioError("Write a message first.");
  if (body.length > 4000) throw new StudioError("That message is too long.");
  const [row] = await db
    .insert(s.studioMessages)
    .values({ clientId: m.clientId, jobId: m.jobId ?? null, direction: m.direction, body })
    .returning();
  return row;
}
export async function listMessages(db: Database, clientId: string) {
  return db
    .select()
    .from(s.studioMessages)
    .where(eq(s.studioMessages.clientId, clientId))
    .orderBy(asc(s.studioMessages.createdAt));
}
export async function markRead(db: Database, clientId: string, direction: "in" | "out", now = new Date()) {
  await db
    .update(s.studioMessages)
    .set({ readAt: now })
    .where(
      and(
        eq(s.studioMessages.clientId, clientId),
        eq(s.studioMessages.direction, direction),
        isNull(s.studioMessages.readAt),
      ),
    );
}
export async function recentThreads(db: Database) {
  return db
    .select({ message: s.studioMessages, client: s.studioClients })
    .from(s.studioMessages)
    .innerJoin(s.studioClients, eq(s.studioClients.id, s.studioMessages.clientId))
    .orderBy(desc(s.studioMessages.createdAt))
    .limit(200);
}

/* ---------- everything a client sees ---------- */
/** One client's jobs with their galleries, contracts, invoices, questionnaires, appointments and quotes. */
export async function clientOverview(db: Database, clientId: string, now = new Date()) {
  const jobs = await db
    .select()
    .from(s.studioJobs)
    .where(and(eq(s.studioJobs.clientId, clientId), isNull(s.studioJobs.deletedAt)))
    .orderBy(desc(s.studioJobs.createdAt));
  const ids = jobs.map((j) => j.id);
  const inJobs = (col: Parameters<typeof eq>[0]) =>
    ids.length
      ? sql`${col} in (${sql.join(
          ids.map((i) => sql`${i}`),
          sql`, `,
        )})`
      : sql`false`;
  const [galleries, contracts, invoices, sends, appointments, quotes] = await Promise.all([
    db
      .select()
      .from(s.studioGalleries)
      .where(and(inJobs(s.studioGalleries.jobId), isNull(s.studioGalleries.deletedAt))),
    db
      .select()
      .from(s.studioContracts)
      .where(and(inJobs(s.studioContracts.jobId), isNull(s.studioContracts.deletedAt))),
    db
      .select()
      .from(s.studioInvoices)
      .where(and(inJobs(s.studioInvoices.jobId), isNull(s.studioInvoices.deletedAt))),
    db.select().from(s.studioQuestionnaireSends).where(eq(s.studioQuestionnaireSends.clientId, clientId)),
    db
      .select()
      .from(s.appointments)
      .where(
        and(
          eq(s.appointments.clientId, clientId),
          sql`${s.appointments.status} <> 'cancelled'`,
          gt(s.appointments.startsAt, new Date(now.getTime() - 86_400_000)),
        ),
      ),
    db
      .select()
      .from(s.studioQuotes)
      .where(and(eq(s.studioQuotes.clientId, clientId), isNull(s.studioQuotes.deletedAt))),
  ]);
  return { jobs, galleries, contracts, invoices, sends, appointments, quotes };
}
