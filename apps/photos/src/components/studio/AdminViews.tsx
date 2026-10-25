"use client";

import {
  Badge,
  Button,
  Checkbox,
  Field,
  Input,
  PricingCard,
  PricingFeature,
  PricingFeatures,
  PricingFooter,
  PricingGrid,
  PricingName,
  PricingPrice,
  PricingTagline,
  Progress,
  Select,
  Status,
  Text,
} from "@holominimal/ui";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  addTrackLinkAction,
  deleteTrackAction,
  deleteWatermarkAction,
  setDefaultWatermarkAction,
} from "@/app/studio/gallery-actions";
import {
  changeMemberRoleAction,
  inviteMemberAction,
  setMemberActiveAction,
  setUndoMinutesAction,
} from "@/app/studio/team-actions";
import {
  billMonthAction,
  downgradePlanAction,
  saveBrandAction,
  upgradePlanAction,
} from "@/app/studio/settings-actions";
import { FormMessage } from "@/components/ui";
import { Card, FormDialog, Frame, statusTone, useAct, useConfirm, useNotify } from "./StudioFrame";
import "./records.css";
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
      <Card title="People who opened your galleries" id="vis-h">
        <Text size="sm" tone="muted">
          Turn on "Ask visitors for their email address" in a gallery's Share tab to collect these. Only people who
          chose to give their email are listed.
        </Text>
        {rows.length ? (
          <>
            <ul className="hm-data-list st-list">
              {rows.map((r) => (
                <li className="hm-data-list-item" key={r.id}>
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
            <Button variant="secondary" onClick={csv}>
              Download CSV
            </Button>
          </>
        ) : (
          <Text size="sm" tone="muted">
            No visitors yet.
          </Text>
        )}
      </Card>
    </Frame>
  );
}

/* ------------------------------------------------------------------- Music */
export function MusicView({
  tracks,
  allowed,
}: { tracks: { id: string; title: string; artist: string; mb: string }[]; allowed: boolean }) {
  const { pending, note, act } = useAct();
  const [ask, confirmEl] = useConfirm();
  const file = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(false);
  const [mode, setMode] = useState<"file" | "link">("file");
  const [link, setLink] = useState("");
  async function upload() {
    if (mode === "link") {
      setBusy(true);
      setErr("");
      const r = (await addTrackLinkAction({ url: link, title, artist })) as { ok: boolean; error?: string };
      setBusy(false);
      if (!r.ok) {
        setErr(r.error ?? "Could not add that link.");
        return false;
      }
      location.reload();
      return true;
    }
    const f = file.current?.files?.[0];
    if (!f) {
      setErr("Choose an audio file.");
      return false;
    }
    setBusy(true);
    setErr("");
    const fd = new FormData();
    fd.set("file", f);
    fd.set("title", title);
    fd.set("artist", artist);
    const r = await fetch("/api/studio/track", { method: "POST", body: fd });
    const j = (await r.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (!r.ok) {
      setErr(j.error ?? "Could not upload that file.");
      return false;
    }
    setTitle("");
    setArtist("");
    if (file.current) file.current.value = "";
    location.reload();
    return true;
  }
  return (
    <Frame section="music" note={note}>
      {confirmEl}
      <Card
        title="Gallery music"
        id="mu-h"
        actions={
          allowed ? (
            <Button size="sm" onClick={() => setAdding(true)}>
              Add a track
            </Button>
          ) : undefined
        }
      >
        <Text size="sm" tone="muted">
          Upload tracks you have the right to play (your own, or licensed for this use). Choose a playlist for each
          gallery under its Branding tab. Visitors can pause or skip it.
        </Text>
        {allowed ? null : (
          <Text size="sm" tone="muted">
            Gallery music is part of Full Frame. See Settings, Plan and billing.
          </Text>
        )}
        {tracks.length ? (
          <ul className="hm-data-list st-list" aria-label="Tracks">
            {tracks.map((t) => (
              <li className="hm-data-list-item" key={t.id}>
                <span>
                  {t.title}
                  <small>
                    {t.artist ? `${t.artist} · ` : ""}
                    {t.mb} MB
                  </small>
                </span>
                <Button
                  variant="secondary"
                  disabled={pending}
                  onClick={async () =>
                    (await ask({
                      title: `Remove ${t.title}?`,
                      body: "It is taken out of the music library, so galleries can no longer play it.",
                      action: "Remove track",
                    })) && act(() => deleteTrackAction(t.id))
                  }
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <Text size="sm" tone="muted">
            No tracks yet.
          </Text>
        )}
      </Card>
      <FormDialog
        open={adding}
        onOpenChange={setAdding}
        title="Add a track"
        submitLabel={busy ? "Uploading…" : "Add track"}
        pending={busy}
        onSubmit={upload}
      >
        <Field label="Add from">
          <Select value={mode} onValueChange={(v) => setMode(v as "file" | "link")}>
            <option value="file">A file from this computer</option>
            <option value="link">A link to an audio file</option>
          </Select>
        </Field>
        {mode === "file" ? (
          <Field label="Audio file" hint="MP3, M4A, AAC, OGG or WAV, up to 40 MB.">
            <input ref={file} type="file" accept="audio/*" className="pm-file" />
          </Field>
        ) : (
          <Field
            label="Link"
            hint="A direct link to an audio file (ending in .mp3, .m4a, .ogg or .wav). Streaming pages like YouTube or Spotify cannot be played here. Only use music you have the right to play."
          >
            <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://example.com/song.mp3" />
          </Field>
        )}
        <Field label="Title (blank = the file name)">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} />
        </Field>
        <Field label="Artist (optional)">
          <Input value={artist} onChange={(e) => setArtist(e.target.value)} maxLength={100} />
        </Field>
        {err ? <FormMessage className="st-error">{err}</FormMessage> : null}
      </FormDialog>
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
/** A sample photograph area with the mark drawn on it, so the owner sees what a delivered copy will look like. */
function MarkPreview({
  kind,
  text,
  position,
  opacity,
  sizePct,
  imageSrc,
}: { kind: string; text: string; position: string; opacity: number; sizePct: number; imageSrc?: string | null }) {
  const [v, h] = position === "center" || position === "tile" ? ["center", "center"] : position.split("-");
  const place = {
    top: v === "top" ? "6%" : v === "bottom" ? "auto" : "50%",
    bottom: v === "bottom" ? "6%" : "auto",
    left: h === "left" ? "5%" : h === "right" ? "auto" : "50%",
    right: h === "right" ? "5%" : "auto",
    transform: `translate(${h === "center" ? "-50%" : "0"}, ${v === "center" ? "-50%" : "0"})`,
  } as const;
  const mark =
    kind === "image" ? (
      imageSrc ? (
        <img src={imageSrc} alt="" style={{ width: "100%", display: "block" }} />
      ) : (
        <span>Your PNG</span>
      )
    ) : (
      <span style={{ fontSize: "clamp(0.6rem, 2.4cqw, 1.4rem)", fontWeight: 600, whiteSpace: "nowrap" }}>
        {text || "Your words"}
      </span>
    );
  return (
    <div className="wm-preview" role="img" aria-label="Preview of the watermark on a sample photograph">
      {position === "tile" ? (
        <div className="wm-tile" style={{ opacity: opacity / 100 }}>
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} style={{ width: `${sizePct}%` }}>
              {mark}
            </div>
          ))}
        </div>
      ) : (
        <div
          className="wm-mark"
          style={{ ...place, width: kind === "image" ? `${sizePct}%` : "auto", opacity: opacity / 100 }}
        >
          {mark}
        </div>
      )}
    </div>
  );
}

export function WatermarksView({ marks }: { marks: Mark[] }) {
  const { pending, note, act } = useAct();
  const notify = useNotify();
  const [ask, confirmEl] = useConfirm();
  const blank = { id: "", name: "", kind: "text", text: "", position: "bottom-right", opacity: 45, sizePct: 22 };
  const [f, setF] = useState<typeof blank | null>(null);
  const [local, setLocal] = useState<string | null>(null);
  const png = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const close = () => {
    setF(null);
    setLocal(null);
    setErr("");
  };
  async function save() {
    if (!f) return false;
    setBusy(true);
    setErr("");
    const fd = new FormData();
    for (const [k, v] of Object.entries(f)) fd.set(k, String(v));
    const file = png.current?.files?.[0];
    if (f.kind === "image" && file) fd.set("file", file);
    const r = await fetch("/api/studio/watermark", { method: "POST", body: fd });
    const j = (await r.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (!r.ok) {
      setErr(j.error ?? "Could not save the watermark.");
      return false;
    }
    notify("Watermark saved", "success");
    location.reload();
    return true;
  }
  const preview = f && f.kind === "image" ? (local ?? (f.id ? `/api/studio/watermark/${f.id}` : null)) : null;
  return (
    <Frame section="watermarks" note={note}>
      {confirmEl}
      <Card
        title="Watermarks"
        id="wm-h"
        actions={
          <Button size="sm" onClick={() => setF({ ...blank })}>
            Add a watermark
          </Button>
        }
      >
        <Text size="sm" tone="muted">
          A watermark is a visible mark put on the copies a download rule delivers. Every delivered photograph also
          carries an invisible mark that traces it to the visitor. You can use words or upload a PNG (a logo, say).
        </Text>
        {marks.length ? (
          <ul className="rc-cards" aria-label="Watermarks">
            {marks.map((m) => (
              <li className="rc-card" key={m.id}>
                <MarkPreview
                  kind={m.kind}
                  text={m.text}
                  position={m.position}
                  opacity={m.opacity}
                  sizePct={m.sizePct}
                  imageSrc={m.kind === "image" ? `/api/studio/watermark/${m.id}` : null}
                />
                <div className="rc-card__head">
                  <strong>{m.name}</strong>
                  {m.isDefault ? <Badge tone="accent">default</Badge> : null}
                </div>
                <span className="rc-muted">
                  {m.kind === "text" ? `"${m.text}"` : "PNG image"} · {m.position} · {m.opacity}% · {m.sizePct}% wide
                </span>
                <div className="rc-card__foot">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setF({
                        id: m.id,
                        name: m.name,
                        kind: m.kind,
                        text: m.text,
                        position: m.position,
                        opacity: m.opacity,
                        sizePct: m.sizePct,
                      });
                      notify(`Loaded ${m.name}`);
                    }}
                  >
                    Edit
                  </Button>
                  <span className="rc-actions">
                    {!m.isDefault ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={pending}
                        onClick={() => act(() => setDefaultWatermarkAction(m.id))}
                      >
                        Make default
                      </Button>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={pending}
                      onClick={async () =>
                        (await ask({
                          title: `Delete the watermark ${m.name}?`,
                          body: "Download rules that use it stop marking copies. Copies already downloaded keep their mark.",
                          action: "Delete watermark",
                        })) && act(() => deleteWatermarkAction(m.id))
                      }
                    >
                      Delete
                    </Button>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <Text size="sm" tone="muted">
            No watermarks yet. Use Add a watermark.
          </Text>
        )}
      </Card>
      <FormDialog
        open={f !== null}
        onOpenChange={(o) => !o && close()}
        title={f?.id ? "Edit watermark" : "Add a watermark"}
        size="lg"
        submitLabel={busy ? "Saving…" : f?.id ? "Save watermark" : "Add watermark"}
        pending={busy}
        onSubmit={save}
      >
        {f ? (
          <>
            <div className="st-wide">
              <MarkPreview
                kind={f.kind}
                text={f.text}
                position={f.position}
                opacity={f.opacity}
                sizePct={f.sizePct}
                imageSrc={preview}
              />
            </div>
            <Field label="Name">
              <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} maxLength={60} />
            </Field>
            <Field label="Kind">
              <Select value={f.kind} onValueChange={(v) => setF({ ...f, kind: v })}>
                <option value="text">Words</option>
                <option value="image">PNG image</option>
              </Select>
            </Field>
            {f.kind === "text" ? (
              <Field label="Words">
                <Input value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} maxLength={80} />
              </Field>
            ) : (
              <Field label="PNG" hint="Transparent works best, up to 4 MB.">
                <input
                  ref={png}
                  type="file"
                  accept="image/png"
                  className="pm-file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    setLocal(file ? URL.createObjectURL(file) : null);
                  }}
                />
              </Field>
            )}
            <Field label="Position">
              <Select value={f.position} onValueChange={(v) => setF({ ...f, position: v })}>
                {POS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={`Opacity: ${f.opacity}%`}>
              <input
                type="range"
                min={5}
                max={100}
                value={f.opacity}
                aria-label="Opacity"
                onChange={(e) => setF({ ...f, opacity: Number(e.target.value) })}
              />
            </Field>
            <Field label={`Width: ${f.sizePct}% of the photograph`}>
              <input
                type="range"
                min={5}
                max={80}
                value={f.sizePct}
                aria-label="Width"
                onChange={(e) => setF({ ...f, sizePct: Number(e.target.value) })}
              />
            </Field>
            {err ? <FormMessage className="st-error">{err}</FormMessage> : null}
          </>
        ) : null}
      </FormDialog>
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
    <Field label={label}>
      <Input type={type} value={String(f[k])} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
    </Field>
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
        <Text size="sm" tone="muted">
          Shown in the About tab of galleries and in emails. The address and phone are only shown when ticked.
        </Text>
        {text("email", "Email", "email")}
        {text("phone", "Phone")}
        <Checkbox
          checked={f.showPhone}
          onChange={(e) => setF({ ...f, showPhone: e.target.checked })}
          label="Show my phone in galleries"
        />
        {text("addressLine1", "Street address")}
        {text("addressLine2", "Street address line 2")}
        {text("city", "City")}
        {text("region", "State")}
        {text("postalCode", "Postal code")}
        {text("country", "Country (two letters)")}
        <Checkbox
          checked={f.showAddress}
          onChange={(e) => setF({ ...f, showAddress: e.target.checked })}
          label="Show my address in galleries"
        />
        <Button type="submit" disabled={pending}>
          Save brand details
        </Button>
      </form>
    </Frame>
  );
}

/* ------------------------------------------------------------------- Users */
export type TeamRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  external: boolean;
  since: string;
};
const ROLE_WORDS: Record<string, string> = {
  owner: "Owner: everything",
  editor: "Editor",
  bookkeeper: "Bookkeeper: money pages only",
  photographer: "Photographer: shoots and galleries",
};

/** Who can sign in, and what each role may do. The owner invites helpers by Google address. */
export function UsersView({ users, undoMinutes }: { users: TeamRow[]; undoMinutes: number }) {
  const { pending, note, act, go } = useAct();
  const notify = useNotify();
  const [inviting, setInviting] = useState(false);
  const [windowOpen, setWindowOpen] = useState(false);
  const [mins, setMins] = useState(String(undoMinutes));
  const [ask, confirmEl] = useConfirm();
  const [f, setF] = useState({ email: "", name: "", role: "photographer" });
  return (
    <Frame section="users" note={note}>
      {confirmEl}
      <div className="st-grid">
        <Card
          title="Team"
          id="us-h"
          actions={
            <>
              <Button variant="secondary" size="sm" onClick={() => setWindowOpen(true)}>
                Take-back window: {undoMinutes} min
              </Button>
              <Button size="sm" onClick={() => setInviting(true)}>
                Invite someone
              </Button>
            </>
          }
        >
          <Text size="sm" tone="muted">
            People who can sign in to this studio with Google. Clients never sign in: they use the link to their
            gallery.
          </Text>
          <ul className="hm-data-list st-list st-list--tall" aria-label="Team">
            {users.map((u) => {
              const helper = u.role === "photographer" || u.role === "bookkeeper";
              return (
                <li className="hm-data-list-item" key={u.id} data-member={u.email}>
                  <span>
                    {u.name || u.email}
                    <small>
                      {u.email} · {ROLE_WORDS[u.role] ?? u.role}
                      {u.active ? "" : " · switched off"} · since {u.since}
                    </small>
                  </span>
                  {helper ? (
                    <span className="st-actions">
                      <Select
                        aria-label={`Role of ${u.email}`}
                        value={u.role}
                        onValueChange={(v) => act(() => changeMemberRoleAction({ memberId: u.id, role: v }))}
                      >
                        <option value="photographer">Photographer</option>
                        <option value="bookkeeper">Bookkeeper</option>
                      </Select>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={pending}
                        onClick={async () =>
                          u.active
                            ? (await ask({
                                title: `Switch off ${u.email}?`,
                                body: "They can no longer sign in. Nothing they added is removed.",
                                action: "Switch off",
                              })) && act(() => setMemberActiveAction({ memberId: u.id, active: false }))
                            : act(() => setMemberActiveAction({ memberId: u.id, active: true }))
                        }
                      >
                        {u.active ? "Switch off" : "Switch on"}
                      </Button>
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>
          {users.length ? null : (
            <Text size="sm" tone="muted">
              Nobody has signed in yet. The first owner address in ADMIN_EMAILS is added when they sign in.
            </Text>
          )}
        </Card>
      </div>
      <FormDialog
        open={inviting}
        onOpenChange={setInviting}
        title="Invite someone"
        description="They sign in with their Google account. Any Google account works, such as a personal Gmail."
        submitLabel="Send invite"
        pending={pending}
        onSubmit={() =>
          go(
            () => inviteMemberAction(f),
            () => setF({ email: "", name: "", role: f.role }),
          )
        }
      >
        <Field label="Google email">
          <Input
            type="email"
            value={f.email}
            autoComplete="off"
            onChange={(e) => setF({ ...f, email: e.target.value })}
          />
        </Field>
        <Field label="Name (optional)">
          <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        </Field>
        <Field label="Role">
          <Select value={f.role} onValueChange={(v) => setF({ ...f, role: v })}>
            <option value="photographer">Photographer</option>
            <option value="bookkeeper">Bookkeeper</option>
          </Select>
        </Field>
        <Text size="sm" tone="muted" className="st-wide">
          {f.role === "bookkeeper"
            ? `Bookkeeper: sees and edits the money side (orders, quotes, invoices, payments, expenses, reports) and the client list. Sees no galleries or settings, and can remove only what they added in the last ${undoMinutes} minutes.`
            : `Photographer: runs shoots and galleries (uploads, albums, calendar, call sheets, gear, clients). Adds freely, but can remove only what they added in the last ${undoMinutes} minutes. Sees no money, settings or team.`}
        </Text>
      </FormDialog>
      <FormDialog
        open={windowOpen}
        onOpenChange={setWindowOpen}
        title="Take-back window"
        description="How long a photographer or bookkeeper can remove something they just added, to fix a slip. After that only you can remove it. 0 means they can never remove anything."
        pending={pending}
        onSubmit={() => go(() => setUndoMinutesAction(Number(mins)))}
      >
        <Field label="Minutes">
          <Input inputMode="numeric" value={mins} onChange={(e) => setMins(e.target.value.replace(/[^0-9]/g, ""))} />
        </Field>
      </FormDialog>
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
  const [ask, confirmEl] = useConfirm();
  const meter = (label: string, used: number, max: number | null, fmt: (n: number) => string) => (
    <div className="pl-meter">
      <Text size="sm">
        {label}: <strong>{fmt(used)}</strong> of {max === null ? "unlimited" : fmt(max)}
      </Text>
      {max !== null ? (
        <Progress
          value={Math.min(used, max)}
          max={max}
          tone={used / max > 0.9 ? "warning" : "accent"}
          aria-label={`${label} used`}
        />
      ) : null}
    </div>
  );
  return (
    <Frame section="plan" note={note}>
      <Card title="Your plan" id="pl-h">
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
        <Text size="sm" tone="muted">
          Up to {data.limits.photosPerGallery.toLocaleString()} photographs per gallery.
          {data.limits.shop
            ? " Shop, music and reports included."
            : " The shop, music and reports are part of Full Frame."}
        </Text>
      </Card>
      <Card title="Plans" id="pl-plans">
        <PricingGrid className="pl-plans">
          {data.plans.map((p) => (
            <PricingCard key={p.key} current={p.key === data.plan} featured={p.key === "fullframe"} as="li">
              <PricingName as="h3">{p.name}</PricingName>
              <PricingTagline>{p.tagline}</PricingTagline>
              <PricingPrice period={p.priceCents ? "/ month" : undefined}>
                {p.priceCents ? usd(p.priceCents) : "Free"}
              </PricingPrice>
              {p.priceCents ? (
                <Text size="xs" tone="dim">
                  SAMPLE price until set
                </Text>
              ) : null}
              <PricingFeatures>
                {p.lines.map((l) => (
                  <PricingFeature key={l}>{l}</PricingFeature>
                ))}
              </PricingFeatures>
              <PricingFooter>
                {p.key === data.plan ? (
                  <Text size="sm" tone="muted">
                    Your current plan
                  </Text>
                ) : p.key === "fullframe" ? (
                  <Button
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
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    disabled={pending}
                    onClick={async () =>
                      (await ask({
                        title: "Switch to Free?",
                        body: "Nothing is deleted, but the Free limits apply to anything new.",
                        action: "Switch to Free",
                        danger: false,
                      })) && act(() => downgradePlanAction())
                    }
                  >
                    Switch to Free
                  </Button>
                )}
              </PricingFooter>
            </PricingCard>
          ))}
        </PricingGrid>
        {data.billing === "none" ? (
          <Text size="sm" tone="muted">
            Paid subscriptions are not set up yet. TODO(owner): needs STRIPE_PRICE_FULLFRAME and the Stripe keys.
          </Text>
        ) : null}
      </Card>
      <Card title="Billing history" id="pl-hist">
        {data.charges.length ? (
          <ul className="hm-data-list st-list">
            {data.charges.map((c) => (
              <li className="hm-data-list-item" key={c.id}>
                <span>
                  {c.description}
                  <small>{c.at}</small>
                </span>
                <span>{usd(c.amountCents)}</span>
                <Status tone={statusTone(c.status)}>{c.status === "free" ? "No payment needed" : c.status}</Status>
              </li>
            ))}
          </ul>
        ) : (
          <Text size="sm" tone="muted">
            No charges yet.
          </Text>
        )}
        {data.plan === "fullframe" ? (
          <Button variant="secondary" disabled={pending} onClick={() => act(() => billMonthAction())}>
            Record this month's charge
          </Button>
        ) : null}
      </Card>
      {confirmEl}
    </Frame>
  );
}
