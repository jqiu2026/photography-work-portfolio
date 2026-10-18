"use client";

import { Alert, Button, Card, Checkbox, Field, Input, Radio, RadioGroup, Text } from "@holominimal/ui";
import { useActionState, useState } from "react";
import { payInvoiceAction, signContractAction } from "@/app/client/actions";
import { FormMessage, ResultCard } from "@/components/ui";

/** The client signs a contract from its emailed link: read it, type a name (and a guardian's for a minor), agree twice. */
export function SignForm({
  token,
  body,
  title,
  minor = false,
  subject,
}: { token: string; body: string; title: string; minor?: boolean; subject?: string | null }) {
  const [r, action, pending] = useActionState(signContractAction.bind(null, token), null);
  const [name, setName] = useState("");
  const [agree, setAgree] = useState(false);
  const [consent, setConsent] = useState(false);
  const [guardian, setGuardian] = useState("");
  if (r?.ok) return <ResultCard eyebrow={title} title="Signed" message={r.message} />;
  return (
    <Card asChild variant="outlined" padding="lg" className="pm-stack">
      <form action={action} aria-label={title}>
        <h1 className="pm-doc-title">{title}</h1>
        <pre className="st-contract" tabIndex={0} aria-label="Contract text">
          {body}
        </pre>
        <Field label="Type your full name to sign">
          <Input name="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        </Field>
        {minor ? (
          <Field label={`Parent or legal guardian: type your full name${subject ? ` (signing for ${subject})` : ""}`}>
            <Input name="guardian" value={guardian} onChange={(e) => setGuardian(e.target.value)} autoComplete="off" />
          </Field>
        ) : null}
        <Checkbox
          name="agree"
          label="I agree to these terms."
          checked={agree}
          onChange={(e) => setAgree(e.target.checked)}
        />
        <Checkbox
          name="consent"
          label="I agree to sign, and to keep records of this agreement, electronically."
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
        />
        <FormMessage>{r && !r.ok ? r.error : null}</FormMessage>
        <div>
          <Button type="submit" size="lg" loading={pending}>
            Sign contract
          </Button>
        </div>
      </form>
    </Card>
  );
}

export type PayOptions = { tips: number[]; ach: boolean; surchargeBp: number };

/** Paying an invoice: method (card or ACH), an optional tip, then the card (mock) or a hand-off to Stripe. */
export function PayForm({
  token,
  mode,
  amount,
  options = { tips: [], ach: false, surchargeBp: 0 },
}: { token: string; mode: "stripe" | "mock"; amount: string; options?: PayOptions }) {
  const [r, action, pending] = useActionState(payInvoiceAction.bind(null, token), null);
  const [card, setCard] = useState({ number: "", exp: "", cvc: "" });
  const [method, setMethod] = useState<"card" | "ach">("card");
  const [tip, setTip] = useState("0");
  const surcharge = (options.surchargeBp / 100).toFixed(2);
  if (r?.ok) return <ResultCard title="Paid" message={r.message} />;
  return (
    <Card asChild variant="outlined" padding="lg" className="pm-stack">
      <form action={action} aria-label="Payment">
        <h1 className="pm-doc-title">Pay {amount}</h1>
        {options.ach ? (
          <RadioGroup
            legend="How would you like to pay?"
            name="method"
            value={method}
            onValueChange={(v) => setMethod(v as "card" | "ach")}
          >
            <Radio
              value="card"
              label="Card"
              description={
                options.surchargeBp ? `A ${surcharge}% surcharge applies to credit cards, never debit.` : undefined
              }
            />
            <Radio
              value="ach"
              label="Bank transfer (ACH)"
              description={options.surchargeBp ? "No surcharge." : undefined}
            />
          </RadioGroup>
        ) : options.surchargeBp ? (
          <Text size="sm" tone="muted" role="note">
            A {surcharge}% surcharge applies to credit cards (never debit cards). It is shown before you pay.
          </Text>
        ) : null}
        {options.tips.length ? (
          <RadioGroup
            legend="Add a tip (optional)"
            name="tip"
            value={tip}
            onValueChange={setTip}
            orientation="horizontal"
          >
            <Radio value="0" label="No tip" />
            {options.tips.map((t) => (
              <Radio key={t} value={String(t)} label={`${t}%`} />
            ))}
            <Radio value="custom" label="Other amount" />
          </RadioGroup>
        ) : null}
        {tip === "custom" ? (
          <Field label="Tip in dollars">
            <Input name="tipCustom" inputMode="decimal" />
          </Field>
        ) : null}
        {mode === "mock" && method === "ach" ? (
          <Alert tone="info" role="note">
            Mock bank transfer: no bank account is used and nothing is charged.
          </Alert>
        ) : mode === "mock" ? (
          <>
            <Alert tone="info" role="note">
              Mock payment. Use the test card 4242 4242 4242 4242, any future expiry, any 3 digits. No card is charged.
            </Alert>
            <Field label="Card number">
              <Input
                name="number"
                inputMode="numeric"
                autoComplete="off"
                value={card.number}
                onChange={(e) => setCard({ ...card, number: e.target.value })}
              />
            </Field>
            <div className="pm-row pm-row--fields">
              <Field label="Expiry (MM / YY)">
                <Input
                  name="exp"
                  autoComplete="off"
                  value={card.exp}
                  onChange={(e) => setCard({ ...card, exp: e.target.value })}
                />
              </Field>
              <Field label="Security code">
                <Input
                  name="cvc"
                  inputMode="numeric"
                  autoComplete="off"
                  value={card.cvc}
                  onChange={(e) => setCard({ ...card, cvc: e.target.value })}
                />
              </Field>
            </div>
          </>
        ) : (
          <Text size="sm" tone="muted">
            You will be taken to a secure Stripe page to pay. The studio never sees your card.
          </Text>
        )}
        <FormMessage>{r && !r.ok ? r.error : null}</FormMessage>
        <div>
          <Button type="submit" size="lg" loading={pending}>
            Pay {amount}
          </Button>
        </div>
      </form>
    </Card>
  );
}
