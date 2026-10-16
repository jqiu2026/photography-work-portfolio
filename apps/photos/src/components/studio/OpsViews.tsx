"use client";

import Link from "next/link";
import { useState } from "react";
import {
  addTaskAction,
  deleteTaskAction,
  markNotificationsReadAction,
  runAutomationsNowAction,
  saveRuleAction,
  toggleTaskAction,
} from "@/app/studio/ops-actions";
import { Card, Frame, useAct } from "./StudioFrame";

export type TasksData = {
  tasks: { id: string; title: string; dueOn: string | null; notes: string | null; done: boolean; overdue: boolean }[];
};

export function TasksView({ user, data }: { user: string; data: TasksData }) {
  const { pending, note, act, submit } = useAct();
  const [f, setF] = useState<Record<string, string>>({});
  const set = (k: string) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  return (
    <Frame section="tasks" user={user} note={note}>
      <div className="st-grid">
        <Card title="Tasks" id="t-list">
          {data.tasks.length ? (
            <ul className="st-list st-list--tall">
              {data.tasks.map((t) => (
                <li key={t.id} data-task-id={t.id} data-done={t.done || undefined}>
                  <label className="st-check">
                    <input
                      type="checkbox"
                      checked={t.done}
                      disabled={pending}
                      onChange={(e) => act(() => toggleTaskAction({ taskId: t.id, done: e.target.checked }))}
                      aria-label={`Mark "${t.title}" ${t.done ? "not done" : "done"}`}
                    />
                    <span style={{ textDecoration: t.done ? "line-through" : undefined }}>
                      {t.title}
                      <small>
                        {t.dueOn ? `due ${t.dueOn}` : "no date"}
                        {t.overdue ? " · overdue" : ""}
                      </small>
                    </span>
                  </label>
                  <button
                    type="button"
                    className="st-btn st-btn--ghost"
                    disabled={pending}
                    onClick={() => act(() => deleteTaskAction(t.id))}
                    aria-label={`Delete "${t.title}"`}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="st-note">Nothing to do.</p>
          )}
        </Card>
        <Card title="Add a task" id="t-add">
          <form
            noValidate
            className="st-form"
            aria-label="New task"
            onSubmit={submit(
              () => addTaskAction({ title: f.t ?? "", dueOn: f.d, notes: f.n }),
              () => setF({}),
            )}
          >
            <label>
              Task
              <input value={f.t ?? ""} onChange={set("t")} />
            </label>
            <label>
              Due
              <input type="date" value={f.d ?? ""} onChange={set("d")} />
            </label>
            <label>
              Notes
              <input value={f.n ?? ""} onChange={set("n")} />
            </label>
            <button type="submit" className="st-btn" disabled={pending}>
              Add task
            </button>
          </form>
        </Card>
      </div>
    </Frame>
  );
}

export type AutomationsData = {
  rules: { key: string; name: string; blurb: string; enabled: boolean; days: number; message: string }[];
  runs: { id: string; rule: string; entity: string; at: string; status: string }[];
};

export function AutomationsView({ user, data }: { user: string; data: AutomationsData }) {
  const { pending, note, act, submit } = useAct();
  const [f, setF] = useState<Record<string, string>>({});
  const [on, setOn] = useState<Record<string, boolean>>(Object.fromEntries(data.rules.map((r) => [r.key, r.enabled])));
  const set = (k: string) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  return (
    <Frame section="automations" user={user} note={note}>
      <p className="st-note">
        These run every hour (a Vercel Cron job; TODO(owner): needs CRON_SECRET) and each acts on a given thing only
        once. A client who turned reminders off in their portal is not nudged. Reminders link to the client's portal
        sign-in.
      </p>
      <div className="st-grid">
        {data.rules.map((r) => (
          <Card key={r.key} title={r.name} id={`a-${r.key}`}>
            <form
              noValidate
              className="st-form"
              aria-label={r.name}
              onSubmit={submit(() =>
                saveRuleAction({
                  key: r.key,
                  enabled: on[r.key],
                  days: f[`d-${r.key}`] ?? String(r.days),
                  message: f[`m-${r.key}`] ?? r.message,
                }),
              )}
            >
              <p className="st-note">{r.blurb}</p>
              <label className="st-check">
                <input
                  type="checkbox"
                  checked={on[r.key]}
                  onChange={(e) => setOn((x) => ({ ...x, [r.key]: e.target.checked }))}
                />{" "}
                Enabled
              </label>
              <label>
                Days
                <input inputMode="numeric" value={f[`d-${r.key}`] ?? String(r.days)} onChange={set(`d-${r.key}`)} />
              </label>
              <label>
                Extra line in the email (optional)
                <input value={f[`m-${r.key}`] ?? r.message} onChange={set(`m-${r.key}`)} />
              </label>
              <button type="submit" className="st-btn" disabled={pending}>
                Save
              </button>
            </form>
          </Card>
        ))}
      </div>
      <Card title="Run now and recent runs" id="a-runs">
        <button
          type="button"
          className="st-btn"
          disabled={pending}
          onClick={() => act(() => runAutomationsNowAction())}
        >
          Run everything now
        </button>
        <ul className="st-list">
          {data.runs.map((r) => (
            <li key={r.id}>
              <span>
                {r.rule} · {r.entity}{" "}
                <small>
                  {r.at} · {r.status}
                </small>
              </span>
            </li>
          ))}
          {!data.runs.length ? <li className="st-note">Nothing has run yet.</li> : null}
        </ul>
      </Card>
    </Frame>
  );
}

export type NotificationsData = {
  items: {
    id: string;
    kind: string;
    title: string;
    body: string | null;
    link: string | null;
    read: boolean;
    at: string;
  }[];
};

export function NotificationsView({ user, data }: { user: string; data: NotificationsData }) {
  const { pending, note, act } = useAct();
  return (
    <Frame section="activity" user={user} note={note}>
      <Card title="Activity" id="n-list">
        <button
          type="button"
          className="st-btn st-btn--ghost"
          disabled={pending || !data.items.some((i) => !i.read)}
          onClick={() => act(() => markNotificationsReadAction())}
        >
          Mark all read
        </button>
        <ul className="st-list st-list--tall" aria-label="Activity">
          {data.items.map((n) => (
            <li key={n.id} data-unread={!n.read || undefined}>
              <span>
                <strong>
                  {n.read ? "" : "● "}
                  {n.title}
                </strong>
                <small>
                  {n.kind} · {n.at}
                  {n.body ? ` · ${n.body}` : ""}
                </small>
              </span>
              {n.link ? (
                <Link className="st-btn st-btn--ghost" href={n.link}>
                  Open
                </Link>
              ) : null}
            </li>
          ))}
          {!data.items.length ? <li className="st-note">Nothing yet.</li> : null}
        </ul>
      </Card>
    </Frame>
  );
}
