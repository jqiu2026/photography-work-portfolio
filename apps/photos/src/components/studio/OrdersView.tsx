"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
  Button,
  Checkbox,
  Field,
  Input,
  Segment,
  SegmentedControl,
  Stat,
  StatGroup,
  Status,
  Text,
} from "@holominimal/ui";

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
import { Card, FormDialog, Frame, useAct, useConfirm, useNotify } from "./StudioFrame";
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
  mounted: "Mounted print",
  framed: "Framed print",
  canvas: "Canvas",
  metal: "Metal print",
  card: "Card",
  album: "Album",
};

/** The shop: one price list for every gallery, and the orders that came in. Prices marked SAMPLE are placeholders until you set them. */
export function OrdersView({ data }: { data: { products: Product[]; sheets: Sheet[]; orders: Order[] } }) {
  const { pending, note, act, go } = useAct();
  const notify = useNotify();
  const [ask, confirmEl] = useConfirm();
  const [editing, setEditing] = useState<{ p: Product; name: string; price: string; active: boolean } | null>(null);
  const [sheetDlg, setSheetDlg] = useState<"new" | "rename" | null>(null);
  const [sheetId, setSheetId] = useState(data.sheets[0]?.id ?? "");
  const [newName, setNewName] = useState("");
  const [rename, setRename] = useState("");
  const sheet = data.sheets.find((x) => x.id === sheetId) ?? data.sheets[0];
  const groups = [
    ...data.products
      .filter((p) => p.sheetId === sheet?.id)
      .reduce(
        (m, p) => m.set(KIND[p.kind] ?? p.kind, [...(m.get(KIND[p.kind] ?? p.kind) ?? []), p]),
        new Map<string, Product[]>(),
      ),
  ];
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
        <div className="st-actions">
          <Button
            variant="secondary"
            size="sm"
            disabled={!sheet}
            onClick={() => {
              setRename(sheet?.name ?? "");
              setSheetDlg("rename");
            }}
          >
            Rename
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setNewName("");
              setSheetDlg("new");
            }}
          >
            New sheet
          </Button>
          {sheet && !sheet.isDefault ? (
            <>
              <Button
                variant="secondary"
                size="sm"
                disabled={pending}
                onClick={() => act(() => makeDefaultSheetAction(sheet.id))}
              >
                Make default
              </Button>
              <Button
                variant="danger"
                size="sm"
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
        <Accordion type="multiple" defaultValue={groups.slice(0, 1).map(([k]) => k)}>
          {groups.map(([kind, items]) => (
            <AccordionItem key={kind} value={kind}>
              <AccordionTrigger>
                {kind} <small>({items.length})</small>
              </AccordionTrigger>
              <AccordionContent>
                <ul className="hm-data-list st-list" aria-label={kind}>
                  {items.map((p) => (
                    <li className="hm-data-list-item" key={p.id}>
                      <span>
                        {p.name}
                        <small>
                          ${p.price} {p.sample ? <Badge tone="warning">SAMPLE</Badge> : null}{" "}
                          {p.active ? "" : <Badge tone="muted">Not for sale</Badge>}
                        </small>
                      </span>
                      <Button
                        variant="secondary"
                        size="sm"
                        aria-label={`Edit ${p.name}`}
                        onClick={() => {
                          setEditing({ p, name: p.name, price: p.price, active: p.active });
                          notify(`Loaded ${p.name}`);
                        }}
                      >
                        Edit
                      </Button>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
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
                  <Button
                    variant="secondary"
                    disabled={pending}
                    onClick={async () =>
                      (await ask({
                        title: `Cancel order ${o.number}?`,
                        body: "The buyer can no longer pay for it and its invoice is voided. This cannot be undone.",
                        action: "Cancel order",
                      })) && act(() => cancelOrderAction(o.id))
                    }
                  >
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
      <FormDialog
        open={editing !== null}
        onOpenChange={(o) => !o && setEditing(null)}
        title={editing ? `Edit ${editing.p.name}` : "Edit"}
        pending={pending}
        onSubmit={() =>
          editing &&
          go(() =>
            saveProductAction({ id: editing.p.id, name: editing.name, price: editing.price, active: editing.active }),
          )
        }
      >
        <Field label="Name">
          <Input
            value={editing?.name ?? ""}
            onChange={(e) => editing && setEditing({ ...editing, name: e.target.value })}
          />
        </Field>
        <Field label="Price (dollars)">
          <Input
            inputMode="decimal"
            value={editing?.price ?? ""}
            onChange={(e) => editing && setEditing({ ...editing, price: e.target.value })}
          />
        </Field>
        <Checkbox
          checked={editing?.active ?? false}
          onChange={(e) => editing && setEditing({ ...editing, active: e.target.checked })}
          label="For sale"
        />
      </FormDialog>
      <FormDialog
        open={sheetDlg === "new"}
        onOpenChange={(o) => !o && setSheetDlg((d) => (d === "new" ? null : d))}
        title="New price sheet"
        description="It starts as a copy of the sheet you are looking at."
        submitLabel="Add sheet"
        pending={pending}
        onSubmit={() => go(() => createSheetAction({ name: newName, copyFrom: sheet?.id }))}
      >
        <Field label="Name">
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} />
        </Field>
      </FormDialog>
      <FormDialog
        open={sheetDlg === "rename"}
        onOpenChange={(o) => !o && setSheetDlg((d) => (d === "rename" ? null : d))}
        title="Rename this sheet"
        submitLabel="Rename"
        pending={pending}
        onSubmit={() => sheet && go(() => renameSheetAction({ id: sheet.id, name: rename }))}
      >
        <Field label="Name">
          <Input value={rename} onChange={(e) => setRename(e.target.value)} />
        </Field>
      </FormDialog>
    </Frame>
  );
}
