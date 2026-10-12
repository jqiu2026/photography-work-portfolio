"use client";

import { Button, Field, Input, Select, Textarea } from "@placeholder/ui";
import NextLink from "next/link";
import { useState, type FormEvent } from "react";

/**
 * Phase 1 contact form: opens the visitor's email app with the message prefilled (nothing is stored or sent
 * by this site). The hidden "website" field is a honeypot. Phase 2 replaces this with a stored inbox.
 */
export function ContactForm({ to }: { to: string }) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  function submit(e: FormEvent<HTMLFormElement>) {
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
    window.location.href = `mailto:${to}?subject=${encodeURIComponent(`[${topic}] from ${name}`)}&body=${encodeURIComponent(body)}`;
  }
  return (
    <form onSubmit={submit} noValidate style={{ display: "grid", gap: "1.25rem", maxWidth: "36rem" }}>
      <Field label="Your name" error={errors.name} required>
        <Input name="name" autoComplete="name" />
      </Field>
      <Field label="Email" error={errors.email} required>
        <Input name="email" type="email" autoComplete="email" />
      </Field>
      <Field label="Topic">
        <Select name="topic">
          <option>General</option>
          <option>Photography</option>
          <option>Music</option>
          <option>Flying</option>
          <option>Licensing a photograph</option>
        </Select>
      </Field>
      <Field label="Message" error={errors.message} required>
        <Textarea name="message" />
      </Field>
      <div aria-hidden style={{ position: "absolute", left: "-9999px" }}>
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <p style={{ fontSize: "var(--ph-text-sm)", color: "var(--ph-muted)" }}>
        Pressing send opens your email app with this message. Nothing is stored on this site. See the{" "}
        <NextLink href="/privacy" style={{ textDecoration: "underline" }}>
          privacy page
        </NextLink>
        .
      </p>
      <div>
        <Button type="submit">Open in my email app</Button>
      </div>
    </form>
  );
}
