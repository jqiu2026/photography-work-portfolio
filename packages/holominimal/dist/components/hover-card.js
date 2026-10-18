"use client";
import { cx } from "../utils/cx.js";
import { hasFinePointer } from "../utils/motion.js";
import { useDismiss, useFloating, usePresence } from "../interaction/use-floating.js";
import { jsx } from "react/jsx-runtime";
import { cloneElement, createContext, use, useCallback, useEffect, useId, useRef, useState } from "react";
//#region src/components/hover-card.tsx
var HoverCardContext = createContext(null);
function useHoverCard(part) {
	const ctx = use(HoverCardContext);
	if (!ctx) throw new Error(`<${part}> must be inside <HoverCard>`);
	return ctx;
}
/**
* A preview card for a link or a name: it opens on hover (fine pointers) or keyboard focus, stays open while the pointer
* is on the trigger or the card, and closes on Escape. For essential content use `Popover`; the card is a convenience.
*/
function HoverCard({ openDelay = 450, closeDelay = 180, side = "bottom", align = "start", children }) {
	const [open, setOpen] = useState(false);
	const timer = useRef(void 0);
	const triggerRef = useRef(null);
	const id = useId();
	const show = useCallback(() => {
		clearTimeout(timer.current);
		timer.current = setTimeout(() => setOpen(true), openDelay);
	}, [openDelay]);
	const hide = useCallback(() => {
		clearTimeout(timer.current);
		timer.current = setTimeout(() => setOpen(false), closeDelay);
	}, [closeDelay]);
	useEffect(() => () => clearTimeout(timer.current), []);
	return /* @__PURE__ */ jsx(HoverCardContext, {
		value: {
			open,
			show,
			hide,
			triggerRef,
			id,
			side,
			align
		},
		children
	});
}
/** The element that opens the card (a link, an avatar, a name). It must accept a ref and pointer and focus handlers. */
function HoverCardTrigger({ children }) {
	const { open, show, hide, triggerRef, id } = useHoverCard("HoverCardTrigger");
	const own = children.props;
	const chain = (name, fn) => (e) => {
		own[name]?.(e);
		fn();
	};
	return cloneElement(children, {
		ref: triggerRef,
		"aria-describedby": open ? id : own["aria-describedby"],
		onPointerEnter: chain("onPointerEnter", () => hasFinePointer() && show()),
		onPointerLeave: chain("onPointerLeave", hide),
		onFocus: (e) => {
			own.onFocus?.(e);
			if (e.currentTarget.matches(":focus-visible")) show();
		},
		onBlur: chain("onBlur", hide)
	});
}
function HoverCardContent({ className, children, ...rest }) {
	const { open, show, hide, triggerRef, id, side, align } = useHoverCard("HoverCardContent");
	const ref = useRef(null);
	const { present, state } = usePresence(open);
	useFloating(present, triggerRef, ref, {
		side,
		align,
		offset: 8
	});
	const close = useCallback(() => hide(), [hide]);
	useDismiss(open, triggerRef, ref, close);
	if (!present) return null;
	return /* @__PURE__ */ jsx("div", {
		...rest,
		ref,
		id,
		popover: "manual",
		role: "group",
		"data-state": state,
		inert: state === "closed" || void 0,
		className: cx("hm-floating hm-popover hm-hover-card", className),
		onPointerEnter: show,
		onPointerLeave: hide,
		onFocus: show,
		onBlur: hide,
		children
	});
}
//#endregion
export { HoverCard, HoverCardContent, HoverCardTrigger };

//# sourceMappingURL=hover-card.js.map