"use client";

import { useActionState } from "react";
import { type CheckoutState, checkoutAction } from "@/app/(site)/checkout/actions";
import { Button, Field, FormMessage, Input } from "@/components/ui";

export function CheckoutForm({ needsOrganization }: { needsOrganization: boolean }) {
  const [state, run, pending] = useActionState<CheckoutState, FormData>(checkoutAction, null);
  const fe = state?.fieldErrors;
  return (
    <form action={run} className="mu-form" aria-label="Checkout">
      <Field label="Your name" hint="Printed on every page of your copy." error={fe?.name}>
        <Input name="name" autoComplete="name" required />
      </Field>
      <Field label="Email" hint="Your receipt and downloads are sent here." error={fe?.email}>
        <Input name="email" type="email" autoComplete="email" required />
      </Field>
      {needsOrganization ? (
        <Field label="Ensemble or institution" hint="Named on the license." error={fe?.organization}>
          <Input name="organization" autoComplete="organization" required />
        </Field>
      ) : null}
      <div>
        <Button type="submit" loading={pending}>
          Continue to payment
        </Button>
      </div>
      {state && !state.fieldErrors ? <FormMessage>{state.error}</FormMessage> : null}
    </form>
  );
}
