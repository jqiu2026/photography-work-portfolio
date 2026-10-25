"use client";

import { DateField } from "@/components/DateField";
import { Badge, Button, Field, Input, Select, Text } from "@holominimal/ui";
import { useState } from "react";
import {
  createGiftCardAction,
  createPromoAction,
  createReferralAction,
  deleteGiftCardAction,
  deletePromoAction,
  setGiftCardStatusAction,
  togglePromoAction,
  updateGiftCardAction,
  updatePromoAction,
} from "@/app/studio/commerce-actions";
import { Card, FormDialog, Frame, useAct, useConfirm, useNotify } from "./StudioFrame";

const usd = (c: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(c / 100);
const dollars = (c: number) => (c / 100).toFixed(2);

type State = "active" | "inactive" | "expired" | "used";
const STATE_TONE = { active: "success", inactive: "muted", expired: "warning", used: "info" } as const;
const STATE_WORD = { active: "Active", inactive: "Inactive", expired: "Expired", used: "Used" } as const;
const StateBadge = ({ state }: { state: State }) => <Badge tone={STATE_TONE[state]}>{STATE_WORD[state]}</Badge>;

export type CodesData = {
  promos: {
    id: string;
    code: string;
    kind: string;
    off: string;
    uses: number;
    maxUses: number | null;
    note: string | null;
    kindRaw: "percent" | "amount";
    value: string;
    minSubtotal: string;
    galleryId: string;
    gallery: string;
    expires: string;
    state: State;
  }[];
  gifts: {
    id: string;
    code: string;
    initial: number;
    balance: number;
    recipient: string;
    email: string;
    expires: string;
    created: string;
    state: State;
  }[];
  clients: { id: string; name: string }[];
  galleries: { id: string; title: string }[];
};

type Dialogs = "promo" | "referral" | "gift" | null;

/** Discount codes (sitewide or for one gallery) and gift cards (always sitewide), each with a colored state. */
export function CodesView({ user, data }: { user: string; data: CodesData }) {
  const { pending, note, act, go } = useAct();
  const notify = useNotify();
  const [ask, confirmEl] = useConfirm();
  const [open, setOpen] = useState<Dialogs>(null);
  const [f, setF] = useState<Record<string, string>>({});
  const set = (k: string) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  const show = (d: Dialogs, fields: Record<string, string> = {}) => {
    setF(fields);
    setOpen(d);
  };
  const editPromo = (p: CodesData["promos"][number]) => {
    show("promo", {
      cid: p.id,
      ccode: p.code,
      ckind: p.kindRaw,
      cval: p.value,
      cmax: p.maxUses ? String(p.maxUses) : "",
      cmin: p.minSubtotal,
      cgal: p.galleryId,
      cexp: p.expires,
      cnote: p.note ?? "",
    });
    notify(`Loaded code ${p.code}`);
  };
  const editGift = (g: CodesData["gifts"][number]) => {
    show("gift", {
      gid: g.id,
      gcode: g.code,
      gamt: dollars(g.balance),
      gemail: g.email,
      grec: g.recipient,
      gexp: g.expires,
    });
    notify(`Loaded gift card ${g.code}`);
  };
  const del = async (title: string, body: string, action: string, run: () => Promise<unknown>) =>
    (await ask({ title, body, action })) && act(run);
  const copy = (text: string, what: string) =>
    navigator.clipboard?.writeText(text).then(
      () => notify(`${what} copied`, "success"),
      () => notify("Could not copy", "danger"),
    );
  return (
    <Frame section="codes" user={user} note={note}>
      {confirmEl}
      <div className="st-grid">
        <Card
          title="Discount codes"
          id="cd-promos"
          actions={
            <>
              <Button size="sm" onClick={() => show("promo", { ckind: "percent" })}>
                New code
              </Button>
              <Button size="sm" variant="secondary" onClick={() => show("referral")}>
                Referral code
              </Button>
            </>
          }
        >
          <Text size="sm" tone="muted">
            A sitewide code works on any quote and in any gallery's shop. A gallery code works only in that gallery.
          </Text>
          {data.promos.length ? (
            <ul className="hm-data-list st-list st-list--tall" aria-label="Codes">
              {data.promos.map((p) => (
                <li className="hm-data-list-item" key={p.id} data-promo={p.code}>
                  <span>
                    <code>{p.code}</code> <StateBadge state={p.state} />
                    <small>
                      {[
                        p.off,
                        p.gallery ? `only in ${p.gallery}` : "sitewide",
                        `used ${p.uses}${p.maxUses ? ` of ${p.maxUses}` : ""}`,
                        p.kind === "referral" ? "referral" : "",
                        p.expires ? `until ${p.expires}` : "",
                        p.note ?? "",
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </small>
                  </span>
                  <span className="st-actions">
                    <Button variant="secondary" size="sm" onClick={() => editPromo(p)}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={pending}
                      onClick={() => act(() => togglePromoAction(p.id, p.state === "inactive"))}
                    >
                      {p.state === "inactive" ? "Switch on" : "Switch off"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={pending}
                      onClick={() =>
                        del(
                          `Delete the code ${p.code}?`,
                          "Quotes and orders that already used it keep their discount. Anyone holding the code can no longer use it.",
                          "Delete code",
                          () => deletePromoAction(p.id),
                        )
                      }
                    >
                      Delete
                    </Button>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <Text size="sm" tone="muted">
              No codes yet. Use New code to make one.
            </Text>
          )}
        </Card>

        <Card
          title="Gift cards"
          id="cd-gifts"
          actions={
            <Button size="sm" onClick={() => show("gift")}>
              New gift card
            </Button>
          }
        >
          <Text size="sm" tone="muted">
            Gift cards are sitewide: they pay toward any quote.
          </Text>
          {data.gifts.length ? (
            <ul className="hm-data-list st-list st-list--tall" aria-label="Gift cards">
              {data.gifts.map((g) => (
                <li className="hm-data-list-item" key={g.id} data-gift={g.code}>
                  <span>
                    <code>{g.code}</code> <StateBadge state={g.state} />
                    <small>
                      {[
                        `${usd(g.balance)} left of ${usd(g.initial)}`,
                        g.recipient && `for ${g.recipient}`,
                        g.email,
                        g.expires && `expires ${g.expires}`,
                        `made ${g.created}`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </small>
                  </span>
                  <span className="st-actions">
                    <Button variant="secondary" size="sm" onClick={() => copy(g.code, "Gift card code")}>
                      Copy code
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => editGift(g)}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={pending}
                      onClick={() => act(() => setGiftCardStatusAction(g.id, g.state === "inactive"))}
                    >
                      {g.state === "inactive" ? "Switch on" : "Switch off"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={pending}
                      onClick={() =>
                        del(
                          `Delete gift card ${g.code}?`,
                          g.balance
                            ? `It still has ${usd(g.balance)} on it, which will be lost. This cannot be undone.`
                            : "This cannot be undone.",
                          "Delete gift card",
                          () => deleteGiftCardAction(g.id),
                        )
                      }
                    >
                      Delete
                    </Button>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <Text size="sm" tone="muted">
              No gift cards yet.
            </Text>
          )}
        </Card>
      </div>

      <FormDialog
        open={open === "promo"}
        onOpenChange={(o) => !o && setOpen((d) => (d === "promo" ? null : d))}
        title={f.cid ? `Edit code ${f.ccode}` : "New code"}
        description={f.cid ? "The code itself cannot change, because clients may already have it." : undefined}
        submitLabel={f.cid ? "Save code" : "Create code"}
        pending={pending}
        onSubmit={() =>
          go(() =>
            f.cid
              ? updatePromoAction({
                  promoId: f.cid,
                  kind: f.ckind ?? "percent",
                  value: f.cval ?? "",
                  maxUses: f.cmax,
                  minSubtotal: f.cmin,
                  galleryId: f.cgal,
                  expires: f.cexp,
                  note: f.cnote,
                })
              : createPromoAction({
                  code: f.ccode ?? "",
                  kind: f.ckind ?? "percent",
                  value: f.cval ?? "",
                  maxUses: f.cmax,
                  minSubtotal: f.cmin,
                  galleryId: f.cgal,
                  expires: f.cexp,
                }),
          )
        }
      >
        <Field label="Code">
          <Input value={f.ccode ?? ""} onChange={set("ccode")} disabled={Boolean(f.cid)} />
        </Field>
        <Field label="Works in">
          <Select value={f.cgal ?? ""} onValueChange={(v) => set("cgal")({ target: { value: v } })}>
            <option value="">Everywhere (sitewide)</option>
            {data.galleries.map((g) => (
              <option key={g.id} value={g.id}>
                Only {g.title}
              </option>
            ))}
          </Select>
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
        <Field label="Minimum order (dollars, optional)">
          <Input inputMode="decimal" value={f.cmin ?? ""} onChange={set("cmin")} />
        </Field>
        <Field label="Last day (optional)">
          <DateField value={f.cexp ?? ""} onChange={set("cexp")} />
        </Field>
        {f.cid ? (
          <Field label="Note">
            <Input value={f.cnote ?? ""} onChange={set("cnote")} />
          </Field>
        ) : null}
      </FormDialog>

      <FormDialog
        open={open === "referral"}
        onOpenChange={(o) => !o && setOpen((d) => (d === "referral" ? null : d))}
        title="Referral code"
        description="A one-use 10% code that remembers which client passed it on."
        submitLabel="Create referral code"
        pending={pending}
        onSubmit={() => go(() => createReferralAction(f.rclient ?? ""))}
      >
        <Field label="Client">
          <Select value={f.rclient ?? ""} onValueChange={(v) => set("rclient")({ target: { value: v } })}>
            <option value="">Pick a client</option>
            {data.clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
      </FormDialog>

      <FormDialog
        open={open === "gift"}
        onOpenChange={(o) => !o && setOpen((d) => (d === "gift" ? null : d))}
        title={f.gid ? `Edit gift card ${f.gcode}` : "New gift card"}
        submitLabel={f.gid ? "Save gift card" : "Create gift card"}
        pending={pending}
        onSubmit={() =>
          go(() =>
            f.gid
              ? updateGiftCardAction({
                  cardId: f.gid,
                  recipient: f.grec,
                  email: f.gemail,
                  expires: f.gexp,
                  balance: f.gamt,
                })
              : createGiftCardAction({ amount: f.gamt ?? "", email: f.gemail, recipient: f.grec }),
          )
        }
      >
        <Field label={f.gid ? "Balance (dollars)" : "Gift card amount (dollars)"}>
          <Input inputMode="decimal" value={f.gamt ?? ""} onChange={set("gamt")} />
        </Field>
        <Field label="Buyer email (optional)">
          <Input value={f.gemail ?? ""} onChange={set("gemail")} />
        </Field>
        <Field label="For (optional)">
          <Input value={f.grec ?? ""} onChange={set("grec")} />
        </Field>
        {f.gid ? (
          <Field label="Expires (optional)">
            <DateField value={f.gexp ?? ""} onChange={set("gexp")} />
          </Field>
        ) : null}
      </FormDialog>
    </Frame>
  );
}
