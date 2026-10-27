"use client";

import { useActionState } from "react";
import { type LinkState, requestLinkAction } from "@/app/(site)/library/actions";
import { Button, Field, FormMessage, Input } from "@/components/ui";

export function SignInForm() {
  const [state, run, pending] = useActionState<LinkState, FormData>(requestLinkAction, null);
  return (
    <form action={run} className="mu-form" aria-label="Sign in to your library">
      <Field label="Email you used to buy" hint="We send a one-time link. No password.">
        <Input name="email" type="email" autoComplete="email" required />
      </Field>
      <div>
        <Button type="submit" loading={pending}>
          Email me a link
        </Button>
      </div>
      {state ? <FormMessage ok={state.ok}>{state.message}</FormMessage> : null}
    </form>
  );
}
