"use client";

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
import { Card, Frame, useAct } from "./StudioFrame";

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
  const [f, setF] = useState<Record<string, string>>({});
  const set = (k: string) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  const days = [...new Set(data.appointments.map((a) => a.day))];
  return (
    <Frame section="calendar" user={user} note={note}>
      <div className="st-grid">
        <Card title="Upcoming" id="cal-up">
          <p className="st-note">
            All times in {data.timezone}. Buffers and travel time keep a slot clear on both sides.
          </p>
          {days.length ? (
            days.map((d) => (
              <div key={d}>
                <h3 className="st-day">{data.appointments.find((a) => a.day === d)?.dayLabel}</h3>
                <ul className="st-list">
                  {data.appointments
                    .filter((a) => a.day === d)
                    .map((a) => (
                      <li key={a.id} data-appointment-id={a.id}>
                        <span>
                          <strong>{a.title}</strong>
                          <small>{[a.time, a.kind, a.status, a.client, a.location].filter(Boolean).join(" · ")}</small>
                        </span>
                        <button
                          type="button"
                          className="st-btn st-btn--ghost"
                          disabled={pending}
                          onClick={() => act(() => cancelAppointmentAction(a.id))}
                          aria-label={`Cancel ${a.title}`}
                        >
                          Cancel
                        </button>
                      </li>
                    ))}
                </ul>
              </div>
            ))
          ) : (
            <p className="st-note">Nothing scheduled.</p>
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
            <label>
              Title
              <input value={f.title ?? ""} onChange={set("title")} />
            </label>
            <label>
              Date
              <input type="date" value={f.date ?? ""} onChange={set("date")} />
            </label>
            <label>
              Start
              <input type="time" value={f.start ?? ""} onChange={set("start")} />
            </label>
            <label>
              End
              <input type="time" value={f.end ?? ""} onChange={set("end")} />
            </label>
            <label>
              Kind
              <select value={f.kind ?? "shoot"} onChange={set("kind")}>
                <option value="shoot">Shoot</option>
                <option value="consult">Consult</option>
                <option value="block">Personal block</option>
              </select>
            </label>
            <label>
              Where
              <input value={f.location ?? ""} onChange={set("location")} />
            </label>
            <label>
              Buffer each side (minutes)
              <input
                inputMode="numeric"
                value={f.buffer ?? ""}
                onChange={set("buffer")}
                placeholder={String(data.settings.defaultBufferMin)}
              />
            </label>
            <label>
              Travel each way (minutes)
              <input inputMode="numeric" value={f.travel ?? ""} onChange={set("travel")} placeholder="0" />
            </label>
            <label>
              Job (optional)
              <select value={f.job ?? ""} onChange={set("job")}>
                <option value="">None</option>
                {data.jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="st-btn" disabled={pending}>
              Add
            </button>
          </form>
        </Card>

        <Card title="Bookable hours" id="cal-hours">
          <p className="st-note">When clients can book online. Nothing outside these hours is offered.</p>
          <ul className="st-list">
            {data.rules.map((r) => (
              <li key={r.id}>
                <span>
                  {WEEKDAYS[r.weekday]} {hhmm(r.startMinute)} to {hhmm(r.endMinute)}
                </span>
                <button
                  type="button"
                  className="st-btn st-btn--ghost"
                  disabled={pending}
                  onClick={() => act(() => removeRuleAction(r.id))}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <form
            noValidate
            className="st-form"
            onSubmit={submit(() => addRuleAction({ weekday: f.rwd ?? "1", start: f.rs ?? "", end: f.re ?? "" }))}
          >
            <label>
              Day
              <select value={f.rwd ?? "1"} onChange={set("rwd")}>
                {WEEKDAYS.map((d, i) => (
                  <option key={d} value={i}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
            <label>
              From
              <input type="time" value={f.rs ?? ""} onChange={set("rs")} />
            </label>
            <label>
              To
              <input type="time" value={f.re ?? ""} onChange={set("re")} />
            </label>
            <button type="submit" className="st-btn" disabled={pending}>
              Add hours
            </button>
          </form>
        </Card>

        <Card title="Blocked days" id="cal-black">
          <ul className="st-list">
            {data.blackouts.map((b) => (
              <li key={b.id}>
                <span>
                  {b.date}
                  {b.reason ? ` · ${b.reason}` : ""}
                </span>
                <button
                  type="button"
                  className="st-btn st-btn--ghost"
                  disabled={pending}
                  onClick={() => act(() => removeBlackoutAction(b.id))}
                >
                  Reopen
                </button>
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
            <label>
              Day
              <input type="date" value={f.bd ?? ""} onChange={set("bd")} />
            </label>
            <label>
              Reason (private)
              <input value={f.br ?? ""} onChange={set("br")} />
            </label>
            <button type="submit" className="st-btn" disabled={pending}>
              Block day
            </button>
          </form>
        </Card>

        <Card title="Mini-sessions" id="cal-mini">
          <p className="st-note">
            Open a run of short slots on one day. Clients pick a slot on the booking page; one person gets each.
          </p>
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
            <label>
              Name
              <input value={f.ml ?? ""} onChange={set("ml")} placeholder="Fall minis" />
            </label>
            <label>
              Day
              <input type="date" value={f.md ?? ""} onChange={set("md")} />
            </label>
            <label>
              First slot
              <input type="time" value={f.ms ?? ""} onChange={set("ms")} />
            </label>
            <label>
              Slots
              <input inputMode="numeric" value={f.mc ?? "6"} onChange={set("mc")} />
            </label>
            <label>
              Minutes each
              <input inputMode="numeric" value={f.mlen ?? "20"} onChange={set("mlen")} />
            </label>
            <label>
              Gap between (minutes)
              <input inputMode="numeric" value={f.mg ?? "10"} onChange={set("mg")} />
            </label>
            <label>
              Where
              <input value={f.mloc ?? ""} onChange={set("mloc")} />
            </label>
            <button type="submit" className="st-btn" disabled={pending}>
              Open slots
            </button>
          </form>
        </Card>

        <Card title="Waitlist" id="cal-wait">
          {data.waiting.length ? (
            <ul className="st-list">
              {data.waiting.map((w) => (
                <li key={w.wanted}>
                  <span>
                    {w.wanted} <small>{w.count} waiting</small>
                  </span>
                  <button
                    type="button"
                    className="st-btn"
                    disabled={pending}
                    onClick={() => act(() => notifyWaitlistAction(w.wanted))}
                  >
                    Tell them a spot opened
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="st-note">Nobody is waiting.</p>
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
            <label>
              Time zone
              <input value={f.tz ?? data.timezone} onChange={set("tz")} />
            </label>
            <label>
              Default buffer (minutes)
              <input inputMode="numeric" value={f.sb ?? String(data.settings.defaultBufferMin)} onChange={set("sb")} />
            </label>
            <label>
              Minimum notice (hours)
              <input inputMode="numeric" value={f.sn ?? String(data.settings.minNoticeHours)} onChange={set("sn")} />
            </label>
            <label>
              Book up to (days ahead)
              <input inputMode="numeric" value={f.sa ?? String(data.settings.maxAdvanceDays)} onChange={set("sa")} />
            </label>
            <label>
              Booking deposit (dollars, SAMPLE until you set it)
              <input inputMode="decimal" value={f.sd ?? data.settings.depositDollars} onChange={set("sd")} />
            </label>
            <button type="submit" className="st-btn" disabled={pending}>
              Save
            </button>
          </form>
          <p className="st-note">
            Calendar feed (subscribe in Apple, Google or Outlook calendar; keep the link private):{" "}
            <code>{data.icsUrl}</code>
          </p>
        </Card>
      </div>
    </Frame>
  );
}
