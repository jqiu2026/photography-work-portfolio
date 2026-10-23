import "server-only";
import { actionError } from "@jerryqiu/auth/server";
import { StudioError } from "@jerryqiu/db/studio";
import { canRemove, markCreated } from "@jerryqiu/db/team";
import type { Action } from "@jerryqiu/auth/server";
import { revalidatePath } from "next/cache";
import { guarded } from "@/auth";

type Ctx = Parameters<Parameters<typeof guarded>[1]>[0];
export type StudioResult = { ok: true; message: string; [k: string]: unknown } | { ok: false; error: string };

/**
 * Wraps a studio server action: checks the session and role, rate limits, turns a `StudioError` into a message the UI
 * shows, writes the audit entry the callback returns, and refreshes the studio pages. Use from files that start with
 * "use server" (only async functions may be exported there; this helper lives outside).
 *
 * Three access levels, by who may call it:
 *  - `studio`: anyone on the team (owner, photographer, bookkeeper): shoots, galleries, clients, tasks, gear.
 *  - `studioMoney`: owner and bookkeeper: invoices, payments, orders, price lists, expenses.
 *  - `studioOwner`: the owner only: settings, forms, automations, the team, testimonials, the newsletter list.
 */
function make(access: Action) {
  return (
    fn: (ctx: Ctx) => Promise<{
      message: string;
      audit?: { action: string; entity: string; entityId?: string; summary: string };
      extra?: Record<string, unknown>;
    }>,
  ): Promise<StudioResult> =>
    guarded(access, async (ctx) => {
      try {
        const r = await fn(ctx);
        if (r.audit) await ctx.audit({ ...r.audit, site: "photos" });
        revalidatePath("/studio", "layout");
        return { ok: true as const, message: r.message, ...(r.extra ?? {}) };
      } catch (e) {
        if (e instanceof StudioError) return actionError(e.message);
        throw e;
      }
    }) as Promise<StudioResult>;
}
export const studio = make("studio.access");
export const studioMoney = make("studio.money");
export const studioOwner = make("settings.write");

/**
 * Refuses to remove something unless the person may: the owner can remove anything; a photographer or bookkeeper only
 * what they added themselves in the last 5 minutes (a slip they can take back), so a helper can never delete the
 * studio's work. `entity` and `id` match what `created` recorded when it was added.
 */
export async function mayRemove(ctx: Ctx, entity: string, id: string) {
  if (!(await canRemove(ctx.db, { role: ctx.user.role, email: ctx.user.email }, entity, id)))
    throw new StudioError(
      "You can take back something you added in the last 5 minutes. Ask the owner to remove anything else.",
    );
}
/** Records that this person just added this thing, so they can take it back for a few minutes. */
export const created = (ctx: Ctx, entity: string, id: string) => markCreated(ctx.db, ctx.user.email, entity, id);
