import "server-only";
import { type Database, getDb } from "@jerryqiu/db";
import * as m from "@jerryqiu/db/music";
import { createCheckoutSession } from "@jerryqiu/payments";
import { usd } from "@jerryqiu/scores";
import { sendReceipt, siteUrl } from "@/lib/mail";

export const mocksOn = () => process.env.ENABLE_MOCKS === "true" || process.env.NODE_ENV !== "production";
export const stripeKey = () => process.env.STRIPE_SECRET_KEY?.trim() || "";

/** After an order is paid (webhook, free order or the labeled mock): the receipt email with the order link. */
export async function afterOrderPaid(db: Database, orderId: string, token?: string) {
  const [row] = await m.orderLinesFor(db, orderId);
  if (!row) return;
  const link = token ?? m.accessTokenFor(orderId);
  await sendReceipt(row.order.email, {
    number: m.orderNumber(row.order.seq),
    id: row.order.id,
    token: link,
    lines: row.lines.map((l) => `${l.title}: ${l.priceCents === 0 ? "free" : usd(l.priceCents)}`),
    total: usd(row.order.totalCents),
  });
}

export type StartResult = { redirect: string } | { error: string };

/** Hands a pending order to the payment provider and says where to send the buyer. */
export async function startPayment(
  order: { id: string; seq: number; email: string; totalCents: number },
  token: string,
  lines: string[],
): Promise<StartResult> {
  const db = getDb();
  if (!db) return { error: "Checkout is not open yet." };
  if (order.totalCents === 0) {
    await m.markOrderPaid(db, order.id, { provider: "free" });
    await afterOrderPaid(db, order.id, token);
    return { redirect: `/order/${token}` };
  }
  const key = stripeKey();
  if (key) {
    try {
      const s = await createCheckoutSession(
        { secretKey: key },
        {
          invoiceId: order.id,
          invoiceNumber: m.orderNumber(order.seq),
          amountCents: order.totalCents,
          currency: "usd",
          description: lines.join(", "),
          successUrl: `${siteUrl()}/order/${token}`,
          cancelUrl: `${siteUrl()}/cart`,
          customerEmail: order.email,
          metadata: { site: "music" },
        },
        `music-order-${order.id}`,
      );
      await m.setOrderProviderRef(db, order.id, "stripe", s.id);
      return { redirect: s.url };
    } catch (e) {
      console.error("[music] could not start Stripe checkout", String(e));
      await m.cancelPendingOrder(db, order.id);
      return { error: "The payment page could not be opened. Nothing was charged. Please try again." };
    }
  }
  if (mocksOn()) return { redirect: `/checkout/mock?token=${encodeURIComponent(token)}` };
  await m.cancelPendingOrder(db, order.id);
  return { error: "Payments are not open yet. TODO(owner): needs STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET." };
}
