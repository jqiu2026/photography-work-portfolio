"use client";

import { useServerForm } from "@/components/useServerForm";
import { type CheckoutState, checkoutAction } from "@/app/(site)/checkout/actions";
import { Button, Field, FormMessage, Input } from "@/components/ui";

export function CheckoutForm({ needsOrganization }: { needsOrganization: boolean }) {
  const { state, pending, onSubmit } = useServerForm((fd) => checkoutAction(null, fd));
  const fe = state?.fieldErrors;
  return (
    <form onSubmit={onSubmit} className="mu-form" aria-label="Checkout">
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
