import * as m from "@jerryqiu/db/music";
import Link from "next/link";
import { NoDb, Stat, StudioHead } from "@/components/studio/StudioBits";
import { Tag } from "@/components/ui";
import { usd } from "@/lib/format";
import { studioPage } from "@/lib/studio-page";

export const dynamic = "force-dynamic";

const tone = { paid: "success", pending: "warning", refunded: "neutral", canceled: "neutral" } as const;

export default async function Orders() {
  const { db } = await studioPage();
  if (!db) return <NoDb />;
  const [orders, sales] = await Promise.all([m.listOrdersAdmin(db, 200), m.salesSummary(db)]);
  return (
    <>
      <StudioHead title="Orders" />
      <div className="st-stats">
        <Stat label="Paid" value={sales.paid} />
        <Stat label="Revenue" value={usd(sales.revenueCents)} hint="without card fees" />
        <Stat label="Card fees collected" value={usd(sales.feesCollectedCents)} hint="passed to buyers" />
        <Stat label="Refunded" value={sales.refunded} />
      </div>
      <section className="st-card">
        {orders.length ? (
          orders.map((o) => (
            <div key={o.id} className="st-rowline">
              <Link className="mu-link" href={`/studio/orders/${o.id}`}>
                {m.orderNumber(o.seq)} · {o.holderName}
              </Link>
              <span className="mu-row">
                <Tag tone={tone[o.status]}>{o.status}</Tag>
                <span className="mu-muted">
                  {o.createdAt.toISOString().slice(0, 10)} · {usd(o.totalCents)}
                </span>
              </span>
            </div>
          ))
        ) : (
          <p className="mu-muted">No orders yet.</p>
        )}
      </section>
    </>
  );
}
