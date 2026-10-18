"use client";
import { cx } from "../utils/cx.js";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, useMenu } from "./dropdown-menu.js";
import { jsx } from "react/jsx-runtime";
import { useRef } from "react";
//#region src/components/context-menu.tsx
/** A right-click (or long-press, or the keyboard's menu key) menu: the DropdownMenu, placed at the pointer. */
function ContextMenu({ children, ...rest }) {
	return /* @__PURE__ */ jsx(DropdownMenu, {
		...rest,
		side: "right",
		align: "start",
		children
	});
}
/**
* The area that owns the menu. It is focusable so the menu key and Shift+F10 work from the keyboard, and focus returns
* to it when the menu closes. On touch, holding for half a second opens the menu (iOS sends no contextmenu event).
*/
function ContextMenuTrigger({ className, onContextMenu, onPointerDown, onPointerUp, onPointerCancel, onPointerMove, ...rest }) {
	const { setOpen, triggerRef } = useMenu("ContextMenuTrigger");
	const region = useRef(null);
	const hold = useRef(void 0);
	const openAt = (x, y) => {
		const anchor = document.createElement("span");
		anchor.getBoundingClientRect = () => new DOMRect(x, y, 0, 0);
		anchor.focus = () => region.current?.focus();
		triggerRef.current = anchor;
		setOpen(true);
	};
	const cancelHold = () => clearTimeout(hold.current);
	return /* @__PURE__ */ jsx("div", {
		...rest,
		ref: region,
		tabIndex: rest.tabIndex ?? 0,
		className: cx("hm-context-area", className),
		onContextMenu: (e) => {
			onContextMenu?.(e);
			if (e.defaultPrevented) return;
			e.preventDefault();
			const r = e.currentTarget.getBoundingClientRect();
			openAt(e.clientX || r.left + 16, e.clientY || r.top + 16);
		},
		onPointerDown: (e) => {
			onPointerDown?.(e);
			if (e.pointerType !== "touch") return;
			const { clientX, clientY } = e;
			hold.current = setTimeout(() => openAt(clientX, clientY), 500);
		},
		onPointerUp: (e) => {
			onPointerUp?.(e);
			cancelHold();
		},
		onPointerCancel: (e) => {
			onPointerCancel?.(e);
			cancelHold();
		},
		onPointerMove: (e) => {
			onPointerMove?.(e);
			if (e.pointerType === "touch") cancelHold();
		}
	});
}
var ContextMenuContent = DropdownMenuContent;
var ContextMenuItem = DropdownMenuItem;
var ContextMenuLabel = DropdownMenuLabel;
var ContextMenuSeparator = DropdownMenuSeparator;
//#endregion
export { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuSeparator, ContextMenuTrigger };

//# sourceMappingURL=context-menu.js.map