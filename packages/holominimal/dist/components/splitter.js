"use client";
import { cx } from "../utils/cx.js";
import { clamp } from "../utils/motion.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { Children, isValidElement, useId, useRef, useState } from "react";
//#region src/components/splitter.tsx
function SplitterPanel({ className, ...rest }) {
	return /* @__PURE__ */ jsx("div", {
		...rest,
		className: cx("hm-splitter-panel", className)
	});
}
/**
* Resizable panels. Each handle is a focusable `role="separator"`: drag it, or use the arrow keys (Shift for bigger
* steps), Home and End. Sizes are percentages and the layout follows the pointer with no easing, so dragging never lags.
*/
function Splitter({ direction = "horizontal", defaultSizes, sizes: controlled, onSizesChange, minSize = 10, className, style, children, ...rest }) {
	const panels = Children.toArray(children).filter(isValidElement);
	const n = panels.length;
	const [inner, setInner] = useState(() => defaultSizes && defaultSizes.length === n ? defaultSizes : Array(n).fill(100 / n));
	const sizes = controlled ?? inner;
	const root = useRef(null);
	const base = useId();
	const horizontal = direction === "horizontal";
	const commit = (next) => {
		if (controlled === void 0) setInner(next);
		onSizesChange?.(next);
	};
	/** Move the boundary after panel `i` by `delta` percent, taking from one side and giving to the other. */
	const move = (i, delta, from = sizes) => {
		const a = from[i] ?? 0;
		const total = a + (from[i + 1] ?? 0);
		const na = clamp(a + delta, minSize, total - minSize);
		const next = [...from];
		next[i] = na;
		next[i + 1] = total - na;
		commit(next);
	};
	const drag = useRef(null);
	const down = (e) => {
		const r = root.current?.getBoundingClientRect();
		if (!r) return;
		drag.current = {
			start: horizontal ? e.clientX : e.clientY,
			from: sizes,
			size: horizontal ? r.width : r.height
		};
		e.currentTarget.setPointerCapture(e.pointerId);
		e.currentTarget.dataset.dragging = "";
	};
	const movePtr = (i) => (e) => {
		const d = drag.current;
		if (!d) return;
		move(i, ((horizontal ? e.clientX : e.clientY) - d.start) / d.size * 100, d.from);
	};
	const up = (e) => {
		drag.current = null;
		delete e.currentTarget.dataset.dragging;
	};
	const key = (i) => (e) => {
		const big = e.shiftKey ? 10 : 2;
		const dec = horizontal ? "ArrowLeft" : "ArrowUp";
		const inc = horizontal ? "ArrowRight" : "ArrowDown";
		if (e.key === dec) move(i, -big);
		else if (e.key === inc) move(i, big);
		else if (e.key === "Home") move(i, -100);
		else if (e.key === "End") move(i, 100);
		else return;
		e.preventDefault();
	};
	return /* @__PURE__ */ jsx("div", {
		...rest,
		ref: root,
		className: cx("hm-splitter", className),
		"data-direction": direction,
		style,
		children: panels.map((panel, i) => /* @__PURE__ */ jsxs("div", {
			className: "hm-splitter-cell",
			style: {
				flexGrow: sizes[i],
				flexBasis: 0
			},
			children: [panel, i < n - 1 ? /* @__PURE__ */ jsx("div", {
				role: "separator",
				tabIndex: 0,
				id: `${base}-${i}`,
				"aria-orientation": horizontal ? "vertical" : "horizontal",
				"aria-valuenow": Math.round(sizes[i] ?? 0),
				"aria-valuemin": minSize,
				"aria-valuemax": 100 - minSize,
				"aria-label": `Resize panels ${i + 1} and ${i + 2}`,
				className: "hm-splitter-handle",
				onPointerDown: down,
				onPointerMove: movePtr(i),
				onPointerUp: up,
				onPointerCancel: up,
				onKeyDown: key(i)
			}) : null]
		}, panel.key ?? i))
	});
}
//#endregion
export { Splitter, SplitterPanel };

//# sourceMappingURL=splitter.js.map