"use client";

import { useState } from "react";
import {
  createGiftCardAction,
  createPromoAction,
  createReferralAction,
  deleteAddOnAction,
  deletePackageAction,
  saveAddOnAction,
  savePackageAction,
  saveCommerceSettingsAction,
  togglePromoAction,
} from "@/app/studio/commerce-actions";
import { Card, Frame, useAct } from "./StudioFrame";

const usd = (c: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(c / 100);
const dollars = (c: number) => (c / 100).toFixed(2);

export type CatalogData = {
  packages: {
    id: string;
    name: string;
    tagline: string | null;
    tier: number;
    priceCents: number;
    deliverables: { label: string; value: string }[];
    mandatoryFees: { label: string; cents: number }[];
    includedAddOns: string[];
    featured: boolean;
    visible: boolean;
    isSample: boolean;
  }[];
  addOns: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    priceCents: number;
    unit: string;
    maxQty: number;
    isFee: boolean;
    upsell: boolean;
    isSample: boolean;
  }[];
  promos: {
    id: string;
    code: string;
    kind: string;
    off: string;
    uses: number;
    maxUses: number | null;
    active: boolean;
    note: string | null;
  }[];
  clients: { id: string; name: string }[];
  settings: { depositPercent: number; quoteValidDays: number; taxRate: string; taxLabel: string; taxIsSample: boolean };
};

/** Packages, add-ons, codes, gift cards and the deposit and tax settings. Every price flagged SAMPLE shows as $XX publicly. */
export function CatalogView({ user, data }: { user: string; data: CatalogData }) {
  const { pending, note, act, submit } = useAct();
  const [f, setF] = useState<Record<string, string>>({});
  const set = (k: string) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  const [flags, setFlags] = useState({ featured: false, sample: true, fee: false, upsell: true, asample: true });
  const editPackage = (p: CatalogData["packages"][number]) => {
    setF((x) => ({
      ...x,
      pid: p.id,
      pname: p.name,
      ptag: p.tagline ?? "",
      pprice: dollars(p.priceCents),
      ptier: String(p.tier),
      pdel: p.deliverables.map((d) => `${d.label}: ${d.value}`).join("\n"),
      pfees: p.mandatoryFees.map((x2) => `${x2.label}: ${dollars(x2.cents)}`).join("\n"),
      pinc: p.includedAddOns.join(", "),
    }));
    setFlags((x) => ({ ...x, featured: p.featured, sample: p.isSample }));
  };
  const editAddOn = (a: CatalogData["addOns"][number]) => {
    setF((x) => ({
      ...x,
      aid: a.id,
      aname: a.name,
      adesc: a.description ?? "",
      aprice: dollars(a.priceCents),
      aunit: a.unit,
      amax: String(a.maxQty),
    }));
    setFlags((x) => ({ ...x, fee: a.isFee, upsell: a.upsell, asample: a.isSample }));
  };
  return (
    <Frame section="packages" user={user} note={note}>
      <div className="st-grid">
        <Card title="Packages" id="cat-pk">
          <p className="st-note">
            Prices marked SAMPLE show as $XX on the public site until you untick "Sample price".
          </p>
          <ul className="st-list st-list--tall">
            {data.packages.map((p) => (
              <li key={p.id} data-package-id={p.id}>
                <span>
                  <strong>{p.name}</strong> · {usd(p.priceCents)} {p.isSample ? <em>SAMPLE</em> : null}
                  <small>{p.deliverables.map((d) => `${d.label}: ${d.value}`).join(" · ")}</small>
                  {p.mandatoryFees.length ? (
                    <small>Includes {p.mandatoryFees.map((x) => `${x.label} ${usd(x.cents)}`).join(", ")}</small>
                  ) : null}
                </span>
                <span className="st-actions">
                  <button type="button" className="st-btn st-btn--ghost" onClick={() => editPackage(p)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="st-btn st-btn--ghost"
                    disabled={pending}
                    onClick={() => act(() => deletePackageAction(p.id))}
                  >
                    Remove
                  </button>
                </span>
              </li>
            ))}
          </ul>
          <form
            noValidate
            className="st-form"
            aria-label="Package"
            onSubmit={submit(
              () =>
                savePackageAction({
                  id: f.pid,
                  name: f.pname ?? "",
                  tagline: f.ptag,
                  price: f.pprice ?? "",
                  tier: f.ptier,
                  deliverables: f.pdel,
                  fees: f.pfees,
                  included: f.pinc,
                  featured: flags.featured,
                  isSample: flags.sample,
                }),
              () => setF({}),
            )}
          >
            <label>
              Name
              <input value={f.pname ?? ""} onChange={set("pname")} />
            </label>
            <label>
              Tagline
              <input value={f.ptag ?? ""} onChange={set("ptag")} />
            </label>
            <label>
              Headline price (dollars, fees included)
              <input inputMode="decimal" value={f.pprice ?? ""} onChange={set("pprice")} />
            </label>
            <label>
              Tier (order)
              <input inputMode="numeric" value={f.ptier ?? ""} onChange={set("ptier")} />
            </label>
            <label>
              Deliverables, one per line as "Label: value" (coverage, edited images, gallery time)
              <textarea rows={4} value={f.pdel ?? ""} onChange={set("pdel")} />
            </label>
            <label>
              Mandatory fees included in the price, one per line as "Label: dollars"
              <textarea rows={2} value={f.pfees ?? ""} onChange={set("pfees")} />
            </label>
            <label>
              Included add-ons (slugs, comma separated)
              <input value={f.pinc ?? ""} onChange={set("pinc")} />
            </label>
            <label className="st-check">
              <input
                type="checkbox"
                checked={flags.featured}
                onChange={(e) => setFlags({ ...flags, featured: e.target.checked })}
              />{" "}
              Featured
            </label>
            <label className="st-check">
              <input
                type="checkbox"
                checked={flags.sample}
                onChange={(e) => setFlags({ ...flags, sample: e.target.checked })}
              />{" "}
              Sample price (shows as $XX)
            </label>
            <button type="submit" className="st-btn" disabled={pending}>
              {f.pid ? "Save package" : "Add package"}
            </button>
          </form>
        </Card>

        <Card title="Add-ons and fees" id="cat-ao">
          <p className="st-note">
            The standalone price is always shown next to a bundle. Optional fees (travel, rush) stay separate from the
            headline price.
          </p>
          <ul className="st-list st-list--tall">
            {data.addOns.map((a) => (
              <li key={a.id} data-addon-id={a.id}>
                <span>
                  <strong>{a.name}</strong> · {usd(a.priceCents)} {a.unit} {a.isFee ? "(optional fee)" : ""}{" "}
                  {a.isSample ? <em>SAMPLE</em> : null}
                  <small>{a.slug}</small>
                </span>
                <span className="st-actions">
                  <button type="button" className="st-btn st-btn--ghost" onClick={() => editAddOn(a)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="st-btn st-btn--ghost"
                    disabled={pending}
                    onClick={() => act(() => deleteAddOnAction(a.id))}
                  >
                    Remove
                  </button>
                </span>
              </li>
            ))}
          </ul>
          <form
            noValidate
            className="st-form"
            aria-label="Add-on"
            onSubmit={submit(
              () =>
                saveAddOnAction({
                  id: f.aid,
                  name: f.aname ?? "",
                  description: f.adesc,
                  price: f.aprice ?? "",
                  unit: f.aunit,
                  maxQty: f.amax,
                  isFee: flags.fee,
                  upsell: flags.upsell,
                  isSample: flags.asample,
                }),
              () => setF({}),
            )}
          >
            <label>
              Name
              <input value={f.aname ?? ""} onChange={set("aname")} />
            </label>
            <label>
              Description
              <input value={f.adesc ?? ""} onChange={set("adesc")} />
            </label>
            <label>
              Standalone price (dollars)
              <input inputMode="decimal" value={f.aprice ?? ""} onChange={set("aprice")} />
            </label>
            <label>
              Unit
              <input value={f.aunit ?? ""} onChange={set("aunit")} placeholder="each" />
            </label>
            <label>
              Max quantity
              <input inputMode="numeric" value={f.amax ?? ""} onChange={set("amax")} placeholder="1" />
            </label>
            <label className="st-check">
              <input
                type="checkbox"
                checked={flags.fee}
                onChange={(e) => setFlags({ ...flags, fee: e.target.checked })}
              />{" "}
              Optional fee (travel, rush)
            </label>
            <label className="st-check">
              <input
                type="checkbox"
                checked={flags.upsell}
                onChange={(e) => setFlags({ ...flags, upsell: e.target.checked })}
              />{" "}
              Offer as an upsell on quotes
            </label>
            <label className="st-check">
              <input
                type="checkbox"
                checked={flags.asample}
                onChange={(e) => setFlags({ ...flags, asample: e.target.checked })}
              />{" "}
              Sample price
            </label>
            <button type="submit" className="st-btn" disabled={pending}>
              {f.aid ? "Save add-on" : "Add add-on"}
            </button>
          </form>
        </Card>

        <Card title="Codes and gift cards" id="cat-codes">
          <ul className="st-list">
            {data.promos.map((p) => (
              <li key={p.id}>
                <span>
                  <code>{p.code}</code> · {p.off} · used {p.uses}
                  {p.maxUses ? ` of ${p.maxUses}` : ""} {p.kind === "referral" ? "· referral" : ""}{" "}
                  {p.active ? "" : "· off"}
                  {p.note ? <small>{p.note}</small> : null}
                </span>
                <button
                  type="button"
                  className="st-btn st-btn--ghost"
                  disabled={pending}
                  onClick={() => act(() => togglePromoAction(p.id, !p.active))}
                >
                  {p.active ? "Switch off" : "Switch on"}
                </button>
              </li>
            ))}
          </ul>
          <form
            noValidate
            className="st-form"
            aria-label="New code"
            onSubmit={submit(
              () =>
                createPromoAction({
                  code: f.ccode ?? "",
                  kind: f.ckind ?? "percent",
                  value: f.cval ?? "",
                  maxUses: f.cmax,
                }),
              () => setF({}),
            )}
          >
            <label>
              Code
              <input value={f.ccode ?? ""} onChange={set("ccode")} />
            </label>
            <label>
              Kind
              <select value={f.ckind ?? "percent"} onChange={set("ckind")}>
                <option value="percent">Percent off</option>
                <option value="amount">Dollars off</option>
              </select>
            </label>
            <label>
              Value
              <input inputMode="decimal" value={f.cval ?? ""} onChange={set("cval")} />
            </label>
            <label>
              Max uses (blank = unlimited)
              <input inputMode="numeric" value={f.cmax ?? ""} onChange={set("cmax")} />
            </label>
            <button type="submit" className="st-btn" disabled={pending}>
              Create code
            </button>
          </form>
          <form
            noValidate
            className="st-form"
            aria-label="Referral code"
            onSubmit={submit(() => createReferralAction(f.rclient ?? ""))}
          >
            <label>
              Referral code for a client
              <select value={f.rclient ?? ""} onChange={set("rclient")}>
                <option value="">Pick a client</option>
                {data.clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="st-btn" disabled={pending}>
              Create referral code
            </button>
          </form>
          <form
            noValidate
            className="st-form"
            aria-label="Gift card"
            onSubmit={submit(
              () => createGiftCardAction({ amount: f.gamt ?? "", email: f.gemail, recipient: f.grec }),
              () => setF({}),
            )}
          >
            <label>
              Gift card amount (dollars)
              <input inputMode="decimal" value={f.gamt ?? ""} onChange={set("gamt")} />
            </label>
            <label>
              Buyer email (optional)
              <input value={f.gemail ?? ""} onChange={set("gemail")} />
            </label>
            <label>
              For (optional)
              <input value={f.grec ?? ""} onChange={set("grec")} />
            </label>
            <button type="submit" className="st-btn" disabled={pending}>
              Create gift card
            </button>
          </form>
        </Card>

        <Card title="Deposit, quotes and tax" id="cat-set">
          <p className="st-note">
            Tax is calculated and shown on quotes and checkout only. Registering, collecting, filing and remitting stay
            with you and your accountant.
            {data.settings.taxIsSample ? " The tax rate below is a SAMPLE until you save it." : ""}
          </p>
          <form
            noValidate
            className="st-form"
            aria-label="Deposit and tax"
            onSubmit={submit(() =>
              saveCommerceSettingsAction({
                depositPercent: f.sdp ?? String(data.settings.depositPercent),
                quoteValidDays: f.sqd ?? String(data.settings.quoteValidDays),
                taxRate: f.str ?? data.settings.taxRate,
                taxLabel: f.stl ?? data.settings.taxLabel,
              }),
            )}
          >
            <label>
              Deposit (percent of what is due)
              <input inputMode="decimal" value={f.sdp ?? String(data.settings.depositPercent)} onChange={set("sdp")} />
            </label>
            <label>
              Quotes stay valid (days)
              <input inputMode="numeric" value={f.sqd ?? String(data.settings.quoteValidDays)} onChange={set("sqd")} />
            </label>
            <label>
              Tax rate (percent)
              <input inputMode="decimal" value={f.str ?? data.settings.taxRate} onChange={set("str")} />
            </label>
            <label>
              Tax label
              <input value={f.stl ?? data.settings.taxLabel} onChange={set("stl")} />
            </label>
            <button type="submit" className="st-btn" disabled={pending}>
              Save
            </button>
          </form>
        </Card>
      </div>
    </Frame>
  );
}
