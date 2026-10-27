import { getDb } from "@jerryqiu/db";
import * as m from "@jerryqiu/db/music";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckoutForm } from "@/components/CheckoutForm";
import { PageHeader } from "@/components/PageHeader";
import { readCart } from "@/lib/cart";
import { usd } from "@/lib/format";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function Checkout() {
  const ids = await readCart();
  const db = getDb();
  if (!ids.length || !db) redirect("/cart");
  const cart = await m.previewCart(db, ids);
  if (cart.error || !cart.lines.length) redirect("/cart");
  return (
    <main id="main">
      <PageHeader
        eyebrow="Scores"
        title="Checkout"
        intro="You pay on a secure page; card details never reach this site."
      />
      <div className="mu-wrap mu-section mu-piece">
        <CheckoutForm needsOrganization={m.needsOrganization(cart.lines)} />
        <aside className="mu-note" aria-label="Order summary">
          <ul className="mu-list">
            {cart.lines.map((l) => (
              <li key={l.productId}>
                <span>{l.title}</span>
                <span>{l.priceCents === 0 ? "Free" : usd(l.priceCents)}</span>
              </li>
            ))}
          </ul>
          <div className="mu-totals">
            {cart.totals.feeCents ? (
              <div>
                <span className="mu-muted">Card fee</span>
                <span className="mu-muted">{usd(cart.totals.feeCents)}</span>
              </div>
            ) : null}
            <div className="mu-totals__sum">
              <strong>Total</strong>
              <strong>{usd(cart.totals.totalCents)}</strong>
            </div>
          </div>
          <p className="mu-muted">
            <Link className="mu-link" href="/licensing">
              License terms
            </Link>
          </p>
        </aside>
      </div>
    </main>
  );
}
