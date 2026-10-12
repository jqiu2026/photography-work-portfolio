"use server";

import { normalizeEmail } from "@jerryqiu/auth";
import { schema } from "@jerryqiu/db";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { guarded, kit } from "@/auth";
import type { ActionState } from "@/components/admin/form-kit";
import { fdStr, parseForm } from "@/lib/action-utils";
import { wouldLeaveNoOwner } from "@/lib/user-rules";

const role = z.enum(["owner", "editor"]);

/** Invite: add an @jerryqiu.com address to the allow-list. They still have to sign in with Google. */
export async function inviteUser(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const r = parseForm(z.object({ email: z.string().trim().max(200).email("Enter an email address"), role }), {
    email: fdStr(fd, "email"),
    role: fdStr(fd, "role") || "editor",
  });
  if (!r.ok) return r.state;
  const email = normalizeEmail(r.data.email);
  if (!email.endsWith(`@${kit.domain}`))
    return {
      ok: false,
      error: "Check the highlighted fields.",
      fieldErrors: { email: `Only @${kit.domain} addresses can be invited.` },
    };
  return guarded("users.manage", async ({ db, user, audit }) => {
    const [existing] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
    if (existing) {
      await db.update(schema.users).set({ role: r.data.role, active: true }).where(eq(schema.users.id, existing.id));
    } else {
      await db.insert(schema.users).values({ email, role: r.data.role, addedBy: user.email });
    }
    await audit({
      action: "user.invite",
      entity: "user",
      entityId: email,
      summary: `Allowed ${email} as ${r.data.role}`,
    });
    return { ok: true as const, message: `${email} can now sign in with Google` };
  });
}

async function activeOwners(db: Parameters<Parameters<typeof guarded>[1]>[0]["db"]) {
  const owners = await db
    .select({ email: schema.users.email })
    .from(schema.users)
    .where(and(eq(schema.users.role, "owner"), eq(schema.users.active, true)));
  return owners.map((o) => o.email);
}

export async function changeRole(id: string, next: "owner" | "editor"): Promise<ActionState> {
  const nextRole = role.parse(next);
  return guarded("users.manage", async ({ db, user, audit }) => {
    const [target] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, z.string().uuid().parse(id)))
      .limit(1);
    if (!target) return { ok: false as const, error: "That user no longer exists." };
    if (target.role === "owner" && nextRole !== "owner" && wouldLeaveNoOwner(await activeOwners(db), target.email))
      return { ok: false as const, error: "There must always be at least one active owner." };
    await db.update(schema.users).set({ role: nextRole }).where(eq(schema.users.id, target.id));
    await audit({
      action: "user.role",
      entity: "user",
      entityId: target.email,
      summary: `Role of ${target.email} set to ${nextRole}`,
    });
    return { ok: true as const, message: "Role changed. It applies on their next click." };
  });
}

/** Deactivating takes effect on the person's next request (every request re-checks the allow-list). */
export async function setUserActive(id: string, active: boolean): Promise<ActionState> {
  return guarded("users.manage", async ({ db, user, audit }) => {
    const [target] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, z.string().uuid().parse(id)))
      .limit(1);
    if (!target) return { ok: false as const, error: "That user no longer exists." };
    if (!active && target.email === user.email) return { ok: false as const, error: "You can't deactivate yourself." };
    if (!active && target.role === "owner" && wouldLeaveNoOwner(await activeOwners(db), target.email))
      return { ok: false as const, error: "There must always be at least one active owner." };
    await db.update(schema.users).set({ active }).where(eq(schema.users.id, target.id));
    await audit({
      action: active ? "user.activate" : "user.deactivate",
      entity: "user",
      entityId: target.email,
      summary: `${active ? "Reactivated" : "Removed access for"} ${target.email}`,
    });
    return { ok: true as const, message: active ? "Access restored" : "Access removed. It ends on their next click." };
  });
}
