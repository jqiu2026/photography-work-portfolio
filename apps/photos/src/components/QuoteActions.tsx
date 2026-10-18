"use client";

import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  NumberInput,
} from "@holominimal/ui";
import { useRouter } from "next/navigation";
import { type ChangeEvent, useState, useTransition } from "react";
import { acceptQuoteAction, declineQuoteAction, repriceQuoteAction } from "@/app/client/quote-actions";
import { DataList, DataListItem, Field, FormMessage, Input } from "@/components/ui";

export type Upsell = { id: string; name: string; price: string; unit: string; qty: number; max: number };
const usd = (c: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(c / 100);

/** Upsells (re-priced on the server), accept with a typed name, or decline (asked twice: it cannot be undone). */
export function QuoteActions({
  token,
  upsells,
  open,
  depositCents,
}: { token: string; upsells: Upsell[]; open: boolean; depositCents: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [name, setName] = useState("");
  const [agree, setAgree] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const run = (fn: () => Promise<{ ok: boolean; message?: string; error?: string; payUrl?: string }>) =>
    start(async () => {
      const r = await fn();
      setMsg({ ok: r.ok, text: (r.ok ? r.message : r.error) ?? "" });
      if (r.ok && r.payUrl) return router.push(r.payUrl);
      if (r.ok) router.refresh();
    });
  if (!open) return null;
  return (
    <div className="pm-quote-actions">
      {upsells.length ? (
        <section aria-labelledby="q-add">
          <h2 id="q-add" className="pm-subhead">
            Add to your quote
          </h2>
          <DataList>
            {upsells.map((u) => (
              <DataListItem
                key={u.id}
                description={`${u.price} ${u.unit}`}
                actions={
                  <NumberInput
                    aria-label={`${u.name} quantity`}
                    value={u.qty}
                    min={0}
                    max={u.max}
                    disabled={pending}
                    onValueChange={(n) => run(() => repriceQuoteAction(token, [{ id: u.id, qty: n ?? 0 }]))}
                  />
                }
              >
                {u.name}
              </DataListItem>
            ))}
          </DataList>
        </section>
      ) : null}
      <form
        className="pm-stack"
        onSubmit={(e) => {
          e.preventDefault();
          run(() => acceptQuoteAction(token, name, agree));
        }}
      >
        <Field label="Type your full name to accept">
          <Input
            value={name}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            autoComplete="name"
          />
        </Field>
        <Checkbox
          label="I have read this quote and its terms, and I accept it."
          checked={agree}
          onChange={(e) => setAgree(e.target.checked)}
        />
        <div className="pm-row">
          <Button type="submit" size="lg" loading={pending}>
            {depositCents > 0 ? `Accept and pay the ${usd(depositCents)} deposit` : "Accept"}
          </Button>
          <Button type="button" variant="ghost" disabled={pending} onClick={() => setDeclining(true)}>
            Decline
          </Button>
        </div>
        <FormMessage ok={msg?.ok}>{msg?.text}</FormMessage>
      </form>
      <Dialog open={declining} onOpenChange={setDeclining}>
        <DialogContent size="sm">
          <DialogTitle>Decline this quote?</DialogTitle>
          <DialogDescription>The photographer is told, and the quote can no longer be accepted.</DialogDescription>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeclining(false)}>
              Keep it
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setDeclining(false);
                run(() => declineQuoteAction(token));
              }}
            >
              Decline quote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
