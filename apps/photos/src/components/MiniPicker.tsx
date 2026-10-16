"use client";

import { Button, Field, Input } from "@halation/ui";
import { useState } from "react";
import { bookMinislotAction, joinWaitlistAction } from "@/app/book/schedule/actions";

export type MiniGroup = { label: string; location: string | null; slots: { id: string; time: string }[] };

/** Open mini-session slots, grouped. One person gets each slot; a full session offers the waitlist. */
export function MiniPicker({ groups }: { groups: MiniGroup[] }) {
  const [slot, setSlot] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setErr("");
    const r = await bookMinislotAction({
      slotId: slot as string,
      name: String(f.get("name") ?? ""),
      email: String(f.get("email") ?? ""),
      consent: f.get("consent") ? true : (false as unknown as true),
    });
    if (!r.ok) return setErr(r.error);
    setMsg(r.message);
    setDone(true);
  }
  async function wait(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const r = await joinWaitlistAction({
      name: String(f.get("wname") ?? ""),
      email: String(f.get("wemail") ?? ""),
      wanted: "mini-sessions",
    });
    setMsg(r.ok ? r.message : r.error);
  }
  if (done)
    return (
      <p role="status" style={{ fontSize: "var(--hl-text-lg)" }}>
        {msg}
      </p>
    );
  return (
    <div style={{ display: "grid", gap: "1.5rem", maxWidth: "36rem" }}>
      {groups.length ? (
        groups.map((g) => (
          <section key={g.label} aria-label={g.label}>
            <h2 className="hl-heading" style={{ fontSize: "var(--hl-text-xl)" }}>
              {g.label}
            </h2>
            {g.location ? <p style={{ color: "var(--hl-muted)" }}>{g.location}</p> : null}
            <ul style={{ listStyle: "none", padding: 0, display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {g.slots.map((s) => (
                <li key={s.id}>
                  <button type="button" className="slot" aria-pressed={slot === s.id} onClick={() => setSlot(s.id)}>
                    {s.time}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))
      ) : (
        <form onSubmit={wait} style={{ display: "grid", gap: "0.75rem" }}>
          <p role="status">
            No mini-session slots are open right now. Join the waitlist and I'll email you when the next ones open.
          </p>
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
      )}
      {slot ? (
        <form onSubmit={submit} noValidate style={{ display: "grid", gap: "1rem" }} aria-label="Your details">
          <Field label="Your name" required>
            <Input name="name" autoComplete="name" />
          </Field>
          <Field label="Email" required>
            <Input name="email" type="email" autoComplete="email" />
          </Field>
          <label style={{ display: "flex", gap: "0.6rem", fontSize: "var(--hl-text-sm)" }}>
            <input type="checkbox" name="consent" /> I agree that my details are stored so you can confirm.
          </label>
          {err ? (
            <p role="alert" style={{ color: "var(--hl-danger, #b00020)" }}>
              {err}
            </p>
          ) : null}
          <div>
            <Button type="submit">Book this slot</Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
