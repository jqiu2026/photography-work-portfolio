"use client";
import { cx } from "../utils/cx.js";
import { useIndicator } from "../interaction/hooks.js";
import { jsx } from "react/jsx-runtime";
import { createContext, use, useCallback, useRef, useState } from "react";
//#region src/components/segmented-control.tsx
var SegmentedContext = createContext(null);
/**
* A single-choice set of toggle buttons (`aria-pressed`) for filters and pickers that change a view in place.
* Not for switching panels: that is `Tabs`, which owns tab panels.
*/
function SegmentedControl({ value: controlled, defaultValue = "", onValueChange, className, ...rest }) {
	const [uncontrolled, setUncontrolled] = useState(defaultValue);
	const value = controlled ?? uncontrolled;
	const ref = useRef(null);
	useIndicator(ref, {
		item: ".hm-segment",
		active: ".hm-segment[aria-pressed=\"true\"]"
	});
	const select = useCallback((v) => {
		if (controlled === void 0) setUncontrolled(v);
		onValueChange?.(v);
	}, [controlled, onValueChange]);
	return /* @__PURE__ */ jsx(SegmentedContext, {
		value: {
			value,
			select
		},
		children: /* @__PURE__ */ jsx("div", {
			...rest,
			ref,
			role: "group",
			className: cx("hm-segmented", className)
		})
	});
}
function Segment({ value, className, onClick, ...rest }) {
	const ctx = use(SegmentedContext);
	if (!ctx) throw new Error("<Segment> must be inside <SegmentedControl>");
	return /* @__PURE__ */ jsx("button", {
		...rest,
		type: "button",
		"aria-pressed": ctx.value === value,
		className: cx("hm-segment", className),
		onClick: (e) => {
			onClick?.(e);
			if (!e.defaultPrevented) ctx.select(value);
		}
	});
}
//#endregion
export { Segment, SegmentedControl };

//# sourceMappingURL=segmented-control.js.map