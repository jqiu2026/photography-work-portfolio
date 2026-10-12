"use server";

import { schema } from "@jerryqiu/db";
import { deleteContactData } from "@jerryqiu/inbox";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { guarded } from "@/auth";
import type { ActionState } from "@/components/admin/form-kit";
import { blank, fdStr, parseForm } from "@/lib/action-utils";

const msgSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["new", "read", "replied", "archived", "spam"]),
  notes: z.string().trim().max(4000),
});

export async function saveMessage(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const r = parseForm(msgSchema, { id: fdStr(fd, "id"), status: fdStr(fd, "status"), notes: fdStr(fd, "notes") });
  if (!r.ok) return r.state;
  return guarded("inbox.read", async ({ db, audit }) => {
    await db
      .update(schema.inboxMessages)
      .set({ status: r.data.status, notes: blank(r.data.notes) })
      .where(eq(schema.inboxMessages.id, r.data.id));
    await audit({
      action: "inbox.update",
      entity: "inbox_message",
      entityId: r.data.id,
      summary: `Marked a message ${r.data.status}`,
    });
    return { ok: true as const, message: "Saved" };
  });
}

export async function deleteMessage(id: string): Promise<ActionState> {
  return guarded("inbox.delete", async ({ db, audit }) => {
    await db
      .update(schema.inboxMessages)
      .set({ deletedAt: new Date() })
      .where(eq(schema.inboxMessages.id, z.string().uuid().parse(id)));
    await audit({
      action: "inbox.delete",
      entity: "inbox_message",
      entityId: id,
      summary: "Moved a message to the trash",
    });
    return { ok: true as const, message: "Moved to trash", redirectTo: "/admin/inbox" };
  });
}

/** Privacy request: permanently remove everything stored for an email address (not recoverable from Trash). */
export async function eraseContact(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const r = parseForm(z.object({ email: z.string().trim().email("Enter the email address") }), {
    email: fdStr(fd, "email"),
  });
  if (!r.ok) return r.state;
  return guarded("inbox.delete", async ({ db, audit }) => {
    const n = await deleteContactData(db, r.data.email);
    await audit({
      action: "inbox.erase",
      entity: "inbox_message",
      entityId: r.data.email,
      summary: `Permanently deleted ${n} message(s) for a privacy request`,
    });
    return {
      ok: true as const,
      message: n ? `Deleted ${n} message${n === 1 ? "" : "s"}` : "Nothing stored for that address",
    };
  });
}
