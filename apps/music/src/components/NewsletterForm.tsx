"use client";

import { useServerForm } from "@/components/useServerForm";
import { subscribeAction } from "@/app/(site)/newsletter/actions";
import { Button, Field, FormMessage, Input } from "@/components/ui";

export function NewsletterForm() {
  const { state, pending, onSubmit } = useServerForm((fd) => subscribeAction(null, fd));
  return (
    <form onSubmit={onSubmit} className="mu-form" aria-label="Newsletter">
      <Field label="Email" error={state && !state.ok ? state.error : undefined}>
        <Input name="email" type="email" autoComplete="email" required />
      </Field>
      <div className="mu-row">
        <Button type="submit" loading={pending}>
          Subscribe
        </Button>
        <Button asChild variant="ghost">
          <a href="/privacy">Privacy</a>
        </Button>
      </div>
      {state?.ok ? <FormMessage ok>{state.message}</FormMessage> : null}
    </form>
  );
}
