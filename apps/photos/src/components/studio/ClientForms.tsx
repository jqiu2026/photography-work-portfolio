"use client";

import { useActionState, useState, useTransition } from "react";
import {
  leaveGalleryAction,
  openGalleryAction,
  payInvoiceAction,
  signContractAction,
  toggleFavoriteAction,
  type ClientResult,
} from "@/app/client/actions";
import "./studio.css";

const Err = ({ r }: { r: ClientResult | null }) =>
  r && !r.ok ? (
    <p role="alert" className="st-error">
      {r.error}
    </p>
  ) : null;

export function PassForm() {
  const [r, action, pending] = useActionState(openGalleryAction, null);
  // controlled inputs: React 19 resets uncontrolled fields after every form action, which would wipe a typo'd passcode
  const [pass, setPass] = useState("");
  return (
    <form action={action} className="st-card st-form" aria-labelledby="pf">
      <h2 id="pf">Open your gallery</h2>
      <label>
        Passcode
        <input name="passcode" value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="off" required />
      </label>
      <Err r={r} />
      <button className="st-btn" type="submit" disabled={pending}>
        Open my gallery
      </button>
    </form>
  );
}

export function LeaveButton() {
  return (
    <form action={leaveGalleryAction}>
      <button className="st-btn st-btn--ghost" type="submit">
        Close gallery
      </button>
    </form>
  );
}

export function FavoriteButton({ mediaId, label, initial }: { mediaId: string; label: string; initial: boolean }) {
  const [fav, setFav] = useState(initial);
  const [err, setErr] = useState<string>();
  const [pending, start] = useTransition();
  return (
    <>
      <button
        type="button"
        className="st-fav"
        aria-pressed={fav}
        aria-label={`${fav ? "Remove" : "Add"} ${label} ${fav ? "from" : "to"} favourites`}
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await toggleFavoriteAction(mediaId);
            if (r.ok) setFav((f) => !f);
            else setErr(r.error);
          })
        }
      >
        {fav ? "♥" : "♡"}
      </button>
      {err ? (
        <span role="alert" className="st-error">
          {err}
        </span>
      ) : null}
    </>
  );
}

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
  if (r?.ok)
    return (
      <section className="st-card">
        <h1 className="st-title">Signed</h1>
        <p className="st-note" role="status">
          {r.message}
        </p>
      </section>
    );
  return (
    <form action={action} className="st-card st-form">
      <h1 className="st-title">{title}</h1>
      <pre className="st-contract">{body}</pre>
      <label>
        Type your full name to sign
        <input name="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
      </label>
      {minor ? (
        <label>
          Parent or legal guardian: type your full name{subject ? ` (signing for ${subject})` : ""}
          <input name="guardian" value={guardian} onChange={(e) => setGuardian(e.target.value)} autoComplete="off" />
        </label>
      ) : null}
      <label className="st-check">
        <input type="checkbox" name="agree" checked={agree} onChange={(e) => setAgree(e.target.checked)} /> I agree to
        these terms.
      </label>
      <label className="st-check">
        <input type="checkbox" name="consent" checked={consent} onChange={(e) => setConsent(e.target.checked)} /> I
        agree to sign, and to keep records of this agreement, electronically.
      </label>
      <Err r={r} />
      <button className="st-btn" type="submit" disabled={pending}>
        Sign contract
      </button>
    </form>
  );
}

export function PayForm({ token, mode, amount }: { token: string; mode: "stripe" | "mock"; amount: string }) {
  const [r, action, pending] = useActionState(payInvoiceAction.bind(null, token), null);
  const [card, setCard] = useState({ number: "", exp: "", cvc: "" });
  if (r?.ok)
    return (
      <section className="st-card">
        <h1 className="st-title">Paid</h1>
        <p className="st-note" role="status">
          {r.message}
        </p>
      </section>
    );
  return (
    <form action={action} className="st-card st-form">
      <h1 className="st-title">Pay {amount}</h1>
      {mode === "mock" ? (
        <>
          <p className="st-note">
            Mock payment. Use the test card 4242 4242 4242 4242, any future expiry, any 3 digits. No card is charged.
          </p>
          <label>
            Card number
            <input
              name="number"
              inputMode="numeric"
              autoComplete="off"
              value={card.number}
              onChange={(e) => setCard({ ...card, number: e.target.value })}
            />
          </label>
          <label>
            Expiry (MM / YY)
            <input
              name="exp"
              autoComplete="off"
              value={card.exp}
              onChange={(e) => setCard({ ...card, exp: e.target.value })}
            />
          </label>
          <label>
            Security code
            <input
              name="cvc"
              inputMode="numeric"
              autoComplete="off"
              value={card.cvc}
              onChange={(e) => setCard({ ...card, cvc: e.target.value })}
            />
          </label>
        </>
      ) : (
        <p className="st-note">You will be taken to a secure Stripe page to pay. The studio never sees your card.</p>
      )}
      <Err r={r} />
      <button className="st-btn" type="submit" disabled={pending}>
        {pending ? "One moment…" : `Pay ${amount}`}
      </button>
    </form>
  );
}
