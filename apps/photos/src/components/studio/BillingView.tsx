"use client";

import { DateField } from "@/components/DateField";
import { Button, Checkbox, Field, Input, Select, Status, Text } from "@holominimal/ui";

import { useState } from "react";
import {
  createPlanAction,
  createRecurringAction,
  refundAction,
  runBillingNowAction,
  saveBillingSettingsAction,
  stopRecurringAction,
} from "@/app/studio/billing-actions";
import { Card, FormDialog, Frame, statusTone, useAct, useConfirm } from "./StudioFrame";

const usd = (c: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(c / 100);

export type BillingData = {
  payments: {
    id: string;
    invoice: string;
    provider: string;
    method: string | null;
    amountCents: number;
    tipCents: number;
    surchargeCents: number;
    refundedCents: number;
    status: string;
    at: string;
  }[];
  plans: { id: string; name: string; totalCents: number; count: number; paid: number }[];
  recurring: { id: string; description: string; amountCents: number; months: number; next: string; active: boolean }[];
  jobs: { id: string; title: string }[];
  settings: { tips: boolean; percents: string; ach: boolean; surcharge: boolean; surchargePercent: string };
  stripe: boolean;
};

/** Payments and refunds, instalment plans, recurring invoices, and the tip, bank and surcharge settings. */
export function BillingView({ user, data }: { user: string; data: BillingData }) {
  const { pending, note, act, submit, go } = useAct();
  const [ask, confirmEl] = useConfirm();
  const [planOpen, setPlanOpen] = useState(false);
  const [recOpen, setRecOpen] = useState(false);
  const [setOpen, setSetOpen] = useState(false);
  const [f, setF] = useState<Record<string, string>>({});
  const [flags, setFlags] = useState({
    tips: data.settings.tips,
    ach: data.settings.ach,
    surcharge: data.settings.surcharge,
  });
  const set = (k: string) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  const jobField = (key: string) => (
    <Field label="Job">
      <Select value={f[key] ?? ""} onValueChange={(v) => set(key)({ target: { value: v } })}>
        <option value="">Pick a job</option>
        {data.jobs.map((j) => (
          <option key={j.id} value={j.id}>
            {j.title}
          </option>
        ))}
      </Select>
    </Field>
  );
  return (
    <Frame section="billing" user={user} note={note}>
      {confirmEl}
      <div className="st-grid">
        <Card title="Payments and refunds" id="b-pay">
          {data.payments.length ? (
            <ul className="hm-data-list st-list st-list--tall">
              {data.payments.map((p) => (
                <li className="hm-data-list-item" key={p.id} data-payment-id={p.id}>
                  <span>
                    <strong>{p.invoice}</strong> · {usd(p.amountCents)} · {p.method ?? p.provider}{" "}
                    <Status tone={statusTone(p.status)}>{p.status}</Status>
                    <small>
                      {p.at}
                      {p.tipCents ? ` · tip ${usd(p.tipCents)}` : ""}
                      {p.surchargeCents ? ` · surcharge ${usd(p.surchargeCents)}` : ""}
                      {p.refundedCents ? ` · refunded ${usd(p.refundedCents)}` : ""}
                    </small>
                  </span>
                  {p.status === "succeeded" && p.refundedCents < p.amountCents ? (
                    <form
                      noValidate
                      className="st-actions"
                      aria-label={`Refund ${p.invoice}`}
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const typed = (f[`r-${p.id}`] ?? "").trim();
                        const amount = typed ? `$${typed.replace(/^\$/, "")}` : usd(p.amountCents - p.refundedCents);
                        if (
                          await ask({
                            title: `Refund ${amount} on ${p.invoice}?`,
                            body: data.stripe
                              ? "The money goes back to the client's card through Stripe. A refund cannot be undone."
                              : "This records the refund. Stripe is not set up, so send the money back yourself. A refund cannot be undone.",
                            action: `Refund ${amount}`,
                          })
                        )
                          act(
                            () => refundAction({ paymentId: p.id, amount: typed, reason: "Refund" }),
                            () => setF({}),
                          );
                      }}
                    >
                      <Input
                        inputMode="decimal"
                        aria-label={`Refund amount for ${p.invoice} in dollars`}
                        placeholder={((p.amountCents - p.refundedCents) / 100).toFixed(2)}
                        value={f[`r-${p.id}`] ?? ""}
                        onChange={set(`r-${p.id}`)}
                        style={{ width: "6.5rem" }}
                      />
                      <Button type="submit" variant="secondary" disabled={pending}>
                        Refund
                      </Button>
                    </form>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <Text size="sm" tone="muted">
              No payments yet.
            </Text>
          )}
          <Text size="sm" tone="muted">
            {data.stripe
              ? "Refunds on Stripe payments are sent to Stripe, then recorded here."
              : "Stripe is not configured (TODO(owner): needs STRIPE_SECRET_KEY): refunds here are recorded only; send the money back yourself."}
          </Text>
        </Card>

        <Card
          title="Payment plan"
          actions={
            <Button size="sm" onClick={() => setPlanOpen(true)}>
              New plan
            </Button>
          }
          id="b-plan"
        >
          <ul className="hm-data-list st-list">
            {data.plans.map((p) => (
              <li className="hm-data-list-item" key={p.id}>
                <span>
                  {p.name} · {usd(p.totalCents)} in {p.count}
                  <small>{p.paid} paid</small>
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card
          title="Recurring billing"
          actions={
            <Button size="sm" onClick={() => setRecOpen(true)}>
              New recurring invoice
            </Button>
          }
          id="b-rec"
        >
          <ul className="hm-data-list st-list">
            {data.recurring.map((r) => (
              <li className="hm-data-list-item" key={r.id}>
                <span>
                  {r.description} · {usd(r.amountCents)} every {r.months} month{r.months > 1 ? "s" : ""}
                  <small>{r.active ? `next ${r.next}` : "stopped"}</small>
                </span>
                {r.active ? (
                  <Button
                    variant="secondary"
                    disabled={pending}
                    onClick={async () =>
                      (await ask({
                        title: `Stop billing ${r.description}?`,
                        body: `No more invoices for ${usd(r.amountCents)} every ${r.months} month${r.months > 1 ? "s" : ""} will be sent. Invoices already sent stay as they are. To start again, set up a new recurring invoice.`,
                        action: "Stop recurring billing",
                      })) && act(() => stopRecurringAction(r.id))
                    }
                  >
                    Stop
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>

          <Text size="sm" tone="muted">
            Recurring invoices and due instalments are sent automatically each day (a Vercel Cron job); this button runs
            them now.
          </Text>
          <Button variant="secondary" disabled={pending} onClick={() => act(() => runBillingNowAction())}>
            Run billing now
          </Button>
        </Card>

        <Card
          title="Tips, bank payment and surcharge"
          id="b-set"
          actions={
            <Button size="sm" variant="secondary" onClick={() => setSetOpen(true)}>
              Change
            </Button>
          }
        >
          <dl className="st-roles">
            <div>
              <dt>Tips at payment</dt>
              <dd>{flags.tips ? `On (${data.settings.percents}%)` : "Off"}</dd>
            </div>
            <div>
              <dt>Bank transfer (ACH)</dt>
              <dd>{flags.ach ? "On" : "Off"}</dd>
            </div>
            <div>
              <dt>Card surcharge</dt>
              <dd>{flags.surcharge ? `${data.settings.surchargePercent}%` : "Off"}</dd>
            </div>
          </dl>
        </Card>
      </div>
      <FormDialog
        open={planOpen}
        onOpenChange={setPlanOpen}
        title="New payment plan"
        submitLabel="Create plan"
        pending={pending}
        onSubmit={() =>
          go(
            () =>
              createPlanAction({
                jobId: f.pj ?? "",
                total: f.pt ?? "",
                count: f.pc ?? "3",
                firstDue: f.pd ?? "",
                every: f.pe ?? "month",
              }),
            () => setF({}),
          )
        }
      >
        {jobField("pj")}
        <Field label="Total (dollars)">
          <Input inputMode="decimal" value={f.pt ?? ""} onChange={set("pt")} />
        </Field>
        <Field label="Instalments">
          <Input inputMode="numeric" value={f.pc ?? "3"} onChange={set("pc")} />
        </Field>
        <Field label="First due">
          <DateField value={f.pd ?? ""} onChange={set("pd")} />
        </Field>
        <Field label="Every">
          <Select value={f.pe ?? "month"} onValueChange={(v) => set("pe")({ target: { value: v } })}>
            <option value="month">Month</option>
            <option value="2weeks">Two weeks</option>
            <option value="week">Week</option>
          </Select>
        </Field>
      </FormDialog>
      <FormDialog
        open={recOpen}
        onOpenChange={setRecOpen}
        title="New recurring invoice"
        submitLabel="Start"
        pending={pending}
        onSubmit={() =>
          go(
            () =>
              createRecurringAction({
                jobId: f.rj ?? "",
                description: f.rd ?? "",
                amount: f.ra ?? "",
                months: f.rm ?? "1",
                startOn: f.rs ?? "",
                endsOn: f.re,
              }),
            () => setF({}),
          )
        }
      >
        {jobField("rj")}
        <Field label="What is billed">
          <Input value={f.rd ?? ""} onChange={set("rd")} />
        </Field>
        <Field label="Amount (dollars)">
          <Input inputMode="decimal" value={f.ra ?? ""} onChange={set("ra")} />
        </Field>
        <Field label="Every (months)">
          <Input inputMode="numeric" value={f.rm ?? "1"} onChange={set("rm")} />
        </Field>
        <Field label="First invoice">
          <DateField value={f.rs ?? ""} onChange={set("rs")} />
        </Field>
        <Field label="Last invoice (optional)">
          <DateField value={f.re ?? ""} onChange={set("re")} />
        </Field>
      </FormDialog>
      <FormDialog
        open={setOpen}
        onOpenChange={setSetOpen}
        title="Tips, bank payment and surcharge"
        pending={pending}
        onSubmit={() =>
          go(() =>
            saveBillingSettingsAction({
              tips: flags.tips,
              percents: f.sp ?? data.settings.percents,
              ach: flags.ach,
              surcharge: flags.surcharge,
              surchargePercent: f.ss ?? data.settings.surchargePercent,
            }),
          )
        }
      >
        <Checkbox
          checked={flags.tips}
          onChange={(e) => setFlags({ ...flags, tips: e.target.checked })}
          label="Offer a tip at payment"
        />
        <Field label="Tip choices (percent, comma separated)">
          <Input value={f.sp ?? data.settings.percents} onChange={set("sp")} />
        </Field>
        <Checkbox
          checked={flags.ach}
          onChange={(e) => setFlags({ ...flags, ach: e.target.checked })}
          label="Offer bank transfer (ACH, needs it enabled in Stripe)"
        />
        <Checkbox
          checked={flags.surcharge}
          onChange={(e) => setFlags({ ...flags, surcharge: e.target.checked })}
          label="Add a credit card surcharge (default off)"
        />
        <Field label="Surcharge percent (at most 3)">
          <Input inputMode="decimal" value={f.ss ?? data.settings.surchargePercent} onChange={set("ss")} />
        </Field>
        <Text size="sm" tone="muted">
          A surcharge is allowed on credit cards only (never debit), must be disclosed before the sale, is capped at the
          lower of 3% or your actual cost, needs advance notice to the card networks, and is banned in some states.
          Check the rules where you work before turning it on. Not legal advice.
        </Text>
      </FormDialog>
    </Frame>
  );
}
