"use client";

import { DateField } from "@/components/DateField";
import { Button, Checkbox, Field, FormMessage, Input, ResultCard, Textarea } from "@/components/ui";
import { type ShootType, budgetOptions, shootTypes } from "@/content/shoot-types";
import NextLink from "next/link";
import { type FormEvent, type KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";

type Answers = {
  type: string;
  details: Record<string, string>;
  location: string;
  eventDate: string;
  flexibility: string;
  budget: string;
  message: string;
  name: string;
  email: string;
  phone: string;
  consent: boolean;
};

const EMPTY: Answers = {
  type: "",
  details: {},
  location: "",
  eventDate: "",
  flexibility: "",
  budget: "",
  message: "",
  name: "",
  email: "",
  phone: "",
  consent: false,
};
const KEY = "jq-book-draft";
const FLEX = ["That exact day", "A few days around it", "I'm flexible", "I don't have a date yet"];
const STEPS = ["Kind", "Details", "When", "Budget", "Story", "You", "Review"] as const;

/**
 * "Book a shoot" as a short questionnaire, one question at a time: kind of shoot, the details that kind needs, where
 * and when, budget, the story, then contact. It ends on a review you can edit from, and posts the same JSON to
 * `/api/inquiry` as the per-type form (a scored lead plus a confirmation email). The draft is kept in this tab's session
 * storage so a refresh does not lose it. Honeypot, consent and the mailto fallback are the same as InquiryForm.
 */
export function BookingWizard({ fallbackEmail, initialType }: { fallbackEmail: string; initialType?: string }) {
  const [a, setA] = useState<Answers>({ ...EMPTY, type: initialType ?? "" });
  const [step, setStep] = useState(initialType ? 1 : 0);
  const [dir, setDir] = useState<"fwd" | "back">("fwd");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [problem, setProblem] = useState("");
  const honey = useRef<HTMLInputElement>(null);
  const head = useRef<HTMLHeadingElement>(null);
  const track = useRef<{ source: string; referrer: string; utm: Record<string, string> }>({
    source: "",
    referrer: "",
    utm: {},
  });
  const type: ShootType | undefined = useMemo(() => shootTypes.find((t) => t.slug === a.type), [a.type]);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const utm: Record<string, string> = {};
    for (const [k, v] of q) if (k.startsWith("utm_")) utm[k] = v.slice(0, 120);
    track.current = {
      source: (
        q.get("ref") ??
        q.get("utm_source") ??
        (document.referrer ? new URL(document.referrer).host : "direct")
      ).slice(0, 80),
      referrer: document.referrer.slice(0, 300),
      utm,
    };
    try {
      const saved = sessionStorage.getItem(KEY);
      if (saved && !initialType) {
        const d = JSON.parse(saved) as { a: Answers; step: number };
        setA({ ...EMPTY, ...d.a, consent: false });
        setStep(Math.min(d.step, STEPS.length - 1));
      }
    } catch {}
  }, [initialType]);
  useEffect(() => {
    if (state === "sent") return;
    try {
      sessionStorage.setItem(KEY, JSON.stringify({ a: { ...a, consent: false }, step }));
    } catch {}
  }, [a, step, state]);
  // biome-ignore lint/correctness/useExhaustiveDependencies: move focus to the question whenever the step changes
  useEffect(() => {
    head.current?.focus({ preventScroll: true });
  }, [step]);

  const set = <K extends keyof Answers>(k: K, v: Answers[K]) => {
    setA((x) => ({ ...x, [k]: v }));
    setErrors((e) => ({ ...e, [k as string]: "" }));
  };

  const check = (s: number): Record<string, string> => {
    const e: Record<string, string> = {};
    if (s === 0 && !a.type) e.type = "Pick the closest kind of shoot, or Something else.";
    if (s === 4 && a.message.trim().length < 5) e.message = "Tell me a little about the shoot.";
    if (s === 5) {
      if (a.name.trim().length < 2) e.name = "Please tell me your name.";
      if (!/^\S+@\S+\.\S+$/.test(a.email.trim())) e.email = "That doesn't look like an email address.";
      if (!a.consent) e.consent = "Please tick the box so I can store your message.";
    }
    return e;
  };
  const go = (to: number) => {
    setDir(to > step ? "fwd" : "back");
    setStep(to);
  };
  const next = () => {
    const e = check(step);
    setErrors(e);
    if (!Object.keys(e).length) go(Math.min(step + 1, STEPS.length - 1));
  };
  const enter = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !(e.target instanceof HTMLTextAreaElement) && !(e.target instanceof HTMLButtonElement)) {
      e.preventDefault();
      if (step < STEPS.length - 1) next();
    }
  };

  async function send(e: FormEvent) {
    e.preventDefault();
    if (honey.current?.value) return;
    for (const s of [0, 4, 5]) {
      const er = check(s);
      if (Object.keys(er).length) {
        setErrors(er);
        return go(s);
      }
    }
    setState("sending");
    const details = { ...a.details };
    if (a.flexibility) details["Date flexibility"] = a.flexibility;
    try {
      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: a.name.trim(),
          email: a.email.trim(),
          phone: a.phone.trim(),
          shootType: a.type,
          eventDate: a.eventDate,
          location: a.location.trim(),
          budget: a.budget || budgetOptions[0],
          message: a.message.trim(),
          details,
          consent: true,
          website: "",
          ...track.current,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string; fieldErrors?: Record<string, string> };
      if (res.ok) {
        try {
          sessionStorage.removeItem(KEY);
        } catch {}
        return setState("sent");
      }
      if (j.fieldErrors) setErrors(j.fieldErrors);
      setProblem(j.error ?? "Something went wrong.");
      setState("error");
    } catch {
      setProblem("Could not reach the server.");
      setState("error");
    }
  }

  if (state === "sent")
    return (
      <ResultCard
        level={2}
        title="Thanks, I got your story."
        message="A confirmation is on its way to your inbox. I reply myself, usually within two days."
      />
    );

  const pct = Math.round((step / (STEPS.length - 1)) * 100);
  const summary: [string, string, number][] = [
    ["Kind of shoot", type?.label ?? "—", 0],
    ...Object.entries(a.details)
      .filter(([, v]) => v)
      .map(([k, v]): [string, string, number] => [k, v, 1]),
    ["Where", a.location || "Not said yet", 1],
    ["When", [a.eventDate, a.flexibility].filter(Boolean).join(", ") || "Not decided", 2],
    ["Budget", a.budget || budgetOptions[0], 3],
    ["Your story", a.message || "—", 4],
    ["Contact", [a.name, a.email, a.phone].filter(Boolean).join(" · "), 5],
  ];

  return (
    <form className="bw" onSubmit={send} onKeyDown={enter} noValidate aria-label="Book a shoot">
      <div className="bw-top">
        <ol className="bw-steps" aria-label="Progress">
          {STEPS.map((label, i) => (
            <li key={label} data-state={i === step ? "now" : i < step ? "done" : "next"}>
              <button
                type="button"
                disabled={i > step}
                onClick={() => go(i)}
                aria-current={i === step ? "step" : undefined}
              >
                <span aria-hidden="true">{i < step ? "✓" : i + 1}</span>
                <b>{label}</b>
              </button>
            </li>
          ))}
        </ol>
        <div
          className="bw-bar"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          aria-label="Questionnaire progress"
        >
          <i style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="bw-stage" key={step} data-dir={dir}>
        {step === 0 ? (
          <fieldset className="bw-q">
            <legend>
              <h2 ref={head} tabIndex={-1}>
                What kind of shoot is it?
              </h2>
            </legend>
            <div className="bw-cards" role="radiogroup" aria-label="Kind of shoot">
              {shootTypes.map((t) => (
                <button
                  key={t.slug}
                  type="button"
                  role="radio"
                  aria-checked={a.type === t.slug}
                  data-on={a.type === t.slug ? "" : undefined}
                  onClick={() => {
                    setA((x) => ({ ...x, type: t.slug, details: x.type === t.slug ? x.details : {} }));
                    setErrors({});
                    setDir("fwd");
                    setStep(1);
                  }}
                >
                  <strong>{t.headline}</strong>
                  <span>{t.blurb}</span>
                </button>
              ))}
            </div>
            <FormMessage>{errors.type}</FormMessage>
          </fieldset>
        ) : null}

        {step === 1 ? (
          <div className="bw-q">
            <h2 ref={head} tabIndex={-1}>
              A few details{type ? ` about the ${type.label.toLowerCase()}` : ""}
            </h2>
            {type?.extra.map((x) => (
              <Field key={x.name} label={x.label}>
                <Input
                  value={a.details[x.name] ?? ""}
                  type={x.kind === "number" ? "number" : "text"}
                  inputMode={x.kind === "number" ? "numeric" : undefined}
                  min={x.kind === "number" ? 0 : undefined}
                  onChange={(e) => set("details", { ...a.details, [x.name]: e.target.value })}
                />
              </Field>
            ))}
            <Field label="Where will it be?" hint="A city, a venue, or “not sure yet”.">
              <Input value={a.location} autoComplete="off" onChange={(e) => set("location", e.target.value)} />
            </Field>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="bw-q">
            <h2 ref={head} tabIndex={-1}>
              When is it?
            </h2>
            <Field label="Date (if you have one)">
              <DateField name="eventDate" value={a.eventDate} onChange={(e) => set("eventDate", e.target.value)} />
            </Field>
            <div className="bw-chips" role="radiogroup" aria-label="How firm is the date">
              {FLEX.map((f) => (
                <button
                  key={f}
                  type="button"
                  role="radio"
                  aria-checked={a.flexibility === f}
                  data-on={a.flexibility === f ? "" : undefined}
                  onClick={() => set("flexibility", a.flexibility === f ? "" : f)}
                >
                  {f}
                </button>
              ))}
            </div>
            <p className="bw-aside">
              Want to pick an open time instead? <NextLink href="/book/schedule">See the calendar</NextLink>.
            </p>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="bw-q">
            <h2 ref={head} tabIndex={-1}>
              Roughly what budget do you have in mind?
            </h2>
            <div className="bw-chips" role="radiogroup" aria-label="Budget">
              {budgetOptions.map((b) => (
                <button
                  key={b}
                  type="button"
                  role="radio"
                  aria-checked={(a.budget || budgetOptions[0]) === b}
                  data-on={(a.budget || budgetOptions[0]) === b ? "" : undefined}
                  onClick={() => set("budget", b)}
                >
                  {b}
                </button>
              ))}
            </div>
            <p className="bw-aside">A range helps me suggest the right amount of coverage. Nothing here is a quote.</p>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="bw-q">
            <h2 ref={head} tabIndex={-1}>
              Tell me about it
            </h2>
            <Field label={type?.messageHint ?? "What do you have in mind?"} error={errors.message} required>
              <Textarea rows={6} autoGrow value={a.message} onChange={(e) => set("message", e.target.value)} />
            </Field>
          </div>
        ) : null}

        {step === 5 ? (
          <div className="bw-q">
            <h2 ref={head} tabIndex={-1}>
              Where should I reply?
            </h2>
            <div className="pm-pair">
              <Field label="Your name" error={errors.name} required>
                <Input value={a.name} autoComplete="name" onChange={(e) => set("name", e.target.value)} />
              </Field>
              <Field label="Email" error={errors.email} required>
                <Input
                  type="email"
                  value={a.email}
                  autoComplete="email"
                  onChange={(e) => set("email", e.target.value)}
                />
              </Field>
            </div>
            <Field label="Phone (optional)">
              <Input type="tel" value={a.phone} autoComplete="tel" onChange={(e) => set("phone", e.target.value)} />
            </Field>
            <div className="pm-stack">
              <Checkbox
                checked={a.consent}
                onChange={(e) => set("consent", e.currentTarget.checked)}
                aria-invalid={errors.consent ? true : undefined}
                label={
                  <>
                    I agree that my answers are stored so you can reply, and that you may email me about it. See the{" "}
                    <NextLink href="/privacy" className="pm-link">
                      privacy page
                    </NextLink>
                    .
                  </>
                }
              />
              <FormMessage>{errors.consent}</FormMessage>
            </div>
          </div>
        ) : null}

        {step === 6 ? (
          <div className="bw-q">
            <h2 ref={head} tabIndex={-1}>
              Look right?
            </h2>
            <dl className="bw-review">
              {summary.map(([k, v, s]) => (
                <div key={`${k}-${s}`}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                  <button type="button" onClick={() => go(s)} aria-label={`Change ${k}`}>
                    Edit
                  </button>
                </div>
              ))}
            </dl>
            {state === "error" ? (
              <p role="alert" className="bw-err">
                {problem}{" "}
                <a href={`mailto:${fallbackEmail}`} className="pm-link">
                  Email {fallbackEmail}
                </a>
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div aria-hidden className="pm-honeypot">
        <label>
          Website
          <input ref={honey} name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="bw-nav">
        {step > 0 ? (
          <Button type="button" variant="secondary" onClick={() => go(step - 1)}>
            Back
          </Button>
        ) : (
          <span />
        )}
        {step === 0 ? null : step < STEPS.length - 1 ? (
          <Button key="next" type="button" onClick={next}>
            {step === 2 || step === 3 ? (a.eventDate || a.flexibility || a.budget ? "Next" : "Skip") : "Next"}
          </Button>
        ) : (
          <Button key="send" type="submit" size="lg" loading={state === "sending"}>
            Send it to Jerry
          </Button>
        )}
      </div>
    </form>
  );
}
