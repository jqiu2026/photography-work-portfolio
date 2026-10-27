import "server-only";
import { actionError } from "@jerryqiu/auth/server";
import { StudioError } from "@jerryqiu/db/studio";
import { revalidatePath, revalidateTag } from "next/cache";
import { ZodError } from "zod";
import { guarded } from "@/auth";

type Ctx = Parameters<Parameters<typeof guarded>[1]>[0];
export type StudioResult = { ok: true; message: string; [k: string]: unknown } | { ok: false; error: string };

/**
 * Wraps a studio server action: checks the session and role (`studio.access`), rate limits, turns a `StudioError` or a
 * validation error into a message the UI shows, writes the audit entry the callback returns, and refreshes the public
 * catalog (tag "music") and the studio pages.
 */
export function studio(
  fn: (ctx: Ctx) => Promise<{
    message: string;
    audit?: { action: string; entity: string; entityId?: string; summary: string };
    extra?: Record<string, unknown>;
  }>,
): Promise<StudioResult> {
  return guarded("studio.access", async (ctx) => {
    try {
      const r = await fn(ctx);
      if (r.audit) await ctx.audit({ ...r.audit, site: "music" });
      revalidateTag("music", { expire: 0 });
      revalidatePath("/studio", "layout");
      return { ok: true as const, message: r.message, ...(r.extra ?? {}) };
    } catch (e) {
      if (e instanceof StudioError) return actionError(e.message);
      if (e instanceof ZodError) return actionError(e.issues[0]?.message ?? "Check the fields.");
      throw e;
    }
  }) as Promise<StudioResult>;
}
