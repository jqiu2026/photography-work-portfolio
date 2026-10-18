"use client";

import { Alert, Button, Checkbox, Field, FormMessage, Input, ResultCard, Select, Textarea } from "@/components/ui";
import NextLink from "next/link";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { budgetOptions, type ShootType } from "@/content/shoot-types";

/**
 * Inquiry form for one kind of shoot. Posts JSON to `/api/inquiry`, which stores a scored lead and emails a
 * confirmation. Source tracking: the referrer and any utm_* or ?ref= value in the URL are sent along (no cookies, no
 * third-party script). The hidden "website" field is a honeypot. If the server cannot store it, the visitor is offered
 * a mailto fallback.
 */
export function InquiryForm({
  type,
  fallbackEmail,
  embed = false,
}: { type: ShootType; fallbackEmail: string; embed?: boolean }) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [problem, setProblem] = useState("");
  const track = useRef<{ source: string; referrer: string; utm: Record<string, string> }>({
    source: "",
    referrer: "",
    utm: {},
  });
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
  }, []);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (f.get("website")) return;
    const get = (k: string) => String(f.get(k) ?? "").trim();
    const next: Record<string, string> = {};
    if (get("name").length < 2) next.name = "Please tell me your name.";
    if (!/^\S+@\S+\.\S+$/.test(get("email"))) next.email = "That doesn't look like an email address.";
    if (get("message").length < 5) next.message = "Tell me a little about the shoot.";
    if (!f.get("consent")) next.consent = "Please tick the box so I can store your message.";
    setErrors(next);
    if (Object.keys(next).length) return;
    const details: Record<string, string> = {};
    for (const x of type.extra) if (get(`x:${x.name}`)) details[x.name] = get(`x:${x.name}`);
    setState("sending");
    try {
      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: get("name"),
          email: get("email"),
          phone: get("phone"),
          shootType: type.slug,
          eventDate: get("eventDate"),
          location: get("location"),
          budget: get("budget"),
          message: get("message"),
          details,
          consent: true,
          website: get("website"),
          ...track.current,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as {
        error?: string;
        fieldErrors?: Record<string, string>;
        fallback?: string;
      };
      if (res.ok) return setState("sent");
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
        title="Thanks, I got your message."
        message="A confirmation is on its way to your inbox. I reply myself, usually within two days."
      />
    );
  return (
    <form onSubmit={submit} noValidate aria-label={`${type.label} inquiry`} className="pm-form">
      <div className="pm-pair">
        <Field label="Your name" error={errors.name} required>
          <Input name="name" autoComplete="name" />
        </Field>
        <Field label="Email" error={errors.email} required>
          <Input name="email" type="email" autoComplete="email" />
        </Field>
      </div>
      <div className="pm-pair">
        <Field label="Phone (optional)">
          <Input name="phone" type="tel" autoComplete="tel" />
        </Field>
        <Field label="Date (if you have one)">
          <Input name="eventDate" type="date" />
        </Field>
      </div>
      <Field label="Where">
        <Input name="location" autoComplete="off" />
      </Field>
      {type.extra.length ? (
        <div className="pm-pair">
          {type.extra.map((x) => (
            <Field key={x.name} label={x.label}>
              <Input
                name={`x:${x.name}`}
                type={x.kind === "number" ? "number" : "text"}
                inputMode={x.kind === "number" ? "numeric" : undefined}
                min={x.kind === "number" ? 0 : undefined}
              />
            </Field>
          ))}
        </div>
      ) : null}
      <Field label="Budget">
        <Select name="budget" defaultValue={budgetOptions[0]}>
          {budgetOptions.map((b) => (
            <option key={b}>{b}</option>
          ))}
        </Select>
      </Field>
      <Field label="Tell me about it" hint={type.messageHint} error={errors.message} required>
        <Textarea name="message" rows={5} autoGrow />
      </Field>
      <div aria-hidden className="pm-honeypot">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div className="pm-stack">
        <Checkbox
          name="consent"
          aria-invalid={errors.consent ? true : undefined}
          label={
            <>
              I agree that my message is stored so you can reply, and that you may email me about it. See the{" "}
              <NextLink href="/privacy" target={embed ? "_blank" : undefined} className="pm-link">
                privacy page
              </NextLink>
              .
            </>
          }
        />
        <FormMessage>{errors.consent}</FormMessage>
      </div>
      {state === "error" ? (
        <Alert tone="danger">
          {problem}{" "}
          <a href={`mailto:${fallbackEmail}`} className="pm-link">
            Email {fallbackEmail}
          </a>
        </Alert>
      ) : null}
      <div>
        <Button type="submit" size="lg" loading={state === "sending"}>
          Send inquiry
        </Button>
      </div>
    </form>
  );
}
