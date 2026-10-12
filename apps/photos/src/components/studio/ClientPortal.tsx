"use client";

import { invoiceTotal, usd, type Gallery } from "@jerryqiu/mocks";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import "./studio.css";
import { useStudio } from "./useStudio";

const KEY = "mock-portal-session";

/** Entry: passcode or magic link (shown on screen, never emailed). */
export function PortalEntry() {
  const s = useStudio();
  const router = useRouter();
  const [pass, setPass] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [link, setLink] = useState<string>();

  async function withPasscode(e: FormEvent) {
    e.preventDefault();
    setError(undefined);
    const session = await s.portal.withPasscode(pass);
    if (!session) return setError("That passcode doesn't match a gallery. In this mock, try sample-1234.");
    sessionStorage.setItem(KEY, session.galleryId);
    router.push(`/client/g/${session.galleryId}`);
  }
  async function magic(e: FormEvent) {
    e.preventDefault();
    setError(undefined);
    setLink(undefined);
    const m = await s.portal.requestMagicLink(email);
    if (!m) return setError("No gallery is linked to that email. In this mock, try client.a@example.test.");
    sessionStorage.setItem(`${KEY}:ml`, m.token);
    setLink(m.link);
  }
  return (
    <div className="st-grid">
      <section className="st-card" aria-labelledby="pe-pass">
        <h2 id="pe-pass">Open with a passcode</h2>
        <form className="st-form" onSubmit={withPasscode}>
          <label>
            Passcode
            <input value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="off" required />
          </label>
          <button className="st-btn" type="submit">
            Open my gallery
          </button>
        </form>
      </section>
      <section className="st-card" aria-labelledby="pe-ml">
        <h2 id="pe-ml">Or get a link</h2>
        <form className="st-form" onSubmit={magic}>
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <button className="st-btn st-btn--ghost" type="submit">
            Send me a link
          </button>
        </form>
        {link ? (
          <p className="st-note" role="status">
            Mock: no email is sent. Your link is <Link href={link}>{link}</Link>
          </p>
        ) : null}
      </section>
      {error ? (
        <p role="alert" className="st-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function Lock({ children }: { children: React.ReactNode }) {
  return (
    <section className="st-card">
      <p className="st-note">{children}</p>
      <Link href="/client" className="st-btn">
        Back to the client entry
      </Link>
    </section>
  );
}

/** Client gallery: favourites, the contract and the invoice for this shoot. */
export function ClientGallery({ id, magicToken }: { id: string; magicToken?: string }) {
  const s = useStudio();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  useEffect(() => {
    (async () => {
      let ok = sessionStorage.getItem(KEY) === id;
      if (!ok && magicToken) {
        const sess = await s.portal.redeem(magicToken);
        // the portal instance is per page, so also accept the token issued in this browser for this gallery
        ok = !!sess || sessionStorage.getItem(`${KEY}:ml`) === magicToken;
        if (ok) sessionStorage.setItem(KEY, id);
      }
      setAllowed(ok);
    })();
  }, [id, magicToken, s.portal]);
  if (!s.data || allowed === null) return <p className="st-note">Loading…</p>;
  if (!allowed) return <Lock>Enter your passcode or use your link to open this gallery.</Lock>;
  const g: Gallery | undefined = s.data.galleries.find((x) => x.id === id);
  if (!g) return <Lock>That gallery doesn't exist in this mock.</Lock>;
  const contract = s.data.contracts.find((k) => k.shootId === g.shootId);
  const invoice = s.data.invoices.find((i) => i.shootId === g.shootId);
  return (
    <div className="st-wrap" style={{ padding: 0 }}>
      <p className="hl-eyebrow">Your gallery</p>
      <h1 className="st-title">{g.title}</h1>
      <ul className="st-photos" aria-label="Photographs (sample frames)">
        {g.photos.map((p) => {
          const fav = g.favourites.includes(p.id);
          return (
            <li key={p.id} style={{ ["--h" as string]: p.hue } as React.CSSProperties}>
              <span aria-hidden className="st-photo" />
              <span className="st-photo__label">{p.label}</span>
              <button
                type="button"
                className="st-fav"
                aria-pressed={fav}
                aria-label={`${fav ? "Remove" : "Add"} ${p.label} ${fav ? "from" : "to"} favourites`}
                onClick={() => {
                  s.repo.toggleFavourite(g.id, p.id);
                  s.bump();
                }}
              >
                {fav ? "♥" : "♡"}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="st-note" role="status">
        {g.favourites.length} favourite{g.favourites.length === 1 ? "" : "s"} chosen.
      </p>
      <div className="st-grid" style={{ marginTop: "2rem" }}>
        {contract ? (
          <section className="st-card" aria-labelledby="cg-k">
            <h2 id="cg-k">Contract</h2>
            <p className="st-note">
              {contract.status === "signed"
                ? `Signed by ${contract.signedBy}.`
                : contract.status === "sent"
                  ? "Waiting for your signature."
                  : "Not sent yet."}
            </p>
            {contract.status === "sent" && contract.envelopeId ? (
              <Link className="st-btn" href={`/client/sign/${contract.envelopeId}`}>
                Review and sign
              </Link>
            ) : null}
          </section>
        ) : null}
        {invoice ? (
          <section className="st-card" aria-labelledby="cg-i">
            <h2 id="cg-i">Invoice</h2>
            <p className="st-note">
              {usd(invoiceTotal(invoice))} · {invoice.status}
            </p>
            {invoice.status === "sent" ? (
              <Link className="st-btn" href={`/client/pay/${invoice.id}`}>
                Pay now
              </Link>
            ) : null}
            {invoice.status === "paid" ? <p className="st-note">Paid. Receipt {invoice.receiptId}.</p> : null}
          </section>
        ) : null}
      </div>
    </div>
  );
}

/** Contract signing (typed name, mock e-sign). */
export function SignContract({ envelopeId }: { envelopeId: string }) {
  const s = useStudio();
  const [name, setName] = useState("");
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState<string>();
  if (!s.data) return <p className="st-note">Loading…</p>;
  const contract = s.data.contracts.find((k) => k.envelopeId === envelopeId);
  if (!contract) return <Lock>That signing link isn't valid in this mock.</Lock>;
  if (contract.status === "signed")
    return (
      <section className="st-card">
        <h1 className="st-title">Signed</h1>
        <p className="st-note" role="status">
          Signed by {contract.signedBy} on {contract.signedAt?.slice(0, 10)}. (Mock signature.)
        </p>
      </section>
    );
  async function sign(e: FormEvent) {
    e.preventDefault();
    setError(undefined);
    try {
      const env = { id: envelopeId, contractId: contract!.id, url: "", status: "sent" as const, mock: true as const };
      const { signature } = await s.esign.sign(env, { signerName: name, agree });
      s.repo.updateContract(contract!.id, {
        status: "signed",
        signedBy: signature.signerName,
        signedAt: signature.signedAt,
      });
      s.bump();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign.");
    }
  }
  return (
    <form className="st-card st-form" onSubmit={sign}>
      <h1 className="st-title">{contract.title}</h1>
      <pre className="st-contract">{contract.body}</pre>
      <label>
        Type your full name to sign
        <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
      </label>
      <label className="st-check">
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} /> I agree to these terms
        (sample text).
      </label>
      {error ? (
        <p role="alert" className="st-error">
          {error}
        </p>
      ) : null}
      <button className="st-btn" type="submit">
        Sign contract
      </button>
    </form>
  );
}

/** Invoice payment with the Stripe-test-mode-shaped mock provider. */
export function PayInvoice({ invoiceId }: { invoiceId: string }) {
  const s = useStudio();
  const [card, setCard] = useState({ number: "", exp: "", cvc: "" });
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  if (!s.data) return <p className="st-note">Loading…</p>;
  const invoice = s.data.invoices.find((i) => i.id === invoiceId);
  if (!invoice) return <Lock>That invoice doesn't exist in this mock.</Lock>;
  if (invoice.status === "paid")
    return (
      <section className="st-card">
        <h1 className="st-title">Paid</h1>
        <p className="st-note" role="status">
          Thank you. Receipt {invoice.receiptId} (mock).
        </p>
      </section>
    );
  async function pay(e: FormEvent) {
    e.preventDefault();
    setError(undefined);
    setBusy(true);
    try {
      const intent = await s.pay.createIntent({
        amount: invoiceTotal(invoice!),
        description: `Invoice ${invoice!.id}`,
        metadata: { invoice: invoice!.id },
      });
      const r = await s.pay.confirm(intent, card);
      if (!r.ok) return setError(r.error);
      s.repo.updateInvoice(invoice!.id, {
        status: "paid",
        intentId: r.intent.id,
        receiptId: r.receiptId,
        paidAt: new Date().toISOString(),
      });
      s.bump();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="st-card st-form" onSubmit={pay}>
      <h1 className="st-title">Pay {usd(invoiceTotal(invoice))}</h1>
      <ul className="st-list">
        {invoice.lines.map((l) => (
          <li key={l.description}>
            <span>{l.description}</span>
            <strong>{usd(l.amountCents)}</strong>
          </li>
        ))}
      </ul>
      <p className="st-note">
        Mock payment. Use the test card 4242 4242 4242 4242, any future expiry, any 3 digits. No real card is ever
        charged.
      </p>
      <label>
        Card number
        <input
          inputMode="numeric"
          autoComplete="off"
          value={card.number}
          onChange={(e) => setCard({ ...card, number: e.target.value })}
        />
      </label>
      <label>
        Expiry (MM / YY)
        <input autoComplete="off" value={card.exp} onChange={(e) => setCard({ ...card, exp: e.target.value })} />
      </label>
      <label>
        Security code
        <input
          inputMode="numeric"
          autoComplete="off"
          value={card.cvc}
          onChange={(e) => setCard({ ...card, cvc: e.target.value })}
        />
      </label>
      {error ? (
        <p role="alert" className="st-error">
          {error}
        </p>
      ) : null}
      <button className="st-btn" type="submit" disabled={busy}>
        {busy ? "Paying…" : `Pay ${usd(invoiceTotal(invoice))}`}
      </button>
    </form>
  );
}
