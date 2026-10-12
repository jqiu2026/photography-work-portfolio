"use server";

import { schema } from "@jerryqiu/db";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { guarded } from "@/auth";
import type { ActionState } from "@/components/admin/form-kit";
import { fdBool, fdStr, parseForm } from "@/lib/action-utils";
import { validateRedirect } from "@/lib/redirects";
import { touch } from "@/lib/revalidate";

export async function addRedirect(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const r = parseForm(
    z.object({
      site: z.enum(["hub", "photos", "music", "flying"]),
      fromPath: z.string().max(300),
      toPath: z.string().max(500),
    }),
    { site: fdStr(fd, "site") || "hub", fromPath: fdStr(fd, "fromPath"), toPath: fdStr(fd, "toPath") },
  );
  if (!r.ok) return r.state;
  const v = validateRedirect(r.data.fromPath, r.data.toPath);
  if (!v.ok) return { ok: false, error: "Check the highlighted fields.", fieldErrors: { [v.field]: v.error } };
  return guarded("content.write", async ({ db, audit }) => {
    const [exists] = await db
      .select({ id: schema.redirects.id })
      .from(schema.redirects)
      .where(and(eq(schema.redirects.site, r.data.site), eq(schema.redirects.fromPath, v.from)))
      .limit(1);
    if (exists)
      return {
        ok: false as const,
        error: "Check the highlighted fields.",
        fieldErrors: { fromPath: "A redirect from that path already exists." },
      };
    await db
      .insert(schema.redirects)
      .values({ site: r.data.site, fromPath: v.from, toPath: v.to, permanent: fdBool(fd, "permanent") });
    await audit({
      action: "redirect.add",
      entity: "redirect",
      entityId: v.from,
      site: r.data.site,
      summary: `Redirect ${v.from} → ${v.to}`,
    });
    touch(["redirects"]);
    return { ok: true as const, message: "Redirect added" };
  });
}

export async function deleteRedirect(id: string): Promise<ActionState> {
  return guarded("content.write", async ({ db, audit }) => {
    const [row] = await db
      .delete(schema.redirects)
      .where(eq(schema.redirects.id, z.string().uuid().parse(id)))
      .returning();
    if (row)
      await audit({
        action: "redirect.delete",
        entity: "redirect",
        entityId: row.fromPath,
        site: row.site,
        summary: `Removed redirect ${row.fromPath}`,
      });
    touch(["redirects"]);
    return { ok: true as const, message: "Removed" };
  });
}
