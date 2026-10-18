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
import { deleteTrackAction, deleteWatermarkAction, setDefaultWatermarkAction } from "@/app/studio/gallery-actions";
import {
  billMonthAction,
  downgradePlanAction,
  saveBrandAction,
  upgradePlanAction,
} from "@/app/studio/settings-actions";
import { FormMessage } from "@/components/ui";
import { Card, Frame, useAct, useConfirm } from "./StudioFrame";
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
      <Card title="Gallery music" id="mu-h">
        <Text size="sm" tone="muted">
          Upload tracks you have the right to play (your own, or licensed for this use). Choose a playlist for each
          gallery under its Branding tab. Visitors can pause or skip it.
        </Text>
        {allowed ? (
          <form
            className="st-form"
            aria-label="Add a track"
            onSubmit={(e) => {
              e.preventDefault();
              void upload();
            }}
          >
            <Field label="Audio file" hint="MP3, M4A, AAC, OGG or WAV, up to 40 MB.">
              <input ref={file} type="file" accept="audio/*" className="pm-file" />
            </Field>
            <Field label="Title (blank = the file name)">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} />
            </Field>
            <Field label="Artist (optional)">
              <Input value={artist} onChange={(e) => setArtist(e.target.value)} maxLength={100} />
            </Field>
            {err ? <FormMessage className="st-error">{err}</FormMessage> : null}
            <Button type="submit" disabled={busy}>
              {busy ? "Uploading…" : "Add track"}
            </Button>
          </form>
        ) : (
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
                <Button variant="secondary" disabled={pending} onClick={() => act(() => deleteTrackAction(t.id))}>
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
      <Card title="Watermarks" id="wm-h">
        <Text size="sm" tone="muted">
          A watermark is a visible mark put on the copies a rule delivers (Gallery, Downloads). Every delivered
          photograph also carries an invisible mark that traces it to the visitor.
        </Text>
        {marks.length ? (
          <ul className="hm-data-list st-list" aria-label="Watermarks">
            {marks.map((m) => (
              <li className="hm-data-list-item" key={m.id}>
                <span>
                  {m.name} {m.isDefault ? <Badge tone="accent">default</Badge> : null}
                  <small>
                    {m.kind === "text" ? `"${m.text}"` : "PNG image"} · {m.position} · {m.opacity}% · {m.sizePct}% wide
                  </small>
                </span>
                <Button
                  variant="secondary"
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
                </Button>
                {!m.isDefault ? (
                  <Button
                    variant="secondary"
                    disabled={pending}
                    onClick={() => act(() => setDefaultWatermarkAction(m.id))}
                  >
                    Set as default
                  </Button>
                ) : null}
                <Button variant="secondary" disabled={pending} onClick={() => act(() => deleteWatermarkAction(m.id))}>
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <Text size="sm" tone="muted">
            No watermarks yet.
          </Text>
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
              <input ref={png} type="file" accept="image/png" className="pm-file" />
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
          <Field label="Opacity (5 to 100)">
            <Input
              type="number"
              min={5}
              max={100}
              value={f.opacity}
              onChange={(e) => setF({ ...f, opacity: Number(e.target.value) })}
            />
          </Field>
          <Field label="Width, percent of the photograph (5 to 80)">
            <Input
              type="number"
              min={5}
              max={80}
              value={f.sizePct}
              onChange={(e) => setF({ ...f, sizePct: Number(e.target.value) })}
            />
          </Field>
          {err ? <FormMessage className="st-error">{err}</FormMessage> : null}
          <div className="gm-row">
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : f.id ? "Save watermark" : "Add watermark"}
            </Button>
            {f.id ? (
              <Button variant="secondary" onClick={() => setF(blank)}>
                Cancel
              </Button>
            ) : null}
          </div>
        </form>
      </Card>
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
export function UsersView({
  users,
}: { users: { id: string; name: string; email: string; role: string; active: boolean; since: string }[] }) {
  const { note } = useAct();
  return (
    <Frame section="users" note={note}>
      <Card title="Users and permissions" id="us-h">
        <Text size="sm" tone="muted">
          People who can sign in to this studio. Clients never sign in anywhere: they use the link to their gallery.
          Sign-in is by Google for the addresses on the allow-list (ADMIN_EMAILS).
        </Text>
        {users.length ? (
          <ul className="hm-data-list st-list">
            {users.map((u) => (
              <li className="hm-data-list-item" key={u.id}>
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
          <Text size="sm" tone="muted">
            Nobody has signed in yet. The first owner address in ADMIN_EMAILS is added when they sign in.
          </Text>
        )}
      </Card>
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
                <Status tone={c.status === "paid" || c.status === "free" ? "success" : "warning"}>
                  {c.status === "free" ? "No payment needed" : c.status}
                </Status>
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
