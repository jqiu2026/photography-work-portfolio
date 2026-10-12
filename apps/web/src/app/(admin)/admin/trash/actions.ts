"use server";

import { z } from "zod";
import { guarded } from "@/auth";
import type { ActionState } from "@/components/admin/form-kit";
import { touch } from "@/lib/revalidate";
import { kindByKey, purgeItem, restoreItem } from "@/lib/trash";

const ref = z.object({ kind: z.string().max(20), id: z.string().uuid() });

export async function restore(kind: string, id: string): Promise<ActionState> {
  const r = ref.parse({ kind, id });
  return guarded("trash.restore", async ({ db, audit }) => {
    if (!kindByKey(r.kind)) return { ok: false as const, error: "Unknown item type" };
    const ok = await restoreItem(db, r.kind, r.id);
    if (!ok) return { ok: false as const, error: "That item is not in the trash any more." };
    await audit({
      action: "trash.restore",
      entity: r.kind,
      entityId: r.id,
      summary: `Restored a ${r.kind} from the trash`,
    });
    touch(["posts", "projects", "galleries", "media", "music", "flying", "timeline", "social", "pages"], ["/"]);
    return { ok: true as const, message: "Restored" };
  });
}

export async function purge(kind: string, id: string): Promise<ActionState> {
  const r = ref.parse({ kind, id });
  return guarded("trash.purge", async ({ db, audit }) => {
    const res = await purgeItem(db, r.kind, r.id);
    if (!res.ok) return { ok: false as const, error: res.reason ?? "Could not delete" };
    await audit({ action: "trash.purge", entity: r.kind, entityId: r.id, summary: `Permanently deleted a ${r.kind}` });
    return { ok: true as const, message: "Deleted permanently" };
  });
}
