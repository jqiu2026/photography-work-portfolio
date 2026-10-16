"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { enterGalleryAction } from "@/app/g/actions";
import "./gallery.css";

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
    <div className="gx" data-theme="dark" style={{ display: "grid", placeItems: "center", padding: "2rem" }}>
      <form
        className="gx-form gx-gate"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setErr("");
          const r = await enterGalleryAction({ slug, passcode: code });
          setBusy(false);
          if (r.ok) router.refresh();
          else setErr(r.error);
        }}
      >
        <p className="gx-brand">Private gallery</p>
        <h1>{title}</h1>
        {locked ? (
          <p role="alert" className="gx-msg">
            This gallery was closed because a screenshot or save was attempted. It reopens after a short wait, or ask
            your photographer to let you back in.
          </p>
        ) : null}
        {idle ? (
          <p role="status" className="gx-msg">
            The gallery was closed after a period of inactivity. Enter your passcode to open it again.
          </p>
        ) : null}
        <label>
          Passcode
          <input value={code} onChange={(e) => setCode(e.target.value)} autoComplete="off" />
        </label>
        {err ? (
          <p role="alert" className="gx-msg">
            {err}
          </p>
        ) : null}
        <button type="submit" className="gx-btn gx-btn--solid" disabled={busy}>
          {busy ? "One moment…" : "Open my gallery"}
        </button>
        <p className="gx-fine">Your photographer gave you this passcode with the link.</p>
      </form>
    </div>
  );
}
