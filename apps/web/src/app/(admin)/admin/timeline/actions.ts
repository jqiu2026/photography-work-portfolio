"use server";

import { schema } from "@jerryqiu/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import type { ActionState } from "@/components/admin/form-kit";
import { blank, fdBool, fdStr, optionalUrl, parseForm } from "@/lib/action-utils";
import { touch } from "@/lib/revalidate";
import { guarded } from "@/auth";

const categories = [
  "work",
  "education",
  "leadership",
  "volunteering",
  "flying",
  "music",
  "photography",
  "other",
] as const;
const date = z
  .string()
  .trim()
  .regex(/^(\d{4}-\d{2}-\d{2})?$/, "Use YYYY-MM-DD")
  .or(z.literal(""));

const timelineSchema = z.object({
  id: z.string().uuid().or(z.literal("")),
  category: z.enum(categories),
  title: z.string().trim().min(1, "Required").max(120),
  org: z.string().trim().max(120),
  startDate: date,
  endDate: date,
  summary: z.string().trim().max(1500),
  link: optionalUrl,
  sort: z.coerce.number().int().min(0).max(999),
});

export async function saveTimeline(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const r = parseForm(timelineSchema, {
    id: fdStr(fd, "id"),
    category: fdStr(fd, "category") || "other",
    title: fdStr(fd, "title"),
    org: fdStr(fd, "org"),
    startDate: fdStr(fd, "startDate"),
    endDate: fdStr(fd, "endDate"),
    summary: fdStr(fd, "summary"),
    link: fdStr(fd, "link"),
    sort: fdStr(fd, "sort") || "0",
  });
  if (!r.ok) return r.state;
  const d = r.data;
  if (d.startDate && d.endDate && d.endDate < d.startDate)
    return {
      ok: false,
      error: "Check the highlighted fields.",
      fieldErrors: { endDate: "End date is before the start date" },
    };
  const values = {
    category: d.category,
    title: d.title,
    org: blank(d.org),
    startDate: blank(d.startDate),
    endDate: blank(d.endDate),
    summary: blank(d.summary),
    link: blank(d.link),
    current: fdBool(fd, "current"),
    visible: fdBool(fd, "visible"),
    sort: d.sort,
  };
  return guarded("content.write", async ({ db, user, audit }) => {
    let id = d.id;
    if (id)
      await db
        .update(schema.timelineEntries)
        .set({ ...values, updatedAt: new Date(), updatedBy: user.email })
        .where(eq(schema.timelineEntries.id, id));
    else {
      const [row] = await db
        .insert(schema.timelineEntries)
        .values({ ...values, updatedBy: user.email })
        .returning({ id: schema.timelineEntries.id });
      id = row.id;
    }
    await audit({
      action: d.id ? "timeline.update" : "timeline.create",
      entity: "timeline_entry",
      entityId: id,
      site: "hub",
      summary: `${d.id ? "Updated" : "Added"} “${d.title}”`,
    });
    touch(["timeline"], ["/about", "/"]);
    return { ok: true as const, message: "Saved", redirectTo: "/admin/timeline", id };
  });
}

export async function deleteTimeline(id: string): Promise<ActionState> {
  return guarded("content.write", async ({ db, user, audit }) => {
    await db
      .update(schema.timelineEntries)
      .set({ deletedAt: new Date(), updatedBy: user.email })
      .where(eq(schema.timelineEntries.id, id));
    await audit({
      action: "timeline.delete",
      entity: "timeline_entry",
      entityId: id,
      site: "hub",
      summary: "Moved a timeline entry to the trash",
    });
    touch(["timeline"], ["/about"]);
    return { ok: true as const, message: "Moved to trash", redirectTo: "/admin/timeline" };
  });
}
