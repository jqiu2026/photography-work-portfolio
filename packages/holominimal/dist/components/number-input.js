"use client";
import { cx } from "../utils/cx.js";
import { clamp } from "../utils/motion.js";
import { MinusIcon, PlusIcon } from "../icons/interface.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useRef, useState } from "react";
//#region src/components/number-input.tsx
var decimals = (n) => (String(n).split(".")[1] ?? "").length;
/**
* A numeric field with minus and plus buttons. Arrow keys and Page keys step it, Home and End jump to the limits,
* holding a button repeats, and typed text is parsed and clamped when you leave the field.
*/
function NumberInput({ value: controlled, defaultValue = null, onValueChange, min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY, step = 1, format, disabled, className, onBlur, onKeyDown, ...rest }) {
	const places = decimals(step);
	const show = useCallback((v) => v === null ? "" : format ? format(v) : v.toFixed(places), [format, places]);
	const [inner, setInner] = useState(defaultValue);
	const value = controlled === void 0 ? inner : controlled;
	const [text, setText] = useState(show(value));
	const editing = useRef(false);
	useEffect(() => {
		if (!editing.current) setText(show(value));
	}, [value, show]);
	const latest = useRef(value);
	latest.current = value;
	const set = useCallback((next) => {
		const n = next === null ? null : Number(clamp(next, min, max).toFixed(places));
		if (controlled === void 0) setInner(n);
		onValueChange?.(n);
		latest.current = n;
		setText(show(n));
	}, [
		controlled,
		min,
		max,
		places,
		onValueChange,
		show
	]);
	const bump = useCallback((dir, mult = 1) => set((latest.current ?? (dir > 0 ? Math.max(min, 0) - step : Math.min(max, 0) + step)) + dir * step * mult), [
		set,
		step,
		min,
		max
	]);
	const hold = useRef({});
	const stop = useCallback(() => {
		clearTimeout(hold.current.t);
		clearInterval(hold.current.i);
	}, []);
	useEffect(() => stop, [stop]);
	const press = (dir) => ({
		onPointerDown: (e) => {
			if (disabled || e.button !== 0) return;
			bump(dir);
			hold.current.t = setTimeout(() => {
				hold.current.i = setInterval(() => bump(dir), 70);
			}, 420);
		},
		onPointerUp: stop,
		onPointerLeave: stop,
		onPointerCancel: stop
	});
	const commit = () => {
		editing.current = false;
		const parsed = Number.parseFloat(text.replace(/,/g, ""));
		if (text.trim() === "") set(null);
		else if (Number.isFinite(parsed)) set(parsed);
		else setText(show(value));
	};
	const key = (e) => {
		onKeyDown?.(e);
		if (e.defaultPrevented || disabled) return;
		if (e.key === "ArrowUp") bump(1);
		else if (e.key === "ArrowDown") bump(-1);
		else if (e.key === "PageUp") bump(1, 10);
		else if (e.key === "PageDown") bump(-1, 10);
		else if (e.key === "Home" && Number.isFinite(min)) set(min);
		else if (e.key === "End" && Number.isFinite(max)) set(max);
		else if (e.key === "Enter") {
			commit();
			return;
		} else return;
		e.preventDefault();
	};
	const atMin = value !== null && value <= min;
	const atMax = value !== null && value >= max;
	return /* @__PURE__ */ jsxs("div", {
		className: cx("hm-number hm-control", className),
		"data-disabled": disabled ? "" : void 0,
		children: [
			/* @__PURE__ */ jsx("button", {
				type: "button",
				className: "hm-number-button",
				tabIndex: -1,
				"aria-label": "Decrease",
				disabled: disabled || atMin,
				...press(-1),
				children: /* @__PURE__ */ jsx(MinusIcon, {
					size: 12,
					strokeWidth: 1.6
				})
			}),
			/* @__PURE__ */ jsx("input", {
				...rest,
				type: "text",
				role: "spinbutton",
				inputMode: "decimal",
				autoComplete: "off",
				disabled,
				"aria-valuenow": value ?? void 0,
				"aria-valuemin": Number.isFinite(min) ? min : void 0,
				"aria-valuemax": Number.isFinite(max) ? max : void 0,
				value: text,
				className: "hm-number-input",
				onFocus: () => {
					editing.current = true;
				},
				onChange: (e) => setText(e.target.value),
				onBlur: (e) => {
					onBlur?.(e);
					commit();
				},
				onKeyDown: key
			}),
			/* @__PURE__ */ jsx("button", {
				type: "button",
				className: "hm-number-button",
				tabIndex: -1,
				"aria-label": "Increase",
				disabled: disabled || atMax,
				...press(1),
				children: /* @__PURE__ */ jsx(PlusIcon, {
					size: 12,
					strokeWidth: 1.6
				})
			})
		]
	});
}
//#endregion
export { NumberInput };

//# sourceMappingURL=number-input.js.map