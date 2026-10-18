"use client";
import { cx } from "../utils/cx.js";
import { CloseIcon } from "../icons/interface.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { createContext, use, useCallback, useEffect, useMemo, useRef, useState } from "react";
//#region src/components/toast.tsx
var ToastContext = createContext(null);
/** Raises toasts from any client component under `ToastProvider`. */
function useToast() {
	const ctx = use(ToastContext);
	if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
	return ctx;
}
/**
* A queue of transient messages in a polite live region. The stack lives in the top layer, so it stays above open
* dialogs. Timers pause while the pointer or keyboard focus is inside the stack, and Escape clears it.
*/
function ToastProvider({ children, limit = 4, position = "bottom-right", label = "Notifications" }) {
	const [toasts, setToasts] = useState([]);
	const [paused, setPaused] = useState(false);
	const counter = useRef(0);
	const region = useRef(null);
	const dismiss = useCallback((id) => setToasts((all) => all.map((t) => !id || t.id === id ? {
		...t,
		leaving: true
	} : t)), []);
	const remove = useCallback((id) => setToasts((all) => all.filter((t) => t.id !== id)), []);
	const toast = useCallback((o) => {
		const id = `hm-toast-${++counter.current}`;
		const entry = {
			...o,
			id,
			tone: o.tone ?? "neutral",
			duration: o.duration ?? 5e3
		};
		setToasts((all) => [...all, entry].slice(-limit));
		return id;
	}, [limit]);
	const api = useMemo(() => ({
		toast,
		dismiss
	}), [toast, dismiss]);
	const has = toasts.length > 0;
	useEffect(() => {
		const el = region.current;
		if (!el || typeof el.showPopover !== "function") return;
		if (has && !el.matches(":popover-open")) el.showPopover();
		else if (!has && el.matches(":popover-open")) el.hidePopover();
	}, [has]);
	return /* @__PURE__ */ jsxs(ToastContext, {
		value: api,
		children: [children, /* @__PURE__ */ jsx("div", {
			ref: region,
			popover: "manual",
			role: "region",
			"aria-label": label,
			"aria-live": "polite",
			className: "hm-toast-region",
			"data-position": position,
			onPointerEnter: () => setPaused(true),
			onPointerLeave: () => setPaused(false),
			onFocus: () => setPaused(true),
			onBlur: (e) => {
				if (!e.currentTarget.contains(e.relatedTarget)) setPaused(false);
			},
			onKeyDown: (e) => {
				if (e.key === "Escape") dismiss();
			},
			children: /* @__PURE__ */ jsx("ol", {
				className: "hm-toast-list",
				children: toasts.map((t) => /* @__PURE__ */ jsx(ToastItem, {
					entry: t,
					paused,
					dismiss,
					remove
				}, t.id))
			})
		})]
	});
}
function ToastItem({ entry, paused, dismiss, remove }) {
	const remaining = useRef(entry.duration);
	useEffect(() => {
		if (!entry.leaving) return;
		const t = setTimeout(() => remove(entry.id), 360);
		return () => clearTimeout(t);
	}, [
		entry.leaving,
		entry.id,
		remove
	]);
	useEffect(() => {
		if (!entry.duration || paused || entry.leaving) return;
		const started = Date.now();
		const timer = setTimeout(() => dismiss(entry.id), remaining.current);
		return () => {
			clearTimeout(timer);
			remaining.current = Math.max(0, remaining.current - (Date.now() - started));
		};
	}, [
		paused,
		entry.duration,
		entry.id,
		entry.leaving,
		dismiss
	]);
	return /* @__PURE__ */ jsx("li", {
		className: "hm-toast-slot",
		"data-leaving": entry.leaving ? "" : void 0,
		children: /* @__PURE__ */ jsxs("div", {
			className: cx("hm-toast"),
			"data-tone": entry.tone,
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "hm-toast-body",
					children: [/* @__PURE__ */ jsx("p", {
						className: "hm-toast-title",
						children: entry.title
					}), entry.description ? /* @__PURE__ */ jsx("p", {
						className: "hm-toast-description",
						children: entry.description
					}) : null]
				}),
				entry.action ? /* @__PURE__ */ jsx("button", {
					type: "button",
					className: "hm-toast-action",
					onClick: () => {
						entry.action?.onClick();
						dismiss(entry.id);
					},
					children: entry.action.label
				}) : null,
				/* @__PURE__ */ jsx("button", {
					type: "button",
					className: "hm-toast-close",
					"aria-label": `Dismiss: ${entry.title}`,
					onClick: () => dismiss(entry.id),
					children: /* @__PURE__ */ jsx(CloseIcon, { size: 12 })
				})
			]
		})
	});
}
//#endregion
export { ToastProvider, useToast };

//# sourceMappingURL=toast.js.map