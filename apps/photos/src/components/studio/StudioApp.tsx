"use client";

import {
  SHOOT_STEPS,
  invoiceTotal,
  usd,
  type Booking,
  type Client,
  type Contract,
  type Invoice,
  type Shoot,
} from "@jerryqiu/mocks";
import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import "./studio.css";
import { studioSections } from "./sections";
import { useStudio } from "./useStudio";

function useAction() {
  const [error, setError] = useState<string>();
  const run = (fn: () => void | Promise<void>) => async () => {
    setError(undefined);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    }
  };
  return { error, setError, run };
}

function Err({ error }: { error?: string }) {
  return error ? (
    <p role="alert" className="st-error">
      {error}
    </p>
  ) : null;
}

function Card({ title, children, id }: { title: string; children: ReactNode; id?: string }) {
  return (
    <section className="st-card" aria-labelledby={id}>
      <h2 id={id}>{title}</h2>
      {children}
    </section>
  );
}

export function StudioApp({ section, user }: { section: string; user: string }) {
  const s = useStudio();
  const { repo, data, bump } = s;
  const act = useAction();
  const [form, setForm] = useState<Record<string, string>>({});
  const set = (k: string) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const [links, setLinks] = useState<Record<string, string>>({});

  if (!data) return <p className="st-note">Loading the mock studio…</p>;
  const client = (id: string) => data.clients.find((c) => c.id === id);
  const shoot = (id: string) => data.shoots.find((x) => x.id === id);

  const submit = (fn: () => void) => async (e: FormEvent) => {
    e.preventDefault();
    await act.run(() => {
      fn();
      bump();
    })();
  };

  const nav = (
    <nav className="st-nav" aria-label="Studio sections">
      {studioSections.map((x) => (
        <Link key={x.id} href={`/studio/${x.id}`} aria-current={x.id === section ? "page" : undefined}>
          {x.label}
        </Link>
      ))}
      <Link href="/studio">ShootProof</Link>
    </nav>
  );

  let body: ReactNode = null;
  if (section === "overview") {
    const unpaid = data.invoices.filter((i) => i.status !== "paid");
    const upcoming = data.shoots.filter((x) => x.date >= new Date().toISOString().slice(0, 10) && x.step !== "paid");
    body = (
      <div className="st-grid">
        <Card title="Today" id="st-today">
          <dl className="st-stats">
            <div>
              <dt>New inquiries</dt>
              <dd>{data.bookings.filter((b) => b.status === "new").length}</dd>
            </div>
            <div>
              <dt>Upcoming shoots</dt>
              <dd>{upcoming.length}</dd>
            </div>
            <div>
              <dt>Unpaid invoices</dt>
              <dd>{unpaid.length}</dd>
            </div>
            <div>
              <dt>Contracts awaiting signature</dt>
              <dd>{data.contracts.filter((k) => k.status === "sent").length}</dd>
            </div>
          </dl>
        </Card>
        <Card title="Outstanding" id="st-out">
          {unpaid.length ? (
            <ul className="st-list">
              {unpaid.map((i) => (
                <li key={i.id}>
                  <span>{shoot(i.shootId)?.title}</span>
                  <strong>{usd(invoiceTotal(i))}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p className="st-note">Nothing outstanding.</p>
          )}
        </Card>
        <Card title="Reset" id="st-reset">
          <p className="st-note">All mock data lives in this browser only. Reset restores the sample records.</p>
          <button
            type="button"
            className="st-btn st-btn--ghost"
            onClick={() => {
              repo.reset();
              bump();
            }}
          >
            Reset sample data
          </button>
        </Card>
      </div>
    );
  } else if (section === "bookings") {
    body = (
      <Card title="Bookings" id="st-b">
        <ul className="st-list">
          {data.bookings.map((b: Booking) => (
            <li key={b.id}>
              <span>
                <strong>{b.name}</strong> · {b.topic}
                <small>{b.message}</small>
              </span>
              {b.status === "new" ? (
                <button
                  type="button"
                  className="st-btn"
                  onClick={act.run(() => {
                    repo.convertBooking(b.id);
                    bump();
                  })}
                >
                  Convert to client
                </button>
              ) : (
                <em>converted</em>
              )}
            </li>
          ))}
        </ul>
        <Err error={act.error} />
      </Card>
    );
  } else if (section === "clients") {
    body = (
      <div className="st-grid">
        <Card title="Clients" id="st-c">
          <ul className="st-list">
            {data.clients.map((c: Client) => (
              <li key={c.id}>
                <strong>{c.name}</strong>
                <span>{c.email}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Add a client" id="st-ac">
          <form
            onSubmit={submit(() => {
              repo.addClient(form.cname ?? "", form.cemail ?? "");
              setForm({});
            })}
            className="st-form"
          >
            <label>
              Name
              <input value={form.cname ?? ""} onChange={set("cname")} />
            </label>
            <label>
              Email
              <input type="email" value={form.cemail ?? ""} onChange={set("cemail")} />
            </label>
            <Err error={act.error} />
            <button className="st-btn" type="submit">
              Add client
            </button>
          </form>
        </Card>
      </div>
    );
  } else if (section === "shoots") {
    body = (
      <div className="st-grid">
        <Card title="Shoots" id="st-s">
          <ul className="st-list st-list--tall">
            {data.shoots.map((x: Shoot) => (
              <li key={x.id}>
                <span>
                  <strong>{x.title}</strong>
                  <small>
                    {client(x.clientId)?.name} · {x.date}
                  </small>
                  <ol className="st-steps" aria-label={`Progress: ${x.step}`}>
                    {SHOOT_STEPS.map((st) => (
                      <li
                        key={st}
                        data-done={SHOOT_STEPS.indexOf(st) <= SHOOT_STEPS.indexOf(x.step) || undefined}
                        aria-current={st === x.step ? "step" : undefined}
                      >
                        {st}
                      </li>
                    ))}
                  </ol>
                </span>
                <span className="st-actions">
                  {x.step !== "paid" ? (
                    <button
                      type="button"
                      className="st-btn"
                      onClick={act.run(() => {
                        repo.advanceShoot(x.id);
                        bump();
                      })}
                    >
                      Advance
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="st-btn st-btn--ghost"
                    onClick={act.run(() => {
                      repo.createContract(x.id);
                      bump();
                    })}
                  >
                    New contract
                  </button>
                  <button
                    type="button"
                    className="st-btn st-btn--ghost"
                    onClick={act.run(() => {
                      repo.createInvoice(x.id, [{ description: "SAMPLE: Event coverage", amountCents: 30000 }]);
                      bump();
                    })}
                  >
                    New invoice
                  </button>
                </span>
              </li>
            ))}
          </ul>
          <Err error={act.error} />
        </Card>
        <Card title="New shoot" id="st-ns">
          <form
            onSubmit={submit(() => {
              repo.addShoot(
                form.client ?? data.clients[0]?.id ?? "",
                form.title ?? "",
                form.date ?? new Date().toISOString().slice(0, 10),
              );
              setForm({});
            })}
            className="st-form"
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
            <Err error={act.error} />
            <button className="st-btn" type="submit">
              Add shoot
            </button>
          </form>
        </Card>
      </div>
    );
  } else if (section === "galleries") {
    body = (
      <div className="st-grid">
        <Card title="Client galleries" id="st-g">
          <ul className="st-list">
            {data.galleries.map((g) => (
              <li key={g.id}>
                <span>
                  <strong>{g.title}</strong>
                  <small>
                    Passcode <code>{g.passcode}</code> · {g.favourites.length} favourites
                  </small>
                </span>
                <Link href={`/client/g/${g.id}`} className="st-btn st-btn--ghost">
                  Open as client
                </Link>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="New gallery" id="st-ng">
          <form
            onSubmit={submit(() => {
              repo.createGallery(form.shoot ?? data.shoots[0]?.id ?? "", form.pass ?? "");
              setForm({});
            })}
            className="st-form"
          >
            <label>
              Shoot
              <select value={form.shoot ?? data.shoots[0]?.id ?? ""} onChange={set("shoot")}>
                {data.shoots.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Passcode (6+ characters)
              <input value={form.pass ?? ""} onChange={set("pass")} />
            </label>
            <Err error={act.error} />
            <button className="st-btn" type="submit">
              Create gallery
            </button>
          </form>
        </Card>
      </div>
    );
  } else if (section === "contracts") {
    body = (
      <Card title="Contracts" id="st-k">
        <ul className="st-list st-list--tall">
          {data.contracts.map((k: Contract) => (
            <li key={k.id}>
              <span>
                <strong>{shoot(k.shootId)?.title}</strong>
                <small>
                  {k.status}
                  {k.signedBy ? ` · signed by ${k.signedBy}` : ""}
                </small>
                {links[k.id] ? (
                  <small>
                    Signing link (mock, never emailed): <Link href={links[k.id]}>{links[k.id]}</Link>
                  </small>
                ) : null}
              </span>
              <span className="st-actions">
                {k.status === "draft" ? (
                  <button
                    type="button"
                    className="st-btn"
                    onClick={act.run(async () => {
                      const env = await s.esign.createEnvelope(k.id);
                      repo.updateContract(k.id, { status: "sent", envelopeId: env.id });
                      setLinks((l) => ({ ...l, [k.id]: env.url }));
                      bump();
                    })}
                  >
                    Send for signature
                  </button>
                ) : null}
                {k.status === "sent" && k.envelopeId ? (
                  <Link href={`/client/sign/${k.envelopeId}`} className="st-btn st-btn--ghost">
                    Open signing page
                  </Link>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
        <Err error={act.error} />
      </Card>
    );
  } else if (section === "invoices") {
    body = (
      <Card title="Invoices" id="st-i">
        <ul className="st-list st-list--tall">
          {data.invoices.map((i: Invoice) => (
            <li key={i.id}>
              <span>
                <strong>{shoot(i.shootId)?.title}</strong>
                <small>{i.lines.map((l) => l.description).join(" + ")}</small>
                <small>
                  {i.status}
                  {i.receiptId ? ` · receipt ${i.receiptId}` : ""}
                </small>
              </span>
              <span className="st-actions">
                <strong>{usd(invoiceTotal(i))}</strong>
                {i.status === "draft" ? (
                  <button
                    type="button"
                    className="st-btn"
                    onClick={act.run(() => {
                      repo.updateInvoice(i.id, { status: "sent" });
                      bump();
                    })}
                  >
                    Send
                  </button>
                ) : null}
                {i.status === "sent" ? (
                  <Link href={`/client/pay/${i.id}`} className="st-btn st-btn--ghost">
                    Open payment page
                  </Link>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
        <Err error={act.error} />
      </Card>
    );
  }

  return (
    <div className="st-wrap">
      <p className="hl-eyebrow">Studio · {user}</p>
      {nav}
      {body}
    </div>
  );
}
