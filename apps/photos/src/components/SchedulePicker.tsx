"use client";

import { Button, Field, Input, Textarea } from "@halation/ui";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { bookSlotAction, joinWaitlistAction } from "@/app/book/schedule/actions";
import { scheduleKinds } from "@/lib/scheduling";

type Slot = { start: string; label: string };
const usd = (c: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(c / 100);

/** Pick a kind, a date and a free time; then give your details. Paid sessions are held until the deposit is paid. */
export function SchedulePicker({ minDate, initialKind = "consult" }: { minDate: string; initialKind?: string }) {
  const router = useRouter();
  const [kind, setKind] = useState(initialKind);
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [info, setInfo] = useState<{ timezone: string; minutes: number; deposit: number } | null>(null);
  const [pick, setPick] = useState<Slot | null>(null);
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function load(k: string, d: string) {
    setPick(null);
    setSlots(null);
    setErr("");
    if (!d) return;
    const res = await fetch(`/api/slots?kind=${encodeURIComponent(k)}&date=${d}`);
    const j = (await res.json().catch(() => ({}))) as {
      slots?: Slot[];
      timezone?: string;
      minutes?: number;
      deposit?: number;
      error?: string;
    };
    if (!res.ok) return setErr(j.error ?? "Could not load times.");
    setSlots(j.slots ?? []);
    setInfo({ timezone: j.timezone ?? "", minutes: j.minutes ?? 0, deposit: j.deposit ?? 0 });
  }

  async function book(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!pick) return;
    const f = new FormData(e.currentTarget);
    setState("busy");
    setErr("");
    const r = await bookSlotAction({
      kind,
      start: pick.start,
      name: String(f.get("name") ?? ""),
      email: String(f.get("email") ?? ""),
      notes: String(f.get("notes") ?? ""),
      consent: f.get("consent") ? true : (false as unknown as true),
      website: String(f.get("website") ?? ""),
    });
    if (!r.ok) {
      setState("idle");
      return setErr(r.error);
    }
    if (r.payUrl) return router.push(r.payUrl);
    setMsg(r.message);
    setState("done");
  }

  async function wait(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const r = await joinWaitlistAction({
      name: String(f.get("wname") ?? ""),
      email: String(f.get("wemail") ?? ""),
      wanted: date,
    });
    setMsg(r.ok ? r.message : r.error);
  }

  if (state === "done")
    return (
      <div role="status" style={{ maxWidth: "36rem" }}>
        <p style={{ fontSize: "var(--hl-text-lg)" }}>{msg}</p>
      </div>
    );
  return (
    <div style={{ display: "grid", gap: "1.5rem", maxWidth: "36rem" }}>
      <fieldset style={{ border: 0, padding: 0, margin: 0, display: "grid", gap: "0.5rem" }}>
        <legend style={{ marginBottom: "0.5rem" }}>What would you like to book?</legend>
        {scheduleKinds.map((k) => (
          <label key={k.slug} style={{ display: "flex", gap: "0.6rem", alignItems: "flex-start", minHeight: 44 }}>
            <input
              type="radio"
              name="kind"
              value={k.slug}
              checked={kind === k.slug}
              onChange={() => {
                setKind(k.slug);
                void load(k.slug, date);
              }}
            />
            <span>
              <strong>{k.label}</strong>
              <br />
              <small style={{ color: "var(--hl-muted)" }}>{k.blurb}</small>
            </span>
          </label>
        ))}
      </fieldset>
      <Field label="Pick a day">
        <Input
          type="date"
          min={minDate}
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            void load(kind, e.target.value);
          }}
        />
      </Field>
      {err ? (
        <p role="alert" style={{ color: "var(--hl-danger, #b00020)" }}>
          {err}
        </p>
      ) : null}
      {slots && !slots.length ? (
        <div>
          <p role="status">No times are free that day.</p>
          <form onSubmit={wait} style={{ display: "grid", gap: "0.75rem" }}>
            <p style={{ color: "var(--hl-muted)" }}>Join the waitlist and I'll email you if a spot opens.</p>
            <Field label="Your name">
              <Input name="wname" autoComplete="name" />
            </Field>
            <Field label="Email">
              <Input name="wemail" type="email" autoComplete="email" />
            </Field>
            <div>
              <Button type="submit">Join the waitlist</Button>
            </div>
            {msg ? <p role="status">{msg}</p> : null}
          </form>
        </div>
      ) : null}
      {slots?.length ? (
        <div>
          <p style={{ color: "var(--hl-muted)", fontSize: "var(--hl-text-sm)" }}>
            Times in {info?.timezone}. {info?.minutes} minutes.
          </p>
          <ul
            style={{ listStyle: "none", padding: 0, display: "flex", flexWrap: "wrap", gap: "0.5rem" }}
            aria-label="Free times"
          >
            {slots.map((s) => (
              <li key={s.start}>
                <button
                  type="button"
                  className="slot"
                  aria-pressed={pick?.start === s.start}
                  onClick={() => setPick(s)}
                >
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {pick ? (
        <form onSubmit={book} noValidate style={{ display: "grid", gap: "1rem" }} aria-label="Your details">
          <p>
            <strong>{pick.label}</strong> on {date}
            {info?.deposit ? ` · deposit ${usd(info.deposit)} (SAMPLE amount until the owner sets it)` : ""}
          </p>
          <Field label="Your name" required>
            <Input name="name" autoComplete="name" />
          </Field>
          <Field label="Email" required>
            <Input name="email" type="email" autoComplete="email" />
          </Field>
          <Field label="Anything I should know?">
            <Textarea name="notes" />
          </Field>
          <div aria-hidden style={{ position: "absolute", left: "-9999px" }}>
            <label>
              Website
              <input name="website" tabIndex={-1} autoComplete="off" />
            </label>
          </div>
          <label style={{ display: "flex", gap: "0.6rem", alignItems: "flex-start", fontSize: "var(--hl-text-sm)" }}>
            <input type="checkbox" name="consent" style={{ marginTop: "0.25rem" }} />
            <span>
              I agree that my details are stored so you can reply and confirm. See the{" "}
              <NextLink href="/privacy" style={{ textDecoration: "underline" }}>
                privacy page
              </NextLink>
              .
            </span>
          </label>
          <div>
            <Button type="submit" disabled={state === "busy"}>
              {state === "busy" ? "Booking…" : info?.deposit ? "Hold this time" : "Book this time"}
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
