"use client";

import { Button, Input } from "@holominimal/ui";
import { type FormEvent, useState } from "react";

/**
 * A one-field signup in the footer. Double opt-in: the visitor gets an email with a confirm link, and is on the list
 * only after clicking it. The honeypot is invisible; the answer is the same for new and existing addresses.
 */
export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setError("");
    setState("sending");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "footer", website: String(form.get("website") ?? "") }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(j.error ?? "Something went wrong.");
        return setState("idle");
      }
      setState("sent");
      setEmail("");
    } catch {
      setError("Could not reach the server.");
      setState("idle");
    }
  }
  if (state === "sent")
    return (
      <p className="pub-news__done" role="status">
        Check your inbox for a confirmation link.
      </p>
    );
  return (
    <form className="pub-news" onSubmit={submit} noValidate aria-label="Newsletter signup">
      <label className="pub-news__label" htmlFor="pub-news-email">
        Occasional news, no spam
      </label>
      <div className="pub-news__row">
        <Input
          id="pub-news-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={error ? true : undefined}
        />
        <Button type="submit" variant="secondary" loading={state === "sending"}>
          Sign up
        </Button>
      </div>
      <div aria-hidden className="pm-honeypot">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {error ? (
        <p className="pub-news__error" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
