"use client";

import { DateField } from "@/components/DateField";
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Field,
  Input,
  Progress,
  Select,
  Text,
  Textarea,
} from "@holominimal/ui";
import { useMemo, useState } from "react";
import { eraseClientAction, exportClientDataAction } from "@/app/studio/business-actions";
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
  updateClientAction,
  updateContractAction,
} from "@/app/studio/actions";
import { Card, FormDialog, Frame, statusTone, useAct, useConfirm, useNotify } from "./StudioFrame";
import "./records.css";

const usd = (c: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(c / 100);
const STEPS = ["inquiry", "booked", "shot", "editing", "delivered", "paid"] as const;

/** View, download and print links for a studio document (invoice, quote or contract). */
export function DocLinks({ kind, id, label }: { kind: "invoice" | "quote" | "contract"; id: string; label: string }) {
  const notify = useNotify();
  return (
    <span className="rc-doclinks">
      <Button asChild variant="secondary" size="sm">
        <a href={`/studio/view/${kind}/${id}`} aria-label={`View ${label}`}>
          View
        </a>
      </Button>
      <Button asChild variant="secondary" size="sm">
        <a
          href={`/studio/pdf/${kind}/${id}?download=1`}
          aria-label={`Download ${label} as PDF`}
          onClick={() => notify("Downloading the PDF", "info")}
        >
          Download
        </a>
      </Button>
      <Button asChild variant="secondary" size="sm">
        <a href={`/studio/view/${kind}/${id}?print=1`} target="_blank" rel="noreferrer" aria-label={`Print ${label}`}>
          Print
        </a>
      </Button>
    </span>
  );
}

/** Label and value rows the owner adds to a document (venue, headcount, ...). */
export function FieldsEditor({
  rows,
  onChange,
}: { rows: { label: string; value: string }[]; onChange: (r: { label: string; value: string }[]) => void }) {
  return (
    <div className="st-wide rc-fields">
      <span className="hm-field-label">Extra details (shown on the quote)</span>
      {rows.map((r, i) => (
        <div className="rc-lineedit" key={i}>
          <Input
            aria-label={`Detail ${i + 1} name`}
            placeholder="Name, e.g. Venue"
            value={r.label}
            onChange={(e) => onChange(rows.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
          />
          <Input
            aria-label={`Detail ${i + 1} value`}
            placeholder="Value"
            value={r.value}
            onChange={(e) => onChange(rows.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))}
          />
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange(rows.filter((_, j) => j !== i))}>
            Remove
          </Button>
        </div>
      ))}
      <div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => onChange([...rows, { label: "", value: "" }])}
        >
          Add a detail
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ clients */

export type ClientsData = {
  clients: {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    notes: string;
    jobs: number;
    since: string;
  }[];
};

export function ClientsView({ user, data }: { user: string; data: ClientsData }) {
  const { pending, note, go, act } = useAct();
  const notify = useNotify();
  const [q, setQ] = useState("");
  const [ask, confirmEl] = useConfirm();
  const [f, setF] = useState<Record<string, string> | null>(null);
  const set = (k: string) => (e: { target: { value: string } }) => setF((x) => ({ ...(x ?? {}), [k]: e.target.value }));
  const exportData = (c: { id: string; name: string }) =>
    act(async () => {
      const r = (await exportClientDataAction(c.id)) as { ok: boolean; json?: string };
      if (r.ok && r.json) {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([r.json], { type: "application/json" }));
        a.download = `client-${c.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
      }
      return r;
    });
  const shown = useMemo(() => {
    const n = q.trim().toLowerCase();
    return n
      ? data.clients.filter((c) => `${c.name} ${c.email} ${c.phone} ${c.address} ${c.notes}`.toLowerCase().includes(n))
      : data.clients;
  }, [q, data.clients]);
  return (
    <Frame section="clients" user={user} note={note}>
      {confirmEl}
      <Card
        title="Clients"
        id="st-c"
        actions={
          <Button size="sm" onClick={() => setF({})}>
            Add a client
          </Button>
        }
      >
        {data.clients.length > 6 ? (
          <Input
            aria-label="Search clients"
            placeholder="Search clients"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        ) : null}
        {shown.length ? (
          <ul className="rc-cards" aria-label="Clients">
            {shown.map((c) => (
              <li className="rc-card" key={c.id} data-client={c.email}>
                <div className="rc-card__head">
                  <strong>{c.name}</strong>
                  <Badge tone={c.jobs ? "accent" : "muted"}>
                    {c.jobs} shoot{c.jobs === 1 ? "" : "s"}
                  </Badge>
                </div>
                <a href={`mailto:${c.email}`}>{c.email}</a>
                {c.phone ? <a href={`tel:${c.phone}`}>{c.phone}</a> : null}
                {c.address ? <span className="rc-pre rc-muted">{c.address}</span> : null}
                {c.notes ? <span className="rc-note">{c.notes}</span> : null}
                <div className="rc-card__foot">
                  <small className="rc-muted">Client since {c.since}</small>
                  <Button
                    variant="secondary"
                    size="sm"
                    aria-label={`Edit ${c.name}`}
                    onClick={() => {
                      setF({
                        id: c.id,
                        name: c.name,
                        email: c.email,
                        phone: c.phone,
                        address: c.address,
                        notes: c.notes,
                      });
                      notify(`Loaded ${c.name}`);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Export data for ${c.name}`}
                    onClick={() => exportData(c)}
                  >
                    Export data
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Erase ${c.name}`}
                    onClick={async () =>
                      (await ask({
                        title: `Erase ${c.name}?`,
                        body: "Their contact details, messages and portal account are removed. Invoices, payments and contracts stay, without a name, because they must be kept for tax.",
                        action: "Erase",
                      })) && act(() => eraseClientAction(c.id))
                    }
                  >
                    Erase
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <Text size="sm" tone="muted">
            {data.clients.length ? "No client matches." : "No clients yet."}
          </Text>
        )}
      </Card>
      <FormDialog
        open={f !== null}
        onOpenChange={(o) => !o && setF(null)}
        title={f?.id ? "Edit client" : "Add a client"}
        size="lg"
        submitLabel={f?.id ? "Save client" : "Add client"}
        pending={pending}
        onSubmit={() =>
          f &&
          go(() =>
            f.id
              ? updateClientAction({
                  clientId: f.id,
                  name: f.name ?? "",
                  email: f.email ?? "",
                  phone: f.phone,
                  address: f.address,
                  notes: f.notes,
                })
              : addClientAction({
                  name: f.name ?? "",
                  email: f.email ?? "",
                  phone: f.phone,
                  address: f.address,
                  notes: f.notes,
                }),
          )
        }
      >
        <Field label="Name">
          <Input value={f?.name ?? ""} onChange={set("name")} autoComplete="off" />
        </Field>
        <Field label="Email">
          <Input type="email" value={f?.email ?? ""} onChange={set("email")} autoComplete="off" />
        </Field>
        <Field label="Phone">
          <Input type="tel" value={f?.phone ?? ""} onChange={set("phone")} autoComplete="off" />
        </Field>
        <Field label="Address">
          <Textarea rows={2} value={f?.address ?? ""} onChange={set("address")} />
        </Field>
        <Field label="Notes (private)" hint="Preferences, how you met, anything to remember. Clients never see this.">
          <Textarea rows={3} value={f?.notes ?? ""} onChange={set("notes")} />
        </Field>
      </FormDialog>
    </Frame>
  );
}

/* ------------------------------------------------------------------- shoots */

export type ShootsData = {
  clients: { id: string; name: string }[];
  jobs: {
    id: string;
    title: string;
    client: string;
    clientId: string;
    status: string;
    date: string;
    feeCents: number;
  }[];
};

export function ShootsView({ user, data }: { user: string; data: ShootsData }) {
  const { pending, note, act, go } = useAct();
  const [dlg, setDlg] = useState<"job" | "invoice" | null>(null);
  const [f, setF] = useState<Record<string, string>>({});
  const [more, setMore] = useState<{ description: string; amountDollars: string }[]>([]);
  const set = (k: string) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  const open = data.jobs.filter((j) => j.status !== "paid");
  const done = data.jobs.filter((j) => j.status === "paid");
  const card = (j: ShootsData["jobs"][number]) => {
    const step = STEPS.indexOf(j.status as (typeof STEPS)[number]);
    return (
      <li className="rc-card" key={j.id} data-job-id={j.id}>
        <div className="rc-card__head">
          <strong>{j.title}</strong>
          <Badge tone={statusTone(j.status)}>{j.status}</Badge>
        </div>
        <span className="rc-muted">
          {j.client}
          {j.date ? ` · ${j.date}` : " · no date yet"}
          {j.feeCents ? ` · ${usd(j.feeCents)}` : ""}
        </span>
        <Progress size="sm" value={step + 1} max={STEPS.length} aria-label={`Progress: ${j.status}`} />
        <div className="rc-card__foot">
          <small className="rc-muted">
            Step {step + 1} of {STEPS.length}
          </small>
          <span className="rc-actions">
            {j.status !== "paid" ? (
              <Button
                variant="secondary"
                size="sm"
                disabled={pending}
                aria-label={`Advance ${j.title}`}
                onClick={() => act(() => advanceJobAction(j.id))}
              >
                Next step
              </Button>
            ) : null}
            <DropdownMenu align="end">
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" aria-label={`More for ${j.title}`}>
                  More
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onSelect={() => act(() => createContractAction(j.id))}>New contract</DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    setF({
                      job: j.id,
                      desc: "Photography services",
                      amount: j.feeCents ? String(j.feeCents / 100) : "",
                    });
                    setMore([]);
                    setDlg("invoice");
                  }}
                >
                  New invoice
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </span>
        </div>
      </li>
    );
  };
  return (
    <Frame section="shoots" user={user} note={note}>
      <Card
        title="Shoots"
        id="st-s"
        actions={
          <Button
            size="sm"
            disabled={!data.clients.length}
            onClick={() => {
              setF({ client: data.clients[0]?.id ?? "" });
              setDlg("job");
            }}
          >
            Add a shoot
          </Button>
        }
      >
        <Text size="sm" tone="muted">
          A shoot is one job for one client. Move it along as it happens; the Board tab shows the same shoots by stage.
        </Text>
        {open.length ? (
          <ul className="rc-cards" aria-label="Open shoots">
            {open.map(card)}
          </ul>
        ) : (
          <Text size="sm" tone="muted">
            No open shoots.
          </Text>
        )}
        {done.length ? (
          <>
            <h3>Finished and paid</h3>
            <ul className="rc-cards" aria-label="Paid shoots">
              {done.map(card)}
            </ul>
          </>
        ) : null}
      </Card>
      <FormDialog
        open={dlg === "job"}
        onOpenChange={(o) => !o && setDlg((d) => (d === "job" ? null : d))}
        title="Add a shoot"
        submitLabel="Add shoot"
        pending={pending}
        onSubmit={() =>
          go(() =>
            addJobAction({
              clientId: f.client ?? "",
              title: f.title ?? "",
              date: f.date,
              feeDollars: f.fee,
              location: f.place,
            }),
          )
        }
      >
        <Field label="Client">
          <Select value={f.client ?? ""} onValueChange={(v) => set("client")({ target: { value: v } })}>
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
        <Field label="Date">
          <DateField value={f.date ?? ""} onChange={set("date")} />
        </Field>
        <Field label="Where">
          <Input value={f.place ?? ""} onChange={set("place")} />
        </Field>
        <Field label="Fee (dollars)">
          <Input inputMode="decimal" value={f.fee ?? ""} onChange={set("fee")} />
        </Field>
      </FormDialog>
      <InvoiceDialog
        open={dlg === "invoice"}
        onClose={() => setDlg((d) => (d === "invoice" ? null : d))}
        f={f}
        set={set}
        more={more}
        setMore={setMore}
        jobs={data.jobs.map((j) => ({ id: j.id, title: `${j.title} (${j.client})` }))}
        pending={pending}
        go={go}
      />
    </Frame>
  );
}

/* ----------------------------------------------------------------- invoices */

function InvoiceDialog({
  open,
  onClose,
  f,
  set,
  more,
  setMore,
  jobs,
  pending,
  go,
}: {
  open: boolean;
  onClose: () => void;
  f: Record<string, string>;
  set: (k: string) => (e: { target: { value: string } }) => void;
  more: { description: string; amountDollars: string }[];
  setMore: (m: { description: string; amountDollars: string }[]) => void;
  jobs: { id: string; title: string }[];
  pending: boolean;
  go: (fn: () => Promise<unknown>) => Promise<boolean>;
}) {
  return (
    <FormDialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title="New invoice"
      description="It starts as a draft. Send it to give the client a payment link."
      size="lg"
      submitLabel="Create invoice"
      pending={pending}
      onSubmit={() =>
        go(() =>
          createInvoiceAction({
            jobId: f.job ?? "",
            description: f.desc ?? "",
            amountDollars: f.amount ?? "",
            more,
            dueDate: f.due,
          }),
        )
      }
    >
      <Field label="Shoot">
        <Select value={f.job ?? ""} onValueChange={(v) => set("job")({ target: { value: v } })}>
          <option value="">Choose a shoot</option>
          {jobs.map((j) => (
            <option key={j.id} value={j.id}>
              {j.title}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Due date (optional)">
        <DateField value={f.due ?? ""} onChange={set("due")} />
      </Field>
      <Field label="First item">
        <Input value={f.desc ?? ""} onChange={set("desc")} />
      </Field>
      <Field label="Amount (dollars)">
        <Input inputMode="decimal" value={f.amount ?? ""} onChange={set("amount")} />
      </Field>
      {more.map((m, i) => (
        <div className="rc-lineedit st-wide" key={i}>
          <Input
            aria-label={`Item ${i + 2}`}
            placeholder="Another item"
            value={m.description}
            onChange={(e) => setMore(more.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))}
          />
          <Input
            aria-label={`Amount of item ${i + 2}`}
            inputMode="decimal"
            placeholder="0.00"
            value={m.amountDollars}
            onChange={(e) => setMore(more.map((x, j) => (j === i ? { ...x, amountDollars: e.target.value } : x)))}
          />
          <Button type="button" variant="ghost" size="sm" onClick={() => setMore(more.filter((_, j) => j !== i))}>
            Remove
          </Button>
        </div>
      ))}
      <div className="st-wide">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setMore([...more, { description: "", amountDollars: "" }])}
        >
          Add another item
        </Button>
      </div>
    </FormDialog>
  );
}

export type InvoicesData = {
  invoices: {
    id: string;
    number: string;
    jobId: string;
    jobTitle: string;
    status: string;
    totalCents: number;
    lines: string;
  }[];
  jobs: { id: string; title: string }[];
};

export function InvoicesView({ user, data }: { user: string; data: InvoicesData }) {
  const { pending, note, act, go } = useAct();
  const [dlg, setDlg] = useState(false);
  const [f, setF] = useState<Record<string, string>>({});
  const [more, setMore] = useState<{ description: string; amountDollars: string }[]>([]);
  const set = (k: string) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  const isOpen = (s: string) => s !== "paid" && s !== "void";
  const owed = data.invoices.filter((i) => isOpen(i.status)).reduce((n, i) => n + i.totalCents, 0);
  return (
    <Frame section="invoices" user={user} note={note}>
      <Card
        title="Invoices"
        id="st-i"
        actions={
          <Button
            size="sm"
            disabled={!data.jobs.length}
            onClick={() => {
              setF({ desc: "Photography services" });
              setMore([]);
              setDlg(true);
            }}
          >
            New invoice
          </Button>
        }
      >
        <Text size="sm" tone="muted">
          An invoice belongs to a shoot. Create it as a draft, send it to give the client a payment link, and it turns
          paid when they pay (or when you mark a cash or Zelle payment).{" "}
          {owed ? `${usd(owed)} is waiting to be paid.` : ""}
        </Text>
        {data.invoices.length ? (
          <ul className="rc-cards rc-cards--wide" aria-label="Invoices">
            {data.invoices.map((i) => (
              <li className="rc-card" key={i.id} data-invoice-id={i.id}>
                <div className="rc-card__head">
                  <strong>{i.number}</strong>
                  <Badge tone={statusTone(i.status)}>{i.status}</Badge>
                </div>
                <span className="rc-muted">{i.jobTitle}</span>
                <span className="rc-muted">{i.lines}</span>
                <strong className="rc-amount">{usd(i.totalCents)}</strong>
                <div className="rc-card__foot">
                  <DocLinks kind="invoice" id={i.id} label={`invoice ${i.number}`} />
                  <span className="rc-actions">
                    {isOpen(i.status) ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={pending}
                        onClick={() => act(() => sendInvoiceAction(i.id))}
                      >
                        {i.status === "draft" ? "Send" : "New payment link"}
                      </Button>
                    ) : null}
                    {isOpen(i.status) ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={pending}
                        onClick={() => act(() => markInvoicePaidAction(i.id))}
                      >
                        Mark paid (cash, Zelle)
                      </Button>
                    ) : null}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <Text size="sm" tone="muted">
            No invoices yet. Use New invoice.
          </Text>
        )}
      </Card>
      <InvoiceDialog
        open={dlg}
        onClose={() => setDlg(false)}
        f={f}
        set={set}
        more={more}
        setMore={setMore}
        jobs={data.jobs}
        pending={pending}
        go={go}
      />
    </Frame>
  );
}

/* --------------------------------------------------------------- contracts */

export type ContractsData = {
  contracts: {
    id: string;
    jobTitle: string;
    title: string;
    kind: string;
    status: string;
    signedBy: string | null;
    body: string;
  }[];
  jobs: { id: string; title: string }[];
  templates: { id: string; name: string; kind: string }[];
};

export function ContractsView({ user, data }: { user: string; data: ContractsData }) {
  const { pending, note, act, go } = useAct();
  const notify = useNotify();
  const [edit, setEdit] = useState<{ id: string; title: string; body: string } | null>(null);
  const [mk, setMk] = useState<Record<string, string> | null>(null);
  const editable = (s: string) => s !== "signed";
  return (
    <Frame section="contracts" user={user} note={note}>
      <Card
        title="Contracts"
        id="st-k"
        actions={
          <Button size="sm" disabled={!data.jobs.length} onClick={() => setMk({ tpl: data.templates[0]?.id ?? "" })}>
            New contract
          </Button>
        }
      >
        <Text size="sm" tone="muted">
          A contract is written from a template (edit templates under Studio, Forms) for one shoot. Edit the wording
          while it is a draft, send it for the client to sign by link, and it is locked once signed.
        </Text>
        {data.contracts.length ? (
          <ul className="rc-cards rc-cards--wide" aria-label="Contracts">
            {data.contracts.map((k) => (
              <li className="rc-card" key={k.id}>
                <div className="rc-card__head">
                  <strong>{k.title}</strong>
                  <Badge tone={statusTone(k.status)}>{k.status}</Badge>
                </div>
                <span className="rc-muted">
                  {k.jobTitle} · {k.kind}
                  {k.signedBy ? ` · signed by ${k.signedBy}` : ""}
                </span>
                <div className="rc-card__foot">
                  <DocLinks kind="contract" id={k.id} label={k.title} />
                  <span className="rc-actions">
                    {editable(k.status) ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setEdit({ id: k.id, title: k.title, body: k.body });
                          notify(`Loaded ${k.title}`);
                        }}
                      >
                        Edit
                      </Button>
                    ) : null}
                    {k.status === "draft" || k.status === "sent" || k.status === "viewed" ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={pending}
                        onClick={() => act(() => sendContractAction(k.id))}
                      >
                        {k.status === "draft" ? "Send for signature" : "New signing link"}
                      </Button>
                    ) : null}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <Text size="sm" tone="muted">
            No contracts yet. Use New contract.
          </Text>
        )}
      </Card>
      <FormDialog
        open={edit !== null}
        onOpenChange={(o) => !o && setEdit(null)}
        title="Edit contract"
        size="lg"
        pending={pending}
        onSubmit={() =>
          edit && go(() => updateContractAction({ contractId: edit.id, title: edit.title, body: edit.body }))
        }
      >
        <Field label="Title">
          <Input value={edit?.title ?? ""} onChange={(e) => edit && setEdit({ ...edit, title: e.target.value })} />
        </Field>
        <Field label="Wording">
          <Textarea
            rows={16}
            value={edit?.body ?? ""}
            onChange={(e) => edit && setEdit({ ...edit, body: e.target.value })}
          />
        </Field>
      </FormDialog>
      <FormDialog
        open={mk !== null}
        onOpenChange={(o) => !o && setMk(null)}
        title="New contract"
        description="It is filled in from the shoot and your policies, as a draft you can edit."
        submitLabel="Create contract"
        pending={pending}
        onSubmit={() => mk && go(() => createContractAction(mk.job ?? "", mk.tpl))}
      >
        <Field label="Shoot">
          <Select value={mk?.job ?? ""} onValueChange={(v) => mk && setMk({ ...mk, job: v })}>
            <option value="">Choose a shoot</option>
            {data.jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Template">
          <Select value={mk?.tpl ?? ""} onValueChange={(v) => mk && setMk({ ...mk, tpl: v })}>
            {data.templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </Field>
      </FormDialog>
    </Frame>
  );
}

/* -------------------------------------------------------------- inquiries */

export type InquiriesData = {
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
};

const scoreTone = (n: number) => (n >= 70 ? "success" : n >= 40 ? "warning" : "muted");

export function InquiriesView({ user, data }: { user: string; data: InquiriesData }) {
  const { pending, note, act } = useAct();
  const [show, setShow] = useState<"new" | "all">("new");
  const sorted = [...data.bookings]
    .filter((b) => show === "all" || b.status === "new")
    .sort((x, y) => y.score - x.score || y.createdAt.localeCompare(x.createdAt));
  const fresh = data.bookings.filter((b) => b.status === "new").length;
  return (
    <Frame section="bookings" user={user} note={note}>
      <Card
        title="Inquiries"
        id="st-b"
        actions={
          <>
            <Button
              size="sm"
              variant={show === "new" ? "primary" : "secondary"}
              aria-pressed={show === "new"}
              onClick={() => setShow("new")}
            >
              New ({fresh})
            </Button>
            <Button
              size="sm"
              variant={show === "all" ? "primary" : "secondary"}
              aria-pressed={show === "all"}
              onClick={() => setShow("all")}
            >
              All ({data.bookings.length})
            </Button>
          </>
        }
      >
        <Text size="sm" tone="muted">
          Best leads first. The score rises with a date, a budget, a place and a phone number: green is a strong lead.
        </Text>
        {sorted.length ? (
          <ul className="rc-cards rc-cards--wide" aria-label="Inquiries">
            {sorted.map((b) => (
              <li className="rc-card" key={b.id} data-lead-id={b.id} data-tone={scoreTone(b.score)}>
                <div className="rc-card__head">
                  <strong>{b.name}</strong>
                  <span className="rc-badges">
                    <Badge tone="accent">{b.shootType ?? b.topic}</Badge>
                    <Badge tone={scoreTone(b.score)}>score {b.score}</Badge>
                  </span>
                </div>
                <span className="rc-chips">
                  {[
                    b.eventDate,
                    b.location,
                    b.budget,
                    b.guests ? `${b.guests} guests` : "",
                    b.source && `via ${b.source}`,
                  ]
                    .filter(Boolean)
                    .map((c) => (
                      <span className="rc-chip" key={String(c)}>
                        {c}
                      </span>
                    ))}
                </span>
                <span className="rc-links">
                  <a href={`mailto:${b.email}`}>{b.email}</a>
                  {b.phone ? <a href={`tel:${b.phone}`}>{b.phone}</a> : null}
                </span>
                {b.message ? <p className="rc-quote">{b.message}</p> : null}
                {Object.entries(b.details).length ? (
                  <dl className="rc-details">
                    {Object.entries(b.details).map(([k, v]) => (
                      <div key={k}>
                        <dt>{k}</dt>
                        <dd>{v}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
                <div className="rc-card__foot">
                  <small className="rc-muted">{b.createdAt.slice(0, 10)}</small>
                  {b.status === "new" ? (
                    <Button size="sm" disabled={pending} onClick={() => act(() => convertBookingAction(b.id))}>
                      Convert to client
                    </Button>
                  ) : (
                    <Badge tone={statusTone(b.status)}>{b.status}</Badge>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <Text size="sm" tone="muted">
            {show === "new" ? "No new inquiries." : "No inquiries yet."}
          </Text>
        )}
      </Card>
    </Frame>
  );
}

/* ---------------------------------------------------------------- email log */

export type EmailLogData = {
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
};

export function EmailLogView({ user, data }: { user: string; data: EmailLogData }) {
  const { note } = useAct();
  const [pick, setPick] = useState<EmailLogData["emails"][number] | null>(null);
  const [only, setOnly] = useState("all");
  const kinds = [...new Set(data.emails.map((m) => m.status))];
  const shown = data.emails.filter((m) => only === "all" || m.status === only);
  return (
    <Frame section="inbox" user={user} note={note}>
      <Card
        title="Email log"
        id="st-in"
        actions={
          <Select aria-label="Show emails" value={only} onValueChange={setOnly}>
            <option value="all">All emails</option>
            {kinds.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </Select>
        }
      >
        <Text size="sm" tone="muted">
          Every email the studio sent. <Badge tone="muted">mock</Badge> means the development outbox recorded it and
          nothing was sent; <Badge tone="warning">skipped</Badge> means no email provider is set up yet (TODO(owner):
          RESEND_API_KEY and EMAIL_FROM).
        </Text>
        {shown.length ? (
          <ul className="rc-rows" aria-label="Emails">
            {shown.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  className="rc-row"
                  onClick={() => setPick(m)}
                  aria-label={`Open email: ${m.subject}`}
                >
                  <span className="rc-row__main">
                    <strong>{m.subject}</strong>
                    <small>to {m.to}</small>
                  </span>
                  <Badge tone="accent">{m.kind}</Badge>
                  <Badge tone={statusTone(m.status)}>{m.status}</Badge>
                  <small className="rc-muted">{m.at.slice(0, 16).replace("T", " ")}</small>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <Text size="sm" tone="muted">
            No emails yet.
          </Text>
        )}
      </Card>
      <FormDialog
        open={pick !== null}
        onOpenChange={(o) => !o && setPick(null)}
        title={pick?.subject ?? "Email"}
        description={pick ? `To ${pick.to} · ${pick.at.slice(0, 16).replace("T", " ")} · ${pick.provider}` : undefined}
        size="lg"
        submitLabel="Close"
        onSubmit={() => true}
      >
        {pick?.error ? <p className="rc-err">{pick.error}</p> : null}
        <pre className="st-pre">{pick?.text}</pre>
      </FormDialog>
    </Frame>
  );
}
