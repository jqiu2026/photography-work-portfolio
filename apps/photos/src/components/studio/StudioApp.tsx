"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import {
  addClientAction,
  addJobAction,
  advanceJobAction,
  convertBookingAction,
  createContractAction,
  createGalleryAction,
  createInvoiceAction,
  markInvoicePaidAction,
  publishGalleryAction,
  sendContractAction,
  sendInvoiceAction,
} from "@/app/studio/actions";
import "./studio.css";
import { studioSections } from "./sections";

const JOB_STEPS = ["inquiry", "booked", "shot", "editing", "delivered", "paid"] as const;
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

function Banner({ note }: { note: Result | null }) {
  if (!note) return null;
  return (
    <div className="st-card" role={note.ok ? "status" : "alert"} data-ok={note.ok || undefined}>
      <p className={note.ok ? "st-note" : "st-error"}>{note.ok ? note.message : note.error}</p>
      {note.link ? (
        <p className="st-note">
          Link (copy it to the client; nothing is emailed in this phase): <code>{note.link}</code>
        </p>
      ) : null}
    </div>
  );
}

function Card({ title, children, id }: { title: string; children: ReactNode; id: string }) {
  return (
    <section className="st-card" aria-labelledby={id}>
      <h2 id={id}>{title}</h2>
      {children}
    </section>
  );
}

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

  let body: ReactNode = null;
  if (section === "overview") {
    const unpaid = data.invoices.filter((i) => i.status !== "paid" && i.status !== "void");
    body = (
      <div className="st-grid">
        <Card title="Today" id="st-today">
          <dl className="st-stats">
            <div>
              <dt>New inquiries</dt>
              <dd>{data.bookings.filter((b) => b.status === "new").length}</dd>
            </div>
            <div>
              <dt>Open jobs</dt>
              <dd>{data.jobs.filter((j) => j.status !== "paid" && j.status !== "cancelled").length}</dd>
            </div>
            <div>
              <dt>Unpaid invoices</dt>
              <dd>{unpaid.length}</dd>
            </div>
            <div>
              <dt>Awaiting signature</dt>
              <dd>{data.contracts.filter((k) => k.status === "sent" || k.status === "viewed").length}</dd>
            </div>
          </dl>
        </Card>
        <Card title="Outstanding" id="st-out">
          {unpaid.length ? (
            <ul className="st-list">
              {unpaid.map((i) => (
                <li key={i.id}>
                  <span>
                    {i.number} · {i.jobTitle}
                  </span>
                  <strong>{usd(i.totalCents)}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p className="st-note">Nothing outstanding.</p>
          )}
        </Card>
      </div>
    );
  } else if (section === "bookings") {
    const sorted = [...data.bookings].sort((x, y) => y.score - x.score || y.createdAt.localeCompare(x.createdAt));
    body = (
      <Card title="Inquiries" id="st-b">
        <p className="st-note">
          Highest lead score first. The score is explained in docs/project/01-photo-site-spec.md.
        </p>
        {sorted.length ? (
          <ul className="st-list st-list--tall">
            {sorted.map((b) => (
              <li key={b.id} data-lead-id={b.id}>
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
                  <button
                    type="button"
                    className="st-btn"
                    disabled={pending}
                    onClick={() => run(() => convertBookingAction(b.id))}
                  >
                    Convert to client
                  </button>
                ) : (
                  <em>{b.status}</em>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="st-note">No inquiries yet.</p>
        )}
      </Card>
    );
  } else if (section === "inbox") {
    body = (
      <Card title="Inbox" id="st-in">
        <p className="st-note">
          Every email the platform sends. <strong>mock</strong> means the labelled development outbox recorded it and
          nothing was sent; <strong>skipped</strong> means no email provider is configured (TODO(owner): needs
          RESEND_API_KEY and EMAIL_FROM).
        </p>
        {data.emails.length ? (
          <ul className="st-list st-list--tall">
            {data.emails.map((m) => (
              <li key={m.id}>
                <details>
                  <summary>
                    <strong>{m.subject}</strong> · {m.to} · <em>{m.status}</em> · {m.kind}
                  </summary>
                  <pre className="st-pre">{m.text}</pre>
                  {m.error ? <p className="st-error">{m.error}</p> : null}
                  <small>
                    {m.provider} · {m.at.slice(0, 16).replace("T", " ")}
                  </small>
                </details>
              </li>
            ))}
          </ul>
        ) : (
          <p className="st-note">No email yet.</p>
        )}
      </Card>
    );
  } else if (section === "clients") {
    body = (
      <div className="st-grid">
        <Card title="Clients" id="st-c">
          {data.clients.length ? (
            <ul className="st-list">
              {data.clients.map((c) => (
                <li key={c.id}>
                  <strong>{c.name}</strong>
                  <span>{c.email}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="st-note">No clients yet.</p>
          )}
        </Card>
        <Card title="Add a client" id="st-ac">
          <form
            noValidate
            className="st-form"
            onSubmit={submit(
              () => addClientAction({ name: form.cname ?? "", email: form.cemail ?? "" }),
              () => setForm({}),
            )}
          >
            <label>
              Name
              <input value={form.cname ?? ""} onChange={set("cname")} />
            </label>
            <label>
              Email
              <input type="email" value={form.cemail ?? ""} onChange={set("cemail")} />
            </label>
            <button className="st-btn" type="submit" disabled={pending}>
              Add client
            </button>
          </form>
        </Card>
      </div>
    );
  } else if (section === "shoots") {
    body = (
      <div className="st-grid">
        <Card title="Jobs" id="st-s">
          {data.jobs.length ? (
            <ul className="st-list st-list--tall">
              {data.jobs.map((j) => (
                <li key={j.id}>
                  <span>
                    <strong>{j.title}</strong>
                    <small>
                      {j.clientName} · {day(j.date)} · {usd(j.feeCents)}
                    </small>
                    <ol className="st-steps" aria-label={`Progress: ${j.status}`}>
                      {JOB_STEPS.map((st) => (
                        <li
                          key={st}
                          data-done={
                            JOB_STEPS.indexOf(st) <= JOB_STEPS.indexOf(j.status as (typeof JOB_STEPS)[number]) ||
                            undefined
                          }
                          aria-current={st === j.status ? "step" : undefined}
                        >
                          {st}
                        </li>
                      ))}
                    </ol>
                  </span>
                  <span className="st-actions">
                    {j.status !== "paid" ? (
                      <button
                        type="button"
                        className="st-btn"
                        disabled={pending}
                        onClick={() => run(() => advanceJobAction(j.id))}
                      >
                        Advance
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="st-btn st-btn--ghost"
                      disabled={pending}
                      onClick={() => run(() => createContractAction(j.id))}
                    >
                      New contract
                    </button>
                    <button
                      type="button"
                      className="st-btn st-btn--ghost"
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
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="st-note">No jobs yet.</p>
          )}
        </Card>
        <Card title="New job" id="st-ns">
          <form
            className="st-form"
            onSubmit={submit(
              () =>
                addJobAction({
                  clientId: form.client ?? data.clients[0]?.id ?? "",
                  title: form.title ?? "",
                  date: form.date,
                  feeDollars: form.fee,
                }),
              () => setForm({}),
            )}
          >
            <label>
              Client
              <select value={form.client ?? data.clients[0]?.id ?? ""} onChange={set("client")}>
                {data.clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Title
              <input value={form.title ?? ""} onChange={set("title")} />
            </label>
            <label>
              Date
              <input type="date" value={form.date ?? ""} onChange={set("date")} />
            </label>
            <label>
              Fee (dollars)
              <input inputMode="decimal" value={form.fee ?? ""} onChange={set("fee")} />
            </label>
            <button className="st-btn" type="submit" disabled={pending || !data.clients.length}>
              Add job
            </button>
          </form>
        </Card>
      </div>
    );
  } else if (section === "galleries") {
    body = (
      <div className="st-grid">
        <Card title="Client galleries" id="st-g">
          {data.galleries.length ? (
            <ul className="st-list">
              {data.galleries.map((g) => (
                <li key={g.id}>
                  <span>
                    <strong>{g.title}</strong>
                    <small>
                      {g.jobTitle} · {g.items} photographs · {g.status}
                    </small>
                  </span>
                  <span className="st-actions">
                    <Link className="st-btn st-btn--ghost" href={`/studio/gallery/${g.id}`}>
                      Manage
                    </Link>
                    {g.status === "draft" ? (
                      <button
                        type="button"
                        className="st-btn"
                        disabled={pending}
                        onClick={() => run(() => publishGalleryAction(g.id))}
                      >
                        Publish
                      </button>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="st-note">No galleries yet.</p>
          )}
        </Card>
        <Card title="New gallery" id="st-ng">
          <form
            className="st-form"
            onSubmit={submit(
              () =>
                createGalleryAction({
                  jobId: form.job ?? data.jobs[0]?.id ?? "",
                  passcode: form.pass ?? "",
                  mediaIds: picked,
                }),
              () => {
                setForm({});
                setPicked([]);
              },
            )}
          >
            <label>
              Job
              <select value={form.job ?? data.jobs[0]?.id ?? ""} onChange={set("job")}>
                {data.jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Passcode (6+ characters)
              <input value={form.pass ?? ""} onChange={set("pass")} autoComplete="off" />
            </label>
            <fieldset className="st-pick">
              <legend>Photographs from the media library ({picked.length} chosen)</legend>
              {data.media.map((m) => (
                <label key={m.id} className="st-check">
                  <input
                    type="checkbox"
                    checked={picked.includes(m.id)}
                    onChange={(e) => setPicked((p) => (e.target.checked ? [...p, m.id] : p.filter((x) => x !== m.id)))}
                  />
                  {m.filename}
                </label>
              ))}
              {!data.media.length ? (
                <p className="st-note">Upload photographs in the admin media library first.</p>
              ) : null}
            </fieldset>
            <button className="st-btn" type="submit" disabled={pending || !data.jobs.length}>
              Create gallery
            </button>
          </form>
        </Card>
      </div>
    );
  } else if (section === "contracts") {
    body = (
      <Card title="Contracts" id="st-k">
        {data.contracts.length ? (
          <ul className="st-list st-list--tall">
            {data.contracts.map((k) => (
              <li key={k.id}>
                <span>
                  <strong>{k.jobTitle}</strong>
                  <small>
                    {k.title} · {k.status}
                    {k.signedBy ? ` · signed by ${k.signedBy}` : ""}
                  </small>
                </span>
                {k.status === "draft" || k.status === "sent" || k.status === "viewed" ? (
                  <button
                    type="button"
                    className="st-btn"
                    disabled={pending}
                    onClick={() => run(() => sendContractAction(k.id))}
                  >
                    {k.status === "draft" ? "Send for signature" : "New signing link"}
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="st-note">No contracts yet. Create one from a job.</p>
        )}
      </Card>
    );
  } else if (section === "invoices") {
    body = (
      <Card title="Invoices" id="st-i">
        {data.invoices.length ? (
          <ul className="st-list st-list--tall">
            {data.invoices.map((i) => (
              <li key={i.id} data-invoice-id={i.id}>
                <span>
                  <strong>
                    {i.number} · {i.jobTitle}
                  </strong>
                  <small>{i.lines}</small>
                  <small>{i.status}</small>
                </span>
                <span className="st-actions">
                  <strong>{usd(i.totalCents)}</strong>
                  {i.status !== "paid" && i.status !== "void" ? (
                    <button
                      type="button"
                      className="st-btn"
                      disabled={pending}
                      onClick={() => run(() => sendInvoiceAction(i.id))}
                    >
                      {i.status === "draft" ? "Send" : "New payment link"}
                    </button>
                  ) : null}
                  {i.status !== "paid" && i.status !== "void" ? (
                    <button
                      type="button"
                      className="st-btn st-btn--ghost"
                      disabled={pending}
                      onClick={() => run(() => markInvoicePaidAction(i.id))}
                    >
                      Mark paid (cash, Zelle)
                    </button>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="st-note">No invoices yet. Create one from a job.</p>
        )}
      </Card>
    );
  }

  return (
    <div className="st-wrap">
      <p className="hl-eyebrow">Studio · {user}</p>
      <nav className="st-nav" aria-label="Studio sections">
        {studioSections.map((x) => (
          <Link key={x.id} href={`/studio/${x.id}`} aria-current={x.id === section ? "page" : undefined}>
            {x.label}
          </Link>
        ))}
      </nav>
      <Banner note={note} />
      {body}
    </div>
  );
}
