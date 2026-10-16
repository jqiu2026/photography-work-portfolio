"use client";

import { useState } from "react";
import { cancelOrderAction, saveShopAction } from "@/app/studio/gallery-actions";

type Run = (fn: () => Promise<{ ok: boolean; [k: string]: unknown }>, after?: () => void) => void;
const usd = (c: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(c / 100);

/** What visitors can buy or download from one gallery, and its orders. The price list is under Money > Shop; the link is under Share. */
export function GalleryShopPanel({
  galleryId,
  shop,
  orders,
  run,
  pending,
}: {
  galleryId: string;
  shop: {
    enabled: boolean;
    sellDigital: boolean;
    sellPrints: boolean;
    freeDownloads: string;
    proofing: boolean;
    note: string;
  };
  orders: {
    id: string;
    number: string;
    status: string;
    buyer: string;
    totalCents: number;
    at: string;
    items: number;
  }[];
  run: Run;
  pending: boolean;
}) {
  const [s, setS] = useState(shop);
  return (
    <>
      <div className="gm-block">
        <h2>Shop</h2>
        <p className="st-note">
          What visitors can buy from this gallery. Prices come from the price list in Money, Orders.
        </p>
        <div className="gm-fields">
          <label className="gm-check">
            <input type="checkbox" checked={s.enabled} onChange={(e) => setS({ ...s, enabled: e.target.checked })} />{" "}
            Open the shop
          </label>
          <label className="gm-check">
            <input
              type="checkbox"
              checked={s.sellDigital}
              onChange={(e) => setS({ ...s, sellDigital: e.target.checked })}
            />{" "}
            Sell downloads
          </label>
          <label className="gm-check">
            <input
              type="checkbox"
              checked={s.sellPrints}
              onChange={(e) => setS({ ...s, sellPrints: e.target.checked })}
            />{" "}
            Sell prints and products
          </label>
          <label>
            Free downloads for visitors
            <select value={s.freeDownloads} onChange={(e) => setS({ ...s, freeDownloads: e.target.value })}>
              <option value="none">None (they buy)</option>
              <option value="web">Web-size copies, free</option>
            </select>
          </label>
          <label className="gm-wide">
            Note at the top of the shop (turnaround, shipping)
            <input maxLength={240} value={s.note} onChange={(e) => setS({ ...s, note: e.target.value })} />
          </label>
        </div>
        <button
          type="button"
          className="st-btn"
          disabled={pending}
          onClick={() => run(() => saveShopAction({ galleryId, ...s }))}
        >
          Save shop settings
        </button>
      </div>
      <div className="gm-block">
        <h2>Orders from this gallery</h2>
        {orders.length ? (
          <ul className="st-list">
            {orders.map((o) => (
              <li key={o.id}>
                <span>
                  {o.number} · {o.buyer}
                  <small>
                    {o.at} · {o.items} item{o.items === 1 ? "" : "s"} · {o.status}
                  </small>
                </span>
                <span>{usd(o.totalCents)}</span>
                {o.status === "pending" ? (
                  <button
                    type="button"
                    className="st-btn st-btn--ghost"
                    disabled={pending}
                    onClick={() => run(() => cancelOrderAction(o.id))}
                  >
                    Cancel
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="st-note">No orders yet.</p>
        )}
      </div>
    </>
  );
}
