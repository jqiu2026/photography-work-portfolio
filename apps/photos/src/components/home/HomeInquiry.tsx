"use client";

import { type FormEvent, useRef, useState } from "react";
import { END } from "@/content/home-story";
import { shootTypes } from "@/content/shoot-types";

/**
 * The last thing on the home page: a short inquiry form that posts to the same `/api/inquiry` as the full booking
 * form (so it becomes a scored lead and sends the confirmation), with an email link as the fallback.
 */
export function HomeInquiry({ email }: { email: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [problem, setProblem] = useState("");
  const form = useRef<HTMLFormElement>(null);
  const copy = END.form;

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (f.get("website")) return;
    const get = (k: string) => String(f.get(k) ?? "").trim();
    const next: Record<string, string> = {};
    if (get("name").length < 2) next.name = copy.errors.name;
    if (!/^\S+@\S+\.\S+$/.test(get("email"))) next.email = copy.errors.email;
    if (get("message").length < 5) next.message = copy.errors.message;
    if (!f.get("consent")) next.consent = copy.errors.consent;
    setErrors(next);
    if (Object.keys(next).length) return;
    setState("sending");
    try {
      const q = new URLSearchParams(window.location.search);
      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: get("name"),
          email: get("email"),
          phone: "",
          shootType: get("type") || "other",
          eventDate: get("date"),
          location: "",
          budget: "Not sure yet",
          message: get("message"),
          details: {},
          consent: true,
          website: get("website"),
          source: (q.get("ref") ?? q.get("utm_source") ?? "home").slice(0, 80),
          referrer: document.referrer.slice(0, 300),
          utm: {},
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string; fieldErrors?: Record<string, string> };
      if (res.ok) return setState("sent");
      if (j.fieldErrors) setErrors(j.fieldErrors);
      setProblem(j.error ?? copy.errors.server);
      setState("error");
    } catch {
      setProblem(copy.errors.network);
      setState("error");
    }
  }

  if (state === "sent")
    return (
      <div className="hj-form hj-form--sent" role="status">
        <h3>{copy.sentTitle}</h3>
        <p>{copy.sentText}</p>
        <button
          type="button"
          className="hj-form-again"
          onClick={() => {
            setState("idle");
            setErrors({});
          }}
        >
          {copy.again}
        </button>
      </div>
    );

  return (
    <form className="hj-form" ref={form} onSubmit={submit} noValidate aria-labelledby="hj-form-title">
      <h3 id="hj-form-title">{copy.title}</h3>
      <div className="hj-form-pair">
        <label className="hj-field" data-error={errors.name ? "" : undefined}>
          <span>{copy.name}</span>
          <input name="name" autoComplete="name" aria-invalid={errors.name ? true : undefined} />
          <small>{errors.name}</small>
        </label>
        <label className="hj-field" data-error={errors.email ? "" : undefined}>
          <span>{copy.email}</span>
          <input name="email" type="email" autoComplete="email" aria-invalid={errors.email ? true : undefined} />
          <small>{errors.email}</small>
        </label>
      </div>
      <div className="hj-form-pair">
        <label className="hj-field">
          <span>{copy.type}</span>
          <select name="type" defaultValue="event">
            {shootTypes.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className="hj-field">
          <span>{copy.date}</span>
          <input name="date" type="date" />
        </label>
      </div>
      <label className="hj-field" data-error={errors.message ? "" : undefined}>
        <span>{copy.message}</span>
        <textarea name="message" rows={3} aria-invalid={errors.message ? true : undefined} />
        <small>{errors.message}</small>
      </label>
      <div aria-hidden className="hj-honey">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <label className="hj-check" data-error={errors.consent ? "" : undefined}>
        <input type="checkbox" name="consent" />
        <span>{copy.consent}</span>
      </label>
      <small className="hj-check-error">{errors.consent}</small>
      <div className="hj-form-row">
        <button
          type="submit"
          className="hj-send"
          disabled={state === "sending"}
          data-sending={state === "sending" ? "" : undefined}
        >
          {state === "sending" ? copy.sending : copy.send}
        </button>
        <a href={`mailto:${email}`} className="hj-form-mail">
          {copy.orEmail} {email}
        </a>
      </div>
      {state === "error" ? (
        <p className="hj-form-problem" role="alert">
          {problem}
        </p>
      ) : null}
    </form>
  );
}
