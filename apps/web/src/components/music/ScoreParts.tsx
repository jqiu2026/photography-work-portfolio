"use client";

import { cartTotal, compositions, makeOrder, usd, bySlug, type Composition } from "@jerryqiu/mocks";
import Link from "next/link";
import { sitePath } from "@jerryqiu/sites";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useScoreStore } from "./useScoreStore";

const href = (p: string) => sitePath("music", p);

export function AddToCart({ slug }: { slug: string }) {
  const s = useScoreStore();
  const [msg, setMsg] = useState<string>();
  const inCart = s.cart.some((l) => l.slug === slug);
  const owned = s.orders.some((o) => o.lines.some((l) => l.slug === slug));
  if (owned)
    return (
      <p className="sc-note" role="status">
        You own this score. <Link href={href("/scores/library")}>Open your library</Link>
      </p>
    );
  return (
    <div>
      <button
        type="button"
        className="sc-btn"
        disabled={!s.ready}
        onClick={() => {
          try {
            s.add(slug);
            setMsg("Added to your cart.");
          } catch (e) {
            setMsg(e instanceof Error ? e.message : "Could not add.");
          }
        }}
      >
        {inCart ? "In your cart" : "Add score to cart"}
      </button>
      {msg ? (
        <p className="sc-note" role="status">
          {msg} <Link href={href("/scores/cart")}>View cart</Link>
        </p>
      ) : null}
    </div>
  );
}

export function CartView() {
  const s = useScoreStore();
  if (!s.ready) return <p className="sc-note">Loading…</p>;
  if (!s.cart.length)
    return (
      <p className="sc-note">
        Your cart is empty. <Link href={href("/scores")}>Browse scores</Link>
      </p>
    );
  return (
    <div>
      <ul className="sc-lines">
        {s.cart.map((l) => (
          <li key={l.slug}>
            <span>{bySlug(l.slug)?.title}</span>
            <strong>{usd(l.priceCents)}</strong>
            <button
              type="button"
              className="sc-link"
              onClick={() => s.remove(l.slug)}
              aria-label={`Remove ${bySlug(l.slug)?.title} from cart`}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      <p className="sc-total">
        Total <strong>{usd(cartTotal(s.cart))}</strong>
      </p>
      <Link className="sc-btn" href={href("/scores/checkout")}>
        Checkout
      </Link>
    </div>
  );
}

export function Checkout() {
  const s = useScoreStore();
  const router = useRouter();
  const [card, setCard] = useState({ number: "", exp: "", cvc: "" });
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  if (!s.ready) return <p className="sc-note">Loading…</p>;
  if (!s.cart.length)
    return (
      <p className="sc-note">
        Nothing to check out. <Link href={href("/scores")}>Browse scores</Link>
      </p>
    );
  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(undefined);
    setBusy(true);
    try {
      const intent = await s.pay.createIntent({
        amount: cartTotal(s.cart),
        description: "Score order",
        metadata: { items: s.cart.map((l) => l.slug).join(",") },
      });
      const r = await s.pay.confirm(intent, card);
      if (!r.ok) return setError(r.error);
      const order = makeOrder(s.cart, email, r.receiptId);
      s.addOrder(order);
      s.clear();
      router.push(href("/scores/library"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="sc-form" onSubmit={submit}>
      <p className="sc-total">
        Total <strong>{usd(cartTotal(s.cart))}</strong>
      </p>
      <p className="sc-note">
        Mock checkout (Stripe test-mode shape). Use 4242 4242 4242 4242, any future expiry, any 3 digits. No card is
        charged.
      </p>
      <label>
        Email for the receipt
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      </label>
      <label>
        Card number
        <input
          inputMode="numeric"
          autoComplete="off"
          value={card.number}
          onChange={(e) => setCard({ ...card, number: e.target.value })}
        />
      </label>
      <label>
        Expiry (MM / YY)
        <input autoComplete="off" value={card.exp} onChange={(e) => setCard({ ...card, exp: e.target.value })} />
      </label>
      <label>
        Security code
        <input
          inputMode="numeric"
          autoComplete="off"
          value={card.cvc}
          onChange={(e) => setCard({ ...card, cvc: e.target.value })}
        />
      </label>
      {error ? (
        <p role="alert" className="sc-error">
          {error}
        </p>
      ) : null}
      <button className="sc-btn" type="submit" disabled={busy}>
        {busy ? "Paying…" : `Pay ${usd(cartTotal(s.cart))}`}
      </button>
    </form>
  );
}

export function Library() {
  const s = useScoreStore();
  if (!s.ready) return <p className="sc-note">Loading…</p>;
  if (!s.orders.length)
    return (
      <p className="sc-note">
        No purchases yet. <Link href={href("/scores")}>Browse scores</Link>
      </p>
    );
  function download(orderIndex: number, slug: string) {
    const o = s.orders[orderIndex];
    const f = s.delivery.deliver(o, slug);
    const url = URL.createObjectURL(new Blob([f.bytes as BlobPart], { type: f.mime }));
    const a = document.createElement("a");
    a.href = url;
    a.download = f.filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div>
      {s.orders.map((o, oi) => (
        <section key={o.id} className="sc-order" aria-label={`Order ${o.id}`}>
          <p className="sc-eyebrow">
            Order {o.id} · receipt {o.receiptId} · {o.createdAt.slice(0, 10)} · {usd(o.totalCents)}
          </p>
          <ul className="sc-lines">
            {o.lines.map((l) => (
              <li key={l.slug}>
                <span>{bySlug(l.slug)?.title}</span>
                <button type="button" className="sc-btn sc-btn--ghost" onClick={() => download(oi, l.slug)}>
                  Download (placeholder file)
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/** The two separate paths of a composition: listen (only with a recording) and score (preview, price, cart). */
export function Paths({ c }: { c: Composition }) {
  return (
    <div className="sc-paths">
      <section aria-labelledby={`l-${c.slug}`}>
        <h2 id={`l-${c.slug}`}>Listen</h2>
        {c.recording ? (
          <Link className="sc-btn sc-btn--ghost" href={href("/listen")}>
            Open the listening room
          </Link>
        ) : (
          <p className="sc-note">No performance recording exists yet.</p>
        )}
      </section>
      <section aria-labelledby={`s-${c.slug}`}>
        <h2 id={`s-${c.slug}`}>Score</h2>
        {c.score ? (
          <>
            <p className="sc-price">{usd(c.score.priceCents)}</p>
            <p className="sc-note">
              {c.score.pages} pages · {c.score.format} · {c.score.licence}
            </p>
            <Link className="sc-btn sc-btn--ghost" href={href(`/scores/${c.slug}`)}>
              Preview and buy
            </Link>
          </>
        ) : (
          <p className="sc-note">This score is not for sale.</p>
        )}
      </section>
    </div>
  );
}

export const catalogue = compositions;
