"use client";

import { useState } from "react";
import { createQuoteAction, sendQuoteAction } from "@/app/studio/commerce-actions";
import { Card, Frame, useAct } from "./StudioFrame";

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
  }[];
  clients: { id: string; name: string }[];
  packages: { id: string; name: string; priceCents: number }[];
  addOns: { id: string; name: string; priceCents: number; unit: string }[];
};

const TERMS =
  "SAMPLE TERMS (have a lawyer review before use). Gallery access is included for the period in the package; extensions and reactivation are priced as shown. The deposit holds the date and is non-refundable except as the agreement states. TODO(owner): replace with your terms.";

/** Quotes and proposals: create from a package and add-ons, send a link, see accepted, expired or declined. */
export function QuotesView({ user, data }: { user: string; data: QuotesData }) {
  const { pending, note, act, submit } = useAct();
  const [f, setF] = useState<Record<string, string>>({});
  const [picked, setPicked] = useState<Record<string, number>>({});
  const set = (k: string) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  return (
    <Frame section="quotes" user={user} note={note}>
      <div className="st-grid">
        <Card title="Quotes" id="q-list">
          {data.quotes.length ? (
            <ul className="st-list st-list--tall">
              {data.quotes.map((q) => (
                <li key={q.id} data-quote-id={q.id}>
                  <span>
                    <strong>{q.number}</strong> · {q.title} {q.isSample ? <em>SAMPLE</em> : null}
                    <small>
                      {q.client} · {q.status} · {usd(q.totalCents)}
                      {q.validUntil ? ` · valid until ${q.validUntil}` : ""}
                    </small>
                  </span>
                  {q.status === "draft" || q.status === "sent" || q.status === "viewed" ? (
                    <button
                      type="button"
                      className="st-btn"
                      disabled={pending}
                      onClick={() => act(() => sendQuoteAction(q.id))}
                    >
                      {q.status === "draft" ? "Send" : "Send a new link"}
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="st-note">No quotes yet.</p>
          )}
        </Card>
        <Card title="New quote" id="q-new">
          <form
            noValidate
            className="st-form"
            onSubmit={submit(
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
            )}
          >
            <label>
              Client
              <select value={f.client ?? ""} onChange={set("client")}>
                <option value="">Pick a client</option>
                {data.clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Title
              <input value={f.title ?? ""} onChange={set("title")} />
            </label>
            <label>
              Package
              <select value={f.pkg ?? ""} onChange={set("pkg")}>
                <option value="">No package</option>
                {data.packages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({usd(p.priceCents)})
                  </option>
                ))}
              </select>
            </label>
            <fieldset className="st-fieldset">
              <legend>Add-ons</legend>
              {data.addOns.map((a) => (
                <label key={a.id} className="st-check">
                  <input
                    type="number"
                    min={0}
                    max={50}
                    aria-label={`${a.name} quantity`}
                    value={picked[a.id] ?? 0}
                    onChange={(e) => setPicked((x) => ({ ...x, [a.id]: Number(e.target.value) }))}
                    style={{ width: "4rem" }}
                  />{" "}
                  {a.name} ({usd(a.priceCents)} {a.unit})
                </label>
              ))}
            </fieldset>
            <label>
              Promo code
              <input value={f.promo ?? ""} onChange={set("promo")} />
            </label>
            <label>
              Gift card code
              <input value={f.gift ?? ""} onChange={set("gift")} />
            </label>
            <label>
              Introduction (optional)
              <textarea rows={2} value={f.intro ?? ""} onChange={set("intro")} />
            </label>
            <label>
              Terms
              <textarea rows={4} value={f.terms ?? TERMS} onChange={set("terms")} />
            </label>
            <label>
              Tax address for Stripe Tax: country (optional, 2 letters)
              <input value={f.country ?? ""} onChange={set("country")} maxLength={2} />
            </label>
            <label>
              State
              <input value={f.state ?? ""} onChange={set("state")} />
            </label>
            <label>
              Postal code
              <input value={f.zip ?? ""} onChange={set("zip")} />
            </label>
            <button type="submit" className="st-btn" disabled={pending}>
              Create quote
            </button>
          </form>
        </Card>
      </div>
    </Frame>
  );
}
