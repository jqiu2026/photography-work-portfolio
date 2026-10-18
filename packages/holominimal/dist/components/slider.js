"use client";
import { cx, flag } from "../utils/cx.js";
import { clamp } from "../utils/motion.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { useCallback, useRef, useState } from "react";
//#region src/components/slider.tsx
var decimals = (n) => (String(n).split(".")[1] ?? "").length;
/**
* A custom slider: pointer, touch and keyboard (arrows, Page keys, Home, End), one thumb or a range. The visual
* position glides between values with a short eased transition, so dragging and key presses never jump. Each thumb is
* `role="slider"` with `aria-valuenow/min/max`.
*/
function Slider({ min = 0, max = 100, step = 1, value: controlled, defaultValue, onValueChange, onValueCommit, disabled, showValue, formatValue = (v) => String(v), name, className, style, ...rest }) {
	const isRange = Array.isArray(controlled ?? defaultValue);
	const [inner, setInner] = useState(() => {
		const d = defaultValue ?? min;
		return Array.isArray(d) ? [...d] : [d];
	});
	const values = controlled === void 0 ? inner : Array.isArray(controlled) ? controlled : [controlled];
	const track = useRef(null);
	const active = useRef(0);
	const [dragging, setDragging] = useState(false);
	const places = Math.max(decimals(step), decimals(min));
	const snap = useCallback((v) => {
		const s = Math.round((v - min) / step) * step + min;
		return Number(clamp(s, min, max).toFixed(places));
	}, [
		min,
		max,
		step,
		places
	]);
	const emit = (next, commit = false) => {
		if (controlled === void 0) setInner(next);
		const out = isRange ? [next[0], next[1]] : next[0];
		onValueChange?.(out);
		if (commit) onValueCommit?.(out);
	};
	const setThumb = (i, v, commit = false) => {
		const next = [...values];
		const lo = i > 0 ? next[i - 1] ?? min : min;
		const hi = i < next.length - 1 ? next[i + 1] ?? max : max;
		next[i] = clamp(snap(v), lo, hi);
		if (next[i] !== values[i] || commit) emit(next, commit);
	};
	const fromPointer = (e) => {
		const r = track.current?.getBoundingClientRect();
		if (!r || !r.width) return min;
		return min + clamp((e.clientX - r.left) / r.width, 0, 1) * (max - min);
	};
	const onPointerDown = (e) => {
		if (disabled || e.button !== 0) return;
		const v = fromPointer(e);
		let nearest = 0;
		values.forEach((t, i) => {
			if (Math.abs(t - v) <= Math.abs((values[nearest] ?? 0) - v)) nearest = i;
		});
		active.current = nearest;
		e.currentTarget.setPointerCapture(e.pointerId);
		setDragging(true);
		setThumb(nearest, v);
		track.current?.parentElement?.querySelectorAll("[role=\"slider\"]")[nearest]?.focus({ preventScroll: true });
	};
	const onPointerMove = (e) => {
		if (dragging) setThumb(active.current, fromPointer(e));
	};
	const endDrag = (e) => {
		if (!dragging) return;
		setDragging(false);
		setThumb(active.current, fromPointer(e), true);
	};
	const onKey = (i) => (e) => {
		if (disabled) return;
		const cur = values[i] ?? min;
		const big = step * 10;
		const to = e.key === "ArrowRight" || e.key === "ArrowUp" ? cur + step : e.key === "ArrowLeft" || e.key === "ArrowDown" ? cur - step : e.key === "PageUp" ? cur + big : e.key === "PageDown" ? cur - big : e.key === "Home" ? min : e.key === "End" ? max : null;
		if (to === null) return;
		e.preventDefault();
		setThumb(i, to, true);
	};
	const pct = (v) => max === min ? 0 : (v - min) / (max - min) * 100;
	const lo = isRange ? pct(values[0] ?? min) : 0;
	const hi = pct(values[isRange ? 1 : 0] ?? min);
	return /* @__PURE__ */ jsxs("div", {
		...rest,
		className: cx("hm-slider", className),
		style: {
			...style,
			"--_lo": `${lo}%`,
			"--_hi": `${hi}%`
		},
		"data-disabled": flag(disabled),
		"data-dragging": flag(dragging),
		children: [
			/* @__PURE__ */ jsxs("div", {
				ref: track,
				className: "hm-slider-track",
				onPointerDown,
				onPointerMove,
				onPointerUp: endDrag,
				onPointerCancel: endDrag,
				children: [
					/* @__PURE__ */ jsx("span", { className: "hm-slider-rail" }),
					/* @__PURE__ */ jsx("span", { className: "hm-slider-fill" }),
					values.map((v, i) => /* @__PURE__ */ jsx("span", {
						className: "hm-slider-thumb",
						style: { "--_at": `${pct(v)}%` },
						role: "slider",
						tabIndex: disabled ? -1 : 0,
						"aria-valuemin": min,
						"aria-valuemax": max,
						"aria-valuenow": v,
						"aria-valuetext": formatValue(v),
						"aria-disabled": disabled || void 0,
						"aria-label": isRange ? `${rest["aria-label"]} ${i === 0 ? "minimum" : "maximum"}` : rest["aria-label"],
						onKeyDown: onKey(i)
					}, i))
				]
			}),
			showValue ? /* @__PURE__ */ jsx("output", {
				className: "hm-slider-value",
				children: values.map((v) => formatValue(v)).join(" – ")
			}) : null,
			name ? values.map((v, i) => /* @__PURE__ */ jsx("input", {
				type: "hidden",
				name: isRange ? `${name}[]` : name,
				value: v
			}, i)) : null
		]
	});
}
//#endregion
export { Slider };

//# sourceMappingURL=slider.js.map