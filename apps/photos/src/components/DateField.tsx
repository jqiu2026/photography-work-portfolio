"use client";

import { DatePicker } from "@holominimal/ui";
import { Select } from "@/components/ui";
import { useState } from "react";

/** "2026-03-14" to a local Date (no time zone shift), and back. */
const parse = (v?: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v ?? "");
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
};
const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

type Change = (e: { target: { value: string } }) => void;
type Common = {
  id?: string;
  name?: string;
  min?: string;
  max?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  "aria-label"?: string;
};

/**
 * A day field that uses Holominimal's date picker instead of the browser's. It keeps the value as "YYYY-MM-DD", so it
 * stands in for `<input type="date">`: controlled with `value` and `onChange`, or uncontrolled with `name` (a hidden
 * input carries it into a form's data).
 */
export function DateField({
  value,
  defaultValue = "",
  onChange,
  name,
  min,
  max,
  ...rest
}: Common & { value?: string; defaultValue?: string; onChange?: Change }) {
  const [inner, setInner] = useState(defaultValue);
  const current = value ?? inner;
  return (
    <>
      <DatePicker
        {...rest}
        value={parse(current)}
        min={parse(min) ?? undefined}
        max={parse(max) ?? undefined}
        onValueChange={(d) => {
          const v = d ? iso(d) : "";
          setInner(v);
          onChange?.({ target: { value: v } });
        }}
      />
      {name ? <input type="hidden" name={name} value={current} /> : null}
    </>
  );
}

const TIMES = Array.from(
  { length: 48 },
  (_, i) => `${String(Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`,
);
const label = (t: string) => {
  const [h = "0", m = "00"] = t.split(":");
  const hour = Number(h);
  return `${hour % 12 || 12}:${m} ${hour < 12 ? "AM" : "PM"}`;
};

/** A day and a time (every half hour), as "YYYY-MM-DDTHH:MM" like `<input type="datetime-local">`. */
export function DateTimeField({
  value = "",
  onChange,
  disabled,
  ...rest
}: Common & { value?: string; onChange?: Change }) {
  const [day = "", time = ""] = value.split("T");
  const emit = (d: string, t: string) => onChange?.({ target: { value: d ? `${d}T${t || "09:00"}` : "" } });
  return (
    <div className="pm-pair">
      <DateField {...rest} disabled={disabled} value={day} onChange={(e) => emit(e.target.value, time.slice(0, 5))} />
      <Select
        aria-label="Time"
        disabled={disabled || !day}
        value={time.slice(0, 5) || "09:00"}
        onValueChange={(t) => emit(day, t)}
        options={TIMES.map((t) => ({ value: t, label: label(t) }))}
      />
    </div>
  );
}

const QUARTERS = Array.from(
  { length: 96 },
  (_, i) => `${String(Math.floor(i / 4)).padStart(2, "0")}:${String((i % 4) * 15).padStart(2, "0")}`,
);

/** A time of day ("HH:MM", every 15 minutes) in a Holominimal select, for `<input type="time">`. */
export function TimeField({
  value,
  onChange,
  disabled,
  ...rest
}: Pick<Common, "aria-label" | "disabled" | "id"> & { value?: string; onChange?: Change }) {
  const list = value && !QUARTERS.includes(value) ? [...QUARTERS, value].sort() : QUARTERS;
  return (
    <Select
      {...rest}
      disabled={disabled}
      value={value ?? ""}
      onValueChange={(t) => onChange?.({ target: { value: t } })}
      options={[{ value: "", label: "Pick a time" }, ...list.map((t) => ({ value: t, label: label(t) }))]}
    />
  );
}
