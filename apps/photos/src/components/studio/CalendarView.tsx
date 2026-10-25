"use client";

import {
  Button,
  ChevronLeftIcon,
  ChevronRightIcon,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  Field,
  IconButton,
  Input,
  Select,
  Text,
  Textarea,
} from "@holominimal/ui";
import { DateRangePicker } from "@holominimal/ui";
import { useMemo, useState } from "react";
import { DateField, TimeField } from "@/components/DateField";
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
  updateAppointmentAction,
} from "@/app/studio/calendar-actions";
import { Card, FormDialog, Frame, useAct, useConfirm, useNotify } from "./StudioFrame";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const parseDay = (v?: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v ?? "");
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : undefined;
};
const dayIso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

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
    start: string;
    end: string;
    buffer: number;
    travel: number;
    notes: string;
    jobId: string;
  }[];
  rules: { id: string; weekday: number; startMinute: number; endMinute: number }[];
  blackouts: { id: string; date: string; reason: string | null }[];
  waiting: { wanted: string; count: number }[];
  icsUrl: string;
  jobs: { id: string; title: string }[];
};

type Dlg = "add" | "hours" | "blocked" | "minis" | "settings" | null;

/**
 * A month you can browse: each day shows its appointments, a blocked day is shaded, and a day opens to what is on it.
 * Adding, bookable hours, blocked days, mini-sessions and settings are one button each, in dialogs.
 */
export function CalendarView({ user, data, month }: { user: string; data: CalendarData; month?: string }) {
  const { pending, note, act, go } = useAct();
  const notify = useNotify();
  const [ask, confirmEl] = useConfirm();
  const today = useMemo(() => {
    const n = new Date();
    return iso(n.getFullYear(), n.getMonth(), n.getDate());
  }, []);
  const [view, setView] = useState(() => {
    const m = /^(\d{4})-(\d{2})$/.exec(month ?? "");
    if (m && Number(m[2]) >= 1 && Number(m[2]) <= 12) return { y: Number(m[1]), m: Number(m[2]) - 1 };
    const n = new Date();
    return { y: n.getFullYear(), m: n.getMonth() };
  });
  const [dlg, setDlg] = useState<Dlg>(null);
  const [day, setDay] = useState<string | null>(null);
  const [f, setF] = useState<Record<string, string>>({});
  const set = (k: string) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  const open = (d: Dlg, fields: Record<string, string> = {}) => {
    setF(fields);
    setDlg(d);
  };

  const byDay = useMemo(() => {
    const m = new Map<string, CalendarData["appointments"]>();
    for (const a of data.appointments) m.set(a.day, [...(m.get(a.day) ?? []), a]);
    return m;
  }, [data.appointments]);
  const blocked = useMemo(() => new Map(data.blackouts.map((b) => [b.date, b])), [data.blackouts]);

  const first = new Date(view.y, view.m, 1);
  const lead = first.getDay();
  const length = new Date(view.y, view.m + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((lead + length) / 7) * 7 }, (_, i) => {
    const d = i - lead + 1;
    return d >= 1 && d <= length ? d : null;
  });
  const title = first.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const go2 = (delta: number) =>
    setView((v) => ({ y: v.y + Math.floor((v.m + delta) / 12), m: (v.m + delta + 120) % 12 }));
  const dayItems = day ? (byDay.get(day) ?? []) : [];
  const dayLabel = day
    ? new Date(`${day}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
    : "";

  return (
    <Frame section="calendar" user={user} note={note}>
      {confirmEl}
      <Card
        title={title}
        id="cal-month"
        actions={
          <>
            <IconButton variant="secondary" size="sm" aria-label="Previous month" onClick={() => go2(-1)}>
              <ChevronLeftIcon />
            </IconButton>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const n = new Date();
                setView({ y: n.getFullYear(), m: n.getMonth() });
              }}
            >
              Today
            </Button>
            <IconButton variant="secondary" size="sm" aria-label="Next month" onClick={() => go2(1)}>
              <ChevronRightIcon />
            </IconButton>
            <Button size="sm" onClick={() => open("add", { date: day ?? today, kind: "shoot" })}>
              Add to the calendar
            </Button>
          </>
        }
      >
        <Text size="sm" tone="muted">
          All times in {data.timezone}. Buffers and travel time keep a slot clear on both sides. Open a day to see it or
          add to it.
        </Text>
        <div className="cal" role="grid" aria-label={title}>
          <div className="cal-head" role="row">
            {WEEKDAYS.map((w) => (
              <span key={w} role="columnheader" aria-label={w}>
                {w.slice(0, 3)}
              </span>
            ))}
          </div>
          <div className="cal-body">
            {cells.map((d, i) => {
              if (d === null) return <span key={`e${i}`} className="cal-cell cal-cell--empty" role="gridcell" />;
              const key = iso(view.y, view.m, d);
              const items = byDay.get(key) ?? [];
              const shut = blocked.get(key);
              return (
                <button
                  type="button"
                  key={key}
                  role="gridcell"
                  className="cal-cell"
                  data-today={key === today || undefined}
                  data-blocked={shut ? "" : undefined}
                  aria-label={`${key}: ${items.length} appointment${items.length === 1 ? "" : "s"}${shut ? ", blocked" : ""}`}
                  onClick={() => setDay(key)}
                >
                  <b>{d}</b>
                  {shut ? <small className="cal-shut">Blocked</small> : null}
                  {items.slice(0, 3).map((a) => (
                    <span
                      key={a.id}
                      className="cal-chip"
                      data-kind={a.kind}
                      data-hold={a.status === "hold" || undefined}
                    >
                      {a.time.split(" to ")[0]} {a.title}
                    </span>
                  ))}
                  {items.length > 3 ? <small>+{items.length - 3} more</small> : null}
                </button>
              );
            })}
          </div>
        </div>
        <div className="st-actions">
          <Button variant="secondary" size="sm" onClick={() => open("hours")}>
            Bookable hours
          </Button>
          <Button variant="secondary" size="sm" onClick={() => open("blocked", {})}>
            Blocked days
          </Button>
          <Button variant="secondary" size="sm" onClick={() => open("minis", { mc: "6", mlen: "20", mg: "10" })}>
            Mini-sessions
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              open("settings", {
                tz: data.timezone,
                sb: String(data.settings.defaultBufferMin),
                sn: String(data.settings.minNoticeHours),
                sa: String(data.settings.maxAdvanceDays),
                sd: data.settings.depositDollars,
              })
            }
          >
            Settings and feed
          </Button>
        </div>
      </Card>

      {data.waiting.length ? (
        <Card title="Waitlist" id="cal-wait">
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
        </Card>
      ) : null}

      <Dialog open={day !== null} onOpenChange={(o) => !o && setDay(null)}>
        <DialogContent size="md">
          <DialogTitle>{dayLabel}</DialogTitle>
          <DialogDescription>
            {blocked.get(day ?? "")
              ? `Blocked${blocked.get(day ?? "")?.reason ? `: ${blocked.get(day ?? "")?.reason}` : ""}`
              : "Open for booking within your hours."}
          </DialogDescription>
          {dayItems.length ? (
            <ul className="hm-data-list st-list" aria-label="On this day">
              {dayItems.map((a) => (
                <li className="hm-data-list-item" key={a.id} data-appointment-id={a.id}>
                  <span>
                    <strong>{a.title}</strong>
                    <small>{[a.time, a.kind, a.status, a.client, a.location].filter(Boolean).join(" · ")}</small>
                    {a.notes ? <small className="rc-note">{a.notes}</small> : null}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    aria-label={`Edit ${a.title}`}
                    onClick={() => {
                      setDay(null);
                      open("add", {
                        aid: a.id,
                        title: a.title,
                        date: a.day,
                        start: a.start,
                        end: a.end,
                        kind: a.kind === "shoot" || a.kind === "consult" || a.kind === "block" ? a.kind : "shoot",
                        location: a.location ?? "",
                        buffer: String(a.buffer),
                        travel: String(a.travel),
                        job: a.jobId,
                        notes: a.notes,
                      });
                      notify(`Loaded ${a.title}`);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={pending}
                    aria-label={`Cancel ${a.title}`}
                    onClick={async () =>
                      (await ask({
                        title: `Cancel ${a.title}?`,
                        body: "The client is not emailed, so let them know yourself. Anyone on the waitlist can be told from this page.",
                        action: "Cancel appointment",
                      })) && act(() => cancelAppointmentAction(a.id))
                    }
                  >
                    Cancel
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <Text size="sm" tone="muted">
              Nothing scheduled.
            </Text>
          )}
          <DialogFooter>
            {blocked.get(day ?? "") ? (
              <Button
                variant="secondary"
                disabled={pending}
                onClick={() => {
                  const b = blocked.get(day ?? "");
                  if (b) act(() => removeBlackoutAction(b.id));
                }}
              >
                Reopen this day
              </Button>
            ) : (
              <Button
                variant="secondary"
                onClick={() => {
                  const d = day;
                  setDay(null);
                  open("blocked", { bd: d ?? "" });
                }}
              >
                Block this day
              </Button>
            )}
            <Button
              onClick={() => {
                const d = day;
                setDay(null);
                open("add", { date: d ?? today, kind: "shoot" });
              }}
            >
              Add to this day
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FormDialog
        open={dlg === "add"}
        onOpenChange={(o) => !o && setDlg((d) => (d === "add" ? null : d))}
        title={f.aid ? "Edit calendar entry" : "Add to the calendar"}
        size="lg"
        submitLabel={f.aid ? "Save" : "Add"}
        pending={pending}
        onSubmit={() => {
          const body = {
            title: f.title ?? "",
            date: f.date ?? "",
            start: f.start ?? "",
            end: f.end ?? "",
            kind: f.kind,
            location: f.location,
            bufferMin: f.buffer,
            travelMin: f.travel,
            jobId: f.job,
            notes: f.notes,
          };
          return go(() =>
            f.aid ? updateAppointmentAction({ appointmentId: f.aid, ...body }) : addAppointmentAction(body),
          );
        }}
      >
        <Field label="Title">
          <Input value={f.title ?? ""} onChange={set("title")} />
        </Field>
        <Field label="Date">
          <DateField value={f.date ?? ""} onChange={set("date")} />
        </Field>
        <Field label="Start">
          <TimeField aria-label="Start time" value={f.start ?? ""} onChange={set("start")} />
        </Field>
        <Field label="End">
          <TimeField aria-label="End time" value={f.end ?? ""} onChange={set("end")} />
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
        <Field label="Notes" hint="Parking, who to find, what to bring. Only you see this.">
          <Textarea rows={3} value={f.notes ?? ""} onChange={set("notes")} />
        </Field>
      </FormDialog>

      <FormDialog
        open={dlg === "hours"}
        onOpenChange={(o) => !o && setDlg((d) => (d === "hours" ? null : d))}
        title="Bookable hours"
        description="When clients can book online. Nothing outside these hours is offered."
        submitLabel="Add hours"
        pending={pending}
        onSubmit={() => go(() => addRuleAction({ weekday: f.rwd ?? "1", start: f.rs ?? "", end: f.re ?? "" }))}
      >
        {data.rules.length ? (
          <ul className="hm-data-list st-list" aria-label="Current hours">
            {data.rules.map((r) => (
              <li className="hm-data-list-item" key={r.id}>
                <span>
                  {WEEKDAYS[r.weekday]} {hhmm(r.startMinute)} to {hhmm(r.endMinute)}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() => act(() => removeRuleAction(r.id))}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        ) : null}
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
          <TimeField aria-label="From" value={f.rs ?? ""} onChange={set("rs")} />
        </Field>
        <Field label="To">
          <TimeField aria-label="To" value={f.re ?? ""} onChange={set("re")} />
        </Field>
      </FormDialog>

      <FormDialog
        open={dlg === "blocked"}
        onOpenChange={(o) => !o && setDlg((d) => (d === "blocked" ? null : d))}
        title="Blocked days"
        submitLabel="Block day"
        pending={pending}
        onSubmit={() => go(() => addBlackoutAction({ date: f.bd ?? "", to: f.bt, reason: f.br }))}
      >
        {data.blackouts.length ? (
          <ul className="hm-data-list st-list" aria-label="Blocked days">
            {data.blackouts.map((b) => (
              <li className="hm-data-list-item" key={b.id}>
                <span>
                  {b.date}
                  {b.reason ? ` · ${b.reason}` : ""}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() => act(() => removeBlackoutAction(b.id))}
                >
                  Reopen
                </Button>
              </li>
            ))}
          </ul>
        ) : null}
        <Field
          label="Day or range"
          hint="Press a first day, then a last day to block several at once. Press one day twice for a single day."
        >
          <DateRangePicker
            aria-label="Days to block"
            value={{ from: parseDay(f.bd), to: parseDay(f.bt) }}
            onValueChange={(r) =>
              setF((x) => ({
                ...x,
                bd: r.from ? dayIso(r.from) : "",
                bt: r.to ? dayIso(r.to) : r.from ? dayIso(r.from) : "",
              }))
            }
          />
        </Field>
        <Field label="Reason (private)">
          <Input value={f.br ?? ""} onChange={set("br")} />
        </Field>
      </FormDialog>

      <FormDialog
        open={dlg === "minis"}
        onOpenChange={(o) => !o && setDlg((d) => (d === "minis" ? null : d))}
        title="Mini-sessions"
        description="Open a run of short slots on one day. Clients pick a slot on the booking page; one person gets each."
        submitLabel="Open slots"
        pending={pending}
        onSubmit={() =>
          go(() =>
            createMinislotsAction({
              label: f.ml ?? "",
              date: f.md ?? "",
              start: f.ms ?? "",
              count: f.mc ?? "6",
              length: f.mlen ?? "20",
              gap: f.mg ?? "10",
              location: f.mloc,
            }),
          )
        }
      >
        <Field label="Name">
          <Input value={f.ml ?? ""} onChange={set("ml")} placeholder="Fall minis" />
        </Field>
        <Field label="Day">
          <DateField value={f.md ?? ""} onChange={set("md")} />
        </Field>
        <Field label="First slot">
          <TimeField aria-label="First slot" value={f.ms ?? ""} onChange={set("ms")} />
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
      </FormDialog>

      <FormDialog
        open={dlg === "settings"}
        onOpenChange={(o) => !o && setDlg((d) => (d === "settings" ? null : d))}
        title="Calendar settings and feed"
        pending={pending}
        onSubmit={() =>
          go(() =>
            saveCalendarSettingsAction({
              timezone: f.tz ?? data.timezone,
              defaultBufferMin: f.sb ?? String(data.settings.defaultBufferMin),
              minNoticeHours: f.sn ?? String(data.settings.minNoticeHours),
              maxAdvanceDays: f.sa ?? String(data.settings.maxAdvanceDays),
              depositDollars: f.sd ?? data.settings.depositDollars,
            }),
          )
        }
      >
        <Field label="Time zone">
          <Input value={f.tz ?? ""} onChange={set("tz")} />
        </Field>
        <Field label="Default buffer (minutes)">
          <Input inputMode="numeric" value={f.sb ?? ""} onChange={set("sb")} />
        </Field>
        <Field label="Minimum notice (hours)">
          <Input inputMode="numeric" value={f.sn ?? ""} onChange={set("sn")} />
        </Field>
        <Field label="Book up to (days ahead)">
          <Input inputMode="numeric" value={f.sa ?? ""} onChange={set("sa")} />
        </Field>
        <Field label="Booking deposit (dollars, SAMPLE until you set it)">
          <Input inputMode="decimal" value={f.sd ?? ""} onChange={set("sd")} />
        </Field>
        <Text size="sm" tone="muted">
          Calendar feed (subscribe in Apple, Google or Outlook calendar; keep the link private):{" "}
          <code>{data.icsUrl}</code>{" "}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() =>
              navigator.clipboard?.writeText(data.icsUrl).then(
                () => notify("Calendar feed link copied", "success"),
                () => notify("Could not copy", "danger"),
              )
            }
          >
            Copy
          </Button>
        </Text>
      </FormDialog>
    </Frame>
  );
}
