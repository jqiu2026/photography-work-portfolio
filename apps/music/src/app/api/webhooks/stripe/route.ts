import { getDb } from "@jerryqiu/db";
import * as m from "@jerryqiu/db/music";
import { claimWebhookEvent } from "@jerryqiu/db/studio";
import { type StripeEvent, paymentFromEvent, refundFromEvent, verifyStripeSignature } from "@jerryqiu/payments";
import { afterOrderPaid } from "@/lib/checkout";
import { sendRefundNotice } from "@/lib/mail";

export const dynamic = "force-dynamic";

/**
 * Stripe webhook for score orders. Verifies the signature over the raw body, ignores events that are not this site's
 * (metadata site=music), and marks the order paid once (a replay changes nothing). 503 when Stripe is not configured, so
 * nothing can be spoofed in.
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return new Response("Not configured", { status: 503 });
  const raw = await request.text();
  if (raw.length > 512_000) return new Response("Too large", { status: 413 });
  if (!verifyStripeSignature(raw, request.headers.get("stripe-signature"), secret))
    return new Response("Bad signature", { status: 400 });
  let event: StripeEvent;
  try {
    event = JSON.parse(raw) as StripeEvent;
  } catch {
    return new Response("Bad request", { status: 400 });
  }
  const db = getDb();
  if (!db) return new Response("No database", { status: 503 });
  const meta = (event.data?.object?.metadata ?? {}) as Record<string, string>;
  const p = paymentFromEvent(event);
  if (p && meta.site === "music") {
    try {
      const r = await m.markOrderPaid(db, p.invoiceId, { provider: "stripe", providerRef: p.providerRef });
      if (!r.duplicate) await afterOrderPaid(db, p.invoiceId).catch((e) => console.error("[music] receipt", String(e)));
    } catch (error) {
      console.error("[music-stripe] could not record payment", event.id, String(error));
      return new Response("Could not record", { status: 500 });
    }
  }
  const rf = refundFromEvent(event);
  if (rf) {
    try {
      const order = await m.orderByProviderRef(db, rf.providerRef);
      // Only a full refund ends the licenses; a partial refund is the owner's call in the studio.
      if (order && rf.refundedCents >= order.totalCents && (await m.refundOrder(db, order.id)))
        await sendRefundNotice(order.email, m.orderNumber(order.seq));
    } catch (error) {
      console.error("[music-stripe] could not record refund", event.id, String(error));
      return new Response("Could not record", { status: 500 });
    }
  }
  await claimWebhookEvent(db, event.id, "stripe", event.type);
  return Response.json({ received: true });
}
