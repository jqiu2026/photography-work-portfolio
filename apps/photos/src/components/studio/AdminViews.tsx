"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { deleteTrackAction, deleteWatermarkAction, setDefaultWatermarkAction } from "@/app/studio/gallery-actions";
import {
  billMonthAction,
  downgradePlanAction,
  saveBrandAction,
  upgradePlanAction,
} from "@/app/studio/settings-actions";
import { Frame, useAct } from "./StudioFrame";
import "./galleries.css";

const usd = (c: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(c / 100);

/* ---------------------------------------------------------------- Visitors */
export function VisitorsView({
  rows,
}: {
  rows: { id: string; email: string; name: string; gallery: string; galleryId: string; visits: number; last: string }[];
}) {
  const { note } = useAct();
  const csv = () => {
    const body = [
      ["email", "name", "gallery", "visits", "last visit"],
      ...rows.map((r) => [r.email, r.name, r.gallery, String(r.visits), r.last]),
    ]
      .map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([body], { type: "text/csv" }));
    a.download = "gallery-visitors.csv";
    a.click();
  };
  return (
    <Frame section="visitors" note={note}>
      <section className="st-card" aria-labelledby="vis-h">
        <h2 id="vis-h">People who opened your galleries</h2>
        <p className="st-note">
          Turn on "Ask visitors for their email address" in a gallery's Share tab to collect these. Only people who
          chose to give their email are listed.
        </p>
        {rows.length ? (
          <>
            <ul className="st-list">
              {rows.map((r) => (
                <li key={r.id}>
                  <span>
                    {r.email}
                    <small>
                      {r.name ? `${r.name} · ` : ""}
                      <Link href={`/studio/gallery/${r.galleryId}`}>{r.gallery}</Link> · {r.visits} visit
                      {r.visits === 1 ? "" : "s"} · last {r.last}
                    </small>
                  </span>
                </li>
              ))}
            </ul>
            <button type="button" className="st-btn st-btn--ghost" onClick={csv}>
              Download CSV
            </button>
          </>
        ) : (
          <p className="st-note">No visitors yet.</p>
        )}
      </section>
    </Frame>
  );
}

/* ------------------------------------------------------------------- Music */
export function MusicView({
  tracks,
  allowed,
}: { tracks: { id: string; title: string; artist: string; mb: string }[]; allowed: boolean }) {
  const { pending, note, act } = useAct();
  const file = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  async function upload() {
    const f = file.current?.files?.[0];
    if (!f) return setErr("Choose an audio file.");
    setBusy(true);
    setErr("");
    const fd = new FormData();
    fd.set("file", f);
    fd.set("title", title);
    fd.set("artist", artist);
    const r = await fetch("/api/studio/track", { method: "POST", body: fd });
    const j = (await r.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (!r.ok) return setErr(j.error ?? "Could not upload that file.");
    setTitle("");
    setArtist("");
    if (file.current) file.current.value = "";
    location.reload();
  }
  return (
    <Frame section="music" note={note}>
      <section className="st-card" aria-labelledby="mu-h">
        <h2 id="mu-h">Gallery music</h2>
        <p className="st-note">
          Upload tracks you have the right to play (your own, or licensed for this use). Choose a playlist for each
          gallery under its Branding tab. Visitors can pause or skip it.
        </p>
        {allowed ? (
          <form
            className="st-form"
            aria-label="Add a track"
            onSubmit={(e) => {
              e.preventDefault();
              void upload();
            }}
          >
            <label>
              Audio file (MP3, M4A, AAC, OGG or WAV, up to 40 MB)
              <input ref={file} type="file" accept="audio/*" />
            </label>
            <label>
              Title (blank = the file name)
              <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} />
            </label>
            <label>
              Artist (optional)
              <input value={artist} onChange={(e) => setArtist(e.target.value)} maxLength={100} />
            </label>
            {err ? (
              <p role="alert" className="st-error">
                {err}
              </p>
            ) : null}
            <button type="submit" className="st-btn" disabled={busy}>
              {busy ? "Uploading…" : "Add track"}
            </button>
          </form>
        ) : (
          <p className="st-note">Gallery music is part of Full Frame. See Settings, Plan and billing.</p>
        )}
        {tracks.length ? (
          <ul className="st-list" aria-label="Tracks">
            {tracks.map((t) => (
              <li key={t.id}>
                <span>
                  {t.title}
                  <small>
                    {t.artist ? `${t.artist} · ` : ""}
                    {t.mb} MB
                  </small>
                </span>
                <button
                  type="button"
                  className="st-btn st-btn--ghost"
                  disabled={pending}
                  onClick={() => act(() => deleteTrackAction(t.id))}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="st-note">No tracks yet.</p>
        )}
      </section>
    </Frame>
  );
}

/* -------------------------------------------------------------- Watermarks */
type Mark = {
  id: string;
  name: string;
  kind: string;
  text: string;
  position: string;
  opacity: number;
  sizePct: number;
  isDefault: boolean;
};
const POS = ["bottom-right", "bottom-left", "top-right", "top-left", "center", "tile"];
export function WatermarksView({ marks }: { marks: Mark[] }) {
  const { pending, note, act } = useAct();
  const blank = { id: "", name: "", kind: "text", text: "", position: "bottom-right", opacity: 45, sizePct: 22 };
  const [f, setF] = useState(blank);
  const png = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  async function save() {
    setBusy(true);
    setErr("");
    const fd = new FormData();
    for (const [k, v] of Object.entries(f)) fd.set(k, String(v));
    const file = png.current?.files?.[0];
    if (f.kind === "image" && file) fd.set("file", file);
    const r = await fetch("/api/studio/watermark", { method: "POST", body: fd });
    const j = (await r.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (!r.ok) return setErr(j.error ?? "Could not save the watermark.");
    location.reload();
  }
  return (
    <Frame section="watermarks" note={note}>
      <section className="st-card" aria-labelledby="wm-h">
        <h2 id="wm-h">Watermarks</h2>
        <p className="st-note">
          A watermark is a visible mark put on the copies a rule delivers (Gallery, Downloads). Every delivered
          photograph also carries an invisible mark that traces it to the visitor.
        </p>
        {marks.length ? (
          <ul className="st-list" aria-label="Watermarks">
            {marks.map((m) => (
              <li key={m.id}>
                <span>
                  {m.name} {m.isDefault ? <em>· default</em> : null}
                  <small>
                    {m.kind === "text" ? `"${m.text}"` : "PNG image"} · {m.position} · {m.opacity}% · {m.sizePct}% wide
                  </small>
                </span>
                <button
                  type="button"
                  className="st-btn st-btn--ghost"
                  onClick={() =>
                    setF({
                      id: m.id,
                      name: m.name,
                      kind: m.kind,
                      text: m.text,
                      position: m.position,
                      opacity: m.opacity,
                      sizePct: m.sizePct,
                    })
                  }
                >
                  Edit
                </button>
                {!m.isDefault ? (
                  <button
                    type="button"
                    className="st-btn st-btn--ghost"
                    disabled={pending}
                    onClick={() => act(() => setDefaultWatermarkAction(m.id))}
                  >
                    Set as default
                  </button>
                ) : null}
                <button
                  type="button"
                  className="st-btn st-btn--ghost"
                  disabled={pending}
                  onClick={() => act(() => deleteWatermarkAction(m.id))}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="st-note">No watermarks yet.</p>
        )}
        <h3>{f.id ? "Edit watermark" : "New watermark"}</h3>
        <form
          className="st-form"
          aria-label="Watermark"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <label>
            Name
            <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} maxLength={60} />
          </label>
          <label>
            Kind
            <select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}>
              <option value="text">Words</option>
              <option value="image">PNG image</option>
            </select>
          </label>
          {f.kind === "text" ? (
            <label>
              Words
              <input value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} maxLength={80} />
            </label>
          ) : (
            <label>
              PNG (transparent works best, up to 4 MB)
              <input ref={png} type="file" accept="image/png" />
            </label>
          )}
          <label>
            Position
            <select value={f.position} onChange={(e) => setF({ ...f, position: e.target.value })}>
              {POS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label>
            Opacity (5 to 100)
            <input
              type="number"
              min={5}
              max={100}
              value={f.opacity}
              onChange={(e) => setF({ ...f, opacity: Number(e.target.value) })}
            />
          </label>
          <label>
            Width, percent of the photograph (5 to 80)
            <input
              type="number"
              min={5}
              max={80}
              value={f.sizePct}
              onChange={(e) => setF({ ...f, sizePct: Number(e.target.value) })}
            />
          </label>
          {err ? (
            <p role="alert" className="st-error">
              {err}
            </p>
          ) : null}
          <div className="gm-row">
            <button type="submit" className="st-btn" disabled={busy}>
              {busy ? "Saving…" : f.id ? "Save watermark" : "Add watermark"}
            </button>
            {f.id ? (
              <button type="button" className="st-btn st-btn--ghost" onClick={() => setF(blank)}>
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      </section>
    </Frame>
  );
}

/* ------------------------------------------------------------------- Brand */
export type BrandForm = {
  name: string;
  website: string;
  instagram: string;
  facebook: string;
  twitter: string;
  pinterest: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  timezone: string;
  showPhone: boolean;
  showAddress: boolean;
};
export function BrandView({ brand }: { brand: BrandForm }) {
  const { pending, note, submit } = useAct();
  const [f, setF] = useState(brand);
  const text = (k: keyof BrandForm, label: string, type = "text") => (
    <label>
      {label}
      <input type={type} value={String(f[k])} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
    </label>
  );
  return (
    <Frame section="brand" note={note}>
      <form className="st-card st-form" aria-label="Brand" onSubmit={submit(() => saveBrandAction(f))}>
        <h2>Brand details</h2>
        {text("name", "Brand name")}
        {text("website", "Website")}
        {text("timezone", "Time zone")}
        <h2>Social media</h2>
        {text("instagram", "Instagram username")}
        {text("facebook", "Facebook page URL")}
        {text("twitter", "X (Twitter) handle")}
        {text("pinterest", "Pinterest username")}
        <h2>Contact</h2>
        <p className="st-note">
          Shown in the About tab of galleries and in emails. The address and phone are only shown when ticked.
        </p>
        {text("email", "Email", "email")}
        {text("phone", "Phone")}
        <label className="gm-check">
          <input type="checkbox" checked={f.showPhone} onChange={(e) => setF({ ...f, showPhone: e.target.checked })} />{" "}
          Show my phone in galleries
        </label>
        {text("addressLine1", "Street address")}
        {text("addressLine2", "Street address line 2")}
        {text("city", "City")}
        {text("region", "State")}
        {text("postalCode", "Postal code")}
        {text("country", "Country (two letters)")}
        <label className="gm-check">
          <input
            type="checkbox"
            checked={f.showAddress}
            onChange={(e) => setF({ ...f, showAddress: e.target.checked })}
          />{" "}
          Show my address in galleries
        </label>
        <button type="submit" className="st-btn" disabled={pending}>
          Save brand details
        </button>
      </form>
    </Frame>
  );
}

/* ------------------------------------------------------------------- Users */
export function UsersView({
  users,
}: { users: { id: string; name: string; email: string; role: string; active: boolean; since: string }[] }) {
  const { note } = useAct();
  return (
    <Frame section="users" note={note}>
      <section className="st-card" aria-labelledby="us-h">
        <h2 id="us-h">Users and permissions</h2>
        <p className="st-note">
          People who can sign in to this studio. Clients never sign in anywhere: they use the link to their gallery.
          Sign-in is by Google for the addresses on the allow-list (ADMIN_EMAILS).
        </p>
        {users.length ? (
          <ul className="st-list">
            {users.map((u) => (
              <li key={u.id}>
                <span>
                  {u.name || u.email}
                  <small>
                    {u.email} · {u.role}
                    {u.active ? "" : " · inactive"} · since {u.since}
                  </small>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="st-note">
            Nobody has signed in yet. The first owner address in ADMIN_EMAILS is added when they sign in.
          </p>
        )}
      </section>
    </Frame>
  );
}

/* -------------------------------------------------------------------- Plan */
type PlanData = {
  plan: "free" | "fullframe";
  name: string;
  discountPct: number;
  since: string;
  dueCents: number;
  priceCents: number;
  usage: { galleries: number; storageBytes: number };
  limits: {
    galleries: number | null;
    storageBytes: number;
    photosPerGallery: number;
    shop: boolean;
    music: boolean;
    reports: boolean;
  };
  plans: { key: string; name: string; tagline: string; priceCents: number; lines: string[] }[];
  charges: { id: string; description: string; amountCents: number; status: string; at: string }[];
  billing: "stripe" | "mock" | "none";
};
const GB = 1024 ** 3;
export function PlanView({ data }: { data: PlanData }) {
  const { pending, note, act } = useAct();
  const meter = (label: string, used: number, max: number | null, fmt: (n: number) => string) => (
    <div className="pl-meter">
      <p>
        {label}: <strong>{fmt(used)}</strong> of {max === null ? "unlimited" : fmt(max)}
      </p>
      {max !== null ? <progress value={Math.min(used, max)} max={max} aria-label={`${label} used`} /> : null}
    </div>
  );
  return (
    <Frame section="plan" note={note}>
      <section className="st-card" aria-labelledby="pl-h">
        <h2 id="pl-h">Your plan</h2>
        <p>
          <strong>{data.name}</strong>
          {data.plan === "fullframe" && data.discountPct
            ? ` · ${data.discountPct}% discount, billed monthly at ${usd(data.dueCents)}`
            : data.plan === "fullframe"
              ? ` · ${usd(data.priceCents)} a month`
              : ""}
          {data.since ? <small> · since {data.since}</small> : null}
        </p>
        {meter("Active galleries", data.usage.galleries, data.limits.galleries, (n) => String(n))}
        {meter(
          "Storage",
          data.usage.storageBytes,
          data.limits.storageBytes,
          (n) => `${(n / GB).toFixed(n < GB ? 2 : 1)} GB`,
        )}
        <p className="st-note">
          Up to {data.limits.photosPerGallery.toLocaleString()} photographs per gallery.
          {data.limits.shop
            ? " Shop, music and reports included."
            : " The shop, music and reports are part of Full Frame."}
        </p>
      </section>
      <section className="st-card" aria-labelledby="pl-plans">
        <h2 id="pl-plans">Plans</h2>
        <div className="pl-plans">
          {data.plans.map((p) => (
            <article key={p.key} className="pl-plan" data-current={p.key === data.plan || undefined}>
              <h3>{p.name}</h3>
              <p className="st-note">{p.tagline}</p>
              <p>
                <strong>{p.priceCents ? `${usd(p.priceCents)} / month` : "Free"}</strong>
                {p.priceCents ? <small> · SAMPLE price until set</small> : null}
              </p>
              <ul>
                {p.lines.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
              {p.key === data.plan ? (
                <p className="st-note">Your current plan</p>
              ) : p.key === "fullframe" ? (
                <button
                  type="button"
                  className="st-btn"
                  disabled={pending || data.billing === "none"}
                  onClick={() =>
                    act(async () => {
                      const r = (await upgradePlanAction()) as { ok: boolean; url?: string };
                      if (r.ok && r.url) location.assign(r.url);
                      return r;
                    })
                  }
                >
                  {data.billing === "mock" ? "Upgrade (labelled mock)" : "Upgrade to Full Frame"}
                </button>
              ) : (
                <button
                  type="button"
                  className="st-btn st-btn--ghost"
                  disabled={pending}
                  onClick={() =>
                    confirm("Switch to Free? Nothing is deleted, but the Free limits apply to anything new.") &&
                    act(() => downgradePlanAction())
                  }
                >
                  Switch to Free
                </button>
              )}
            </article>
          ))}
        </div>
        {data.billing === "none" ? (
          <p className="st-note">
            Paid subscriptions are not set up yet. TODO(owner): needs STRIPE_PRICE_FULLFRAME and the Stripe keys.
          </p>
        ) : null}
      </section>
      <section className="st-card" aria-labelledby="pl-hist">
        <h2 id="pl-hist">Billing history</h2>
        {data.charges.length ? (
          <ul className="st-list">
            {data.charges.map((c) => (
              <li key={c.id}>
                <span>
                  {c.description}
                  <small>{c.at}</small>
                </span>
                <span>{usd(c.amountCents)}</span>
                <em>{c.status === "free" ? "No payment needed" : c.status}</em>
              </li>
            ))}
          </ul>
        ) : (
          <p className="st-note">No charges yet.</p>
        )}
        {data.plan === "fullframe" ? (
          <button
            type="button"
            className="st-btn st-btn--ghost"
            disabled={pending}
            onClick={() => act(() => billMonthAction())}
          >
            Record this month's charge
          </button>
        ) : null}
      </section>
    </Frame>
  );
}
