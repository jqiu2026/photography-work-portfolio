"use client";
import { cx, flag } from "../utils/cx.js";
import { Slot } from "../utils/slot.js";
import { useDismiss, useFloating, usePresence } from "../interaction/use-floating.js";
import { jsx } from "react/jsx-runtime";
import { createContext, use, useCallback, useEffect, useId, useRef, useState } from "react";
//#region src/components/dropdown-menu.tsx
var MenuContext = createContext(null);
/** @internal Shared with ContextMenu, which anchors the same menu at the pointer instead of a trigger. */
function useMenu(part) {
	const ctx = use(MenuContext);
	if (!ctx) throw new Error(`<${part}> must be inside <DropdownMenu>`);
	return ctx;
}
/**
* The menu button pattern: a trigger that opens a list of actions. Arrow keys move through items (wrapping), Home and
* End jump, typing a letter jumps to the next matching item, Escape closes and returns focus, Tab closes.
*/
function DropdownMenu({ open: controlled, defaultOpen = false, onOpenChange, side = "bottom", align = "start", children }) {
	const [uncontrolled, setUncontrolled] = useState(defaultOpen);
	const open = controlled ?? uncontrolled;
	const setOpen = useCallback((next) => {
		if (controlled === void 0) setUncontrolled(next);
		onOpenChange?.(next);
	}, [controlled, onOpenChange]);
	const triggerRef = useRef(null);
	const menuId = useId();
	return /* @__PURE__ */ jsx(MenuContext, {
		value: {
			open,
			setOpen,
			triggerRef,
			menuId,
			side,
			align
		},
		children
	});
}
function DropdownMenuTrigger({ asChild, onClick, onKeyDown, ...rest }) {
	const { open, setOpen, triggerRef, menuId } = useMenu("DropdownMenuTrigger");
	return /* @__PURE__ */ jsx(asChild ? Slot : "button", {
		...asChild ? {} : { type: "button" },
		...rest,
		ref: triggerRef,
		"aria-haspopup": "menu",
		"aria-expanded": open,
		"aria-controls": open ? menuId : void 0,
		onClick: (e) => {
			onClick?.(e);
			if (!e.defaultPrevented) setOpen(!open);
		},
		onKeyDown: (e) => {
			onKeyDown?.(e);
			if (!e.defaultPrevented && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
				e.preventDefault();
				setOpen(true);
			}
		}
	});
}
var ITEMS = "[role=\"menuitem\"]:not([aria-disabled=\"true\"])";
function DropdownMenuContent({ className, onKeyDown, children, ...rest }) {
	const { open, setOpen, triggerRef, menuId, side, align } = useMenu("DropdownMenuContent");
	const ref = useRef(null);
	const typed = useRef({
		text: "",
		at: 0
	});
	const { present, state } = usePresence(open);
	useFloating(present, triggerRef, ref, {
		side,
		align,
		offset: 6
	});
	const close = useCallback(() => setOpen(false), [setOpen]);
	const refocus = useCallback(() => triggerRef.current?.focus(), [triggerRef]);
	useDismiss(open, triggerRef, ref, close, refocus);
	useEffect(() => {
		if (open) ref.current?.querySelector(ITEMS)?.focus({ preventScroll: true });
	}, [open]);
	if (!present) return null;
	const onKey = (e) => {
		onKeyDown?.(e);
		if (e.defaultPrevented) return;
		const items = Array.from(e.currentTarget.querySelectorAll(ITEMS));
		const i = items.indexOf(document.activeElement);
		let to = -1;
		if (e.key === "ArrowDown") to = (i + 1) % items.length;
		else if (e.key === "ArrowUp") to = (i - 1 + items.length) % items.length;
		else if (e.key === "Home") to = 0;
		else if (e.key === "End") to = items.length - 1;
		else if (e.key === "Tab") {
			close();
			return;
		} else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && e.key !== " ") {
			const now = e.timeStamp;
			const t = typed.current;
			t.text = now - t.at > 700 ? e.key.toLowerCase() : t.text + e.key.toLowerCase();
			t.at = now;
			const start = t.text.length === 1 ? i + 1 : Math.max(i, 0);
			for (let k = 0; k < items.length; k++) {
				const idx = (start + k) % items.length;
				if (items[idx]?.textContent?.trim().toLowerCase().startsWith(t.text)) {
					to = idx;
					break;
				}
			}
		}
		const target = items[to];
		if (to < 0 || !target) return;
		e.preventDefault();
		target.focus();
	};
	return /* @__PURE__ */ jsx("div", {
		...rest,
		ref,
		"data-state": state,
		inert: state === "closed" || void 0,
		id: menuId,
		popover: "manual",
		role: "menu",
		"aria-orientation": "vertical",
		className: cx("hm-floating hm-menu", className),
		onKeyDown: onKey,
		children
	});
}
function DropdownMenuItem({ asChild, onSelect, tone = "default", disabled, className, onClick, ...rest }) {
	const { setOpen, triggerRef } = useMenu("DropdownMenuItem");
	return /* @__PURE__ */ jsx(asChild ? Slot : "button", {
		...asChild ? {} : { type: "button" },
		...rest,
		role: "menuitem",
		tabIndex: -1,
		"aria-disabled": disabled || void 0,
		"data-tone": tone,
		"data-disabled": flag(disabled),
		className: cx("hm-menu-item", className),
		onClick: (e) => {
			if (disabled) {
				e.preventDefault();
				return;
			}
			onClick?.(e);
			onSelect?.(e);
			if (!e.defaultPrevented) {
				setOpen(false);
				triggerRef.current?.focus();
			}
		}
	});
}
function DropdownMenuLabel({ className, ...rest }) {
	return /* @__PURE__ */ jsx("div", {
		...rest,
		role: "presentation",
		className: cx("hm-menu-label", className)
	});
}
function DropdownMenuSeparator({ className, ...rest }) {
	return /* @__PURE__ */ jsx("div", {
		...rest,
		role: "separator",
		className: cx("hm-menu-separator", className)
	});
}
//#endregion
export { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, useMenu };

//# sourceMappingURL=dropdown-menu.js.map