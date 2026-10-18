"use client";

import { Badge, Button, Checkbox, Field, Input, Select, Text, Textarea } from "@holominimal/ui";

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
import { Card, Frame, useAct, useConfirm } from "./StudioFrame";

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
  const [ask, confirmEl] = useConfirm();
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
      {confirmEl}
      <div className="st-grid">
        <Card title="Packages" id="cat-pk">
          <Text size="sm" tone="muted">
            Prices marked SAMPLE show as $XX on the public site until you untick "Sample price".
          </Text>
          <ul className="hm-data-list st-list st-list--tall">
            {data.packages.map((p) => (
              <li className="hm-data-list-item" key={p.id} data-package-id={p.id}>
                <span>
                  <strong>{p.name}</strong> · {usd(p.priceCents)}{" "}
                  {p.isSample ? <Badge tone="warning">SAMPLE</Badge> : null}
                  <small>{p.deliverables.map((d) => `${d.label}: ${d.value}`).join(" · ")}</small>
                  {p.mandatoryFees.length ? (
                    <small>Includes {p.mandatoryFees.map((x) => `${x.label} ${usd(x.cents)}`).join(", ")}</small>
                  ) : null}
                </span>
                <span className="st-actions">
                  <Button variant="secondary" onClick={() => editPackage(p)}>
                    Edit
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={pending}
                    onClick={async () =>
                      (await ask({
                        title: `Remove the package ${p.name}?`,
                        body: "It is no longer offered to clients.",
                        action: "Remove package",
                      })) && act(() => deletePackageAction(p.id))
                    }
                  >
                    Remove
                  </Button>
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
            <Field label="Name">
              <Input value={f.pname ?? ""} onChange={set("pname")} />
            </Field>
            <Field label="Tagline">
              <Input value={f.ptag ?? ""} onChange={set("ptag")} />
            </Field>
            <Field label="Headline price (dollars, fees included)">
              <Input inputMode="decimal" value={f.pprice ?? ""} onChange={set("pprice")} />
            </Field>
            <Field label="Tier (order)">
              <Input inputMode="numeric" value={f.ptier ?? ""} onChange={set("ptier")} />
            </Field>
            <Field label={'Deliverables, one per line as "Label: value" (coverage, edited images, gallery time)'}>
              <Textarea rows={4} value={f.pdel ?? ""} onChange={set("pdel")} />
            </Field>
            <Field label={'Mandatory fees included in the price, one per line as "Label: dollars"'}>
              <Textarea rows={2} value={f.pfees ?? ""} onChange={set("pfees")} />
            </Field>
            <Field label="Included add-ons (slugs, comma separated)">
              <Input value={f.pinc ?? ""} onChange={set("pinc")} />
            </Field>
            <Checkbox
              checked={flags.featured}
              onChange={(e) => setFlags({ ...flags, featured: e.target.checked })}
              label="Featured"
            />
            <Checkbox
              checked={flags.sample}
              onChange={(e) => setFlags({ ...flags, sample: e.target.checked })}
              label="Sample price (shows as $XX)"
            />
            <Button type="submit" disabled={pending}>
              {f.pid ? "Save package" : "Add package"}
            </Button>
          </form>
        </Card>

        <Card title="Add-ons and fees" id="cat-ao">
          <Text size="sm" tone="muted">
            The standalone price is always shown next to a bundle. Optional fees (travel, rush) stay separate from the
            headline price.
          </Text>
          <ul className="hm-data-list st-list st-list--tall">
            {data.addOns.map((a) => (
              <li className="hm-data-list-item" key={a.id} data-addon-id={a.id}>
                <span>
                  <strong>{a.name}</strong> · {usd(a.priceCents)} {a.unit} {a.isFee ? "(optional fee)" : ""}{" "}
                  {a.isSample ? <Badge tone="warning">SAMPLE</Badge> : null}
                  <small>{a.slug}</small>
                </span>
                <span className="st-actions">
                  <Button variant="secondary" onClick={() => editAddOn(a)}>
                    Edit
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={pending}
                    onClick={async () =>
                      (await ask({
                        title: `Remove the add-on ${a.name}?`,
                        body: "It is no longer offered to clients.",
                        action: "Remove add-on",
                      })) && act(() => deleteAddOnAction(a.id))
                    }
                  >
                    Remove
                  </Button>
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
            <Field label="Name">
              <Input value={f.aname ?? ""} onChange={set("aname")} />
            </Field>
            <Field label="Description">
              <Input value={f.adesc ?? ""} onChange={set("adesc")} />
            </Field>
            <Field label="Standalone price (dollars)">
              <Input inputMode="decimal" value={f.aprice ?? ""} onChange={set("aprice")} />
            </Field>
            <Field label="Unit">
              <Input value={f.aunit ?? ""} onChange={set("aunit")} placeholder="each" />
            </Field>
            <Field label="Max quantity">
              <Input inputMode="numeric" value={f.amax ?? ""} onChange={set("amax")} placeholder="1" />
            </Field>
            <Checkbox
              checked={flags.fee}
              onChange={(e) => setFlags({ ...flags, fee: e.target.checked })}
              label="Optional fee (travel, rush)"
            />
            <Checkbox
              checked={flags.upsell}
              onChange={(e) => setFlags({ ...flags, upsell: e.target.checked })}
              label="Offer as an upsell on quotes"
            />
            <Checkbox
              checked={flags.asample}
              onChange={(e) => setFlags({ ...flags, asample: e.target.checked })}
              label="Sample price"
            />
            <Button type="submit" disabled={pending}>
              {f.aid ? "Save add-on" : "Add add-on"}
            </Button>
          </form>
        </Card>

        <Card title="Codes and gift cards" id="cat-codes">
          <ul className="hm-data-list st-list">
            {data.promos.map((p) => (
              <li className="hm-data-list-item" key={p.id}>
                <span>
                  <code>{p.code}</code> · {p.off} · used {p.uses}
                  {p.maxUses ? ` of ${p.maxUses}` : ""} {p.kind === "referral" ? "· referral" : ""}{" "}
                  {p.active ? "" : "· off"}
                  {p.note ? <small>{p.note}</small> : null}
                </span>
                <Button
                  variant="secondary"
                  disabled={pending}
                  onClick={() => act(() => togglePromoAction(p.id, !p.active))}
                >
                  {p.active ? "Switch off" : "Switch on"}
                </Button>
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
            <Field label="Code">
              <Input value={f.ccode ?? ""} onChange={set("ccode")} />
            </Field>
            <Field label="Kind">
              <Select value={f.ckind ?? "percent"} onValueChange={(v) => set("ckind")({ target: { value: v } })}>
                <option value="percent">Percent off</option>
                <option value="amount">Dollars off</option>
              </Select>
            </Field>
            <Field label="Value">
              <Input inputMode="decimal" value={f.cval ?? ""} onChange={set("cval")} />
            </Field>
            <Field label="Max uses (blank = unlimited)">
              <Input inputMode="numeric" value={f.cmax ?? ""} onChange={set("cmax")} />
            </Field>
            <Button type="submit" disabled={pending}>
              Create code
            </Button>
          </form>
          <form
            noValidate
            className="st-form"
            aria-label="Referral code"
            onSubmit={submit(() => createReferralAction(f.rclient ?? ""))}
          >
            <Field label="Referral code for a client">
              <Select value={f.rclient ?? ""} onValueChange={(v) => set("rclient")({ target: { value: v } })}>
                <option value="">Pick a client</option>
                {data.clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Button type="submit" disabled={pending}>
              Create referral code
            </Button>
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
            <Field label="Gift card amount (dollars)">
              <Input inputMode="decimal" value={f.gamt ?? ""} onChange={set("gamt")} />
            </Field>
            <Field label="Buyer email (optional)">
              <Input value={f.gemail ?? ""} onChange={set("gemail")} />
            </Field>
            <Field label="For (optional)">
              <Input value={f.grec ?? ""} onChange={set("grec")} />
            </Field>
            <Button type="submit" disabled={pending}>
              Create gift card
            </Button>
          </form>
        </Card>

        <Card title="Deposit, quotes and tax" id="cat-set">
          <Text size="sm" tone="muted">
            Tax is calculated and shown on quotes and checkout only. Registering, collecting, filing and remitting stay
            with you and your accountant.
            {data.settings.taxIsSample ? " The tax rate below is a SAMPLE until you save it." : ""}
          </Text>
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
            <Field label="Deposit (percent of what is due)">
              <Input inputMode="decimal" value={f.sdp ?? String(data.settings.depositPercent)} onChange={set("sdp")} />
            </Field>
            <Field label="Quotes stay valid (days)">
              <Input inputMode="numeric" value={f.sqd ?? String(data.settings.quoteValidDays)} onChange={set("sqd")} />
            </Field>
            <Field label="Tax rate (percent)">
              <Input inputMode="decimal" value={f.str ?? data.settings.taxRate} onChange={set("str")} />
            </Field>
            <Field label="Tax label">
              <Input value={f.stl ?? data.settings.taxLabel} onChange={set("stl")} />
            </Field>
            <Button type="submit" disabled={pending}>
              Save
            </Button>
          </form>
        </Card>
      </div>
    </Frame>
  );
}
