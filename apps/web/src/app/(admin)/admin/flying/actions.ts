"use server";

import { schema } from "@jerryqiu/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import type { ActionState } from "@/components/admin/form-kit";
import { blank, fdBool, fdStr, parseForm } from "@/lib/action-utils";
import { touch } from "@/lib/revalidate";
import { guarded } from "@/auth";

const entrySchema = z.object({
  id: z.string().uuid().or(z.literal("")),
  kind: z.enum(["milestone", "flight"]),
  title: z.string().trim().min(1, "Required").max(160),
  date: z
    .string()
    .trim()
    .regex(/^(\d{4}-\d{2}-\d{2})?$/, "Use YYYY-MM-DD"),
  story: z.string().trim().max(5000),
  aircraft: z.string().trim().max(120),
  photoMediaId: z.string().uuid().or(z.literal("")),
  sort: z.coerce.number().int().min(0).max(9999),
});

const checklist = ["ackLocation", "ackDetails", "ackPeople"] as const;

/**
 * Flight log entries have a "safe to publish" checklist (docs/project/11-legal-and-compliance.md): no real-time
 * location, a conscious decision about tail numbers and exact times, and nobody identifiable without permission.
 * An entry can only be visible when all three are confirmed; otherwise it is saved hidden.
 */
export async function saveFlight(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const r = parseForm(entrySchema, {
    id: fdStr(fd, "id"),
    kind: fdStr(fd, "kind") || "milestone",
    title: fdStr(fd, "title"),
    date: fdStr(fd, "date"),
    story: fdStr(fd, "story"),
    aircraft: fdStr(fd, "aircraft"),
    photoMediaId: fdStr(fd, "photoMediaId"),
    sort: fdStr(fd, "sort") || "0",
  });
  if (!r.ok) return r.state;
  const d = r.data;
  const safe = checklist.every((k) => fdBool(fd, k));
  const wantVisible = fdBool(fd, "visible");
  if (wantVisible && !safe)
    return {
      ok: false,
      error: "Confirm all three safety checks before making this entry visible.",
      fieldErrors: { visible: "Tick the safety checklist first, or save it hidden." },
    };
  return guarded("content.write", async ({ db, user, audit }) => {
    const values = {
      kind: d.kind,
      title: d.title,
      date: blank(d.date),
      story: blank(d.story),
      aircraft: blank(d.aircraft),
      photoMediaId: d.photoMediaId || null,
      safeToPublish: safe,
      visible: wantVisible && safe,
      sort: d.sort,
    };
    let id = d.id;
    if (id)
      await db
        .update(schema.flightEntries)
        .set({ ...values, updatedAt: new Date(), updatedBy: user.email })
        .where(eq(schema.flightEntries.id, id));
    else {
      const [row] = await db
        .insert(schema.flightEntries)
        .values({ ...values, updatedBy: user.email })
        .returning({ id: schema.flightEntries.id });
      id = row.id;
    }
    await audit({
      action: d.id ? "flight.update" : "flight.create",
      entity: "flight_entry",
      entityId: id,
      site: "flying",
      summary: `${d.id ? "Updated" : "Added"} “${d.title}”${values.visible ? "" : " (hidden)"}`,
    });
    touch(["flying"], ["/flying", "/flying/log"]);
    return {
      ok: true as const,
      message: values.visible ? "Saved" : "Saved (hidden until the safety checklist is complete)",
      redirectTo: "/admin/flying",
      id,
    };
  });
}

export async function deleteFlight(id: string): Promise<ActionState> {
  return guarded("content.write", async ({ db, user, audit }) => {
    await db
      .update(schema.flightEntries)
      .set({ deletedAt: new Date(), updatedBy: user.email })
      .where(eq(schema.flightEntries.id, id));
    await audit({
      action: "flight.delete",
      entity: "flight_entry",
      entityId: id,
      site: "flying",
      summary: "Moved a flight entry to the trash",
    });
    touch(["flying"], ["/flying"]);
    return { ok: true as const, message: "Moved to trash", redirectTo: "/admin/flying" };
  });
}

const aircraftSchema = z.object({
  id: z.string().uuid().or(z.literal("")),
  name: z.string().trim().min(1, "Required").max(120),
  note: z.string().trim().max(500),
  sort: z.coerce.number().int().min(0).max(999),
});

export async function saveAircraft(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const r = parseForm(aircraftSchema, {
    id: fdStr(fd, "id"),
    name: fdStr(fd, "name"),
    note: fdStr(fd, "note"),
    sort: fdStr(fd, "sort") || "0",
  });
  if (!r.ok) return r.state;
  const d = r.data;
  const values = {
    name: d.name,
    note: blank(d.note),
    flown: fdBool(fd, "flown"),
    visible: fdBool(fd, "visible"),
    sort: d.sort,
  };
  return guarded("content.write", async ({ db, user, audit }) => {
    if (d.id)
      await db
        .update(schema.aircraft)
        .set({ ...values, updatedAt: new Date(), updatedBy: user.email })
        .where(eq(schema.aircraft.id, d.id));
    else await db.insert(schema.aircraft).values({ ...values, updatedBy: user.email });
    await audit({
      action: d.id ? "aircraft.update" : "aircraft.create",
      entity: "aircraft",
      entityId: d.id || undefined,
      site: "flying",
      summary: `${d.id ? "Updated" : "Added"} aircraft “${d.name}”`,
    });
    touch(["flying"], ["/flying/aircraft"]);
    return { ok: true as const, message: d.id ? "Saved" : "Added" };
  });
}

export async function deleteAircraft(id: string): Promise<ActionState> {
  return guarded("content.write", async ({ db, user, audit }) => {
    await db
      .update(schema.aircraft)
      .set({ deletedAt: new Date(), updatedBy: user.email })
      .where(eq(schema.aircraft.id, id));
    await audit({
      action: "aircraft.delete",
      entity: "aircraft",
      entityId: id,
      site: "flying",
      summary: "Moved an aircraft to the trash",
    });
    touch(["flying"], ["/flying/aircraft"]);
    return { ok: true as const, message: "Moved to trash" };
  });
}

const backgroundSchema = z.object({
  story: z.string().trim().max(3000),
  clubName: z.string().trim().max(120),
  clubNote: z.string().trim().max(300),
  clubUrl: z
    .string()
    .trim()
    .max(300)
    .refine((v) => v === "" || /^https?:\/\//.test(v), "Must start with https://"),
  certificates: z.string().trim().max(2000),
});

export async function saveFlyingBackground(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const r = parseForm(backgroundSchema, {
    story: fdStr(fd, "story"),
    clubName: fdStr(fd, "clubName"),
    clubNote: fdStr(fd, "clubNote"),
    clubUrl: fdStr(fd, "clubUrl"),
    certificates: fdStr(fd, "certificates"),
  });
  if (!r.ok) return r.state;
  return guarded("content.write", async ({ db, user, audit }) => {
    await db
      .insert(schema.settings)
      .values({ site: "flying", key: "background", value: r.data, updatedBy: user.email })
      .onConflictDoUpdate({
        target: [schema.settings.site, schema.settings.key],
        set: { value: r.data, updatedAt: new Date(), updatedBy: user.email },
      });
    await audit({
      action: "flying.background",
      entity: "settings",
      entityId: "flying/background",
      site: "flying",
      summary: "Updated the flying background",
    });
    touch(["flying", "settings"], ["/flying", "/flying/about"]);
    return { ok: true as const, message: "Saved" };
  });
}
