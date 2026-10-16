"use client";

import { useState } from "react";
import { cancelOrderAction, saveShopAction } from "@/app/studio/gallery-actions";

type Run = (fn: () => Promise<{ ok: boolean; [k: string]: unknown }>, after?: () => void) => void;
const usd = (c: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(c / 100);

export type StoreSettings = {
  enabled: boolean;
  listed: boolean;
  sellDigital: boolean;
  sellPrints: boolean;
  note: string;
  priceSheetId: string;
  minOrder: string;
  abandonedCart: boolean;
  checkoutMessage: string;
  printRelease: string;
};

/** What visitors can buy from one gallery, and its orders. Prices live on price sheets (Store, Price sheets); the link is under Share. */
export function GalleryShopPanel({
  galleryId,
  shop,
  sheets,
  orders,
  run,
  pending,
}: {
  galleryId: string;
  shop: StoreSettings;
  sheets: { id: string; name: string; isDefault: boolean }[];
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
  const box = (k: "enabled" | "listed" | "sellDigital" | "sellPrints" | "abandonedCart", label: string) => (
    <label className="gm-check">
      <input type="checkbox" checked={s[k]} onChange={(e) => setS({ ...s, [k]: e.target.checked })} /> {label}
    </label>
  );
  return (
    <>
      <div className="gm-block">
        <h2>Store</h2>
        <p className="st-note">
          Let people order prints and downloads from this gallery. Choose the price sheet it sells from.
        </p>
        <div className="gm-fields">
          {box("enabled", "Open the store in this gallery")}
          {box("sellDigital", "Sell downloads")}
          {box("sellPrints", "Sell prints and products")}
          {box("listed", 'List this gallery on the site\'s public Shop page (needs "Anyone with the link")')}
          <label>
            Price sheet
            <select value={s.priceSheetId} onChange={(e) => setS({ ...s, priceSheetId: e.target.value })}>
              <option value="">{sheets.find((x) => x.isDefault)?.name ?? "Standard"} (default)</option>
              {sheets
                .filter((x) => !x.isDefault)
                .map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
            </select>
          </label>
          <label>
            Smallest order, in dollars (blank = none)
            <input inputMode="decimal" value={s.minOrder} onChange={(e) => setS({ ...s, minOrder: e.target.value })} />
          </label>
          {box("abandonedCart", "Email a reminder when an order is left unpaid for a day")}
          <label className="gm-wide">
            Note at the top of the Store (turnaround, shipping)
            <input maxLength={240} value={s.note} onChange={(e) => setS({ ...s, note: e.target.value })} />
          </label>
          <label className="gm-wide">
            Message shown at checkout
            <textarea
              rows={3}
              maxLength={1000}
              value={s.checkoutMessage}
              onChange={(e) => setS({ ...s, checkoutMessage: e.target.value })}
            />
          </label>
          <label className="gm-wide">
            Print release delivered with every order (shown on the buyer's order page)
            <textarea
              rows={6}
              maxLength={7500}
              value={s.printRelease}
              onChange={(e) => setS({ ...s, printRelease: e.target.value })}
            />
          </label>
        </div>
        <button
          type="button"
          className="st-btn"
          disabled={pending}
          onClick={() => run(() => saveShopAction({ galleryId, ...s }))}
        >
          Save store settings
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
