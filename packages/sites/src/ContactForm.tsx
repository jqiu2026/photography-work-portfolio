"use client";

import { Button, Field, Input, Select, Textarea } from "@holominimal/ui";
import NextLink from "next/link";
import { useState, type FormEvent } from "react";

/**
 * Contact form. With `endpoint` it posts JSON to the site's inbox route (stored, owner notified); without one, or if the
 * inbox is unavailable, it falls back to opening the visitor's email app with the message prefilled. The hidden
 * "website" field is a honeypot.
 */
export function ContactForm({
  to,
  topics = ["General", "Photography", "Music", "Flying", "Licensing a photograph"],
  privacyHref = "/privacy",
  submitLabel,
  endpoint,
}: {
  to: string;
  topics?: string[];
  privacyHref?: string;
  submitLabel?: string;
  endpoint?: string;
}) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [problem, setProblem] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (f.get("website")) return; // honeypot
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
    const body = `${message}\n\n${name}\n${email}`;
    const mailto = () => {
      window.location.href = `mailto:${to}?subject=${encodeURIComponent(`[${topic}] from ${name}`)}&body=${encodeURIComponent(body)}`;
    };
    if (!endpoint) return mailto();
    setState("sending");
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, topic, message, website: String(f.get("website") ?? "") }),
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
      <div role="status" style={{ maxWidth: "36rem" }}>
        <p style={{ fontSize: "var(--hm-text-lg)" }}>Thanks, your message is on its way.</p>
        <p style={{ color: "var(--hm-muted)" }}>I read everything and will reply by email.</p>
      </div>
    );
  return (
    <form onSubmit={submit} noValidate style={{ display: "grid", gap: "1.25rem", maxWidth: "36rem" }}>
      <Field label="Your name" error={errors.name}>
        <Input name="name" autoComplete="name" required />
      </Field>
      <Field label="Email" error={errors.email}>
        <Input name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label="Topic">
        <Select name="topic" defaultValue="General">
          <option value="General">General</option>
          <option value="Photography">Photography</option>
          <option value="Music">Music</option>
          <option value="Flying">Flying</option>
          <option value="Licensing a photograph">Licensing a photograph</option>
        </Select>
      </Field>
      <Field label="Message" error={errors.message}>
        <Textarea name="message" required />
      </Field>
      <div aria-hidden style={{ position: "absolute", left: "-9999px" }}>
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <p style={{ fontSize: "var(--hm-text-sm)", color: "var(--hm-muted)" }}>
        {endpoint
          ? "Your message is stored so I can reply, and emailed to me. I delete it on request. See the"
          : "Pressing send opens your email app with this message. Nothing is stored on this site. See the"}{" "}
        <NextLink href={privacyHref} style={{ textDecoration: "underline" }}>
          privacy page
        </NextLink>
        .
      </p>
      {state === "error" ? (
        <p role="alert" style={{ color: "var(--hm-danger, #f87171)" }}>
          {problem}{" "}
          <a href={`mailto:${to}`} style={{ textDecoration: "underline" }}>
            Email {to}
          </a>
        </p>
      ) : null}
      <div>
        <Button type="submit" disabled={state === "sending"}>
          {state === "sending" ? "Sending…" : (submitLabel ?? (endpoint ? "Send message" : "Open in my email app"))}
        </Button>
      </div>
    </form>
  );
}
