"use client";

import { Alert, Button, Field, Input, LockIcon, Surface } from "@holominimal/ui";
import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";
import { enterGalleryAction, registerVisitorAction } from "@/app/g/actions";
import "./gallery.css";

function Door({ eyebrow, title, children }: { eyebrow: ReactNode; title: string; children: ReactNode }) {
  return (
    <main className="gx gx-door hm-theme">
      <Surface variant="outlined" padding="lg" className="gx-door__card">
        <div className="gx-door__head">
          <p className="gx-brand">{eyebrow}</p>
          <h1>{title}</h1>
        </div>
        {children}
      </Surface>
    </main>
  );
}

/** The front door of a private gallery: its title and one field for the passcode. */
export function GalleryGate({
  slug,
  title,
  locked,
  idle,
}: { slug: string; title: string; locked: boolean; idle: boolean }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Door
      eyebrow={
        <>
          <LockIcon size={12} /> Private gallery
        </>
      }
      title={title}
    >
      {locked ? (
        <Alert tone="warning">
          This gallery was closed because a screenshot or save was attempted. It reopens after a short wait, or ask your
          photographer to let you back in.
        </Alert>
      ) : null}
      {idle ? (
        <Alert tone="info" role="status">
          The gallery was closed after a period of inactivity. Enter your passcode to open it again.
        </Alert>
      ) : null}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setErr("");
          const r = await enterGalleryAction({ slug, passcode: code.trim() });
          if (r.ok) router.refresh();
          else {
            setBusy(false);
            setErr(r.error);
          }
        }}
      >
        <Field label="Passcode" hint="Your photographer sent it with the link." error={err || undefined}>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            required
            autoFocus
          />
        </Field>
        <Button type="submit" size="lg" loading={busy}>
          Open my gallery
        </Button>
      </form>
    </Door>
  );
}

/** Asked before an open gallery when the studio collects visitors' email addresses. */
export function EmailGate({ slug, title }: { slug: string; title: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Door eyebrow="Welcome" title={title}>
      <p className="gx-fine" style={{ textAlign: "center" }}>
        Enter your email address to view this gallery. The photographer may use it to send you news about it.
      </p>
      <form
        noValidate
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setErr("");
          const r = await registerVisitorAction({ slug, email, name });
          if (r.ok) router.refresh();
          else {
            setBusy(false);
            setErr(r.error);
          }
        }}
      >
        <Field label="Email" error={err || undefined}>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            autoFocus
          />
        </Field>
        <Field label="Name (optional)">
          <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        </Field>
        <Button type="submit" size="lg" loading={busy}>
          Open the gallery
        </Button>
      </form>
    </Door>
  );
}
