import type { Database } from "./client";
import { auditLog } from "./schema";

export type AuditEntry = {
  actor: string;
  action: string;
  entity: string;
  entityId?: string;
  site?: "hub" | "photos" | "music" | "flying" | "all";
  summary?: string;
  diff?: Record<string, unknown>;
};

/** Records who changed what. Never throws: an audit failure must not block the owner's edit, but it is logged loudly. */
export async function writeAudit(db: Database, entry: AuditEntry) {
  try {
    await db.insert(auditLog).values({
      ...entry,
      entityId: entry.entityId ?? null,
      summary: entry.summary ?? null,
      diff: entry.diff ?? null,
      site: entry.site ?? null,
    });
  } catch (error) {
    console.error("[audit] failed to write entry", entry.action, error);
  }
}
