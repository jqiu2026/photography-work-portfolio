"use client";

import { Button, Checkbox, Field, Input, Select, SettingsSection, Text, Textarea } from "@holominimal/ui";

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
    <Checkbox checked={s[k]} onChange={(e) => setS({ ...s, [k]: e.target.checked })} label={label} />
  );
  return (
    <>
      <SettingsSection title="Store" className="gm-block">
        <Text size="sm" tone="muted">
          Let people order prints and downloads from this gallery. Choose the price sheet it sells from.
        </Text>
        <div className="gm-fields">
          {box("enabled", "Open the store in this gallery")}
          {box("sellDigital", "Sell downloads")}
          {box("sellPrints", "Sell prints and products")}
          {box("listed", 'List this gallery on the site\'s public Shop page (needs "Anyone with the link")')}
          <Field label="Price sheet">
            <Select value={s.priceSheetId} onValueChange={(v) => setS({ ...s, priceSheetId: v })}>
              <option value="">{sheets.find((x) => x.isDefault)?.name ?? "Standard"} (default)</option>
              {sheets
                .filter((x) => !x.isDefault)
                .map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
            </Select>
          </Field>
          <Field label="Smallest order, in dollars (blank = none)">
            <Input inputMode="decimal" value={s.minOrder} onChange={(e) => setS({ ...s, minOrder: e.target.value })} />
          </Field>
          {box("abandonedCart", "Email a reminder when an order is left unpaid for a day")}
          <Field label="Note at the top of the Store (turnaround, shipping)" className="gm-wide">
            <Input maxLength={240} value={s.note} onChange={(e) => setS({ ...s, note: e.target.value })} />
          </Field>
          <Field label="Message shown at checkout" className="gm-wide">
            <Textarea
              rows={3}
              maxLength={1000}
              value={s.checkoutMessage}
              onChange={(e) => setS({ ...s, checkoutMessage: e.target.value })}
            />
          </Field>
          <Field label="Print release delivered with every order (shown on the buyer's order page)" className="gm-wide">
            <Textarea
              rows={6}
              maxLength={7500}
              value={s.printRelease}
              onChange={(e) => setS({ ...s, printRelease: e.target.value })}
            />
          </Field>
        </div>
        <Button disabled={pending} onClick={() => run(() => saveShopAction({ galleryId, ...s }))}>
          Save store settings
        </Button>
      </SettingsSection>
      <SettingsSection title="Orders from this gallery" className="gm-block">
        {orders.length ? (
          <ul className="hm-data-list st-list">
            {orders.map((o) => (
              <li className="hm-data-list-item" key={o.id}>
                <span>
                  {o.number} · {o.buyer}
                  <small>
                    {o.at} · {o.items} item{o.items === 1 ? "" : "s"} · {o.status}
                  </small>
                </span>
                <span>{usd(o.totalCents)}</span>
                {o.status === "pending" ? (
                  <Button variant="secondary" disabled={pending} onClick={() => run(() => cancelOrderAction(o.id))}>
                    Cancel
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <Text size="sm" tone="muted">
            No orders yet.
          </Text>
        )}
      </SettingsSection>
    </>
  );
}
