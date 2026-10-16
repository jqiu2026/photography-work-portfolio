"use client";

import Link from "next/link";
import { useState } from "react";
import { cancelOrderAction, saveProductAction } from "@/app/studio/gallery-actions";
import { Frame, useAct } from "./StudioFrame";
import "./galleries.css";

type Product = {
  id: string;
  kind: string;
  name: string;
  description: string;
  price: string;
  sample: boolean;
  active: boolean;
};
type Order = {
  id: string;
  number: string;
  gallery: string;
  galleryId: string;
  status: string;
  buyer: string;
  totalCents: number;
  at: string;
  lab: string | null;
  items: string[];
};
const usd = (c: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(c / 100);
const KIND: Record<string, string> = {
  "digital-web": "Download",
  "digital-full": "Download",
  "digital-all": "Download",
  print: "Print",
  canvas: "Canvas",
  card: "Card",
  album: "Album",
};

/** The shop: one price list for every gallery, and the orders that came in. Prices marked SAMPLE are placeholders until you set them. */
export function OrdersView({ data }: { data: { products: Product[]; orders: Order[] } }) {
  const { pending, note, act } = useAct();
  const [edit, setEdit] = useState<Record<string, Partial<Product>>>({});
  const val = (p: Product, k: keyof Product) => (edit[p.id]?.[k] as string | undefined) ?? (p[k] as string);
  const set = (id: string, k: keyof Product, v: string) => setEdit((e) => ({ ...e, [id]: { ...e[id], [k]: v } }));
  const paid = data.orders.filter((o) => o.status === "paid" || o.status === "fulfilled");
  const revenue = paid.reduce((n, o) => n + o.totalCents, 0);
  return (
    <Frame section="orders" note={note}>
      <div className="gl-stats" style={{ display: "flex", gap: "2rem", flexWrap: "wrap", margin: "0 0 1.6rem" }}>
        <p>
          <strong>{usd(revenue)}</strong>
          <br />
          <small>
            from {paid.length} paid order{paid.length === 1 ? "" : "s"}
          </small>
        </p>
        <p>
          <strong>{data.orders.filter((o) => o.status === "pending").length}</strong>
          <br />
          <small>waiting for payment</small>
        </p>
      </div>

      <section className="st-card" aria-labelledby="ord-prices">
        <h2 id="ord-prices">Price list</h2>
        <p className="st-note">
          One list for every gallery. Print costs come from your lab; check each price covers the lab's cost, shipping
          and the card fee. A price marked SAMPLE is a placeholder: set yours and it disappears.
        </p>
        <ul className="st-list">
          {data.products.map((p) => (
            <li key={p.id}>
              <span style={{ display: "grid", gap: ".3rem", flex: 1 }}>
                <small>{KIND[p.kind] ?? p.kind}</small>
                <input
                  aria-label={`Name of ${p.name}`}
                  value={val(p, "name")}
                  onChange={(e) => set(p.id, "name", e.target.value)}
                />
              </span>
              <span>
                <input
                  aria-label={`Price of ${p.name}`}
                  inputMode="decimal"
                  style={{ width: "6rem" }}
                  value={val(p, "price")}
                  onChange={(e) => set(p.id, "price", e.target.value)}
                />{" "}
                {p.sample && !edit[p.id]?.price ? <small>SAMPLE</small> : null}
              </span>
              <label>
                <input
                  type="checkbox"
                  checked={edit[p.id]?.active === undefined ? p.active : Boolean(edit[p.id]?.active)}
                  onChange={(e) => setEdit((x) => ({ ...x, [p.id]: { ...x[p.id], active: e.target.checked } }))}
                />{" "}
                For sale
              </label>
              <button
                type="button"
                className="st-btn"
                disabled={pending || !edit[p.id]}
                onClick={() =>
                  act(
                    () =>
                      saveProductAction({
                        id: p.id,
                        name: edit[p.id]?.name,
                        price: edit[p.id]?.price,
                        active: edit[p.id]?.active,
                      }),
                    () => setEdit((x) => ({ ...x, [p.id]: undefined as never })),
                  )
                }
              >
                Save
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="st-card" aria-labelledby="ord-list">
        <h2 id="ord-list">Orders</h2>
        {data.orders.length ? (
          <ul className="st-list">
            {data.orders.map((o) => (
              <li key={o.id}>
                <span>
                  {o.number} · <Link href={`/studio/gallery/${o.galleryId}#shop`}>{o.gallery}</Link>
                  <small>
                    {o.at} · {o.buyer}
                  </small>
                  <small>{o.items.join(", ")}</small>
                  {o.lab ? <small>Print lab order {o.lab}</small> : null}
                </span>
                <span>{usd(o.totalCents)}</span>
                <em>{o.status}</em>
                {o.status === "pending" ? (
                  <button
                    type="button"
                    className="st-btn st-btn--ghost"
                    disabled={pending}
                    onClick={() => act(() => cancelOrderAction(o.id))}
                  >
                    Cancel
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="st-note">No orders yet. Open a gallery's Shop tab, turn the shop on, and share its link.</p>
        )}
      </section>
    </Frame>
  );
}
