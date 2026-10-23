import "server-only";
import { type Database, schema } from "@jerryqiu/db";
import { notify } from "@jerryqiu/db/automation";
import * as gal from "@jerryqiu/db/galleries";
import * as shop from "@jerryqiu/db/gallery-shop";
import { PRINT_KINDS } from "@jerryqiu/db/gallery-shop";
import { sendTemplate } from "@jerryqiu/email";
import { tokenSecrets } from "@jerryqiu/protect";
import { MOCK_CATALOG, fitsProduct, printProviderFromEnv, signFileLink } from "@jerryqiu/prints";
import { getSite } from "@jerryqiu/sites";
import { eq } from "drizzle-orm";
import { orderUrl } from "@/lib/order-link";

const usd = (c: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(c / 100);

/** The print items of an order in a stable order; the lab's file links address them by position in this list. */
export const printItems = (items: (typeof schema.studioOrderItems.$inferSelect)[]) =>
  items
    .filter((i) => i.sku && (PRINT_KINDS as readonly string[]).includes(i.kind))
    .sort((a, b) => a.id.localeCompare(b.id));

/**
 * Called after any invoice payment. For a shop order that just became paid: tell the studio, send prints to the lab (only
 * now, never before payment, and only when the photograph is sharp enough for the size), and email the buyer their link.
 * Safe to call twice: the order moves to "paid" once.
 */
export async function afterShopPayment(db: Database, invoiceId: string) {
  const paid = await shop.markOrderPaid(db, invoiceId);
  if (!paid || !paid.first) return;
  const { order, items } = paid;
  const prints = printItems(items);
  const problems: string[] = [];
  let labOrderId: string | null = null;
  if (prints.length && order.ship) {
    const provider = printProviderFromEnv();
    const secret = tokenSecrets()[0];
    if (!provider || !secret) problems.push("No print lab is connected, so prints were not sent.");
    else {
      const catalog = await provider.catalog();
      const [g] = await db.select().from(schema.studioGalleries).where(eq(schema.studioGalleries.id, order.galleryId));
      const contents = g ? await gal.galleryContents(db, g.id) : [];
      const exp = Date.now() + 14 * 24 * 3600 * 1000;
      const lines: { sku: string; qty: number; fileUrl: string; mediaId: string }[] = [];
      prints.forEach((it, i) => {
        const cat = catalog.find((c) => c.sku === it.sku) ?? MOCK_CATALOG.find((c) => c.sku === it.sku);
        const m = contents.find((c) => c.media.id === it.mediaId)?.media;
        if (!cat || !m || !it.mediaId) return void problems.push(`${it.name}: product or photograph not found.`);
        const fit = fitsProduct(cat, m.width ?? 0, m.height ?? 0);
        if (!fit.ok)
          return void problems.push(`${it.name}: ${m.filename} is too small for this size (${fit.ppi} ppi).`);
        const sig = signFileLink(secret, order.id, i, exp);
        lines.push({
          sku: it.sku as string,
          qty: it.qty,
          mediaId: it.mediaId,
          fileUrl: `${getSite("photos").url}/api/print-file/${order.id}/${i}?e=${exp}&s=${sig}`,
        });
      });
      if (lines.length) {
        try {
          const r = await provider.submit({
            reference: order.number,
            items: lines,
            ship: { ...(order.ship as Record<string, string>) } as never,
          });
          labOrderId = r.providerOrderId;
          await shop.setLabOrder(db, order.id, r.providerOrderId);
        } catch (e) {
          problems.push(`The print lab refused the order: ${String(e).slice(0, 160)}`);
        }
      }
    }
  }
  if (!prints.length) await shop.markFulfilled(db, order.id);
  await notify(db, {
    kind: "payment",
    title: `Shop order ${order.number} paid`,
    body: `${order.buyerName}, ${usd(order.totalCents)}${problems.length ? `. Needs you: ${problems.join(" ")}` : ""}`,
    link: "/studio/orders",
  });
  await sendTemplate(
    db,
    order.buyerEmail,
    "order-ready",
    {
      name: order.buyerName,
      title: order.number,
      amount: usd(order.totalCents),
      detail: prints.length
        ? labOrderId
          ? "Your prints are with the lab and will ship to the address you gave."
          : "I'll send your prints as soon as they are ready."
        : "Your downloads are ready.",
      link: orderUrl(order.id),
    },
    { related: { type: "order", id: order.id } },
  );
}
