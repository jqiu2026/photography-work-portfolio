"use client";

import { Radio, RadioGroup } from "@holominimal/ui";
import { useState, useTransition } from "react";
import { submitQuestionnaireAction } from "@/app/client/questionnaire-actions";
import { Button, Card, Field, FormMessage, Input, ResultCard, Select, Textarea } from "@/components/ui";

type F = { id: string; label: string; type: string; required?: boolean; options?: string[]; hint?: string };

/** A questionnaire from its emailed link. Yes/no and short choices are radio buttons; long lists stay a menu. */
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
  if (msg?.ok) return <ResultCard eyebrow={title} title="Thank you" message={msg.text} />;
  return (
    <Card asChild variant="outlined" padding="lg" className="pm-stack">
      <form onSubmit={submit} noValidate aria-label={title}>
        <h1 className="pm-doc-title">{title}</h1>
        {fields.map((x) => {
          const choices = x.type === "yesno" ? ["Yes", "No"] : x.type === "choice" ? (x.options ?? []) : null;
          if (choices && choices.length <= 4)
            return (
              <RadioGroup
                key={x.id}
                name={x.id}
                legend={`${x.label}${x.required ? " *" : ""}`}
                orientation={choices.length <= 2 ? "horizontal" : "vertical"}
              >
                {choices.map((o) => (
                  <Radio key={o} value={o} label={o} />
                ))}
              </RadioGroup>
            );
          return (
            <Field key={x.id} label={x.label} required={x.required} hint={x.hint}>
              {x.type === "longtext" ? (
                <Textarea name={x.id} autoGrow rows={3} />
              ) : choices ? (
                <Select name={x.id} placeholder="Choose…">
                  {choices.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </Select>
              ) : (
                <Input name={x.id} type={x.type === "date" ? "date" : "text"} />
              )}
            </Field>
          );
        })}
        <FormMessage className="st-error">{msg && !msg.ok ? msg.text : null}</FormMessage>
        <div>
          <Button type="submit" size="lg" loading={pending}>
            Send my answers
          </Button>
        </div>
      </form>
    </Card>
  );
}
