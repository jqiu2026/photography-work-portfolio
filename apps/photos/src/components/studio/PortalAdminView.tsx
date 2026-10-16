"use client";

import { useState } from "react";
import { inviteClientAction, replyMessageAction, setEtaAction } from "@/app/studio/portal-actions";
import { Card, Frame, useAct } from "./StudioFrame";

export type PortalAdminData = {
  threads: {
    clientId: string;
    client: string;
    unread: number;
    messages: { id: string; direction: string; body: string; at: string }[];
  }[];
  clients: {
    id: string;
    name: string;
    email: string;
    hasAccount: boolean;
    hasPassword: boolean;
    lastLogin: string | null;
  }[];
  jobs: { id: string; title: string; status: string; eta: string | null }[];
};

/** Client messages and replies, portal invitations, and the estimated delivery date clients see on each job. */
export function PortalAdminView({ user, data }: { user: string; data: PortalAdminData }) {
  const { pending, note, act, submit } = useAct();
  const [f, setF] = useState<Record<string, string>>({});
  const set = (k: string) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  return (
    <Frame section="portal" user={user} note={note}>
      <div className="st-grid">
        <Card title="Messages" id="pa-msg">
          {data.threads.length ? (
            data.threads.map((t) => (
              <div key={t.clientId} data-thread-client={t.clientId} style={{ marginBottom: "1.25rem" }}>
                <h3 className="st-day">
                  {t.client} {t.unread ? `(${t.unread} new)` : ""}
                </h3>
                <ul className="st-list">
                  {t.messages.slice(-6).map((m) => (
                    <li key={m.id}>
                      <span>
                        <strong>{m.direction === "in" ? t.client : "You"}</strong> <small>{m.at}</small>
                        <small style={{ whiteSpace: "pre-wrap" }}>{m.body}</small>
                      </span>
                    </li>
                  ))}
                </ul>
                <form
                  noValidate
                  className="st-form"
                  aria-label={`Reply to ${t.client}`}
                  onSubmit={submit(
                    () => replyMessageAction({ clientId: t.clientId, body: f[`r-${t.clientId}`] ?? "" }),
                    () => setF({}),
                  )}
                >
                  <label>
                    Reply
                    <textarea rows={2} value={f[`r-${t.clientId}`] ?? ""} onChange={set(`r-${t.clientId}`)} />
                  </label>
                  <button type="submit" className="st-btn" disabled={pending}>
                    Send reply
                  </button>
                </form>
              </div>
            ))
          ) : (
            <p className="st-note">No messages yet. Clients write from their portal.</p>
          )}
        </Card>
        <Card title="Portal access" id="pa-acc">
          <ul className="st-list">
            {data.clients.map((c) => (
              <li key={c.id} data-client-id={c.id}>
                <span>
                  <strong>{c.name}</strong> · {c.email}
                  <small>
                    {c.hasAccount
                      ? c.hasPassword
                        ? "password set"
                        : "no password yet (magic link works)"
                      : "no portal account yet"}
                    {c.lastLogin ? ` · last sign-in ${c.lastLogin}` : ""}
                  </small>
                </span>
                <button
                  type="button"
                  className="st-btn"
                  disabled={pending}
                  onClick={() => act(() => inviteClientAction(c.id))}
                >
                  {c.hasAccount ? "Send a new invitation" : "Invite to the portal"}
                </button>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Estimated delivery" id="pa-eta">
          <p className="st-note">Clients see this date on the job's status page while it is being shot or edited.</p>
          <ul className="st-list">
            {data.jobs.map((j) => (
              <li key={j.id} data-job-id={j.id}>
                <span>
                  <strong>{j.title}</strong>
                  <small>{j.status}</small>
                </span>
                <form
                  noValidate
                  className="st-actions"
                  aria-label={`Estimated delivery for ${j.title}`}
                  onSubmit={submit(() => setEtaAction({ jobId: j.id, date: f[`e-${j.id}`] ?? j.eta ?? "" }))}
                >
                  <input
                    type="date"
                    aria-label={`Estimated delivery date for ${j.title}`}
                    value={f[`e-${j.id}`] ?? j.eta ?? ""}
                    onChange={set(`e-${j.id}`)}
                  />
                  <button type="submit" className="st-btn st-btn--ghost" disabled={pending}>
                    Save
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </Frame>
  );
}
