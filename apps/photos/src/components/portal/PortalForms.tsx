"use client";

import { Button, Field, Input, Textarea } from "@halation/ui";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";
import {
  type AccountResult,
  cancelMyAppointmentAction,
  changePasswordAction,
  confirmLoginAction,
  passwordLoginAction,
  requestMagicLinkAction,
  requestResetAction,
  resetPasswordAction,
  rescheduleMyAppointmentAction,
  savePrefsAction,
  sendMessageAction,
} from "@/app/client/account-actions";

/**
 * Runs a server action from onSubmit instead of `<form action>`: React 19 resets a form's fields after an action finishes,
 * which wiped what people had typed (and raced with fast re-typing). This keeps the fields and shows the result.
 */
function useServerForm(
  fn: (prev: AccountResult | null, data: FormData) => Promise<AccountResult>,
  after?: (r: AccountResult) => void,
) {
  const [state, setState] = useState<AccountResult | null>(null);
  const [pending, start] = useTransition();
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    start(async () => {
      const r = await fn(null, data);
      setState(r);
      after?.(r);
    });
  };
  return [state, onSubmit, pending] as const;
}

function Msg({ r }: { r: AccountResult | null }) {
  if (!r) return null;
  return r.ok ? (
    r.message ? (
      <p role="status" className="st-note">
        {r.message}
      </p>
    ) : null
  ) : (
    <p role="alert" className="st-error">
      {r.error}
    </p>
  );
}

/** Sign in with a password or ask for an emailed link. */
export function LoginForms() {
  const [pw, pwAction, pwPending] = useServerForm(passwordLoginAction);
  const [ml, mlAction, mlPending] = useServerForm(requestMagicLinkAction);
  const [rs, rsAction, rsPending] = useServerForm(requestResetAction);
  const [mode, setMode] = useState<"password" | "link" | "reset">("password");
  // Controlled, because React resets uncontrolled fields after a form action, which would wipe the email after a typo.
  const [email, setEmail] = useState("");
  return (
    <div style={{ display: "grid", gap: "1.5rem", maxWidth: "26rem" }}>
      <div role="tablist" aria-label="Way to sign in" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {(
          [
            ["password", "Password"],
            ["link", "Email me a link"],
            ["reset", "Forgot password"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={mode === k}
            className="slot"
            aria-pressed={mode === k}
            onClick={() => setMode(k)}
          >
            {label}
          </button>
        ))}
      </div>
      {mode === "password" ? (
        <form onSubmit={pwAction} className="st-form" aria-label="Sign in with a password">
          <Field label="Email">
            <Input
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label="Password">
            <Input name="password" type="password" autoComplete="current-password" />
          </Field>
          <Msg r={pw} />
          <Button type="submit" disabled={pwPending}>
            Sign in
          </Button>
        </form>
      ) : null}
      {mode === "link" ? (
        <form onSubmit={mlAction} className="st-form" aria-label="Email me a sign-in link">
          <Field label="Email" hint="I'll email a link that signs you in once.">
            <Input
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Msg r={ml} />
          <Button type="submit" disabled={mlPending}>
            Email me a link
          </Button>
        </form>
      ) : null}
      {mode === "reset" ? (
        <form onSubmit={rsAction} className="st-form" aria-label="Reset my password">
          <Field label="Email">
            <Input
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Msg r={rs} />
          <Button type="submit" disabled={rsPending}>
            Email me a reset link
          </Button>
        </form>
      ) : null}
    </div>
  );
}

export function ConfirmLoginButton({ token }: { token: string }) {
  const [pending, start] = useTransition();
  const [r, setR] = useState<AccountResult | null>(null);
  return (
    <div style={{ display: "grid", gap: "1rem", maxWidth: "26rem" }}>
      <Button type="button" disabled={pending} onClick={() => start(async () => setR(await confirmLoginAction(token)))}>
        Continue to my portal
      </Button>
      <Msg r={r} />
    </div>
  );
}

export function ResetForm({ token }: { token: string }) {
  const [r, action, pending] = useServerForm(resetPasswordAction.bind(null, token));
  return (
    <form onSubmit={action} className="st-form" aria-label="Choose a password" style={{ maxWidth: "26rem" }}>
      <Field label="New password" hint="At least 10 characters.">
        <Input name="password" type="password" autoComplete="new-password" />
      </Field>
      <Field label="Type it again">
        <Input name="confirm" type="password" autoComplete="new-password" />
      </Field>
      <Msg r={r} />
      <Button type="submit" disabled={pending}>
        Save and sign in
      </Button>
    </form>
  );
}

export function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [r, action, pending] = useServerForm(changePasswordAction);
  return (
    <form onSubmit={action} className="st-form" aria-label="Password">
      {hasPassword ? (
        <Field label="Current password">
          <Input name="current" type="password" autoComplete="current-password" />
        </Field>
      ) : null}
      <Field label={hasPassword ? "New password" : "Choose a password"} hint="At least 10 characters.">
        <Input name="password" type="password" autoComplete="new-password" />
      </Field>
      <Field label="Type it again">
        <Input name="confirm" type="password" autoComplete="new-password" />
      </Field>
      <Msg r={r} />
      <Button type="submit" disabled={pending}>
        Save password
      </Button>
    </form>
  );
}

export function PrefsForm({ prefs }: { prefs: { galleryReady: boolean; reminders: boolean; news: boolean } }) {
  const [r, action, pending] = useServerForm(savePrefsAction);
  return (
    <form onSubmit={action} className="st-form" aria-label="Email preferences">
      <label className="st-check">
        <input type="checkbox" name="galleryReady" defaultChecked={prefs.galleryReady} /> Tell me when a gallery is
        ready
      </label>
      <label className="st-check">
        <input type="checkbox" name="reminders" defaultChecked={prefs.reminders} /> Reminders (payments, questionnaires,
        expiring galleries)
      </label>
      <label className="st-check">
        <input type="checkbox" name="news" defaultChecked={prefs.news} /> News and offers
      </label>
      <p className="st-note">
        Emails about things you asked for (a booking, an invoice, a sign-in link) are always sent.
      </p>
      <Msg r={r} />
      <Button type="submit" disabled={pending}>
        Save
      </Button>
    </form>
  );
}

export function MessageForm({ jobs }: { jobs: { id: string; title: string }[] }) {
  const router = useRouter();
  const [sent, setSent] = useState(0);
  const [r, action, pending] = useServerForm(sendMessageAction, (res) => {
    if (res.ok) {
      setSent((n) => n + 1); // a new key empties the box
      router.refresh();
    }
  });
  return (
    <form key={sent} onSubmit={action} className="st-form" aria-label="New message">
      {jobs.length > 1 ? (
        <label>
          About
          <select name="jobId" defaultValue="">
            <option value="">Anything</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <Field label="Message">
        <Textarea name="body" />
      </Field>
      <Msg r={r} />
      <Button type="submit" disabled={pending}>
        Send
      </Button>
    </form>
  );
}

/** Cancel, or pick another time, for an appointment that is outside the policy window. */
export function AppointmentControls({ id, minutes, minDate }: { id: string; minutes: number; minDate: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<{ start: string; label: string }[] | null>(null);
  const [msg, setMsg] = useState<AccountResult | null>(null);
  async function load(d: string) {
    setDate(d);
    setSlots(null);
    if (!d) return;
    const res = await fetch(`/api/slots?minutes=${minutes}&date=${d}`);
    const j = (await res.json().catch(() => ({}))) as { slots?: { start: string; label: string }[] };
    setSlots(j.slots ?? []);
  }
  return (
    <div style={{ display: "grid", gap: "0.75rem" }}>
      <details>
        <summary>Pick another time</summary>
        <div style={{ display: "grid", gap: "0.75rem", paddingTop: "0.75rem" }}>
          <label>
            Day
            <input type="date" min={minDate} value={date} onChange={(e) => void load(e.target.value)} />
          </label>
          {slots && !slots.length ? <p className="st-note">No free times that day.</p> : null}
          <ul
            style={{ listStyle: "none", padding: 0, display: "flex", flexWrap: "wrap", gap: "0.5rem" }}
            aria-label="Free times"
          >
            {slots?.map((s) => (
              <li key={s.start}>
                <button
                  type="button"
                  className="slot"
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      const r = await rescheduleMyAppointmentAction(id, s.start);
                      setMsg(r);
                      if (r.ok) router.refresh();
                    })
                  }
                >
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </details>
      <div>
        <Button
          type="button"
          variant="ghost"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await cancelMyAppointmentAction(id);
              setMsg(r);
              if (r.ok) router.refresh();
            })
          }
        >
          Cancel this appointment
        </Button>
      </div>
      <Msg r={msg} />
      <NextLink href="/client/messages" className="hl-link">
        Message me instead
      </NextLink>
    </div>
  );
}
