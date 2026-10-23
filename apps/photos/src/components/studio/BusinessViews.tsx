"use client";

import { DateField } from "@/components/DateField";
import { Badge, Button, Checkbox, DownloadIcon, Field, Input, Select, Text, Textarea } from "@holominimal/ui";
import { useState } from "react";
import {
  addExpenseAction,
  addGearAction,
  addTestimonialAction,
  deleteSubscriberAction,
  reopenPrivacyAction,
  resolvePrivacyAction,
  assignGearAction,
  consentAction,
  deleteExpenseAction,
  deleteTestimonialAction,
  publishTestimonialAction,
  retireGearAction,
  saveCallSheetAction,
  unassignGearAction,
  withdrawConsentAction,
} from "@/app/studio/business-actions";
import { Card, Frame, useAct, useConfirm } from "./StudioFrame";

const money = (c: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(c / 100);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/* ---------------------------------------------------------------- expenses and mileage */

export type ExpensesData = {
  year: number;
  csv: string;
  totalCents: number;
  miles: number;
  byCategory: { category: string; cents: number }[];
  categories: string[];
  jobs: { id: string; title: string }[];
  mileageRate: number;
  rows: {
    id: string;
    spentOn: string;
    kind: string;
    category: string;
    description: string;
    vendor: string | null;
    amountCents: number;
    miles: number | null;
    jobTitle: string | null;
  }[];
};

export function ExpensesView({ user, data }: { user: string; data: ExpensesData }) {
  const { pending, note, act, submit } = useAct();
  const [ask, confirmEl] = useConfirm();
  const [kind, setKind] = useState<"expense" | "mileage">("expense");
  const [f, setF] = useState<Record<string, string>>({ category: "gear", rate: (data.mileageRate / 100).toFixed(2) });
  const set = (k: string) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  const download = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([data.csv], { type: "text/csv" }));
    a.download = `expenses-${data.year}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <Frame section="expenses" user={user} note={note}>
      {confirmEl}
      <div className="st-grid">
        <Card title={`${data.year} so far`} id="x-sum">
          <p className="st-big" data-testid="expense-total">
            {money(data.totalCents)}
          </p>
          <Text size="sm" tone="muted">
            {data.miles.toFixed(1)} miles driven. Mileage entries use the rate on the day they were added, so a later
            rate change never rewrites an old trip.
          </Text>
          <ul className="hm-data-list st-list">
            {data.byCategory.map((c) => (
              <li className="hm-data-list-item" key={c.category}>
                <span>{cap(c.category)}</span>
                <b>{money(c.cents)}</b>
              </li>
            ))}
          </ul>
          <Button variant="secondary" onClick={download} disabled={!data.rows.length}>
            <DownloadIcon /> Download CSV for {data.year}
          </Button>
        </Card>
        <Card title="Add an entry" id="x-add">
          <form
            noValidate
            className="st-form"
            aria-label="New expense"
            onSubmit={submit(
              () =>
                addExpenseAction({
                  kind,
                  spentOn: f.date ?? "",
                  category: f.category,
                  description: f.desc,
                  vendor: f.vendor,
                  amount: f.amount,
                  miles: f.miles,
                  rate: f.rate,
                  jobId: f.job,
                  receiptNote: f.receipt,
                }),
              () => setF({ category: f.category ?? "gear", rate: f.rate ?? "" }),
            )}
          >
            <Field label="Type">
              <Select value={kind} onValueChange={(v) => setKind(v as "expense" | "mileage")}>
                <option value="expense">Expense</option>
                <option value="mileage">Mileage</option>
              </Select>
            </Field>
            <Field label="Date">
              <DateField value={f.date ?? ""} onChange={set("date")} />
            </Field>
            {kind === "expense" ? (
              <>
                <Field label="Category">
                  <Select value={f.category} onValueChange={(v) => setF({ ...f, category: v })}>
                    {data.categories.map((c) => (
                      <option key={c} value={c}>
                        {cap(c)}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Amount (USD)">
                  <Input inputMode="decimal" value={f.amount ?? ""} onChange={set("amount")} />
                </Field>
                <Field label="Vendor">
                  <Input value={f.vendor ?? ""} onChange={set("vendor")} />
                </Field>
              </>
            ) : (
              <>
                <Field label="Miles">
                  <Input inputMode="decimal" value={f.miles ?? ""} onChange={set("miles")} />
                </Field>
                <Field
                  label="Rate (dollars per mile)"
                  hint="TODO(owner): set the current IRS standard rate with your accountant."
                >
                  <Input inputMode="decimal" value={f.rate ?? ""} onChange={set("rate")} />
                </Field>
              </>
            )}
            <Field label="What for">
              <Input value={f.desc ?? ""} onChange={set("desc")} />
            </Field>
            <Field label="Job (optional)">
              <Select value={f.job ?? ""} onValueChange={(v) => setF({ ...f, job: v })}>
                <option value="">No job</option>
                {data.jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title}
                  </option>
                ))}
              </Select>
            </Field>
            {kind === "expense" ? (
              <Field
                label="Where the receipt is"
                hint="Receipt uploads switch on with file storage. Until then, note where it is kept."
              >
                <Input value={f.receipt ?? ""} onChange={set("receipt")} />
              </Field>
            ) : null}
            <Button type="submit" disabled={pending}>
              {kind === "mileage" ? "Add trip" : "Add expense"}
            </Button>
          </form>
        </Card>
      </div>
      <Card title="Entries" id="x-list">
        {data.rows.length ? (
          <ul className="hm-data-list st-list st-list--tall">
            {data.rows.map((r) => (
              <li className="hm-data-list-item" key={r.id}>
                <span>
                  {r.description || cap(r.category)}
                  <small>
                    {r.spentOn} · {r.kind === "mileage" ? `${r.miles?.toFixed(1)} mi` : cap(r.category)}
                    {r.vendor ? ` · ${r.vendor}` : ""}
                    {r.jobTitle ? ` · ${r.jobTitle}` : ""}
                  </small>
                </span>
                <b>{money(r.amountCents)}</b>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  aria-label={`Delete ${r.description || r.category} of ${r.spentOn}`}
                  onClick={async () =>
                    (await ask({ title: "Delete this entry?", body: "It also leaves the CSV.", action: "Delete" })) &&
                    act(() => deleteExpenseAction(r.id))
                  }
                >
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <Text size="sm" tone="muted">
            Nothing logged yet.
          </Text>
        )}
      </Card>
    </Frame>
  );
}

/* ---------------------------------------------------------------- testimonials */

export type TestimonialsData = {
  items: {
    id: string;
    displayName: string;
    role: string | null;
    quote: string;
    consentAt: string | null;
    consentNote: string | null;
    published: boolean;
  }[];
};

export function TestimonialsView({ user, data }: { user: string; data: TestimonialsData }) {
  const { pending, note, act, submit } = useAct();
  const [ask, confirmEl] = useConfirm();
  const [f, setF] = useState<Record<string, string>>({});
  const set = (k: string) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  const [consent, setConsent] = useState<Record<string, string>>({});
  return (
    <Frame section="testimonials" user={user} note={note}>
      {confirmEl}
      <div className="st-grid">
        <Card title="Testimonials" id="tm-list">
          {data.items.length ? (
            <ul className="hm-data-list st-list st-list--tall">
              {data.items.map((t) => (
                <li className="hm-data-list-item st-stack" key={t.id} data-testimonial-id={t.id}>
                  <blockquote className="st-quote">“{t.quote}”</blockquote>
                  <p>
                    <b>{t.displayName}</b>
                    {t.role ? `, ${t.role}` : ""}{" "}
                    <Badge tone={t.published ? "success" : t.consentAt ? "info" : "warning"}>
                      {t.published ? "Public" : t.consentAt ? "Agreed, not public" : "No consent yet"}
                    </Badge>
                  </p>
                  {t.consentAt ? (
                    <small>
                      Agreed {t.consentAt.slice(0, 10)}: {t.consentNote}
                    </small>
                  ) : (
                    <form
                      noValidate
                      className="st-inline"
                      aria-label={`Record consent from ${t.displayName}`}
                      onSubmit={submit(() => consentAction({ testimonialId: t.id, note: consent[t.id] ?? "" }))}
                    >
                      <Input
                        aria-label={`How ${t.displayName} agreed`}
                        placeholder="How they agreed, e.g. email of 3 March"
                        value={consent[t.id] ?? ""}
                        onChange={(e) => setConsent({ ...consent, [t.id]: e.target.value })}
                      />
                      <Button type="submit" variant="secondary" size="sm" disabled={pending}>
                        Record consent
                      </Button>
                    </form>
                  )}
                  <div className="st-actions">
                    {t.consentAt ? (
                      <Button
                        size="sm"
                        variant={t.published ? "secondary" : "primary"}
                        disabled={pending}
                        onClick={() => act(() => publishTestimonialAction({ testimonialId: t.id, on: !t.published }))}
                      >
                        {t.published ? "Take down" : "Publish"}
                      </Button>
                    ) : null}
                    {t.consentAt ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={pending}
                        onClick={async () =>
                          (await ask({
                            title: "Withdraw consent?",
                            body: "The testimonial comes down from the site and stays here without consent.",
                            action: "Withdraw",
                          })) && act(() => withdrawConsentAction(t.id))
                        }
                      >
                        They withdrew consent
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={pending}
                      onClick={async () =>
                        (await ask({ title: "Delete this testimonial?", action: "Delete" })) &&
                        act(() => deleteTestimonialAction(t.id))
                      }
                    >
                      Delete
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <Text size="sm" tone="muted">
              No testimonials yet. Add one a client sent you, with their permission.
            </Text>
          )}
        </Card>
        <Card title="Add one" id="tm-add">
          <form
            noValidate
            className="st-form"
            aria-label="New testimonial"
            onSubmit={submit(
              () =>
                addTestimonialAction({
                  displayName: f.name ?? "",
                  quote: f.quote ?? "",
                  role: f.role,
                  consentNote: f.consent,
                }),
              () => setF({}),
            )}
          >
            <Field label="Name to show" hint="As they want it, such as “Maria R.” or “A parent”.">
              <Input value={f.name ?? ""} onChange={set("name")} />
            </Field>
            <Field label="Role (optional)">
              <Input value={f.role ?? ""} onChange={set("role")} />
            </Field>
            <Field label="What they said">
              <Textarea rows={4} value={f.quote ?? ""} onChange={set("quote")} />
            </Field>
            <Field
              label="How they agreed (leave empty if not yet)"
              hint="Nothing can be published until this is recorded."
            >
              <Input value={f.consent ?? ""} onChange={set("consent")} />
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

/* ---------------------------------------------------------------- gear */

export type GearData = {
  gear: { id: string; name: string; kind: string; notes: string | null; retired: boolean }[];
  kinds: string[];
  jobs: { id: string; title: string; date: string | null }[];
  uses: { gearId: string; jobId: string; onDate: string; jobTitle: string }[];
  clashes: string[];
};

export function GearView({ user, data }: { user: string; data: GearData }) {
  const { pending, note, act, submit } = useAct();
  const [f, setF] = useState<Record<string, string>>({ kind: "camera" });
  const [a, setA] = useState<Record<string, string>>({});
  const set = (k: string) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  const active = data.gear.filter((g) => !g.retired);
  return (
    <Frame section="gear" user={user} note={note}>
      {data.clashes.length ? (
        <Card title="Double bookings" id="g-clash">
          <ul className="hm-data-list st-list">
            {data.clashes.map((c) => (
              <li className="hm-data-list-item" key={c}>
                <Badge tone="warning">Clash</Badge> {c}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
      <div className="st-grid">
        <Card title="Gear" id="g-list">
          {data.gear.length ? (
            <ul className="hm-data-list st-list st-list--tall">
              {data.gear.map((g) => (
                <li className="hm-data-list-item" key={g.id} data-gear-id={g.id}>
                  <span>
                    {g.name}
                    <small>
                      {cap(g.kind)}
                      {g.notes ? ` · ${g.notes}` : ""}
                      {g.retired ? " · retired" : ""}
                    </small>
                  </span>
                  <span>
                    {data.uses
                      .filter((u) => u.gearId === g.id)
                      .map((u) => (
                        <small key={`${u.jobId}${u.onDate}`}>
                          {u.onDate} · {u.jobTitle}{" "}
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={pending}
                            aria-label={`Take ${g.name} off ${u.jobTitle} on ${u.onDate}`}
                            onClick={() =>
                              act(() => unassignGearAction({ gearId: g.id, jobId: u.jobId, onDate: u.onDate }))
                            }
                          >
                            Remove
                          </Button>
                        </small>
                      ))}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    onClick={() => act(() => retireGearAction({ gearId: g.id, retired: !g.retired }))}
                  >
                    {g.retired ? "Bring back" : "Retire"}
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <Text size="sm" tone="muted">
              Add the cameras, lenses and lights you own, then put them on jobs to catch a double booking.
            </Text>
          )}
        </Card>
        <div className="st-stack">
          <Card title="Add gear" id="g-add">
            <form
              noValidate
              className="st-form"
              aria-label="New gear"
              onSubmit={submit(
                () => addGearAction({ name: f.name ?? "", kind: f.kind ?? "other", notes: f.notes }),
                () => setF({ kind: f.kind ?? "camera" }),
              )}
            >
              <Field label="Name">
                <Input value={f.name ?? ""} onChange={set("name")} />
              </Field>
              <Field label="Kind">
                <Select value={f.kind} onValueChange={(v) => setF({ ...f, kind: v })}>
                  {data.kinds.map((k) => (
                    <option key={k} value={k}>
                      {cap(k)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Notes">
                <Input value={f.notes ?? ""} onChange={set("notes")} />
              </Field>
              <Button type="submit" disabled={pending}>
                Add gear
              </Button>
            </form>
          </Card>
          <Card title="Put gear on a job" id="g-assign">
            <form
              noValidate
              className="st-form"
              aria-label="Assign gear"
              onSubmit={submit(() =>
                assignGearAction({ gearId: a.gear ?? "", jobId: a.job ?? "", onDate: a.date ?? "" }),
              )}
            >
              <Field label="Gear">
                <Select value={a.gear ?? ""} onValueChange={(v) => setA({ ...a, gear: v })}>
                  <option value="">Choose</option>
                  {active.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Job">
                <Select
                  value={a.job ?? ""}
                  onValueChange={(v) =>
                    setA({ ...a, job: v, date: a.date || (data.jobs.find((j) => j.id === v)?.date ?? "") })
                  }
                >
                  <option value="">Choose</option>
                  {data.jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Day">
                <DateField value={a.date ?? ""} onChange={(e) => setA({ ...a, date: e.target.value })} />
              </Field>
              <Button type="submit" disabled={pending}>
                Assign
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </Frame>
  );
}

/* ---------------------------------------------------------------- call sheets */

export type CallSheetsData = {
  jobs: { id: string; title: string; date: string | null; client: string }[];
  selected: string | null;
  sheet: {
    callTime: string;
    location: string;
    notes: string;
    shots: { text: string; done: boolean }[];
    contacts: { name: string; role: string; phone: string }[];
  } | null;
  have: string[];
};

export function CallSheetsView({ user, data }: { user: string; data: CallSheetsData }) {
  const { pending, note, act, submit } = useAct();
  const [jobId, setJobId] = useState(data.selected ?? "");
  const [callTime, setCallTime] = useState(data.sheet?.callTime ?? "");
  const [location, setLocation] = useState(data.sheet?.location ?? "");
  const [notes, setNotes] = useState(data.sheet?.notes ?? "");
  const [shots, setShots] = useState(data.sheet?.shots ?? []);
  const [contacts, setContacts] = useState(data.sheet?.contacts ?? []);
  const [shot, setShot] = useState("");
  const [c, setC] = useState({ name: "", role: "", phone: "" });
  return (
    <Frame section="callsheets" user={user} note={note}>
      <div className="st-grid">
        <Card title="Call sheet" id="cs-form">
          <form
            noValidate
            className="st-form"
            aria-label="Call sheet"
            onSubmit={submit(() => saveCallSheetAction({ jobId, callTime, location, notes, shots, contacts }))}
          >
            <Field label="Job">
              <Select
                value={jobId}
                onValueChange={(v) => {
                  setJobId(v);
                  // the page loads the chosen job's sheet
                  window.location.assign(`/studio/callsheets?job=${v}`);
                }}
              >
                <option value="">Choose a job</option>
                {data.jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title}
                    {j.date ? ` (${j.date})` : ""}
                    {data.have.includes(j.id) ? " ✓" : ""}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Call time">
              <Input value={callTime} onChange={(e) => setCallTime(e.target.value)} placeholder="6:30 pm" />
            </Field>
            <Field label="Place">
              <Input value={location} onChange={(e) => setLocation(e.target.value)} />
            </Field>
            <Field label="Notes (parking, power, who to find)">
              <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </Field>
            <Button type="submit" disabled={pending || !jobId}>
              Save call sheet
            </Button>
          </form>
        </Card>
        <div className="st-stack">
          <Card title="Shot list" id="cs-shots">
            <ul className="hm-data-list st-list">
              {shots.map((s, i) => (
                <li className="hm-data-list-item" key={`${s.text}${i}`}>
                  <Checkbox
                    checked={s.done}
                    onChange={(e) => setShots(shots.map((x, j) => (j === i ? { ...x, done: e.target.checked } : x)))}
                    label={<span style={{ textDecoration: s.done ? "line-through" : undefined }}>{s.text}</span>}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShots(shots.filter((_, j) => j !== i))}
                    aria-label={`Remove ${s.text}`}
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
            <div className="st-inline">
              <Input
                aria-label="New shot"
                placeholder="A shot you must get"
                value={shot}
                onChange={(e) => setShot(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && shot.trim()) {
                    e.preventDefault();
                    setShots([...shots, { text: shot.trim(), done: false }]);
                    setShot("");
                  }
                }}
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  if (!shot.trim()) return;
                  setShots([...shots, { text: shot.trim(), done: false }]);
                  setShot("");
                }}
              >
                Add shot
              </Button>
            </div>
          </Card>
          <Card title="People on the day" id="cs-people">
            <ul className="hm-data-list st-list">
              {contacts.map((p, i) => (
                <li className="hm-data-list-item" key={`${p.name}${i}`}>
                  <span>
                    {p.name}
                    <small>{[p.role, p.phone].filter(Boolean).join(" · ")}</small>
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setContacts(contacts.filter((_, j) => j !== i))}
                    aria-label={`Remove ${p.name}`}
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
            <div className="st-form">
              <Field label="Name">
                <Input value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} />
              </Field>
              <Field label="Role">
                <Input value={c.role} onChange={(e) => setC({ ...c, role: e.target.value })} />
              </Field>
              <Field label="Phone">
                <Input value={c.phone} onChange={(e) => setC({ ...c, phone: e.target.value })} />
              </Field>
              <Button
                variant="secondary"
                onClick={() => {
                  if (!c.name.trim()) return;
                  setContacts([...contacts, c]);
                  setC({ name: "", role: "", phone: "" });
                }}
              >
                Add person
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </Frame>
  );
}

/* ---------------------------------------------------------------- usage rights */

export type RightsData = {
  items: {
    id: string;
    title: string;
    kind: string;
    jobTitle: string;
    clientName: string;
    personal: boolean;
    commercial: boolean;
    termMonths: number | null;
    signedAt: string;
    expiresAt: string | null;
    state: "perpetual" | "active" | "expiring" | "expired";
  }[];
};

const RIGHTS_TONE = { perpetual: "info", active: "success", expiring: "warning", expired: "danger" } as const;
const RIGHTS_LABEL = { perpetual: "No end date", active: "In force", expiring: "Ends soon", expired: "Ended" } as const;

export function RightsView({ user, data }: { user: string; data: RightsData }) {
  const { note } = useAct();
  const order = { expired: 0, expiring: 1, active: 2, perpetual: 3 } as const;
  const items = [...data.items].sort((a, b) => order[a.state] - order[b.state]);
  return (
    <Frame section="rights" user={user} note={note}>
      <Card title="Licenses in force" id="r-list">
        {items.length ? (
          <ul className="hm-data-list st-list st-list--tall">
            {items.map((r) => (
              <li className="hm-data-list-item" key={r.id} data-license-id={r.id}>
                <span>
                  {r.clientName}: {r.jobTitle}
                  <small>
                    {[r.personal && "personal use", r.commercial && "commercial use"].filter(Boolean).join(" and ") ||
                      "no use granted"}
                    {r.termMonths ? ` · ${r.termMonths} months` : ""} · signed {r.signedAt.slice(0, 10)}
                  </small>
                </span>
                <span>
                  <Badge tone={RIGHTS_TONE[r.state]}>{RIGHTS_LABEL[r.state]}</Badge>
                  {r.expiresAt ? (
                    <small>
                      {r.state === "expired" ? "ended" : "ends"} {r.expiresAt.slice(0, 10)}
                    </small>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <Text size="sm" tone="muted">
            Nothing yet. A signed contract or license that grants personal or commercial use shows up here, and you get
            a note in Activity when one is about to end.
          </Text>
        )}
      </Card>
    </Frame>
  );
}

/* ---------------------------------------------------------------- newsletter subscribers */

export type SubscribersData = {
  csv: string;
  items: {
    id: string;
    email: string;
    state: "active" | "pending" | "unsubscribed";
    source: string | null;
    at: string;
  }[];
};

export function SubscribersView({ user, data }: { user: string; data: SubscribersData }) {
  const { pending, note, act } = useAct();
  const [ask, confirmEl] = useConfirm();
  const active = data.items.filter((i) => i.state === "active").length;
  const download = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([data.csv], { type: "text/csv" }));
    a.download = "subscribers.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <Frame section="subscribers" user={user} note={note}>
      {confirmEl}
      <Card title={`${active} confirmed`} id="s-list">
        <Text size="sm" tone="muted">
          People sign up in the footer of every page and confirm by email. Pending addresses never count, and anyone can
          unsubscribe with one click. Sending newsletters is not built yet (it needs a verified sending domain), so this
          is the list, ready for when it is.
        </Text>
        <div className="st-actions">
          <Button variant="secondary" onClick={download} disabled={!active}>
            <DownloadIcon /> Download confirmed addresses (CSV)
          </Button>
        </div>
        {data.items.length ? (
          <ul className="hm-data-list st-list st-list--tall">
            {data.items.map((i) => (
              <li className="hm-data-list-item" key={i.id}>
                <span>
                  {i.email}
                  <small>
                    {i.source ?? "footer"} · {i.at.slice(0, 10)}
                  </small>
                </span>
                <Badge tone={i.state === "active" ? "success" : i.state === "pending" ? "warning" : "neutral"}>
                  {i.state === "active" ? "Confirmed" : i.state === "pending" ? "Not confirmed" : "Unsubscribed"}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  aria-label={`Delete ${i.email}`}
                  onClick={async () =>
                    (await ask({ title: `Delete ${i.email}?`, body: "They can sign up again.", action: "Delete" })) &&
                    act(() => deleteSubscriberAction(i.id))
                  }
                >
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <Text size="sm" tone="muted">
            No one has signed up yet.
          </Text>
        )}
      </Card>
    </Frame>
  );
}

/* ---------------------------------------------------------------- privacy requests */

export type PrivacyData = {
  items: {
    id: string;
    name: string;
    email: string;
    details: string;
    status: string;
    resolution: string | null;
    at: string;
  }[];
};

export function PrivacyView({ user, data }: { user: string; data: PrivacyData }) {
  const { pending, note, act, submit } = useAct();
  const [text, setText] = useState<Record<string, string>>({});
  const open = data.items.filter((i) => i.status === "open").length;
  return (
    <Frame section="privacy" user={user} note={note}>
      <Card title={open ? `${open} waiting` : "Requests"} id="pv-list">
        <Text size="sm" tone="muted">
          Visitors ask for a photograph to come down from the page “Remove a photo of me” (linked in the footer). Find
          the photograph, hide it in its gallery (Photos, select it, Hide), then write what you did and mark it done.
          Reply to them by email; nothing is sent from here.
        </Text>
        {data.items.length ? (
          <ul className="hm-data-list st-list st-list--tall">
            {data.items.map((r) => (
              <li className="hm-data-list-item st-stack" key={r.id} data-privacy-id={r.id}>
                <p>
                  <b>{r.name}</b> <a href={`mailto:${r.email}`}>{r.email}</a>{" "}
                  <Badge tone={r.status === "open" ? "warning" : r.status === "done" ? "success" : "neutral"}>
                    {r.status === "open" ? "Waiting" : r.status === "done" ? "Done" : "Declined"}
                  </Badge>{" "}
                  <small>{r.at.slice(0, 10)}</small>
                </p>
                <p className="st-quote">{r.details}</p>
                {r.status === "open" ? (
                  <form
                    noValidate
                    className="st-inline"
                    aria-label={`Resolve the request from ${r.name}`}
                    onSubmit={submit(() =>
                      resolvePrivacyAction({ requestId: r.id, status: "done", resolution: text[r.id] ?? "" }),
                    )}
                  >
                    <Input
                      aria-label={`What you did for ${r.name}`}
                      placeholder="What you did, for the record"
                      value={text[r.id] ?? ""}
                      onChange={(e) => setText({ ...text, [r.id]: e.target.value })}
                    />
                    <Button type="submit" size="sm" disabled={pending}>
                      Mark done
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={pending}
                      onClick={() =>
                        act(() =>
                          resolvePrivacyAction({ requestId: r.id, status: "declined", resolution: text[r.id] ?? "" }),
                        )
                      }
                    >
                      Decline
                    </Button>
                  </form>
                ) : (
                  <>
                    <small>{r.resolution}</small>
                    <div className="st-actions">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={pending}
                        onClick={() => act(() => reopenPrivacyAction(r.id))}
                      >
                        Reopen
                      </Button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <Text size="sm" tone="muted">
            No requests.
          </Text>
        )}
      </Card>
    </Frame>
  );
}
