"use client";

import { type FormEvent, useState } from "react";
import { Button, Field, FormMessage, Input, Select, Textarea } from "./ui";

/**
 * Contact form. It posts JSON to the site's inbox route (stored, owner notified); if the inbox is unavailable it falls back
 * to opening the visitor's email app with the message prefilled. The hidden "website" field is a honeypot.
 */
export function ContactForm({ to, endpoint }: { to: string; endpoint: string }) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [problem, setProblem] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (f.get("website")) return;
    const name = String(f.get("name") ?? "").trim();
    const email = String(f.get("email") ?? "").trim();
    const message = String(f.get("message") ?? "").trim();
    const topic = String(f.get("topic") ?? "General");
    const next: Record<string, string> = {};
    if (!name) next.name = "Please tell me your name.";
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = "That doesn't look like an email address.";
    if (message.length < 5) next.message = "Say a little more so I know how to help.";
    setErrors(next);
    if (Object.keys(next).length) return;
    const mailto = () => {
      window.location.href = `mailto:${to}?subject=${encodeURIComponent(`[${topic}] from ${name}`)}&body=${encodeURIComponent(`${message}\n\n${name}\n${email}`)}`;
    };
    setState("sending");
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, topic, message, website: "" }),
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
      if (j.fallback === "mailto") mailto();
    } catch {
      setProblem("Could not reach the server. You can email me directly instead.");
      setState("error");
    }
  }

  if (state === "sent")
    return (
      <div role="status" className="hb-note">
        <p style={{ margin: 0, fontSize: "var(--hm-text-lg)" }}>Thanks, your message is on its way.</p>
        <p className="hb-muted" style={{ margin: "0.4rem 0 0" }}>
          I read everything and will reply by email.
        </p>
      </div>
    );
  return (
    <form onSubmit={submit} noValidate className="hb-form" aria-label="Send a message">
      <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", height: 0, overflow: "hidden" }}>
        <label>
          Leave this empty
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <Field label="Your name" error={errors.name}>
        <Input name="name" autoComplete="name" required />
      </Field>
      <Field label="Email" error={errors.email}>
        <Input name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label="Topic">
        <Select
          name="topic"
          defaultValue="General"
          options={["General", "Photography", "Music", "Flying", "Licensing a photograph"].map((t) => ({
            value: t,
            label: t,
          }))}
        />
      </Field>
      <Field label="Message" error={errors.message}>
        <Textarea name="message" rows={6} required />
      </Field>
      <div>
        <Button type="submit" loading={state === "sending"}>
          Send message
        </Button>
      </div>
      {state === "error" ? <FormMessage>{problem}</FormMessage> : null}
    </form>
  );
}
