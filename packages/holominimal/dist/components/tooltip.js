"use client";
import { cx } from "../utils/cx.js";
import { hasFinePointer } from "../utils/motion.js";
import { useDismiss, useFloating, usePresence } from "../interaction/use-floating.js";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { cloneElement, useCallback, useEffect, useId, useRef, useState } from "react";
//#region src/components/tooltip.tsx
/**
* A label for a control, shown on hover (fine pointers only) and keyboard focus, hidden on Escape or blur. It
* describes the trigger (`aria-describedby`); it never replaces an accessible name.
*/
function Tooltip({ content, side = "top", align = "center", delay = 400, className, children }) {
	const [open, setOpen] = useState(false);
	const id = useId();
	const anchor = useRef(null);
	const tip = useRef(null);
	const timer = useRef(void 0);
	const hide = useCallback(() => {
		clearTimeout(timer.current);
		setOpen(false);
	}, []);
	const show = useCallback((wait) => {
		clearTimeout(timer.current);
		if (wait <= 0) setOpen(true);
		else timer.current = setTimeout(() => setOpen(true), wait);
	}, []);
	useEffect(() => () => clearTimeout(timer.current), []);
	const { present, state } = usePresence(open, 140);
	useFloating(present, anchor, tip, {
		side,
		align,
		offset: 8
	});
	useDismiss(open, anchor, tip, hide);
	const own = children.props;
	const chain = (name, fn) => (e) => {
		own[name]?.(e);
		fn();
	};
	return /* @__PURE__ */ jsxs(Fragment, { children: [cloneElement(children, {
		ref: anchor,
		"aria-describedby": open ? id : own["aria-describedby"],
		onPointerEnter: chain("onPointerEnter", () => hasFinePointer() && show(delay)),
		onPointerLeave: chain("onPointerLeave", hide),
		onFocus: (e) => {
			own.onFocus?.(e);
			if (e.currentTarget.matches(":focus-visible")) show(0);
		},
		onBlur: chain("onBlur", hide)
	}), present ? /* @__PURE__ */ jsx("div", {
		ref: tip,
		"data-state": state,
		inert: state === "closed" || void 0,
		id,
		popover: "manual",
		role: "tooltip",
		className: cx("hm-floating hm-tooltip", className),
		children: content
	}) : null] });
}
//#endregion
export { Tooltip };

//# sourceMappingURL=tooltip.js.map