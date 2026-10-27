import * as m from "@jerryqiu/db/music";
import Link from "next/link";
import { NoDb, Stat, StudioHead } from "@/components/studio/StudioBits";
import { Button } from "@/components/ui";
import { usd } from "@/lib/format";
import { studioPage } from "@/lib/studio-page";

export const dynamic = "force-dynamic";

export default async function Overview() {
  const { db } = await studioPage();
  if (!db) return <NoDb />;
  const [sales, works, commissions, subs, orders] = await Promise.all([
    m.salesSummary(db),
    m.listWorksAdmin(db),
    m.listCommissions(db),
    m.listSubscribersAdmin(db),
    m.listOrdersAdmin(db, 5),
  ]);
  const published = works.filter((w) => w.status === "published").length;
  const fresh = commissions.filter((c) => c.status === "new").length;
  const confirmed = subs.filter((s) => s.confirmedAt && !s.unsubscribedAt).length;
  return (
    <>
      <StudioHead title="Overview">
        <Button asChild>
          <Link href="/studio/pieces/new">New piece</Link>
        </Button>
      </StudioHead>
      <div className="st-stats">
        <Stat
          label="Revenue (scores)"
          value={usd(sales.revenueCents)}
          hint={`${sales.paid} paid orders, card fees not counted`}
        />
        <Stat label="Pieces" value={`${published} of ${works.length}`} hint="published" />
        <Stat label="New inquiries" value={fresh} hint={<Link href="/studio/commissions">Open</Link>} />
        <Stat label="Subscribers" value={confirmed} hint="confirmed" />
      </div>
      <section className="st-card" aria-labelledby="recent">
        <h2 id="recent">Recent orders</h2>
        {orders.length ? (
          orders.map((o) => (
            <div key={o.id} className="st-rowline">
              <Link className="mu-link" href={`/studio/orders/${o.id}`}>
                {m.orderNumber(o.seq)} · {o.holderName}
              </Link>
              <span className="mu-muted">
                {o.status} · {usd(o.totalCents)}
              </span>
            </div>
          ))
        ) : (
          <p className="mu-muted">No orders yet.</p>
        )}
      </section>
      {sales.top.length ? (
        <section className="st-card" aria-labelledby="top">
          <h2 id="top">Best sellers</h2>
          {sales.top.map((t) => (
            <div key={t.title} className="st-rowline">
              <span>{t.title}</span>
              <span className="mu-muted">
                {t.count} sold · {usd(t.cents)}
              </span>
            </div>
          ))}
        </section>
      ) : null}
    </>
  );
}
