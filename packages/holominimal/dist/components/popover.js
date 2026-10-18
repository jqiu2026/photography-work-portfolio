"use client";
import { cx } from "../utils/cx.js";
import { Slot } from "../utils/slot.js";
import { useDismiss, useFloating, usePresence } from "../interaction/use-floating.js";
import { jsx } from "react/jsx-runtime";
import { createContext, use, useCallback, useEffect, useId, useRef, useState } from "react";
//#region src/components/popover.tsx
var PopoverContext = createContext(null);
function usePopover(part) {
	const ctx = use(PopoverContext);
	if (!ctx) throw new Error(`<${part}> must be inside <Popover>`);
	return ctx;
}
/**
* A non-modal panel anchored to its trigger. It lives in the top layer (native `popover`), is positioned by the
* floating engine (flips and stays on screen), and closes on Escape or an outside press. Use `Dialog` when the
* content must block the page, `DropdownMenu` for a list of actions.
*/
function Popover({ open: controlled, defaultOpen = false, onOpenChange, side = "bottom", align = "start", offset = 6, children }) {
	const [uncontrolled, setUncontrolled] = useState(defaultOpen);
	const open = controlled ?? uncontrolled;
	const setOpen = useCallback((next) => {
		if (controlled === void 0) setUncontrolled(next);
		onOpenChange?.(next);
	}, [controlled, onOpenChange]);
	const triggerRef = useRef(null);
	const contentId = useId();
	return /* @__PURE__ */ jsx(PopoverContext, {
		value: {
			open,
			setOpen,
			triggerRef,
			contentId,
			side,
			align,
			offset
		},
		children
	});
}
function PopoverTrigger({ asChild, onClick, ...rest }) {
	const { open, setOpen, triggerRef, contentId } = usePopover("PopoverTrigger");
	return /* @__PURE__ */ jsx(asChild ? Slot : "button", {
		...asChild ? {} : { type: "button" },
		...rest,
		ref: triggerRef,
		"aria-haspopup": "dialog",
		"aria-expanded": open,
		"aria-controls": open ? contentId : void 0,
		onClick: (e) => {
			onClick?.(e);
			if (!e.defaultPrevented) setOpen(!open);
		}
	});
}
function PopoverContent({ className, children, ...rest }) {
	const { open, setOpen, triggerRef, contentId, side, align, offset } = usePopover("PopoverContent");
	const ref = useRef(null);
	const { present, state } = usePresence(open);
	useFloating(present, triggerRef, ref, {
		side,
		align,
		offset
	});
	const close = useCallback(() => setOpen(false), [setOpen]);
	const refocus = useCallback(() => triggerRef.current?.focus(), [triggerRef]);
	useDismiss(open, triggerRef, ref, close, refocus);
	const wasOpen = useRef(false);
	useEffect(() => {
		if (open) {
			wasOpen.current = true;
			ref.current?.focus({ preventScroll: true });
		} else if (wasOpen.current) {
			wasOpen.current = false;
			if (ref.current?.contains(document.activeElement)) triggerRef.current?.focus();
		}
	}, [open, triggerRef]);
	if (!present) return null;
	return /* @__PURE__ */ jsx("div", {
		...rest,
		ref,
		"data-state": state,
		inert: state === "closed" || void 0,
		id: contentId,
		popover: "manual",
		role: "dialog",
		tabIndex: -1,
		className: cx("hm-floating hm-popover", className),
		children
	});
}
//#endregion
export { Popover, PopoverContent, PopoverTrigger };

//# sourceMappingURL=popover.js.map