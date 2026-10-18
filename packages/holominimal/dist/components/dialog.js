"use client";
import { cx } from "../utils/cx.js";
import { Slot } from "../utils/slot.js";
import { createSwipe } from "../interaction/swipe.js";
import { jsx } from "react/jsx-runtime";
import { createContext, use, useCallback, useEffect, useId, useRef, useState } from "react";
//#region src/components/dialog.tsx
var DialogContext = createContext(null);
function useDialog(part) {
	const ctx = use(DialogContext);
	if (!ctx) throw new Error(`<${part}> must be inside <Dialog>`);
	return ctx;
}
/**
* A modal dialog on the native <dialog> element: the browser provides the top layer, focus trapping, Escape and
* focus return. Holominimal adds the elevated surface, the scrim, an entrance and exit, and backdrop-click to close.
*/
function Dialog({ open: controlled, defaultOpen = false, onOpenChange, children }) {
	const [uncontrolled, setUncontrolled] = useState(defaultOpen);
	const open = controlled ?? uncontrolled;
	const setOpen = useCallback((next) => {
		if (controlled === void 0) setUncontrolled(next);
		onOpenChange?.(next);
	}, [controlled, onOpenChange]);
	const id = useId();
	return /* @__PURE__ */ jsx(DialogContext, {
		value: {
			open,
			setOpen,
			titleId: `${id}-title`,
			descriptionId: `${id}-description`
		},
		children
	});
}
function DialogTrigger({ asChild, onClick, ...rest }) {
	const { open, setOpen } = useDialog("DialogTrigger");
	return /* @__PURE__ */ jsx(asChild ? Slot : "button", {
		...asChild ? {} : { type: "button" },
		...rest,
		"aria-haspopup": "dialog",
		"aria-expanded": open,
		onClick: (e) => {
			onClick?.(e);
			if (!e.defaultPrevented) setOpen(true);
		}
	});
}
function DialogContent({ position = "center", size = "md", dismissible = true, className, children, onClick, ...rest }) {
	const { open, setOpen, titleId, descriptionId } = useDialog("DialogContent");
	const ref = useRef(null);
	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		if (open && !el.open) el.showModal();
		else if (!open && el.open) el.close();
	}, [open]);
	useEffect(() => {
		const el = ref.current;
		if (!el || !open || !(position === "left" || position === "right" || position === "bottom")) return;
		const away = position === "left" ? "left" : position === "right" ? "right" : "down";
		return createSwipe(el, { onSwipe: (d) => d === away && setOpen(false) });
	}, [
		open,
		position,
		setOpen
	]);
	return /* @__PURE__ */ jsx("dialog", {
		...rest,
		ref,
		className: cx("hm-dialog", className),
		"data-position": position,
		"data-size": size,
		"aria-labelledby": titleId,
		"aria-describedby": descriptionId,
		onClose: () => setOpen(false),
		onCancel: (e) => {
			if (!dismissible) e.preventDefault();
		},
		onClick: (e) => {
			onClick?.(e);
			if (dismissible && e.target === e.currentTarget) setOpen(false);
		},
		children: /* @__PURE__ */ jsx("div", {
			className: "hm-dialog-box",
			children
		})
	});
}
function DialogTitle({ className, ...rest }) {
	const { titleId } = useDialog("DialogTitle");
	return /* @__PURE__ */ jsx("h2", {
		...rest,
		id: titleId,
		className: cx("hm-dialog-title", className)
	});
}
function DialogDescription({ className, ...rest }) {
	const { descriptionId } = useDialog("DialogDescription");
	return /* @__PURE__ */ jsx("p", {
		...rest,
		id: descriptionId,
		className: cx("hm-dialog-description", className)
	});
}
function DialogFooter({ className, ...rest }) {
	return /* @__PURE__ */ jsx("div", {
		...rest,
		className: cx("hm-dialog-footer", className)
	});
}
function DialogClose({ asChild, onClick, ...rest }) {
	const { setOpen } = useDialog("DialogClose");
	return /* @__PURE__ */ jsx(asChild ? Slot : "button", {
		...asChild ? {} : { type: "button" },
		...rest,
		onClick: (e) => {
			onClick?.(e);
			if (!e.defaultPrevented) setOpen(false);
		}
	});
}
//#endregion
export { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger };

//# sourceMappingURL=dialog.js.map