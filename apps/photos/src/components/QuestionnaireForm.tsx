"use client";

import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import { useState, useTransition } from "react";
import { submitQuestionnaireAction } from "@/app/client/questionnaire-actions";

type F = { id: string; label: string; type: string; required?: boolean; options?: string[]; hint?: string };

export function QuestionnaireForm({ token, title, fields }: { token: string; title: string; fields: F[] }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const answers: Record<string, string> = {};
    for (const x of fields) answers[x.id] = String(f.get(x.id) ?? "");
    start(async () => {
      const r = await submitQuestionnaireAction(token, answers);
      setMsg({ ok: r.ok, text: r.ok ? r.message : r.error });
    });
  }
  if (msg?.ok)
    return (
      <section className="st-card">
        <h1 className="st-title">{title}</h1>
        <p role="status" className="st-note">
          {msg.text}
        </p>
      </section>
    );
  return (
    <form onSubmit={submit} noValidate className="st-card st-form" aria-label={title}>
      <h1 className="st-title">{title}</h1>
      {fields.map((x) => (
        <Field key={x.id} label={`${x.label}${x.required ? " *" : ""}`} hint={x.hint}>
          {x.type === "longtext" ? (
            <Textarea name={x.id} />
          ) : x.type === "choice" ? (
            <Select name={x.id} defaultValue="">
              <option value="">Choose…</option>
              {x.options?.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </Select>
          ) : x.type === "yesno" ? (
            <Select name={x.id} defaultValue="">
              <option value="">Choose…</option>
              <option>Yes</option>
              <option>No</option>
            </Select>
          ) : (
            <Input name={x.id} type={x.type === "date" ? "date" : "text"} />
          )}
        </Field>
      ))}
      {msg && !msg.ok ? (
        <p role="alert" className="st-error">
          {msg.text}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        Send my answers
      </Button>
    </form>
  );
}
