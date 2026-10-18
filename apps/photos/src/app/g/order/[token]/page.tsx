import { getDb, schema } from "@jerryqiu/db";
import * as shop from "@jerryqiu/db/gallery-shop";
import { RichTextBlock } from "@/components/gallery/RichTextBlock";
import { eq, inArray } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Shell } from "@/components/Shell";
import { verifyOrderLink } from "@/lib/order-link";
import "@/components/gallery/order.css";
import {
  Alert,
  Button,
  Container,
  DataList,
  DataListItem,
  Heading,
  PageDescription,
  PageEyebrow,
  PageHeader,
  PageTitle,
  Prose,
  Section,
  Status,
} from "@/components/ui";

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
  const tone = paid ? "success" : order.status === "pending" ? "warning" : "muted";
  return (
    <Shell>
      <Container size="sm">
        <Section>
          <PageHeader>
            <PageEyebrow>{g?.title ?? "Order"}</PageEyebrow>
            <PageTitle>Order {order.number}</PageTitle>
            <PageDescription>
              <Status tone={tone}>{STATUS[order.status] ?? order.status}</Status>
            </PageDescription>
          </PageHeader>
          {order.status === "pending" ? (
            <Alert tone="warning" role="status" style={{ marginBottom: "var(--hm-space-6)" }}>
              Finish paying from the link in your email to unlock this order.
            </Alert>
          ) : null}
          <DataList aria-label="What you ordered">
            {items.map((i) => (
              <DataListItem
                key={i.id}
                description={i.mediaId ? (names.get(i.mediaId) ?? "photograph") : undefined}
                meta={<span className="ord-num">{usd(i.unitCents * i.qty)}</span>}
              >
                {i.name}
                {i.qty > 1 ? ` × ${i.qty}` : ""}
              </DataListItem>
            ))}
            {order.shippingCents ? (
              <DataListItem meta={<span className="ord-num">{usd(order.shippingCents)}</span>}>Shipping</DataListItem>
            ) : null}
            <DataListItem className="ord-total" meta={<span className="ord-num">{usd(order.totalCents)}</span>}>
              Total
            </DataListItem>
          </DataList>
          {paid && (ent.all || ent.per.length) ? (
            <section aria-labelledby="ord-dl" className="ord-block">
              <Heading level={2} size="lg" id="ord-dl">
                Your downloads
              </Heading>
              <DataList>
                {ent.per.map((e) => (
                  <DataListItem
                    key={`${e.mediaId}-${e.size}`}
                    description={e.size === "full" ? "Full resolution" : "Web size"}
                    actions={
                      <Button asChild variant="secondary" size="sm">
                        <a href={dl(`m=${e.mediaId}&size=${e.size}`)} download>
                          Download
                        </a>
                      </Button>
                    }
                  >
                    {names.get(e.mediaId) ?? "Photograph"}
                  </DataListItem>
                ))}
                {ent.all ? (
                  <DataListItem
                    description="Full resolution, ZIP"
                    actions={
                      <Button asChild variant="secondary" size="sm">
                        <a href={dl("zip=1&size=full&part=1")} download>
                          Download ZIP
                        </a>
                      </Button>
                    }
                  >
                    Whole gallery
                  </DataListItem>
                ) : null}
              </DataList>
            </section>
          ) : null}
          {paid && items.some((i) => ["print", "canvas", "album", "card"].includes(i.kind)) ? (
            <Alert tone="info" role="status" className="ord-block">
              {order.labOrderId
                ? "Your prints were sent to the lab. They ship to the address you gave, and a tracking email follows."
                : "Your prints are being prepared. I'll email you when they ship."}
            </Alert>
          ) : null}
          {paid && g && shop.readShop(g.shop).printRelease ? (
            <section aria-labelledby="ord-lic" className="ord-block">
              <Heading level={2} size="lg" id="ord-lic">
                Print release
              </Heading>
              <Prose>
                <RichTextBlock text={shop.readShop(g.shop).printRelease} />
              </Prose>
            </section>
          ) : null}
          {g?.slug ? (
            <p className="ord-block">
              <Button asChild variant="secondary">
                <a href={`/g/${g.slug}`}>Back to the gallery</a>
              </Button>
            </p>
          ) : null}
        </Section>
      </Container>
    </Shell>
  );
}
