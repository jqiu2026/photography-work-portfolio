"use client";

import {
  Badge,
  Button,
  DataList,
  DataListItem,
  Field,
  Input,
  NumberInput,
  Select,
  Text,
  Textarea,
} from "@holominimal/ui";

import { useState } from "react";
import { createQuoteAction, sendQuoteAction, updateQuoteTextAction } from "@/app/studio/commerce-actions";
import { DocLinks, FieldsEditor } from "./RecordsViews";
import { Card, FormDialog, Frame, useAct, useNotify } from "./StudioFrame";

const usd = (c: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(c / 100);

export type QuotesData = {
  quotes: {
    id: string;
    number: string;
    title: string;
    client: string;
    status: string;
    totalCents: number;
    isSample: boolean;
    validUntil: string | null;
    intro: string;
    terms: string;
    fields: { label: string; value: string }[];
  }[];
  clients: { id: string; name: string }[];
  packages: { id: string; name: string; priceCents: number }[];
  addOns: { id: string; name: string; priceCents: number; unit: string }[];
};

const TERMS =
  "SAMPLE TERMS (have a lawyer review before use). Gallery access is included for the period in the package; extensions and reactivation are priced as shown. The deposit holds the date and is non-refundable except as the agreement states. TODO(owner): replace with your terms.";

/** Quotes and proposals: create from a package and add-ons, send a link, see accepted, expired or declined. */
export function QuotesView({ user, data }: { user: string; data: QuotesData }) {
  const { pending, note, act, go } = useAct();
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState<Record<string, string>>({});
  const notify = useNotify();
  const [fields, setFields] = useState<{ label: string; value: string }[]>([]);
  const [edit, setEdit] = useState<{
    id: string;
    title: string;
    intro: string;
    terms: string;
    fields: { label: string; value: string }[];
  } | null>(null);
  const [picked, setPicked] = useState<Record<string, number>>({});
  const set = (k: string) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  return (
    <Frame section="quotes" user={user} note={note}>
      <div className="st-grid">
        <Card
          title="Quotes"
          id="q-list"
          actions={
            <Button size="sm" onClick={() => setAdding(true)}>
              New quote
            </Button>
          }
        >
          {data.quotes.length ? (
            <ul className="hm-data-list st-list st-list--tall">
              {data.quotes.map((q) => (
                <li className="hm-data-list-item" key={q.id} data-quote-id={q.id}>
                  <span>
                    <strong>{q.number}</strong> · {q.title} {q.isSample ? <Badge tone="warning">SAMPLE</Badge> : null}
                    <small>
                      {q.client} · {q.status} · {usd(q.totalCents)}
                      {q.validUntil ? ` · valid until ${q.validUntil}` : ""}
                    </small>
                  </span>
                  <span className="rc-actions">
                    <DocLinks kind="quote" id={q.id} label={`quote ${q.number}`} />
                    {q.status !== "accepted" ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setEdit({ id: q.id, title: q.title, intro: q.intro, terms: q.terms, fields: q.fields });
                          notify(`Loaded ${q.number}`);
                        }}
                      >
                        Edit
                      </Button>
                    ) : null}
                    {q.status === "draft" || q.status === "sent" || q.status === "viewed" ? (
                      <Button size="sm" disabled={pending} onClick={() => act(() => sendQuoteAction(q.id))}>
                        {q.status === "draft" ? "Send" : "Send a new link"}
                      </Button>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <Text size="sm" tone="muted">
              No quotes yet.
            </Text>
          )}
        </Card>
      </div>
      <FormDialog
        open={adding}
        onOpenChange={setAdding}
        title="New quote"
        submitLabel={"Create quote"}
        pending={pending}
        onSubmit={() =>
          go(
            () =>
              createQuoteAction({
                clientId: f.client ?? "",
                title: f.title ?? "",
                packageId: f.pkg,
                addOns: Object.entries(picked)
                  .filter(([, q]) => q > 0)
                  .map(([id, qty]) => ({ id, qty })),
                promoCode: f.promo,
                giftCode: f.gift,
                intro: f.intro,
                terms: f.terms ?? TERMS,
                country: f.country,
                state: f.state,
                postalCode: f.zip,
              }),
            () => {
              setF({});
              setPicked({});
            },
          )
        }
      >
        <Field label="Client">
          <Select value={f.client ?? ""} onValueChange={(v) => set("client")({ target: { value: v } })}>
            <option value="">Pick a client</option>
            {data.clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Title">
          <Input value={f.title ?? ""} onChange={set("title")} />
        </Field>
        <Field label="Package">
          <Select value={f.pkg ?? ""} onValueChange={(v) => set("pkg")({ target: { value: v } })}>
            <option value="">No package</option>
            {data.packages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({usd(p.priceCents)})
              </option>
            ))}
          </Select>
        </Field>
        <fieldset className="pm-fieldset">
          <legend className="hm-field-label">Add-ons</legend>
          <DataList>
            {data.addOns.map((a) => (
              <DataListItem
                key={a.id}
                description={`${usd(a.priceCents)} ${a.unit}`}
                actions={
                  <NumberInput
                    aria-label={`${a.name} quantity`}
                    min={0}
                    max={50}
                    value={picked[a.id] ?? 0}
                    onValueChange={(n) => setPicked((x) => ({ ...x, [a.id]: n ?? 0 }))}
                  />
                }
              >
                {a.name}
              </DataListItem>
            ))}
          </DataList>
        </fieldset>
        <Field label="Promo code">
          <Input value={f.promo ?? ""} onChange={set("promo")} />
        </Field>
        <Field label="Gift card code">
          <Input value={f.gift ?? ""} onChange={set("gift")} />
        </Field>
        <Field label="Introduction (optional)">
          <Textarea rows={2} value={f.intro ?? ""} onChange={set("intro")} />
        </Field>
        <Field label="Terms">
          <Textarea rows={4} value={f.terms ?? TERMS} onChange={set("terms")} />
        </Field>
        <FieldsEditor rows={fields} onChange={setFields} />
        <Field label="Tax address for Stripe Tax: country (optional, 2 letters)">
          <Input value={f.country ?? ""} onChange={set("country")} maxLength={2} />
        </Field>
        <Field label="State">
          <Input value={f.state ?? ""} onChange={set("state")} />
        </Field>
        <Field label="Postal code">
          <Input value={f.zip ?? ""} onChange={set("zip")} />
        </Field>
      </FormDialog>
      <FormDialog
        open={edit !== null}
        onOpenChange={(o) => !o && setEdit(null)}
        title="Edit quote"
        description="Prices stay as they were worked out. Once a client accepts, the text is locked."
        size="lg"
        pending={pending}
        onSubmit={() =>
          edit &&
          go(() =>
            updateQuoteTextAction({
              quoteId: edit.id,
              title: edit.title,
              intro: edit.intro,
              terms: edit.terms,
              fields: edit.fields,
            }),
          )
        }
      >
        <Field label="Title">
          <Input value={edit?.title ?? ""} onChange={(e) => edit && setEdit({ ...edit, title: e.target.value })} />
        </Field>
        <Field label="Introduction">
          <Textarea
            rows={3}
            value={edit?.intro ?? ""}
            onChange={(e) => edit && setEdit({ ...edit, intro: e.target.value })}
          />
        </Field>
        <Field label="Terms">
          <Textarea
            rows={6}
            value={edit?.terms ?? ""}
            onChange={(e) => edit && setEdit({ ...edit, terms: e.target.value })}
          />
        </Field>
        <FieldsEditor rows={edit?.fields ?? []} onChange={(r) => edit && setEdit({ ...edit, fields: r })} />
      </FormDialog>
    </Frame>
  );
}
