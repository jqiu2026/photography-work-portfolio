"use client";
import { cx } from "../utils/cx.js";
import { ChevronLeftIcon, ChevronRightIcon } from "../icons/interface.js";
import { addDays, addMonths, compareDays, isSameDay, isSameMonth, monthGrid, startOfDay, startOfMonth } from "../utils/date.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { useEffect, useId, useMemo, useRef, useState } from "react";
//#region src/components/calendar.tsx
/**
* A month grid for picking a day or a range. Arrows move by day and week, Home/End go to the week's ends, PageUp and
* PageDown change month (with Shift, year), Enter or Space picks. Changing month slides the grid the way you are
* heading; hovering a range preview is drawn as you move. Every day button has its full date as its name.
*/
function Calendar(props) {
	const { min, max, isDisabled, weekStartsOn = 0, locale, defaultMonth, className, mode = "single", ...rest } = props;
	const { value: _v, defaultValue: _d, onValueChange: _o, ...attrs } = rest;
	const range = mode === "range";
	const initial = props.defaultValue;
	const [inner, setInner] = useState(initial);
	const controlled = props.value;
	const value = controlled === void 0 ? inner : controlled;
	const onValueChange = props.onValueChange;
	const sel = value;
	const rng = range ? value ?? {} : {};
	const anchorDay = range ? rng.from ?? rng.to : sel;
	const today = useMemo(() => startOfDay(/* @__PURE__ */ new Date()), []);
	const [month, setMonth] = useState(() => startOfMonth(defaultMonth ?? anchorDay ?? today));
	const [focusDay, setFocusDay] = useState(() => startOfDay(defaultMonth ?? anchorDay ?? today));
	const [direction, setDirection] = useState("none");
	const [hover, setHover] = useState(null);
	const grid = useRef(null);
	const wantFocus = useRef(false);
	const labelId = useId();
	const monthLabel = new Intl.DateTimeFormat(locale, {
		month: "long",
		year: "numeric"
	});
	const dayLabel = new Intl.DateTimeFormat(locale, {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric"
	});
	const weekdayLong = new Intl.DateTimeFormat(locale, { weekday: "long" });
	const weekdayShort = new Intl.DateTimeFormat(locale, { weekday: "short" });
	const weeks = useMemo(() => monthGrid(month, weekStartsOn), [month, weekStartsOn]);
	const headers = weeks[0] ?? [];
	const blocked = (d) => min && compareDays(d, min) < 0 || max && compareDays(d, max) > 0 || isDisabled?.(d) || false;
	const commit = (v) => {
		if (controlled === void 0) setInner(v);
		onValueChange?.(v);
	};
	const go = (to) => {
		const target = startOfDay(to);
		if (!isSameMonth(target, month)) {
			setDirection(compareDays(target, month) > 0 ? "next" : "prev");
			setMonth(startOfMonth(target));
		}
		setFocusDay(target);
	};
	const pick = (d) => {
		if (blocked(d)) return;
		setFocusDay(d);
		if (!range) {
			commit(isSameDay(sel, d) ? null : d);
			return;
		}
		if (!rng.from || rng.to) commit({ from: d });
		else commit(compareDays(d, rng.from) < 0 ? {
			from: d,
			to: rng.from
		} : {
			from: rng.from,
			to: d
		});
		setHover(null);
	};
	useEffect(() => {
		if (!wantFocus.current) return;
		wantFocus.current = false;
		grid.current?.querySelector("[data-focus=\"true\"]")?.focus();
	}, [focusDay, month]);
	const key = (e) => {
		const to = {
			ArrowLeft: addDays(focusDay, -1),
			ArrowRight: addDays(focusDay, 1),
			ArrowUp: addDays(focusDay, -7),
			ArrowDown: addDays(focusDay, 7),
			Home: addDays(focusDay, -((focusDay.getDay() - weekStartsOn + 7) % 7)),
			End: addDays(focusDay, 6 - (focusDay.getDay() - weekStartsOn + 7) % 7),
			PageUp: addMonths(focusDay, e.shiftKey ? -12 : -1),
			PageDown: addMonths(focusDay, e.shiftKey ? 12 : 1)
		}[e.key];
		if (!to) return;
		e.preventDefault();
		wantFocus.current = true;
		go(to);
	};
	const inPreview = (d) => {
		if (!range || !rng.from || rng.to || !hover) return false;
		const [a, b] = compareDays(hover, rng.from) < 0 ? [hover, rng.from] : [rng.from, hover];
		return compareDays(d, a) >= 0 && compareDays(d, b) <= 0;
	};
	const inRange = (d) => !!rng.from && !!rng.to && compareDays(d, rng.from) >= 0 && compareDays(d, rng.to) <= 0;
	const prevDisabled = !!min && compareDays(addDays(month, -1), min) < 0;
	const nextDisabled = !!max && compareDays(addMonths(month, 1), max) > 0;
	const shift = (n) => {
		setDirection(n > 0 ? "next" : "prev");
		setMonth(addMonths(month, n));
		setFocusDay((d) => addMonths(d, n));
	};
	return /* @__PURE__ */ jsxs("div", {
		...attrs,
		className: cx("hm-calendar", className),
		children: [/* @__PURE__ */ jsxs("div", {
			className: "hm-calendar-head",
			children: [
				/* @__PURE__ */ jsx("button", {
					type: "button",
					className: "hm-calendar-nav",
					"aria-label": "Previous month",
					disabled: prevDisabled,
					onClick: () => shift(-1),
					children: /* @__PURE__ */ jsx(ChevronLeftIcon, {
						size: 14,
						strokeWidth: 1.6
					})
				}),
				/* @__PURE__ */ jsx("p", {
					id: labelId,
					className: "hm-calendar-title",
					"aria-live": "polite",
					children: monthLabel.format(month)
				}),
				/* @__PURE__ */ jsx("button", {
					type: "button",
					className: "hm-calendar-nav",
					"aria-label": "Next month",
					disabled: nextDisabled,
					onClick: () => shift(1),
					children: /* @__PURE__ */ jsx(ChevronRightIcon, {
						size: 14,
						strokeWidth: 1.6
					})
				})
			]
		}), /* @__PURE__ */ jsx("div", {
			className: "hm-calendar-viewport",
			children: /* @__PURE__ */ jsxs("div", {
				ref: grid,
				role: "grid",
				"aria-labelledby": labelId,
				"aria-multiselectable": range || void 0,
				className: "hm-calendar-grid",
				"data-direction": direction,
				onKeyDown: key,
				onPointerLeave: () => setHover(null),
				children: [/* @__PURE__ */ jsx("div", {
					role: "row",
					className: "hm-calendar-row hm-calendar-weekdays",
					children: headers.map((d) => /* @__PURE__ */ jsx("span", {
						role: "columnheader",
						"aria-label": weekdayLong.format(d),
						className: "hm-calendar-weekday",
						children: weekdayShort.format(d).slice(0, 2)
					}, d.getDay()))
				}), weeks.map((week) => /* @__PURE__ */ jsx("div", {
					role: "row",
					className: "hm-calendar-row",
					children: week.map((d) => {
						const outside = !isSameMonth(d, month);
						const selected = range ? isSameDay(d, rng.from) || isSameDay(d, rng.to) : isSameDay(d, sel);
						const off = blocked(d);
						const focused = isSameDay(d, focusDay);
						return /* @__PURE__ */ jsx("span", {
							role: "gridcell",
							"aria-selected": selected || void 0,
							className: "hm-calendar-cell",
							children: /* @__PURE__ */ jsx("button", {
								type: "button",
								tabIndex: focused ? 0 : -1,
								"data-focus": focused,
								"data-today": isSameDay(d, today) ? "" : void 0,
								"data-outside": outside ? "" : void 0,
								"data-selected": selected ? "" : void 0,
								"data-in-range": inRange(d) || inPreview(d) ? "" : void 0,
								"data-range-start": range && isSameDay(d, rng.from) ? "" : void 0,
								"data-range-end": range && isSameDay(d, rng.to) ? "" : void 0,
								"aria-label": dayLabel.format(d),
								"aria-current": isSameDay(d, today) ? "date" : void 0,
								disabled: off,
								className: "hm-calendar-day",
								onClick: () => pick(d),
								onPointerEnter: () => range && setHover(d),
								children: d.getDate()
							})
						}, d.getTime());
					})
				}, week[0]?.toISOString()))]
			}, `${month.getFullYear()}-${month.getMonth()}`)
		})]
	});
}
//#endregion
export { Calendar };

//# sourceMappingURL=calendar.js.map