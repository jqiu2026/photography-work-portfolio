"use client";

import { Badge, Button, Checkbox, Field, Input, Text } from "@holominimal/ui";
import { useState } from "react";
import {
  createApiKeyAction,
  revokeApiKeyAction,
  addWebhookAction,
  deleteWebhookAction,
  setWebhookActiveAction,
} from "@/app/studio/integration-actions";
import { Card, Frame, useAct, useConfirm } from "./StudioFrame";

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

/* ---------------------------------------------------------------- read-only API keys */

export type ApiKeysData = {
  keys: { id: string; name: string; prefix: string; created: string; lastUsed: string; revoked: boolean }[];
};

/** Keys for the read-only REST API (clients, jobs, invoices, galleries). A key is shown once when made. */
export function ApiKeysCard({ data }: { data: ApiKeysData }) {
  const { pending, note, act } = useAct();
  const [ask, confirmEl] = useConfirm();
  const [name, setName] = useState("");
  const [key, setKey] = useState<string | null>(null);
  return (
    <Frame section="automations" note={note} head={false}>
      {confirmEl}
      <Card title="Read-only API" id="api-card">
        <Text size="sm" tone="muted">
          Another app can read your clients, jobs, invoices and galleries with a key: <code>GET /api/v1/clients</code>{" "}
          with the header <code>Authorization: Bearer your-key</code>. Nothing can be changed through it. Treat a key
          like a password.
        </Text>
        {key ? (
          <p role="status" className="st-secret">
            Key (shown once): <code>{key}</code>{" "}
            <Button size="sm" variant="secondary" onClick={() => void navigator.clipboard?.writeText(key)}>
              Copy
            </Button>
          </p>
        ) : null}
        <ul className="hm-data-list st-list" aria-label="API keys">
          {data.keys.map((k) => (
            <li className="hm-data-list-item" key={k.id}>
              <span>
                {k.name} <code>{k.prefix}…</code>
                <small>
                  Made {k.created}, {k.lastUsed ? `last used ${k.lastUsed}` : "never used"}
                </small>
              </span>
              {k.revoked ? (
                <Badge tone="muted">Revoked</Badge>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={pending}
                  onClick={async () =>
                    (await ask({
                      title: `Revoke the key ${k.name}?`,
                      body: "Apps using it stop working.",
                      action: "Revoke",
                    })) && act(() => revokeApiKeyAction(k.id))
                  }
                >
                  Revoke
                </Button>
              )}
            </li>
          ))}
        </ul>
        <form
          noValidate
          className="st-form"
          aria-label="New API key"
          onSubmit={(e) => {
            e.preventDefault();
            act(
              async () => {
                const r = await createApiKeyAction(name);
                const got = r.ok ? (r as Record<string, unknown>).key : undefined;
                if (typeof got === "string") setKey(got);
                return r;
              },
              () => setName(""),
            );
          }}
        >
          <Field label="Name (the app that will use it)">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Button type="submit" disabled={pending}>
            Make a key
          </Button>
        </form>
      </Card>
    </Frame>
  );
}
