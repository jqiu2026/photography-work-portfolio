"use client";

import { useActionState } from "react";
import { commissionAction } from "@/app/(site)/commission/actions";
import { Button, Field, FormMessage, Input, Textarea } from "@/components/ui";

export function CommissionForm() {
  const [state, run, pending] = useActionState(commissionAction, null);
  const fe = state && !state.ok ? state.fieldErrors : undefined;
  return (
    <form action={run} className="mu-form" aria-label="Commission inquiry">
      <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", height: 0, overflow: "hidden" }}>
        <label>
          Leave this empty
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <Field label="Your name" error={fe?.name}>
        <Input name="name" autoComplete="name" required />
      </Field>
      <Field label="Email" error={fe?.email}>
        <Input name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label="Ensemble or organization (optional)">
        <Input name="organization" autoComplete="organization" />
      </Field>
      <Field label="Who will play it (optional)" hint="For example: brass quintet, string orchestra, solo cello.">
        <Input name="forces" />
      </Field>
      <Field label="Occasion (optional)">
        <Input name="occasion" />
      </Field>
      <Field label="Needed by (optional)">
        <Input name="deadline" type="date" />
      </Field>
      <Field label="Budget (optional)">
        <Input name="budget" placeholder="A number or a range" />
      </Field>
      <Field label="What are you imagining?" error={fe?.message}>
        <Textarea name="message" rows={6} required minLength={10} />
      </Field>
      <div>
        <Button type="submit" loading={pending}>
          Send inquiry
        </Button>
      </div>
      {state && !state.ok && !state.fieldErrors ? <FormMessage>{state.error}</FormMessage> : null}
      {state?.ok ? <FormMessage ok>{state.message}</FormMessage> : null}
    </form>
  );
}
