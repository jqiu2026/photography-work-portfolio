"use client";

import { Button, Checkbox, Input, Segment, SegmentedControl, Stat, StatGroup, Status, Text } from "@holominimal/ui";

import Link from "next/link";
import { useState } from "react";
import {
  cancelOrderAction,
  createSheetAction,
  deleteSheetAction,
  makeDefaultSheetAction,
  renameSheetAction,
  saveProductAction,
} from "@/app/studio/gallery-actions";
import { Card, Frame, useAct, useConfirm } from "./StudioFrame";
import "./galleries.css";

type Product = {
  id: string;
  sheetId: string;
  kind: string;
  name: string;
  description: string;
  price: string;
  sample: boolean;
  active: boolean;
};
type Sheet = { id: string; name: string; isDefault: boolean };
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
export function OrdersView({ data }: { data: { products: Product[]; sheets: Sheet[]; orders: Order[] } }) {
  const { pending, note, act } = useAct();
  const [ask, confirmEl] = useConfirm();
  const [edit, setEdit] = useState<Record<string, Partial<Product>>>({});
  const [sheetId, setSheetId] = useState(data.sheets[0]?.id ?? "");
  const [newName, setNewName] = useState("");
  const [rename, setRename] = useState("");
  const sheet = data.sheets.find((x) => x.id === sheetId) ?? data.sheets[0];
  const val = (p: Product, k: keyof Product) => (edit[p.id]?.[k] as string | undefined) ?? (p[k] as string);
  const set = (id: string, k: keyof Product, v: string) => setEdit((e) => ({ ...e, [id]: { ...e[id], [k]: v } }));
  const paid = data.orders.filter((o) => o.status === "paid" || o.status === "fulfilled");
  const revenue = paid.reduce((n, o) => n + o.totalCents, 0);
  return (
    <Frame section="orders" note={note}>
      <StatGroup className="st-statrow">
        <Stat
          label="Revenue"
          value={usd(revenue)}
          detail={`from ${paid.length} paid order${paid.length === 1 ? "" : "s"}`}
        />
        <Stat
          label="Waiting"
          value={data.orders.filter((o) => o.status === "pending").length}
          detail="orders waiting for payment"
        />
      </StatGroup>

      <Card title="Price sheets" id="ord-prices">
        <Text size="sm" tone="muted">
          A price sheet is a list of what you sell and for how much. Each gallery picks one (its Store tab); the default
          is used when it does not. Print costs come from your lab; check each price covers the lab's cost, shipping and
          the card fee. A price marked SAMPLE is a placeholder: set yours and it disappears.
        </Text>
        <SegmentedControl aria-label="Price sheets" value={sheet?.id ?? ""} onValueChange={setSheetId}>
          {data.sheets.map((x) => (
            <Segment key={x.id} value={x.id}>
              {x.name}
              {x.isDefault ? " (default)" : ""}
            </Segment>
          ))}
        </SegmentedControl>
        <div className="gm-row">
          <Input
            aria-label="Rename this sheet"
            placeholder={sheet?.name}
            value={rename}
            onChange={(e) => setRename(e.target.value)}
          />
          <Button
            variant="secondary"
            disabled={pending || !rename.trim() || !sheet}
            onClick={() =>
              sheet &&
              act(
                () => renameSheetAction({ id: sheet.id, name: rename }),
                () => setRename(""),
              )
            }
          >
            Rename
          </Button>
          {sheet && !sheet.isDefault ? (
            <>
              <Button
                variant="secondary"
                disabled={pending}
                onClick={() => act(() => makeDefaultSheetAction(sheet.id))}
              >
                Make default
              </Button>
              <Button
                variant="danger"
                disabled={pending}
                onClick={async () =>
                  (await ask({
                    title: `Delete the price sheet "${sheet.name}"?`,
                    body: "Its products and prices are removed with it.",
                    action: "Delete sheet",
                  })) &&
                  act(
                    () => deleteSheetAction(sheet.id),
                    () => setSheetId(data.sheets[0]?.id ?? ""),
                  )
                }
              >
                Delete sheet
              </Button>
            </>
          ) : null}
        </div>
        <form
          className="gm-inline"
          aria-label="New price sheet"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            act(
              () => createSheetAction({ name: newName, copyFrom: sheet?.id }),
              () => setNewName(""),
            );
          }}
        >
          <Input
            aria-label="New sheet name"
            placeholder="New sheet (copies this one)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Button type="submit" disabled={pending}>
            Add sheet
          </Button>
        </form>
        <ul className="hm-data-list st-list">
          {data.products
            .filter((p) => p.sheetId === sheet?.id)
            .map((p) => (
              <li className="hm-data-list-item" key={p.id}>
                <span style={{ display: "grid", gap: ".3rem", flex: 1 }}>
                  <small>{KIND[p.kind] ?? p.kind}</small>
                  <Input
                    aria-label={`Name of ${p.name}`}
                    value={val(p, "name")}
                    onChange={(e) => set(p.id, "name", e.target.value)}
                  />
                </span>
                <span>
                  <Input
                    aria-label={`Price of ${p.name}`}
                    inputMode="decimal"
                    style={{ width: "6rem" }}
                    value={val(p, "price")}
                    onChange={(e) => set(p.id, "price", e.target.value)}
                  />{" "}
                  {p.sample && !edit[p.id]?.price ? <small>SAMPLE</small> : null}
                </span>
                <Checkbox
                  checked={edit[p.id]?.active === undefined ? p.active : Boolean(edit[p.id]?.active)}
                  onChange={(e) => setEdit((x) => ({ ...x, [p.id]: { ...x[p.id], active: e.target.checked } }))}
                  label="For sale"
                />
                <Button
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
                </Button>
              </li>
            ))}
        </ul>
      </Card>

      <Card title="Orders" id="ord-list">
        {data.orders.length ? (
          <ul className="hm-data-list st-list">
            {data.orders.map((o) => (
              <li className="hm-data-list-item" key={o.id}>
                <span>
                  {o.number} · <Link href={`/studio/gallery/${o.galleryId}#shop`}>{o.gallery}</Link>
                  <small>
                    {o.at} · {o.buyer}
                  </small>
                  <small>{o.items.join(", ")}</small>
                  {o.lab ? <small>Print lab order {o.lab}</small> : null}
                </span>
                <span>{usd(o.totalCents)}</span>
                <Status
                  tone={
                    o.status === "paid" || o.status === "fulfilled"
                      ? "success"
                      : o.status === "pending"
                        ? "warning"
                        : "muted"
                  }
                >
                  {o.status}
                </Status>
                {o.status === "pending" ? (
                  <Button variant="secondary" disabled={pending} onClick={() => act(() => cancelOrderAction(o.id))}>
                    Cancel
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <Text size="sm" tone="muted">
            No orders yet. Open a gallery's Shop tab, turn the shop on, and share its link.
          </Text>
        )}
      </Card>
      {confirmEl}
    </Frame>
  );
}
