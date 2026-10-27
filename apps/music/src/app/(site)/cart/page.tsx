import { getDb } from "@jerryqiu/db";
import * as m from "@jerryqiu/db/music";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { RemoveFromCart } from "@/components/RemoveFromCart";
import { Button, EmptyState, FormMessage } from "@/components/ui";
import { readCart } from "@/lib/cart";
import { TIER_LABEL, usd } from "@/lib/format";

export const metadata: Metadata = { title: "Cart", robots: { index: false } };

export default async function Cart() {
  const ids = await readCart();
  const db = getDb();
  const cart = db && ids.length ? await m.previewCart(db, ids) : { lines: [], totals: null, error: null };
  return (
    <main id="main">
      <PageHeader eyebrow="Scores" title="Your cart" />
      <div className="mu-wrap mu-section mu-stack">
        {cart.error ? <FormMessage>{cart.error}</FormMessage> : null}
        {!ids.length || !cart.lines.length ? (
          <>
            <EmptyState>
              {ids.length && cart.error
                ? "Remove the item that is no longer available and try again."
                : "Your cart is empty."}
            </EmptyState>
            {ids.length && cart.error
              ? ids.map((id) => <RemoveFromCart key={id} productId={id} label="Remove this item" />)
              : null}
            <div>
              <Button asChild variant="secondary">
                <Link href="/scores">Browse scores</Link>
              </Button>
            </div>
          </>
        ) : (
          <>
            <table className="mu-table">
              <caption className="hm-visually-hidden" style={{ position: "absolute", left: "-9999px" }}>
                Scores in your cart
              </caption>
              <thead>
                <tr>
                  <th scope="col">Score</th>
                  <th scope="col">License</th>
                  <th scope="col" className="num">
                    Price
                  </th>
                  <th scope="col">
                    <span style={{ position: "absolute", left: "-9999px" }}>Remove</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {cart.lines.map((l) => (
                  <tr key={l.productId}>
                    <td>{l.title}</td>
                    <td>{TIER_LABEL[l.tier]}</td>
                    <td className="num">{l.priceCents === 0 ? "Free" : usd(l.priceCents)}</td>
                    <td>
                      <RemoveFromCart productId={l.productId} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {cart.totals ? (
              <div className="mu-totals">
                <div>
                  <span>Scores</span>
                  <span>{usd(cart.totals.subtotalCents)}</span>
                </div>
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
            ) : null}
            <div className="mu-actions" style={{ justifyContent: "flex-end" }}>
              <Button asChild variant="ghost">
                <Link href="/scores">Keep browsing</Link>
              </Button>
              <Button asChild>
                <Link href="/checkout">Checkout</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
