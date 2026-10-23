"use client";

import { DateField } from "@/components/DateField";
import { Button, Field, Input, Progress, Select, Stat, StatGroup, Status, Step, Stepper, Text } from "@holominimal/ui";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import {
  addClientAction,
  addJobAction,
  advanceJobAction,
  convertBookingAction,
  createContractAction,
  createInvoiceAction,
  markInvoicePaidAction,
  sendContractAction,
  sendInvoiceAction,
} from "@/app/studio/actions";
import "./studio.css";
import { FormMessage } from "@/components/ui";
import { Banner, Card, FormDialog, StudioHead, statusTone } from "./StudioFrame";
import { studioSections } from "./sections";

const JOB_STEPS = ["inquiry", "booked", "shot", "editing", "delivered", "paid"] as const;
/** An invoice still waiting for money (not paid, voided or refunded). */
const open = (status: string) => !["paid", "void", "refunded"].includes(status);
const usd = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
const day = (d: Date | string | null) => (d ? new Date(d).toISOString().slice(0, 10) : "");

export type StudioData = {
  clients: { id: string; name: string; email: string }[];
  jobs: {
    id: string;
    clientId: string;
    clientName: string;
    title: string;
    date: Date | string | null;
    status: string;
    feeCents: number;
  }[];
  galleries: { id: string; jobTitle: string; title: string; status: string; items: number }[];
  bookings: {
    id: string;
    name: string;
    email: string;
    topic: string;
    message: string;
    status: string;
    phone: string | null;
    shootType: string | null;
    eventDate: string | null;
    location: string | null;
    budget: string | null;
    guests: number | null;
    source: string | null;
    score: number;
    details: Record<string, string>;
    createdAt: string;
  }[];
  emails: {
    id: string;
    kind: string;
    to: string;
    subject: string;
    text: string;
    status: string;
    provider: string;
    error: string | null;
    at: string;
  }[];
  contracts: { id: string; jobTitle: string; title: string; kind: string; status: string; signedBy: string | null }[];
  invoices: { id: string; number: string; jobTitle: string; status: string; totalCents: number; lines: string }[];
  media: { id: string; filename: string }[];
};

type Result = { ok: boolean; message?: string; error?: string; link?: string };

/** Studio dashboard sections. Every button calls a guarded server action; the page refreshes from the database. */
export function StudioApp({ section, user, data }: { section: string; user: string; data: StudioData }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [note, setNote] = useState<Result | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [picked, setPicked] = useState<string[]>([]);
  const set = (k: string) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const run = (fn: () => Promise<unknown>, after?: () => void) =>
    start(async () => {
      const r = (await fn()) as Result;
      setNote(r);
      if (r.ok) {
        after?.();
        router.refresh();
      }
    });
  const submit = (fn: () => Promise<unknown>, after?: () => void) => (e: React.FormEvent) => {
    e.preventDefault();
    run(fn, after);
  };

  const go = async (fn: () => Promise<unknown>, after?: () => void) => {
    const r = (await fn()) as Result;
    setNote(r);
    if (r.ok) {
      after?.();
      router.refresh();
    }
    return r.ok;
  };
  const [adding, setAdding] = useState<"client" | "job" | null>(null);

  let body: ReactNode = null;
  if (section === "overview") {
    const unpaid = data.invoices.filter((i) => i.status !== "paid" && i.status !== "void");
    body = (
      <div className="st-grid">
        <Card title="Today" id="st-today">
          <StatGroup>
            <Stat label="New inquiries" value={data.bookings.filter((b) => b.status === "new").length} />
            <Stat
              label="Open jobs"
              value={data.jobs.filter((j) => j.status !== "paid" && j.status !== "cancelled").length}
            />
            <Stat label="Unpaid invoices" value={unpaid.length} />
            <Stat
              label="Awaiting signature"
              value={data.contracts.filter((k) => k.status === "sent" || k.status === "viewed").length}
            />
          </StatGroup>
        </Card>
        <Card title="Outstanding" id="st-out">
          {unpaid.length ? (
            <ul className="hm-data-list st-list">
              {unpaid.map((i) => (
                <li className="hm-data-list-item" key={i.id}>
                  <span>
                    {i.number} · {i.jobTitle}
                  </span>
                  <strong>{usd(i.totalCents)}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <Text size="sm" tone="muted">
              Nothing outstanding.
            </Text>
          )}
        </Card>
      </div>
    );
  } else if (section === "bookings") {
    const sorted = [...data.bookings].sort((x, y) => y.score - x.score || y.createdAt.localeCompare(x.createdAt));
    body = (
      <Card title="Inquiries" id="st-b">
        <Text size="sm" tone="muted">
          Highest lead score first. The score is explained in docs/project/01-photo-site-spec.md.
        </Text>
        {sorted.length ? (
          <ul className="hm-data-list st-list st-list--tall">
            {sorted.map((b) => (
              <li className="hm-data-list-item" key={b.id} data-lead-id={b.id}>
                <span>
                  <strong>{b.name}</strong> · {b.shootType ?? b.topic} · <span title="Lead score">score {b.score}</span>
                  <small>
                    {[
                      b.eventDate,
                      b.location,
                      b.budget,
                      b.guests ? `${b.guests} guests` : "",
                      b.phone,
                      b.source && `via ${b.source}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </small>
                  <small>{b.message}</small>
                  {Object.entries(b.details).length ? (
                    <small>
                      {Object.entries(b.details)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(" · ")}
                    </small>
                  ) : null}
                </span>
                {b.status === "new" ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={pending}
                    onClick={() => run(() => convertBookingAction(b.id))}
                  >
                    Convert to client
                  </Button>
                ) : (
                  <Status tone={statusTone(b.status)}>{b.status}</Status>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <Text size="sm" tone="muted">
            No inquiries yet.
          </Text>
        )}
      </Card>
    );
  } else if (section === "inbox") {
    body = (
      <Card title="Inbox" id="st-in">
        <Text size="sm" tone="muted">
          Every email the platform sends. <strong>mock</strong> means the labelled development outbox recorded it and
          nothing was sent; <strong>skipped</strong> means no email provider is configured (TODO(owner): needs
          RESEND_API_KEY and EMAIL_FROM).
        </Text>
        {data.emails.length ? (
          <ul className="hm-data-list st-list st-list--tall">
            {data.emails.map((m) => (
              <li className="hm-data-list-item" key={m.id}>
                <details>
                  <summary>
                    <strong>{m.subject}</strong> · {m.to} · <Status tone={statusTone(m.status)}>{m.status}</Status> ·{" "}
                    {m.kind}
                  </summary>
                  <pre className="st-pre">{m.text}</pre>
                  {m.error ? <FormMessage className="st-error">{m.error}</FormMessage> : null}
                  <small>
                    {m.provider} · {m.at.slice(0, 16).replace("T", " ")}
                  </small>
                </details>
              </li>
            ))}
          </ul>
        ) : (
          <Text size="sm" tone="muted">
            No email yet.
          </Text>
        )}
      </Card>
    );
  } else if (section === "clients") {
    body = (
      <div className="st-grid">
        <Card
          title="Clients"
          id="st-c"
          actions={
            <Button size="sm" onClick={() => setAdding("client")}>
              Add a client
            </Button>
          }
        >
          {data.clients.length ? (
            <ul className="hm-data-list st-list">
              {data.clients.map((c) => (
                <li className="hm-data-list-item" key={c.id}>
                  <strong>{c.name}</strong>
                  <span>{c.email}</span>
                </li>
              ))}
            </ul>
          ) : (
            <Text size="sm" tone="muted">
              No clients yet.
            </Text>
          )}
        </Card>
      </div>
    );
  } else if (section === "shoots") {
    body = (
      <div className="st-grid">
        <Card
          title="Jobs"
          id="st-s"
          actions={
            <Button size="sm" disabled={!data.clients.length} onClick={() => setAdding("job")}>
              Add a job
            </Button>
          }
        >
          {data.jobs.length ? (
            <ul className="hm-data-list st-list st-list--tall">
              {data.jobs.map((j) => (
                <li className="hm-data-list-item" key={j.id}>
                  <span>
                    <strong>{j.title}</strong>
                    <small>
                      {j.clientName} · {day(j.date)} · {usd(j.feeCents)}
                    </small>
                    <span className="st-steps">
                      <Status tone={statusTone(j.status)}>{j.status}</Status>
                      <Progress
                        size="sm"
                        aria-label={`Progress: ${j.status}`}
                        value={JOB_STEPS.indexOf(j.status as (typeof JOB_STEPS)[number]) + 1}
                        max={JOB_STEPS.length}
                      />
                      <small>
                        step {JOB_STEPS.indexOf(j.status as (typeof JOB_STEPS)[number]) + 1} of {JOB_STEPS.length}
                      </small>
                    </span>
                  </span>
                  <span className="hm-data-list-actions st-actions">
                    {j.status !== "paid" ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={pending}
                        onClick={() => run(() => advanceJobAction(j.id))}
                      >
                        Advance
                      </Button>
                    ) : null}
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={pending}
                      onClick={() => run(() => createContractAction(j.id))}
                    >
                      New contract
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={pending}
                      onClick={() =>
                        run(() =>
                          createInvoiceAction({
                            jobId: j.id,
                            description: "Photography services",
                            amountDollars: String(j.feeCents ? j.feeCents / 100 : 300),
                          }),
                        )
                      }
                    >
                      New invoice
                    </Button>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <Text size="sm" tone="muted">
              No jobs yet.
            </Text>
          )}
        </Card>
      </div>
    );
  } else if (section === "contracts") {
    body = (
      <Card title="Contracts" id="st-k">
        {data.contracts.length ? (
          <ul className="hm-data-list st-list st-list--tall">
            {data.contracts.map((k) => (
              <li className="hm-data-list-item" key={k.id}>
                <span>
                  <strong>{k.jobTitle}</strong>
                  <small>
                    {k.title} · <Status tone={statusTone(k.status)}>{k.status}</Status>
                    {k.signedBy ? ` · signed by ${k.signedBy}` : ""}
                  </small>
                </span>
                {k.status === "draft" || k.status === "sent" || k.status === "viewed" ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={pending}
                    onClick={() => run(() => sendContractAction(k.id))}
                  >
                    {k.status === "draft" ? "Send for signature" : "New signing link"}
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <Text size="sm" tone="muted">
            No contracts yet. Create one from a job.
          </Text>
        )}
      </Card>
    );
  } else if (section === "invoices") {
    body = (
      <Card title="Invoices" id="st-i">
        {data.invoices.length ? (
          <ul className="hm-data-list st-list st-list--tall">
            {data.invoices.map((i) => (
              <li className="hm-data-list-item" key={i.id} data-invoice-id={i.id}>
                <span>
                  <span className="st-title">
                    <strong>
                      {i.number} · {i.jobTitle}
                    </strong>
                    <Status tone={statusTone(i.status)}>{i.status}</Status>
                  </span>
                  <small>{i.lines}</small>
                </span>
                <strong className="st-amount">{usd(i.totalCents)}</strong>
                <span className="hm-data-list-actions st-actions">
                  {open(i.status) ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={pending}
                      onClick={() => run(() => sendInvoiceAction(i.id))}
                    >
                      {i.status === "draft" ? "Send" : "New payment link"}
                    </Button>
                  ) : null}
                  {open(i.status) ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={pending}
                      onClick={() => run(() => markInvoicePaidAction(i.id))}
                    >
                      Mark paid (cash, Zelle)
                    </Button>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <Text size="sm" tone="muted">
            No invoices yet. Create one from a job.
          </Text>
        )}
      </Card>
    );
  }

  return (
    <div className="st-wrap">
      <StudioHead section={section} />
      <Banner note={note} />
      {body}
      <FormDialog
        open={adding === "client"}
        onOpenChange={(o) => !o && setAdding((a) => (a === "client" ? null : a))}
        title="Add a client"
        submitLabel="Add client"
        pending={pending}
        onSubmit={() =>
          go(
            () => addClientAction({ name: form.cname ?? "", email: form.cemail ?? "" }),
            () => setForm({}),
          )
        }
      >
        <Field label="Name">
          <Input value={form.cname ?? ""} onChange={set("cname")} />
        </Field>
        <Field label="Email">
          <Input type="email" value={form.cemail ?? ""} onChange={set("cemail")} />
        </Field>
      </FormDialog>
      <FormDialog
        open={adding === "job"}
        onOpenChange={(o) => !o && setAdding((a) => (a === "job" ? null : a))}
        title="Add a job"
        submitLabel="Add job"
        pending={pending}
        onSubmit={() =>
          go(
            () =>
              addJobAction({
                clientId: form.client ?? data.clients[0]?.id ?? "",
                title: form.title ?? "",
                date: form.date,
                feeDollars: form.fee,
              }),
            () => setForm({}),
          )
        }
      >
        <Field label="Client">
          <Select
            value={form.client ?? data.clients[0]?.id ?? ""}
            onValueChange={(v) => set("client")({ target: { value: v } })}
          >
            {data.clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Title">
          <Input value={form.title ?? ""} onChange={set("title")} />
        </Field>
        <Field label="Date">
          <DateField value={form.date ?? ""} onChange={set("date")} />
        </Field>
        <Field label="Fee (dollars)">
          <Input inputMode="decimal" value={form.fee ?? ""} onChange={set("fee")} />
        </Field>
      </FormDialog>
    </div>
  );
}
