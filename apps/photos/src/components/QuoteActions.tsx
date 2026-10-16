"use client";

import { Button, Field, Input } from "@halation/ui";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { acceptQuoteAction, declineQuoteAction, repriceQuoteAction } from "@/app/client/quote-actions";

export type Upsell = { id: string; name: string; price: string; unit: string; qty: number; max: number };
const usd = (c: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(c / 100);

/** Upsells (re-priced on the server), accept with a typed name, or decline. */
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
    <div style={{ display: "grid", gap: "1.5rem", marginTop: "2rem", maxWidth: "36rem" }}>
      {upsells.length ? (
        <fieldset
          style={{
            border: "1px solid var(--hl-line)",
            borderRadius: 12,
            padding: "1rem",
            display: "grid",
            gap: "0.5rem",
          }}
        >
          <legend>Add to your quote</legend>
          {upsells.map((u) => (
            <label key={u.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", minHeight: 44 }}>
              <input
                type="number"
                min={0}
                max={u.max}
                value={u.qty}
                aria-label={`${u.name} quantity`}
                style={{ width: "4.5rem" }}
                disabled={pending}
                onChange={(e) => run(() => repriceQuoteAction(token, [{ id: u.id, qty: Number(e.target.value) }]))}
              />
              <span>
                {u.name}{" "}
                <small style={{ color: "var(--hl-muted)" }}>
                  {u.price} {u.unit}
                </small>
              </span>
            </label>
          ))}
        </fieldset>
      ) : null}
      <div style={{ display: "grid", gap: "0.75rem" }}>
        <Field label="Type your full name to accept">
          <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        </Field>
        <label style={{ display: "flex", gap: "0.6rem", alignItems: "flex-start" }}>
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            style={{ marginTop: "0.3rem" }}
          />
          <span>I have read this quote and its terms, and I accept it.</span>
        </label>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <Button type="button" disabled={pending} onClick={() => run(() => acceptQuoteAction(token, name, agree))}>
            {depositCents > 0 ? `Accept and pay the ${usd(depositCents)} deposit` : "Accept"}
          </Button>
          <Button type="button" variant="ghost" disabled={pending} onClick={() => run(() => declineQuoteAction(token))}>
            Decline
          </Button>
        </div>
      </div>
      {msg ? (
        <p role={msg.ok ? "status" : "alert"} style={{ color: msg.ok ? undefined : "var(--hl-danger, #b00020)" }}>
          {msg.text}
        </p>
      ) : null}
    </div>
  );
}
