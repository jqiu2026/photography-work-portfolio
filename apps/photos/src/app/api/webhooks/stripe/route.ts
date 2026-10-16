import { afterPayment } from "@/lib/after-payment";
import { getDb } from "@jerryqiu/db";
import * as st from "@jerryqiu/db/studio";
import { type StripeEvent, paymentFromEvent, verifyStripeSignature } from "@jerryqiu/payments";

export const dynamic = "force-dynamic";

/**
 * Stripe webhook. Verifies the signature over the RAW body, claims the event id (replays are acknowledged and ignored),
 * and records the payment idempotently. Returns 503 when Stripe is not configured so nothing can be spoofed in.
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
  const p = paymentFromEvent(event);
  if (p) {
    try {
      const rec = await st.recordPayment(db, {
        invoiceId: p.invoiceId,
        provider: "stripe",
        providerRef: p.providerRef,
        amountCents: p.amountCents,
        status: p.status,
        receiptRef: p.receiptRef,
        raw: { event: event.id, type: event.type },
      });
      if (!rec.duplicate && p.status === "succeeded")
        await afterPayment(db, p.invoiceId).catch((e) => console.error("[after-payment]", String(e)));
    } catch (error) {
      console.error("[stripe] could not record payment", event.id, String(error));
      return new Response("Could not record", { status: 500 });
    }
  }
  // Claimed AFTER the payment is recorded: if recording failed we returned 500 above and Stripe retries; a replay of a
  // processed event is harmless because recordPayment is idempotent per (provider, reference).
  const first = await st.claimWebhookEvent(db, event.id, "stripe", event.type);
  return Response.json({ received: true, duplicate: !first });
}
