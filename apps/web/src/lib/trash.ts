import { type Database, schema } from "@jerryqiu/db";
import { and, isNotNull, lt } from "drizzle-orm";
import { eq } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import { derivativesStore, originalsStore } from "./storage";

type Trashable = PgTable & { id: PgColumn; deletedAt: PgColumn };
type Kind = { key: string; label: string; table: Trashable; title: (row: Record<string, unknown>) => string };

const t = (x: unknown) => x as Trashable;
const pick =
  (...fields: string[]) =>
  (row: Record<string, unknown>) => {
    for (const f of fields) if (typeof row[f] === "string" && row[f]) return row[f] as string;
    return "(untitled)";
  };

/** Everything that soft-deletes. Restoring clears `deleted_at`; purging removes the row (children cascade). */
export const TRASH_KINDS: Kind[] = [
  { key: "post", label: "Post", table: t(schema.posts), title: pick("title") },
  { key: "project", label: "Project", table: t(schema.projects), title: pick("title") },
  { key: "gallery", label: "Gallery", table: t(schema.galleries), title: pick("title") },
  { key: "media", label: "Image", table: t(schema.media), title: pick("filename") },
  { key: "music", label: "Music item", table: t(schema.musicItems), title: pick("title") },
  { key: "flight", label: "Flying entry", table: t(schema.flightEntries), title: pick("title") },
  { key: "aircraft", label: "Aircraft", table: t(schema.aircraft), title: pick("name") },
  { key: "timeline", label: "Timeline entry", table: t(schema.timelineEntries), title: pick("title") },
  { key: "social", label: "Social link", table: t(schema.socialLinks), title: pick("label") },
  { key: "page", label: "Page", table: t(schema.pages), title: pick("title") },
  { key: "message", label: "Inbox message", table: t(schema.inboxMessages), title: pick("name") },
];

export const kindByKey = (key: string) => TRASH_KINDS.find((k) => k.key === key);
export const RETENTION_DAYS = 30;

export type TrashItem = { kind: string; label: string; id: string; title: string; deletedAt: Date };

export async function listTrash(db: Database): Promise<TrashItem[]> {
  const out: TrashItem[] = [];
  for (const k of TRASH_KINDS) {
    const rows = (await db.select().from(k.table).where(isNotNull(k.table.deletedAt))) as Record<string, unknown>[];
    for (const r of rows)
      out.push({ kind: k.key, label: k.label, id: String(r.id), title: k.title(r), deletedAt: r.deletedAt as Date });
  }
  return out.sort((a, b) => b.deletedAt.getTime() - a.deletedAt.getTime());
}

export async function restoreItem(db: Database, kind: string, id: string): Promise<boolean> {
  const k = kindByKey(kind);
  if (!k) return false;
  const res = await db
    .update(k.table)
    .set({ deletedAt: null } as never)
    .where(and(eq(k.table.id, id), isNotNull(k.table.deletedAt)))
    .returning({ id: k.table.id });
  return res.length > 0;
}

/** Permanently removes one trashed row. Images also lose their stored files. Returns false when it cannot be removed. */
export async function purgeItem(db: Database, kind: string, id: string): Promise<{ ok: boolean; reason?: string }> {
  const k = kindByKey(kind);
  if (!k) return { ok: false, reason: "Unknown item type" };
  const where = and(eq(k.table.id, id), isNotNull(k.table.deletedAt));
  try {
    if (k.key === "media") {
      const [m] = await db
        .select()
        .from(schema.media)
        .where(and(eq(schema.media.id, id), isNotNull(schema.media.deletedAt)));
      if (!m) return { ok: false, reason: "Not in the trash" };
      await db.delete(schema.media).where(eq(schema.media.id, id)); // fails (FK) if something still uses it
      await originalsStore()
        .delete(m.originalKey)
        .catch(() => {});
      for (const d of m.derivatives ?? [])
        await derivativesStore()
          .delete(d.key)
          .catch(() => {});
      return { ok: true };
    }
    const res = await db.delete(k.table).where(where).returning({ id: k.table.id });
    return res.length ? { ok: true } : { ok: false, reason: "Not in the trash" };
  } catch {
    return { ok: false, reason: "Still referenced by other content" };
  }
}

/** Cron: purge everything trashed more than `days` ago. Returns counts for the log. */
export async function purgeExpired(db: Database, days = RETENTION_DAYS) {
  const cutoff = new Date(Date.now() - days * 86_400_000);
  let purged = 0;
  let skipped = 0;
  for (const k of TRASH_KINDS) {
    const rows = await db
      .select({ id: k.table.id })
      .from(k.table)
      .where(and(isNotNull(k.table.deletedAt), lt(k.table.deletedAt, cutoff)));
    for (const r of rows) {
      const res = await purgeItem(db, k.key, String(r.id));
      if (res.ok) purged++;
      else skipped++;
    }
  }
  return { purged, skipped };
}
