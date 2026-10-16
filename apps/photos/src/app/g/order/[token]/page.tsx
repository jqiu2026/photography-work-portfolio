import { getDb, schema } from "@jerryqiu/db";
import * as shop from "@jerryqiu/db/gallery-shop";
import { RichTextBlock } from "@/components/gallery/RichTextBlock";
import { eq, inArray } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Shell } from "@/components/Shell";
import { verifyOrderLink } from "@/lib/order-link";
import "@/components/gallery/order.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your order", robots: { index: false, follow: false } };

const usd = (c: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(c / 100);
const STATUS: Record<string, string> = {
  pending: "Waiting for payment",
  paid: "Paid. Preparing your order",
  fulfilled: "Complete",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

/** The buyer's order: what they bought, its state, and (once paid) their download links. */
export default async function OrderPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const db = getDb();
  const id = verifyOrderLink(token);
  if (!db || !id) notFound();
  const [order] = await db.select().from(schema.studioOrders).where(eq(schema.studioOrders.id, id));
  if (!order) notFound();
  const items = await shop.orderItems(db, order.id);
  const [g] = await db.select().from(schema.studioGalleries).where(eq(schema.studioGalleries.id, order.galleryId));
  const names = new Map<string, string>();
  const mediaIds = items.map((i) => i.mediaId).filter((x): x is string => Boolean(x));
  if (mediaIds.length) {
    const rows = await db
      .select({ id: schema.media.id, f: schema.media.filename })
      .from(schema.media)
      .where(inArray(schema.media.id, mediaIds));
    for (const r of rows) names.set(r.id, r.f);
  }
  const paid = order.status === "paid" || order.status === "fulfilled";
  const ent = shop.entitlements(items);
  const dl = (q: string) => `/g/order/${token}/download?${q}`;
  return (
    <Shell>
      <div className="ord">
        <p className="ord-eyebrow">{g?.title ?? "Order"}</p>
        <h1>Order {order.number}</h1>
        <p className="ord-state" data-state={order.status}>
          {STATUS[order.status] ?? order.status}
        </p>
        <ul className="ord-items">
          {items.map((i) => (
            <li key={i.id}>
              <span>
                {i.name}
                {i.qty > 1 ? ` × ${i.qty}` : ""}
                {i.mediaId ? <small>{names.get(i.mediaId) ?? "photograph"}</small> : null}
              </span>
              <em>{usd(i.unitCents * i.qty)}</em>
            </li>
          ))}
          {order.shippingCents ? (
            <li>
              <span>Shipping</span>
              <em>{usd(order.shippingCents)}</em>
            </li>
          ) : null}
          <li className="ord-total">
            <span>Total</span>
            <em>{usd(order.totalCents)}</em>
          </li>
        </ul>
        {paid && (ent.all || ent.per.length) ? (
          <section aria-labelledby="ord-dl">
            <h2 id="ord-dl">Your downloads</h2>
            <ul className="ord-dl">
              {ent.per.map((e) => (
                <li key={`${e.mediaId}-${e.size}`}>
                  <span>
                    {names.get(e.mediaId) ?? "Photograph"}{" "}
                    <small>{e.size === "full" ? "full resolution" : "web size"}</small>
                  </span>
                  <a className="ord-btn" href={dl(`m=${e.mediaId}&size=${e.size}`)} download>
                    Download
                  </a>
                </li>
              ))}
              {ent.all ? (
                <li>
                  <span>
                    Whole gallery <small>full resolution, ZIP</small>
                  </span>
                  <a className="ord-btn" href={dl("zip=1&size=full&part=1")} download>
                    Download ZIP
                  </a>
                </li>
              ) : null}
            </ul>
          </section>
        ) : null}
        {paid && items.some((i) => ["print", "canvas", "album", "card"].includes(i.kind)) ? (
          <p className="ord-note">
            {order.labOrderId
              ? "Your prints were sent to the lab. They ship to the address you gave, and a tracking email follows."
              : "Your prints are being prepared. I'll email you when they ship."}
          </p>
        ) : null}
        {paid && g && shop.readShop(g.shop).printRelease ? (
          <section aria-labelledby="ord-lic">
            <h2 id="ord-lic">Print release</h2>
            <RichTextBlock text={shop.readShop(g.shop).printRelease} />
          </section>
        ) : null}
        {order.status === "pending" ? (
          <p className="ord-note">Finish paying from the link in your email to unlock this order.</p>
        ) : null}
        {g?.slug ? (
          <p>
            <a className="ord-link" href={`/g/${g.slug}`}>
              Back to the gallery
            </a>
          </p>
        ) : null}
      </div>
    </Shell>
  );
}
