"use client";

import { Badge, Button, Checkbox, Field, Input, Select, Text, Textarea } from "@holominimal/ui";

import { useState } from "react";
import {
  deleteAddOnAction,
  deletePackageAction,
  saveAddOnAction,
  saveCommerceSettingsAction,
  savePackageAction,
} from "@/app/studio/commerce-actions";
import { Card, FormDialog, Frame, useAct, useConfirm, useNotify } from "./StudioFrame";

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
  settings: { depositPercent: number; quoteValidDays: number; taxRate: string; taxLabel: string; taxIsSample: boolean };
};

type Dialogs = "package" | "addon" | "settings" | null;

/** Packages, add-ons and the deposit and tax settings. Every price flagged SAMPLE shows as $XX publicly. */
export function CatalogView({ user, data }: { user: string; data: CatalogData }) {
  const { pending, note, act, go } = useAct();
  const notify = useNotify();
  const [ask, confirmEl] = useConfirm();
  const [open, setOpen] = useState<Dialogs>(null);
  const [f, setF] = useState<Record<string, string>>({});
  const set = (k: string) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  const [flags, setFlags] = useState({ featured: false, sample: true, fee: false, upsell: true, asample: true });
  const show = (d: Dialogs, fields: Record<string, string> = {}) => {
    setF(fields);
    setOpen(d);
  };

  const editPackage = (p: CatalogData["packages"][number]) => {
    setFlags((x) => ({ ...x, featured: p.featured, sample: p.isSample }));
    show("package", {
      pid: p.id,
      pname: p.name,
      ptag: p.tagline ?? "",
      pprice: dollars(p.priceCents),
      ptier: String(p.tier),
      pdel: p.deliverables.map((d) => `${d.label}: ${d.value}`).join("\n"),
      pfees: p.mandatoryFees.map((x2) => `${x2.label}: ${dollars(x2.cents)}`).join("\n"),
      pinc: p.includedAddOns.join(", "),
    });
    notify(`Loaded saved settings for ${p.name}`);
  };
  const editAddOn = (a: CatalogData["addOns"][number]) => {
    setFlags((x) => ({ ...x, fee: a.isFee, upsell: a.upsell, asample: a.isSample }));
    show("addon", {
      aid: a.id,
      aname: a.name,
      adesc: a.description ?? "",
      aprice: dollars(a.priceCents),
      aunit: a.unit,
      amax: String(a.maxQty),
    });
    notify(`Loaded saved settings for ${a.name}`);
  };
  const del = async (title: string, body: string, action: string, run: () => Promise<unknown>) =>
    (await ask({ title, body, action })) && act(run);
  return (
    <Frame section="packages" user={user} note={note}>
      {confirmEl}
      <div className="st-grid">
        <Card
          title="Packages"
          id="cat-pk"
          actions={
            <Button size="sm" onClick={() => show("package")}>
              Add package
            </Button>
          }
        >
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
                  <Button variant="secondary" size="sm" onClick={() => editPackage(p)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    onClick={() =>
                      del(
                        `Remove the package ${p.name}?`,
                        "It is no longer offered to clients.",
                        "Remove package",
                        () => deletePackageAction(p.id),
                      )
                    }
                  >
                    Remove
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card
          title="Add-ons and fees"
          id="cat-ao"
          actions={
            <Button size="sm" onClick={() => show("addon")}>
              Add add-on
            </Button>
          }
        >
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
                  <Button variant="secondary" size="sm" onClick={() => editAddOn(a)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    onClick={() =>
                      del(`Remove the add-on ${a.name}?`, "It is no longer offered to clients.", "Remove add-on", () =>
                        deleteAddOnAction(a.id),
                      )
                    }
                  >
                    Remove
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card
          title="Deposit, quotes and tax"
          id="cat-set"
          actions={
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                show("settings", {
                  sdp: String(data.settings.depositPercent),
                  sqd: String(data.settings.quoteValidDays),
                  str: data.settings.taxRate,
                  stl: data.settings.taxLabel,
                })
              }
            >
              Change
            </Button>
          }
        >
          <Text size="sm" tone="muted">
            Tax is calculated and shown on quotes and checkout only. Registering, collecting, filing and remitting stay
            with you and your accountant.
            {data.settings.taxIsSample ? " The tax rate below is a SAMPLE until you save it." : ""}
          </Text>
          <dl className="st-roles">
            <div>
              <dt>Deposit</dt>
              <dd>{data.settings.depositPercent}% of what is due</dd>
            </div>
            <div>
              <dt>Quotes stay valid</dt>
              <dd>{data.settings.quoteValidDays} days</dd>
            </div>
            <div>
              <dt>{data.settings.taxLabel || "Tax"}</dt>
              <dd>{data.settings.taxRate}%</dd>
            </div>
          </dl>
        </Card>
      </div>

      <FormDialog
        open={open === "package"}
        onOpenChange={(o) => !o && setOpen((d) => (d === "package" ? null : d))}
        title={f.pid ? "Edit package" : "Add package"}
        size="lg"
        submitLabel={f.pid ? "Save package" : "Add package"}
        pending={pending}
        onSubmit={() =>
          go(() =>
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
          )
        }
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
      </FormDialog>

      <FormDialog
        open={open === "addon"}
        onOpenChange={(o) => !o && setOpen((d) => (d === "addon" ? null : d))}
        title={f.aid ? "Edit add-on" : "Add add-on"}
        size="lg"
        submitLabel={f.aid ? "Save add-on" : "Add add-on"}
        pending={pending}
        onSubmit={() =>
          go(() =>
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
          )
        }
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
      </FormDialog>

      <FormDialog
        open={open === "settings"}
        onOpenChange={(o) => !o && setOpen((d) => (d === "settings" ? null : d))}
        title="Deposit, quotes and tax"
        pending={pending}
        onSubmit={() =>
          go(() =>
            saveCommerceSettingsAction({
              depositPercent: f.sdp ?? String(data.settings.depositPercent),
              quoteValidDays: f.sqd ?? String(data.settings.quoteValidDays),
              taxRate: f.str ?? data.settings.taxRate,
              taxLabel: f.stl ?? data.settings.taxLabel,
            }),
          )
        }
      >
        <Field label="Deposit (percent of what is due)">
          <Input inputMode="decimal" value={f.sdp ?? ""} onChange={set("sdp")} />
        </Field>
        <Field label="Quotes stay valid (days)">
          <Input inputMode="numeric" value={f.sqd ?? ""} onChange={set("sqd")} />
        </Field>
        <Field label="Tax rate (percent)">
          <Input inputMode="decimal" value={f.str ?? ""} onChange={set("str")} />
        </Field>
        <Field label="Tax label">
          <Input value={f.stl ?? ""} onChange={set("stl")} />
        </Field>
      </FormDialog>
    </Frame>
  );
}
