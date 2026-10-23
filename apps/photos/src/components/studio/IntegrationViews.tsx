"use client";

import { DRONE_ITEMS, LIMITS, droneVerdict } from "@jerryqiu/db/drone-rules";
import { Badge, Button, Checkbox, Field, Input, Select, Text } from "@holominimal/ui";
import { useMemo, useState } from "react";
import {
  addWebhookAction,
  deleteWebhookAction,
  saveDroneAction,
  setWebhookActiveAction,
} from "@/app/studio/integration-actions";
import { Card, Frame, useAct, useConfirm } from "./StudioFrame";

/* ---------------------------------------------------------------- drone checklist */

export type DroneData = {
  jobs: { id: string; title: string; date: string | null }[];
  selected: string | null;
  have: string[];
  saved: {
    items: { text: string; done: boolean }[];
    weather: { windMph?: number; gustMph?: number; visibilityMi?: number; precipitation?: boolean; note?: string };
    decision: string | null;
  } | null;
};

const num = (v: string) => (v.trim() === "" ? undefined : Number(v));
const VERDICT_TONE = { go: "success", caution: "warning", "no-go": "danger" } as const;
const VERDICT_WORD = { go: "Go", caution: "Take care", "no-go": "No-go" } as const;

/** One drone checklist per job: the pre-flight steps, the weather you enter, and a go or no-go you record. */
export function DroneView({ user, data }: { user: string; data: DroneData }) {
  const { pending, note, act } = useAct();
  const [items, setItems] = useState(data.saved?.items ?? DRONE_ITEMS.map((text) => ({ text, done: false })));
  const w = data.saved?.weather ?? {};
  const [wind, setWind] = useState(w.windMph?.toString() ?? "");
  const [gust, setGust] = useState(w.gustMph?.toString() ?? "");
  const [vis, setVis] = useState(w.visibilityMi?.toString() ?? "");
  const [rain, setRain] = useState(Boolean(w.precipitation));
  const [wnote, setWnote] = useState(w.note ?? "");
  const verdict = useMemo(
    () => droneVerdict({ windMph: num(wind), gustMph: num(gust), visibilityMi: num(vis), precipitation: rain }),
    [wind, gust, vis, rain],
  );
  const doneCount = items.filter((i) => i.done).length;
  const save = (decision: "go" | "no-go" | null) =>
    act(() =>
      saveDroneAction({
        jobId: data.selected ?? "",
        items,
        weather: { windMph: wind, gustMph: gust, visibilityMi: vis, precipitation: rain, note: wnote },
        decision,
      }),
    );
  return (
    <Frame section="drone" user={user} note={note}>
      <div className="st-grid">
        <Card title="Job" id="dr-job">
          <Field label="Which job">
            <Select
              value={data.selected ?? ""}
              onValueChange={(v) => window.location.assign(`/studio/drone?job=${v}`)}
              aria-label="Which job"
            >
              <option value="">Choose a job</option>
              {data.jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                  {j.date ? ` (${j.date})` : ""}
                  {data.have.includes(j.id) ? " ✓" : ""}
                </option>
              ))}
            </Select>
          </Field>
          {data.saved?.decision ? (
            <Text size="sm">
              Recorded:{" "}
              <Badge tone={data.saved.decision === "go" ? "success" : "danger"}>
                {data.saved.decision === "go" ? "Go" : "No-go"}
              </Badge>
            </Text>
          ) : null}
          <Text size="sm" tone="muted">
            These steps follow the usual FAA Part 107 routine. The limits below are cautious defaults for a small camera
            drone, not legal advice: the pilot in command decides. A live weather feed needs an API key, so for now you
            type the numbers in (TODO(owner): connect a weather source).
          </Text>
        </Card>
        <Card title="Weather" id="dr-weather">
          <div className="st-form">
            <Field label="Wind (mph)">
              <Input inputMode="decimal" value={wind} onChange={(e) => setWind(e.target.value)} />
            </Field>
            <Field label="Gusts (mph)">
              <Input inputMode="decimal" value={gust} onChange={(e) => setGust(e.target.value)} />
            </Field>
            <Field label="Visibility (miles)">
              <Input inputMode="decimal" value={vis} onChange={(e) => setVis(e.target.value)} />
            </Field>
            <Checkbox checked={rain} onChange={(e) => setRain(e.target.checked)} label="Rain, snow or fog on the way" />
            <Field label="Notes">
              <Input value={wnote} onChange={(e) => setWnote(e.target.value)} />
            </Field>
          </div>
          <p role="status" className="st-verdict" data-verdict={verdict.decision}>
            <Badge tone={VERDICT_TONE[verdict.decision]}>{VERDICT_WORD[verdict.decision]}</Badge>{" "}
            {verdict.reasons.join(" ")}
          </p>
          <Text size="sm" tone="muted">
            No-go above {LIMITS.windMph} mph wind, {LIMITS.gustMph} mph gusts, under {LIMITS.visibilityMi} miles of
            visibility, or in precipitation.
          </Text>
        </Card>
      </div>
      <Card title={`Pre-flight checklist (${doneCount} of ${items.length})`} id="dr-list">
        <ul className="hm-data-list st-list st-list--tall" aria-label="Pre-flight checklist">
          {items.map((it, i) => (
            <li className="hm-data-list-item" key={it.text}>
              <Checkbox
                checked={it.done}
                onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, done: e.target.checked } : x)))}
                label={it.text}
              />
            </li>
          ))}
        </ul>
        <div className="st-actions">
          <Button variant="secondary" disabled={pending || !data.selected} onClick={() => save(null)}>
            Save
          </Button>
          <Button
            disabled={pending || !data.selected || doneCount < items.length || verdict.decision === "no-go"}
            onClick={() => save("go")}
          >
            Record: go
          </Button>
          <Button variant="secondary" disabled={pending || !data.selected} onClick={() => save("no-go")}>
            Record: no-go
          </Button>
        </div>
      </Card>
    </Frame>
  );
}

/* ---------------------------------------------------------------- outgoing webhooks */

export type WebhooksData = {
  events: { id: string; label: string }[];
  hooks: { id: string; host: string; events: string[]; active: boolean }[];
  deliveries: { id: string; event: string; status: number | null; error: string | null; at: string; host: string }[];
};

/** Send a signed message to another app when something happens (an inquiry, a payment, a gallery going live). */
export function WebhooksCard({ data }: { data: WebhooksData }) {
  const { pending, note, act } = useAct();
  const [ask, confirmEl] = useConfirm();
  const [url, setUrl] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [secret, setSecret] = useState<string | null>(null);
  return (
    <Frame section="automations" note={note} head={false}>
      {confirmEl}
      <Card title="Send events to other apps" id="wh-card">
        <Text size="sm" tone="muted">
          Each time something below happens, the studio sends a small JSON message to the address you give, signed with
          a secret so the other side can check it is really from you (header X-Studio-Signature). Only https addresses
          on the internet are accepted.
        </Text>
        {secret ? (
          <p role="status" className="st-secret">
            Secret (shown once): <code>{secret}</code>{" "}
            <Button size="sm" variant="secondary" onClick={() => void navigator.clipboard?.writeText(secret)}>
              Copy
            </Button>
          </p>
        ) : null}
        <ul className="hm-data-list st-list" aria-label="Webhooks">
          {data.hooks.map((h) => (
            <li className="hm-data-list-item" key={h.id}>
              <span>
                {h.host}
                <small>{h.events.join(", ")}</small>
              </span>
              <Button
                size="sm"
                variant="secondary"
                disabled={pending}
                onClick={() => act(() => setWebhookActiveAction({ webhookId: h.id, active: !h.active }))}
              >
                {h.active ? "Switch off" : "Switch on"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={pending}
                onClick={async () =>
                  (await ask({ title: `Delete the webhook to ${h.host}?`, action: "Delete" })) &&
                  act(() => deleteWebhookAction(h.id))
                }
              >
                Delete
              </Button>
            </li>
          ))}
        </ul>
        <form
          noValidate
          className="st-form"
          aria-label="New webhook"
          onSubmit={(e) => {
            e.preventDefault();
            act(
              async () => {
                const r = await addWebhookAction({ url, events: picked });
                const got = r.ok ? (r as Record<string, unknown>).secret : undefined;
                if (typeof got === "string") setSecret(got);
                return r;
              },
              () => {
                setUrl("");
                setPicked([]);
              },
            );
          }}
        >
          <Field label="Address (https)">
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/hook" />
          </Field>
          <fieldset className="st-checks">
            <legend>Events</legend>
            {data.events.map((ev) => (
              <Checkbox
                key={ev.id}
                checked={picked.includes(ev.id)}
                onChange={(e) => setPicked(e.target.checked ? [...picked, ev.id] : picked.filter((x) => x !== ev.id))}
                label={ev.label}
              />
            ))}
          </fieldset>
          <Button type="submit" disabled={pending}>
            Add webhook
          </Button>
        </form>
        {data.deliveries.length ? (
          <>
            <h3>Recent messages</h3>
            <ul className="hm-data-list st-list" aria-label="Recent webhook messages">
              {data.deliveries.map((d) => (
                <li className="hm-data-list-item" key={d.id}>
                  <span>
                    {d.event} to {d.host}
                    <small>{d.at.slice(0, 16).replace("T", " ")}</small>
                  </span>
                  <Badge tone={d.error ? "danger" : "success"}>{d.error ? (d.status ?? "failed") : "Delivered"}</Badge>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </Card>
    </Frame>
  );
}
