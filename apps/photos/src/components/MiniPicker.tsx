"use client";

import { ToggleGroup, ToggleGroupItem } from "@holominimal/ui";
import { Alert, Button, Checkbox, Field, FormMessage, Heading, Input, ResultCard, Text } from "@/components/ui";
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
  if (done) return <ResultCard level={2} title="You're booked" message={msg} />;
  return (
    <div className="pm-form">
      {groups.length ? (
        groups.map((g) => (
          <section key={g.label} aria-label={g.label} className="pm-stack">
            <Heading level={2} size="xl">
              {g.label}
            </Heading>
            {g.location ? (
              <Text size="sm" tone="muted">
                {g.location}
              </Text>
            ) : null}
            <ToggleGroup
              aria-label={`Times on ${g.label}`}
              className="pm-slots"
              value={g.slots.some((x) => x.id === slot) ? (slot ?? "") : ""}
              onValueChange={(v) => setSlot(v || null)}
            >
              {g.slots.map((s) => (
                <ToggleGroupItem key={s.id} value={s.id}>
                  {s.time}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </section>
        ))
      ) : (
        <form onSubmit={wait} className="pm-stack" aria-label="Waitlist">
          <Alert tone="neutral">
            No mini-session slots are open right now. Join the waitlist and I'll email you when the next ones open.
          </Alert>
          <div className="pm-pair">
            <Field label="Your name">
              <Input name="wname" autoComplete="name" />
            </Field>
            <Field label="Email">
              <Input name="wemail" type="email" autoComplete="email" />
            </Field>
          </div>
          <div>
            <Button type="submit" variant="secondary">
              Join the waitlist
            </Button>
          </div>
          {msg ? <p role="status">{msg}</p> : null}
        </form>
      )}
      {slot ? (
        <form onSubmit={submit} noValidate className="pm-stack" aria-label="Your details">
          <div className="pm-pair">
            <Field label="Your name" required>
              <Input name="name" autoComplete="name" />
            </Field>
            <Field label="Email" required>
              <Input name="email" type="email" autoComplete="email" />
            </Field>
          </div>
          <Checkbox name="consent" label="I agree that my details are stored so you can confirm." />
          <FormMessage>{err}</FormMessage>
          <div>
            <Button type="submit" size="lg">
              Book this slot
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
