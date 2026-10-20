"use client";

import { DateField } from "@/components/DateField";
import { Button, Checkbox, Field, Input, Status, Text } from "@holominimal/ui";

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
import { Card, Frame, useAct, useConfirm } from "./StudioFrame";

export type TasksData = {
  tasks: { id: string; title: string; dueOn: string | null; notes: string | null; done: boolean; overdue: boolean }[];
};

export function TasksView({ user, data }: { user: string; data: TasksData }) {
  const { pending, note, act, submit } = useAct();
  const [ask, confirmEl] = useConfirm();
  const [f, setF] = useState<Record<string, string>>({});
  const set = (k: string) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  return (
    <Frame section="tasks" user={user} note={note}>
      {confirmEl}
      <div className="st-grid">
        <Card title="Tasks" id="t-list">
          {data.tasks.length ? (
            <ul className="hm-data-list st-list st-list--tall">
              {data.tasks.map((t) => (
                <li className="hm-data-list-item" key={t.id} data-task-id={t.id} data-done={t.done || undefined}>
                  <Checkbox
                    checked={t.done}
                    disabled={pending}
                    onChange={(e) => act(() => toggleTaskAction({ taskId: t.id, done: e.target.checked }))}
                    aria-label={`Mark "${t.title}" ${t.done ? "not done" : "done"}`}
                    label={
                      <span style={{ textDecoration: t.done ? "line-through" : undefined }}>
                        {t.title}
                        <small>
                          {t.dueOn ? `due ${t.dueOn}` : "no date"}
                          {t.overdue ? " · overdue" : ""}
                        </small>
                      </span>
                    }
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    onClick={async () =>
                      (await ask({
                        title: `Delete "${t.title}"?`,
                        body: "To keep a record of it, mark it done instead.",
                        action: "Delete task",
                      })) && act(() => deleteTaskAction(t.id))
                    }
                    aria-label={`Delete "${t.title}"`}
                  >
                    Delete
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <Text size="sm" tone="muted">
              Nothing to do.
            </Text>
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
            <Field label="Task">
              <Input value={f.t ?? ""} onChange={set("t")} />
            </Field>
            <Field label="Due">
              <DateField value={f.d ?? ""} onChange={set("d")} />
            </Field>
            <Field label="Notes">
              <Input value={f.n ?? ""} onChange={set("n")} />
            </Field>
            <Button type="submit" disabled={pending}>
              Add task
            </Button>
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
      <Text size="sm" tone="muted">
        These run every hour (a Vercel Cron job; TODO(owner): needs CRON_SECRET) and each acts on a given thing only
        once. A client who turned reminders off in their portal is not nudged. Reminders link to the client's portal
        sign-in.
      </Text>
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
              <Text size="sm" tone="muted">
                {r.blurb}
              </Text>
              <Checkbox
                checked={on[r.key]}
                onChange={(e) => setOn((x) => ({ ...x, [r.key]: e.target.checked }))}
                label="Enabled"
              />
              <Field label="Days">
                <Input inputMode="numeric" value={f[`d-${r.key}`] ?? String(r.days)} onChange={set(`d-${r.key}`)} />
              </Field>
              <Field label="Extra line in the email (optional)">
                <Input value={f[`m-${r.key}`] ?? r.message} onChange={set(`m-${r.key}`)} />
              </Field>
              <Button type="submit" disabled={pending}>
                Save
              </Button>
            </form>
          </Card>
        ))}
      </div>
      <Card title="Run now and recent runs" id="a-runs">
        <Button disabled={pending} onClick={() => act(() => runAutomationsNowAction())}>
          Run everything now
        </Button>
        <ul className="hm-data-list st-list">
          {data.runs.map((r) => (
            <li className="hm-data-list-item" key={r.id}>
              <span>
                {r.rule} · {r.entity}{" "}
                <small>
                  {r.at} · {r.status}
                </small>
              </span>
            </li>
          ))}
          {!data.runs.length ? <li className="hm-empty">Nothing has run yet.</li> : null}
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
        <Button
          variant="secondary"
          disabled={pending || !data.items.some((i) => !i.read)}
          onClick={() => act(() => markNotificationsReadAction())}
        >
          Mark all read
        </Button>
        <ul className="hm-data-list st-list st-list--tall" aria-label="Activity">
          {data.items.map((n) => (
            <li className="hm-data-list-item" key={n.id} data-unread={!n.read || undefined}>
              <span>
                <strong>
                  {n.read ? null : <Status tone="accent" aria-label="Unread" />}
                  {n.title}
                </strong>
                <small>
                  {n.kind} · {n.at}
                  {n.body ? ` · ${n.body}` : ""}
                </small>
              </span>
              {n.link ? (
                <Button asChild variant="secondary" size="sm">
                  <Link href={n.link}>Open</Link>
                </Button>
              ) : null}
            </li>
          ))}
          {!data.items.length ? <li className="hm-empty">Nothing yet.</li> : null}
        </ul>
      </Card>
    </Frame>
  );
}
