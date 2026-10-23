"use client";

import { checkEmail } from "@jerryqiu/db/email-check";
import NextLink from "next/link";
import { type FormEvent, useState } from "react";
import { Button, Checkbox, Field, FormMessage, Input, ResultCard, Textarea } from "@/components/ui";

/** The form for "please remove me from a photograph". Answers within a few days; nothing is published or shared. */
export function PrivacyRequestForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [problem, setProblem] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? "").trim();
    const next: Record<string, string> = {};
    if (get("name").length < 2) next.name = "Please tell me your name.";
    const mail = checkEmail(get("email"));
    if (!mail.ok) next.email = mail.message;
    if (get("details").length < 20) next.details = "Tell me where you saw the photograph and which one it is.";
    if (!f.get("consent")) next.consent = "Please tick the box so I can keep your request.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setState("sending");
    setProblem("");
    try {
      const res = await fetch("/api/privacy-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: get("name"),
          email: get("email"),
          details: get("details"),
          consent: true,
          website: get("website"),
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.ok) return setState("sent");
      setProblem(j.error ?? "Something went wrong.");
    } catch {
      setProblem("Could not reach the server.");
    }
    setState("idle");
  }
  if (state === "sent")
    return (
      <ResultCard
        level={2}
        title="Thank you, I have your request."
        message="I will find the photograph, take it down, and email you when it is done. This usually takes a few days."
      />
    );
  return (
    <form onSubmit={submit} noValidate aria-label="Photo removal request" className="pm-form">
      <div className="pm-pair">
        <Field label="Your name" error={errors.name} required>
          <Input name="name" autoComplete="name" />
        </Field>
        <Field label="Email" error={errors.email} required>
          <Input name="email" type="email" autoComplete="email" />
        </Field>
      </div>
      <Field
        label="Which photograph?"
        hint="Where you saw it (the page address helps), which event, and where you are in the picture."
        error={errors.details}
        required
      >
        <Textarea name="details" rows={5} autoGrow />
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
              I agree that you keep this request and my email to deal with it. See the{" "}
              <NextLink href="/privacy" className="pm-link">
                privacy page
              </NextLink>
              .
            </>
          }
        />
        <FormMessage>{errors.consent}</FormMessage>
      </div>
      {problem ? (
        <p role="alert" className="bw-err">
          {problem}
        </p>
      ) : null}
      <div>
        <Button type="submit" size="lg" loading={state === "sending"}>
          Send the request
        </Button>
      </div>
    </form>
  );
}
