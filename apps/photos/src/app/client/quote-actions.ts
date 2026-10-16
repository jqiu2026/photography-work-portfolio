"use server";

import { getDb, hitRateLimit } from "@jerryqiu/db";
import { notify } from "@jerryqiu/db/automation";
import * as com from "@jerryqiu/db/commerce";
import { StudioError } from "@jerryqiu/db/studio";
import { sha256Hex } from "@jerryqiu/db/studio-crypto";
import { revalidatePath } from "next/cache";
import { requestIpHash } from "@/lib/portal";
import { resolveRef } from "@/lib/portal-links";

export type QuoteResult = { ok: true; message?: string; payUrl?: string } | { ok: false; error: string };

async function gate(token: string) {
  const db = getDb();
  const ref = await resolveRef(token, "quote");
  if (!db || !ref) return null;
  const ip = await requestIpHash();
  if (!(await hitRateLimit(db, `quote:${ip}`, 40, 600)).allowed) return null;
  return { db, ip, ref };
}

/** Upsells: the client chooses extras; the quote is re-priced on the server from the catalogue. */
export async function repriceQuoteAction(token: string, extra: { id: string; qty: number }[]): Promise<QuoteResult> {
  const g = await gate(token);
  if (!g) return { ok: false, error: "Try again in a moment." };
  try {
    await com.repriceQuote(g.db, g.ref, extra.slice(0, 20));
    revalidatePath(`/client/quote/${token}`);
    return { ok: true, message: "Updated" };
  } catch (e) {
    return { ok: false, error: e instanceof StudioError ? e.message : "Could not update the quote." };
  }
}

export async function acceptQuoteAction(token: string, name: string, agreed: boolean): Promise<QuoteResult> {
  const g = await gate(token);
  if (!g) return { ok: false, error: "Try again in a moment." };
  if (!agreed) return { ok: false, error: "Please tick the box to accept the quote and its terms." };
  try {
    const r = await com.acceptQuote(g.db, g.ref, { name, ipHash: sha256Hex(g.ip) });
    await notify(g.db, { kind: "quote", title: `Quote accepted by ${name.trim()}`, link: "/studio/quotes" });
    const { sendTemplate } = await import("@jerryqiu/email");
    const q = await com.quoteByToken(g.db, g.ref);
    if (q) {
      const { getSite } = await import("@jerryqiu/sites");
      const { schema } = await import("@jerryqiu/db");
      const { eq } = await import("drizzle-orm");
      const [c] = await g.db.select().from(schema.studioClients).where(eq(schema.studioClients.id, q.clientId));
      if (c)
        await sendTemplate(
          g.db,
          c.email,
          "booking-confirmed",
          {
            name: c.name,
            title: q.title,
            detail: r.payToken ? "Pay the deposit to confirm your booking." : "Nothing to pay right now.",
            link: r.payToken ? `${getSite("photos").url}/client/pay/${r.payToken}` : undefined,
            linkLabel: "Pay the deposit",
          },
          { related: { type: "quote", id: q.id } },
        );
    }
    revalidatePath(`/client/quote/${token}`);
    return { ok: true, message: "Accepted. Thank you.", payUrl: r.payToken ? `/client/pay/${r.payToken}` : undefined };
  } catch (e) {
    return { ok: false, error: e instanceof StudioError ? e.message : "Could not accept the quote." };
  }
}

export async function declineQuoteAction(token: string): Promise<QuoteResult> {
  const g = await gate(token);
  if (!g) return { ok: false, error: "Try again in a moment." };
  try {
    await com.declineQuote(g.db, g.ref);
    revalidatePath(`/client/quote/${token}`);
    return { ok: true, message: "Declined. Thank you for letting me know." };
  } catch (e) {
    return { ok: false, error: e instanceof StudioError ? e.message : "Could not decline the quote." };
  }
}
