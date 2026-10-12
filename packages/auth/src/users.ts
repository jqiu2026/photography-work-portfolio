import { type Database, schema } from "@jerryqiu/db";
import { and, eq } from "drizzle-orm";
import { type Denial, type GoogleProfile, type Role, checkGoogleProfile, normalizeEmail } from "./policy";

export type AppUser = { id: string; email: string; name: string | null; image: string | null; role: Role };

type SignInInput = GoogleProfile & { name?: unknown; picture?: unknown };
export type SignInVerdict = { ok: true; user: AppUser } | { ok: false; reason: Denial };

/** Active allow-listed user, or undefined. Looked up on every request so removals apply on the next click. */
export async function findUser(db: Database, email: string): Promise<AppUser | undefined> {
  const [u] = await db
    .select({
      id: schema.users.id,
      email: schema.users.email,
      name: schema.users.name,
      image: schema.users.image,
      role: schema.users.role,
    })
    .from(schema.users)
    .where(and(eq(schema.users.email, normalizeEmail(email)), eq(schema.users.active, true)))
    .limit(1);
  return u;
}

/**
 * Full sign-in decision: Google identity must be from our domain (policy), AND the email must be on the allow-list.
 * `bootstrapEmails` (ADMIN_EMAILS) are created as owners the first time they sign in, so a fresh install is not locked out.
 */
export async function authorizeSignIn(
  db: Database,
  profile: SignInInput,
  opts: { domain: string; bootstrapEmails?: string[] },
): Promise<SignInVerdict> {
  const verdict = checkGoogleProfile(profile, opts.domain);
  if (!verdict.ok) return verdict;
  const email = verdict.email;
  const name = typeof profile.name === "string" ? profile.name : null;
  const image = typeof profile.picture === "string" ? profile.picture : null;

  const [row] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (!row) {
    if (!(opts.bootstrapEmails ?? []).map(normalizeEmail).includes(email)) return { ok: false, reason: "not_listed" };
    const [created] = await db
      .insert(schema.users)
      .values({ email, name, image, role: "owner", addedBy: "ADMIN_EMAILS", lastSignInAt: new Date() })
      .returning();
    return { ok: true, user: { id: created.id, email, name, image, role: created.role } };
  }
  if (!row.active) return { ok: false, reason: "inactive" };
  await db
    .update(schema.users)
    .set({ lastSignInAt: new Date(), name: name ?? row.name, image: image ?? row.image })
    .where(eq(schema.users.id, row.id));
  return { ok: true, user: { id: row.id, email, name: name ?? row.name, image: image ?? row.image, role: row.role } };
}
