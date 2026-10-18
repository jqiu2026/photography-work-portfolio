"use client";
import { cx } from "../utils/cx.js";
import { CalendarIcon } from "../icons/interface.js";
import { Popover, PopoverContent, PopoverTrigger } from "./popover.js";
import { Calendar } from "./calendar.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
//#region src/components/date-picker.tsx
function Field({ label, empty, disabled, className, ...rest }) {
	return /* @__PURE__ */ jsx(PopoverTrigger, {
		asChild: true,
		children: /* @__PURE__ */ jsxs("button", {
			type: "button",
			...rest,
			disabled,
			className: cx("hm-datepicker hm-control", className),
			"data-empty": empty ? "" : void 0,
			children: [/* @__PURE__ */ jsx("span", {
				className: "hm-datepicker-label",
				children: label
			}), /* @__PURE__ */ jsx(CalendarIcon, {
				size: 14,
				strokeWidth: 1.4
			})]
		})
	});
}
/** A field that opens a calendar in a popover. Picking a day closes it and returns focus to the field. */
function DatePicker({ value: controlled, defaultValue = null, onValueChange, placeholder = "Pick a date", format, min, max, isDisabled, weekStartsOn, locale, disabled, className, ...rest }) {
	const [inner, setInner] = useState(defaultValue);
	const value = controlled === void 0 ? inner : controlled;
	const [open, setOpen] = useState(false);
	const fmt = format ?? ((d) => new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(d));
	return /* @__PURE__ */ jsxs(Popover, {
		open,
		onOpenChange: setOpen,
		children: [/* @__PURE__ */ jsx(Field, {
			...rest,
			label: value ? fmt(value) : placeholder,
			empty: !value,
			disabled,
			className
		}), /* @__PURE__ */ jsx(PopoverContent, {
			"aria-label": "Choose a date",
			className: "hm-datepicker-pop",
			children: /* @__PURE__ */ jsx(Calendar, {
				value,
				min,
				max,
				isDisabled,
				weekStartsOn,
				locale,
				onValueChange: (d) => {
					if (controlled === void 0) setInner(d);
					onValueChange?.(d);
					setOpen(false);
				}
			})
		})]
	});
}
/** Two dates in one field: the first press sets the start, the second the end, then it closes. */
function DateRangePicker({ value: controlled, defaultValue = {}, onValueChange, placeholder = "Pick dates", format, min, max, isDisabled, weekStartsOn, locale, disabled, className, ...rest }) {
	const [inner, setInner] = useState(defaultValue);
	const value = controlled ?? inner;
	const [open, setOpen] = useState(false);
	const fmt = format ?? ((d) => new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(d));
	const label = value.from ? `${fmt(value.from)}${value.to ? ` – ${fmt(value.to)}` : " – …"}` : placeholder;
	return /* @__PURE__ */ jsxs(Popover, {
		open,
		onOpenChange: setOpen,
		children: [/* @__PURE__ */ jsx(Field, {
			...rest,
			label,
			empty: !value.from,
			disabled,
			className
		}), /* @__PURE__ */ jsx(PopoverContent, {
			"aria-label": "Choose dates",
			className: "hm-datepicker-pop",
			children: /* @__PURE__ */ jsx(Calendar, {
				mode: "range",
				value,
				min,
				max,
				isDisabled,
				weekStartsOn,
				locale,
				onValueChange: (r) => {
					if (controlled === void 0) setInner(r);
					onValueChange?.(r);
					if (r.from && r.to) setOpen(false);
				}
			})
		})]
	});
}
//#endregion
export { DatePicker, DateRangePicker };

//# sourceMappingURL=date-picker.js.map