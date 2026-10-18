"use client";

import { Radio, RadioGroup, Step, Stepper, ToggleGroup, ToggleGroupItem } from "@holominimal/ui";
import { Alert, Button, Checkbox, Field, FormMessage, Input, ResultCard, Text, Textarea } from "@/components/ui";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { type ChangeEvent, useState } from "react";
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

  if (state === "done") return <ResultCard level={2} title="You're booked" message={msg} />;
  const step = pick ? 2 : date ? 1 : 0;
  return (
    <div className="pm-form">
      <Stepper current={step} aria-label="Booking steps" className="pm-steps">
        <Step title="What" />
        <Step title="When" />
        <Step title="Your details" />
      </Stepper>
      <RadioGroup
        legend="What would you like to book?"
        name="kind"
        value={kind}
        onValueChange={(v) => {
          setKind(v);
          void load(v, date);
        }}
      >
        {scheduleKinds.map((k) => (
          <Radio key={k.slug} value={k.slug} label={k.label} description={k.blurb} />
        ))}
      </RadioGroup>
      <Field label="Pick a day">
        <Input
          type="date"
          min={minDate}
          value={date}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            setDate(e.target.value);
            void load(kind, e.target.value);
          }}
        />
      </Field>
      <FormMessage>{err}</FormMessage>
      {slots && !slots.length ? (
        <div className="pm-stack">
          <Alert tone="neutral">No times are free that day.</Alert>
          <form onSubmit={wait} className="pm-stack" aria-label="Waitlist">
            <Text size="sm" tone="muted">
              Join the waitlist and I'll email you if a spot opens.
            </Text>
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
        </div>
      ) : null}
      {slots?.length ? (
        <div className="pm-stack">
          <Text size="sm" tone="muted">
            Times in {info?.timezone}. {info?.minutes} minutes.
          </Text>
          <ToggleGroup
            aria-label="Free times"
            className="pm-slots"
            value={pick?.start ?? ""}
            onValueChange={(v) => setPick(slots.find((s) => s.start === v) ?? null)}
          >
            {slots.map((s) => (
              <ToggleGroupItem key={s.start} value={s.start}>
                {s.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      ) : null}
      {pick ? (
        <form onSubmit={book} noValidate className="pm-stack" aria-label="Your details">
          <Alert tone="info" role="status">
            <strong>{pick.label}</strong> on {date}
            {info?.deposit ? ` · deposit ${usd(info.deposit)} (SAMPLE amount until the owner sets it)` : ""}
          </Alert>
          <div className="pm-pair">
            <Field label="Your name" required>
              <Input name="name" autoComplete="name" />
            </Field>
            <Field label="Email" required>
              <Input name="email" type="email" autoComplete="email" />
            </Field>
          </div>
          <Field label="Anything I should know?">
            <Textarea name="notes" rows={3} autoGrow />
          </Field>
          <div aria-hidden className="pm-honeypot">
            <label>
              Website
              <input name="website" tabIndex={-1} autoComplete="off" />
            </label>
          </div>
          <Checkbox
            name="consent"
            label={
              <>
                I agree that my details are stored so you can reply and confirm. See the{" "}
                <NextLink href="/privacy" className="pm-link">
                  privacy page
                </NextLink>
                .
              </>
            }
          />
          <div>
            <Button type="submit" size="lg" loading={state === "busy"}>
              {info?.deposit ? "Hold this time" : "Book this time"}
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
