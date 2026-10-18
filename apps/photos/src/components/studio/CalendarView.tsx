"use client";

import { Button, Field, Input, Select, Text } from "@holominimal/ui";

import {
  addAppointmentAction,
  addBlackoutAction,
  addRuleAction,
  cancelAppointmentAction,
  createMinislotsAction,
  notifyWaitlistAction,
  removeBlackoutAction,
  removeRuleAction,
  saveCalendarSettingsAction,
} from "@/app/studio/calendar-actions";
import { useState } from "react";
import { Card, Frame, useAct, useConfirm } from "./StudioFrame";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

export type CalendarData = {
  timezone: string;
  settings: { defaultBufferMin: number; minNoticeHours: number; maxAdvanceDays: number; depositDollars: string };
  appointments: {
    id: string;
    title: string;
    kind: string;
    status: string;
    day: string;
    dayLabel: string;
    time: string;
    location: string | null;
    client: string | null;
  }[];
  rules: { id: string; weekday: number; startMinute: number; endMinute: number }[];
  blackouts: { id: string; date: string; reason: string | null }[];
  waiting: { wanted: string; count: number }[];
  icsUrl: string;
  jobs: { id: string; title: string }[];
};

/** Calendar: upcoming appointments, bookable hours, blocked days, mini-session slots, the .ics feed, and the waitlist. */
export function CalendarView({ user, data }: { user: string; data: CalendarData }) {
  const { pending, note, act, submit } = useAct();
  const [ask, confirmEl] = useConfirm();
  const [f, setF] = useState<Record<string, string>>({});
  const set = (k: string) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  const days = [...new Set(data.appointments.map((a) => a.day))];
  return (
    <Frame section="calendar" user={user} note={note}>
      {confirmEl}
      <div className="st-grid">
        <Card title="Upcoming" id="cal-up">
          <Text size="sm" tone="muted">
            All times in {data.timezone}. Buffers and travel time keep a slot clear on both sides.
          </Text>
          {days.length ? (
            days.map((d) => (
              <div key={d}>
                <h3 className="st-day">{data.appointments.find((a) => a.day === d)?.dayLabel}</h3>
                <ul className="hm-data-list st-list">
                  {data.appointments
                    .filter((a) => a.day === d)
                    .map((a) => (
                      <li className="hm-data-list-item" key={a.id} data-appointment-id={a.id}>
                        <span>
                          <strong>{a.title}</strong>
                          <small>{[a.time, a.kind, a.status, a.client, a.location].filter(Boolean).join(" · ")}</small>
                        </span>
                        <Button
                          variant="secondary"
                          disabled={pending}
                          onClick={async () =>
                            (await ask({
                              title: `Cancel ${a.title}?`,
                              body: "The client is not emailed, so let them know yourself. Anyone on the waitlist can be told from this page.",
                              action: "Cancel appointment",
                            })) && act(() => cancelAppointmentAction(a.id))
                          }
                          aria-label={`Cancel ${a.title}`}
                        >
                          Cancel
                        </Button>
                      </li>
                    ))}
                </ul>
              </div>
            ))
          ) : (
            <Text size="sm" tone="muted">
              Nothing scheduled.
            </Text>
          )}
        </Card>

        <Card title="Add to the calendar" id="cal-add">
          <form
            noValidate
            className="st-form"
            onSubmit={submit(
              () =>
                addAppointmentAction({
                  title: f.title ?? "",
                  date: f.date ?? "",
                  start: f.start ?? "",
                  end: f.end ?? "",
                  kind: f.kind,
                  location: f.location,
                  bufferMin: f.buffer,
                  travelMin: f.travel,
                  jobId: f.job,
                }),
              () => setF({}),
            )}
          >
            <Field label="Title">
              <Input value={f.title ?? ""} onChange={set("title")} />
            </Field>
            <Field label="Date">
              <Input type="date" value={f.date ?? ""} onChange={set("date")} />
            </Field>
            <Field label="Start">
              <Input type="time" value={f.start ?? ""} onChange={set("start")} />
            </Field>
            <Field label="End">
              <Input type="time" value={f.end ?? ""} onChange={set("end")} />
            </Field>
            <Field label="Kind">
              <Select value={f.kind ?? "shoot"} onValueChange={(v) => set("kind")({ target: { value: v } })}>
                <option value="shoot">Shoot</option>
                <option value="consult">Consult</option>
                <option value="block">Personal block</option>
              </Select>
            </Field>
            <Field label="Where">
              <Input value={f.location ?? ""} onChange={set("location")} />
            </Field>
            <Field label="Buffer each side (minutes)">
              <Input
                inputMode="numeric"
                value={f.buffer ?? ""}
                onChange={set("buffer")}
                placeholder={String(data.settings.defaultBufferMin)}
              />
            </Field>
            <Field label="Travel each way (minutes)">
              <Input inputMode="numeric" value={f.travel ?? ""} onChange={set("travel")} placeholder="0" />
            </Field>
            <Field label="Job (optional)">
              <Select value={f.job ?? ""} onValueChange={(v) => set("job")({ target: { value: v } })}>
                <option value="">None</option>
                {data.jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title}
                  </option>
                ))}
              </Select>
            </Field>
            <Button type="submit" disabled={pending}>
              Add
            </Button>
          </form>
        </Card>

        <Card title="Bookable hours" id="cal-hours">
          <Text size="sm" tone="muted">
            When clients can book online. Nothing outside these hours is offered.
          </Text>
          <ul className="hm-data-list st-list">
            {data.rules.map((r) => (
              <li className="hm-data-list-item" key={r.id}>
                <span>
                  {WEEKDAYS[r.weekday]} {hhmm(r.startMinute)} to {hhmm(r.endMinute)}
                </span>
                <Button variant="secondary" disabled={pending} onClick={() => act(() => removeRuleAction(r.id))}>
                  Remove
                </Button>
              </li>
            ))}
          </ul>
          <form
            noValidate
            className="st-form"
            onSubmit={submit(() => addRuleAction({ weekday: f.rwd ?? "1", start: f.rs ?? "", end: f.re ?? "" }))}
          >
            <Field label="Day">
              <Select value={f.rwd ?? "1"} onValueChange={(v) => set("rwd")({ target: { value: v } })}>
                {WEEKDAYS.map((d, i) => (
                  <option key={d} value={String(i)}>
                    {d}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="From">
              <Input type="time" value={f.rs ?? ""} onChange={set("rs")} />
            </Field>
            <Field label="To">
              <Input type="time" value={f.re ?? ""} onChange={set("re")} />
            </Field>
            <Button type="submit" disabled={pending}>
              Add hours
            </Button>
          </form>
        </Card>

        <Card title="Blocked days" id="cal-black">
          <ul className="hm-data-list st-list">
            {data.blackouts.map((b) => (
              <li className="hm-data-list-item" key={b.id}>
                <span>
                  {b.date}
                  {b.reason ? ` · ${b.reason}` : ""}
                </span>
                <Button variant="secondary" disabled={pending} onClick={() => act(() => removeBlackoutAction(b.id))}>
                  Reopen
                </Button>
              </li>
            ))}
          </ul>
          <form
            noValidate
            className="st-form"
            onSubmit={submit(
              () => addBlackoutAction({ date: f.bd ?? "", reason: f.br }),
              () => setF({}),
            )}
          >
            <Field label="Day">
              <Input type="date" value={f.bd ?? ""} onChange={set("bd")} />
            </Field>
            <Field label="Reason (private)">
              <Input value={f.br ?? ""} onChange={set("br")} />
            </Field>
            <Button type="submit" disabled={pending}>
              Block day
            </Button>
          </form>
        </Card>

        <Card title="Mini-sessions" id="cal-mini">
          <Text size="sm" tone="muted">
            Open a run of short slots on one day. Clients pick a slot on the booking page; one person gets each.
          </Text>
          <form
            noValidate
            className="st-form"
            onSubmit={submit(
              () =>
                createMinislotsAction({
                  label: f.ml ?? "",
                  date: f.md ?? "",
                  start: f.ms ?? "",
                  count: f.mc ?? "6",
                  length: f.mlen ?? "20",
                  gap: f.mg ?? "10",
                  location: f.mloc,
                }),
              () => setF({}),
            )}
          >
            <Field label="Name">
              <Input value={f.ml ?? ""} onChange={set("ml")} placeholder="Fall minis" />
            </Field>
            <Field label="Day">
              <Input type="date" value={f.md ?? ""} onChange={set("md")} />
            </Field>
            <Field label="First slot">
              <Input type="time" value={f.ms ?? ""} onChange={set("ms")} />
            </Field>
            <Field label="Slots">
              <Input inputMode="numeric" value={f.mc ?? "6"} onChange={set("mc")} />
            </Field>
            <Field label="Minutes each">
              <Input inputMode="numeric" value={f.mlen ?? "20"} onChange={set("mlen")} />
            </Field>
            <Field label="Gap between (minutes)">
              <Input inputMode="numeric" value={f.mg ?? "10"} onChange={set("mg")} />
            </Field>
            <Field label="Where">
              <Input value={f.mloc ?? ""} onChange={set("mloc")} />
            </Field>
            <Button type="submit" disabled={pending}>
              Open slots
            </Button>
          </form>
        </Card>

        <Card title="Waitlist" id="cal-wait">
          {data.waiting.length ? (
            <ul className="hm-data-list st-list">
              {data.waiting.map((w) => (
                <li className="hm-data-list-item" key={w.wanted}>
                  <span>
                    {w.wanted} <small>{w.count} waiting</small>
                  </span>
                  <Button disabled={pending} onClick={() => act(() => notifyWaitlistAction(w.wanted))}>
                    Tell them a spot opened
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <Text size="sm" tone="muted">
              Nobody is waiting.
            </Text>
          )}
        </Card>

        <Card title="Settings and calendar feed" id="cal-set">
          <form
            noValidate
            className="st-form"
            onSubmit={submit(() =>
              saveCalendarSettingsAction({
                timezone: f.tz ?? data.timezone,
                defaultBufferMin: f.sb ?? String(data.settings.defaultBufferMin),
                minNoticeHours: f.sn ?? String(data.settings.minNoticeHours),
                maxAdvanceDays: f.sa ?? String(data.settings.maxAdvanceDays),
                depositDollars: f.sd ?? data.settings.depositDollars,
              }),
            )}
          >
            <Field label="Time zone">
              <Input value={f.tz ?? data.timezone} onChange={set("tz")} />
            </Field>
            <Field label="Default buffer (minutes)">
              <Input inputMode="numeric" value={f.sb ?? String(data.settings.defaultBufferMin)} onChange={set("sb")} />
            </Field>
            <Field label="Minimum notice (hours)">
              <Input inputMode="numeric" value={f.sn ?? String(data.settings.minNoticeHours)} onChange={set("sn")} />
            </Field>
            <Field label="Book up to (days ahead)">
              <Input inputMode="numeric" value={f.sa ?? String(data.settings.maxAdvanceDays)} onChange={set("sa")} />
            </Field>
            <Field label="Booking deposit (dollars, SAMPLE until you set it)">
              <Input inputMode="decimal" value={f.sd ?? data.settings.depositDollars} onChange={set("sd")} />
            </Field>
            <Button type="submit" disabled={pending}>
              Save
            </Button>
          </form>
          <Text size="sm" tone="muted">
            Calendar feed (subscribe in Apple, Google or Outlook calendar; keep the link private):{" "}
            <code>{data.icsUrl}</code>
          </Text>
        </Card>
      </div>
    </Frame>
  );
}
