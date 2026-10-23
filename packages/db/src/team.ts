import { and, eq, gt } from "drizzle-orm";
import type { Database } from "./client";
import { checkEmail } from "./email-check";
import { StudioError } from "./errors";
import * as s from "./schema";

/**
 * The studio's team: people the owner invites by Google address with a role. Two roles exist for helpers:
 *  - bookkeeper: sees and edits the money side (invoices, payments, orders, expenses, reports) and nothing else.
 *  - photographer: runs shoots and galleries; adds freely, but removes only what they themselves added in the last few
 *    minutes (so a slip can be taken back and nothing can be vandalized).
 * The owner can do everything. Invited people may use any verified Google account, not only the Workspace domain.
 */
export const TEAM_ROLES = ["bookkeeper", "photographer"] as const;
export type TeamRole = (typeof TEAM_ROLES)[number];
/** How long a person can take back something they added. */
export const UNDO_WINDOW_MS = 5 * 60 * 1000;

export async function listTeam(db: Database) {
  return db
    .select({
      id: s.users.id,
      email: s.users.email,
      name: s.users.name,
      role: s.users.role,
      active: s.users.active,
      external: s.users.external,
      createdAt: s.users.createdAt,
      lastSignInAt: s.users.lastSignInAt,
    })
    .from(s.users)
    .orderBy(s.users.createdAt);
}

export async function inviteMember(db: Database, input: { email: string; name?: string; role: string }, by: string) {
  const check = checkEmail(input.email);
  if (!check.ok) throw new StudioError(check.message);
  if (!(TEAM_ROLES as readonly string[]).includes(input.role))
    throw new StudioError("Pick bookkeeper or photographer.");
  const email = input.email.trim().toLowerCase();
  const [have] = await db.select().from(s.users).where(eq(s.users.email, email)).limit(1);
  if (have && (have.role === "owner" || have.role === "editor"))
    throw new StudioError("That person already has full access.");
  if (have) {
    await db
      .update(s.users)
      .set({ role: input.role as TeamRole, active: true, external: true, name: input.name?.trim() || have.name })
      .where(eq(s.users.id, have.id));
    return have.id;
  }
  const [row] = await db
    .insert(s.users)
    .values({
      email,
      name: input.name?.trim().slice(0, 80) || null,
      role: input.role as TeamRole,
      external: true,
      addedBy: by,
    })
    .returning({ id: s.users.id });
  return (row as { id: string }).id;
}

async function helper(db: Database, id: string) {
  const [u] = await db.select().from(s.users).where(eq(s.users.id, id)).limit(1);
  if (!u) throw new StudioError("That person is not on the team.");
  if (u.role === "owner" || u.role === "editor") throw new StudioError("Owners are managed in ADMIN_EMAILS, not here.");
  return u;
}
export async function changeMemberRole(db: Database, id: string, role: string) {
  await helper(db, id);
  if (!(TEAM_ROLES as readonly string[]).includes(role)) throw new StudioError("Pick bookkeeper or photographer.");
  await db
    .update(s.users)
    .set({ role: role as TeamRole })
    .where(eq(s.users.id, id));
}
export async function setMemberActive(db: Database, id: string, active: boolean) {
  await helper(db, id);
  await db.update(s.users).set({ active }).where(eq(s.users.id, id));
}

/* ---- "you may take back what you just added" ---- */

/** Records that this person added this thing, now. Safe to call twice. */
export async function markCreated(db: Database, byEmail: string, entity: string, entityId: string) {
  await db.insert(s.studioCreated).values({ entity, entityId, byEmail: byEmail.toLowerCase() }).onConflictDoNothing();
}

/** The owner (and an editor) may remove anything; everyone else only what they added within the undo window. */
export async function canRemove(
  db: Database,
  who: { role: string; email: string },
  entity: string,
  entityId: string,
  now = new Date(),
): Promise<boolean> {
  if (who.role === "owner" || who.role === "editor") return true;
  const since = new Date(now.getTime() - UNDO_WINDOW_MS);
  const [row] = await db
    .select({ at: s.studioCreated.at })
    .from(s.studioCreated)
    .where(
      and(
        eq(s.studioCreated.entity, entity),
        eq(s.studioCreated.entityId, entityId),
        eq(s.studioCreated.byEmail, who.email.toLowerCase()),
        gt(s.studioCreated.at, since),
      ),
    )
    .limit(1);
  return Boolean(row);
}
