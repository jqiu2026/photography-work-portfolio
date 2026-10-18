"use client";
import { cx } from "../utils/cx.js";
import { useSwipe } from "../interaction/hooks.js";
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from "../icons/interface.js";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useRef } from "react";
//#region src/components/lightbox.tsx
/**
* A full-screen viewer on the native <dialog> (top layer, focus trap, Escape, focus return). Left/Right and
* swipe move between photographs, Home/End jump, the neighbors are preloaded, and the counter is a live region.
* Controlled: the host owns `open` and `index`.
*/
function Lightbox({ open, onOpenChange, items, index, onIndexChange, label = "Photographs", loop, className }) {
	const dialog = useRef(null);
	const stage = useRef(null);
	const last = items.length - 1;
	const previous = useRef(index);
	const direction = index > previous.current ? "next" : index < previous.current ? "prev" : "none";
	useEffect(() => {
		previous.current = index;
	}, [index]);
	const item = items[index];
	const go = useCallback((to) => {
		if (!items.length) return;
		const next = to < 0 ? loop ? last : 0 : to > last ? loop ? 0 : last : to;
		if (next !== index) onIndexChange(next);
	}, [
		items.length,
		last,
		loop,
		index,
		onIndexChange
	]);
	useEffect(() => {
		const el = dialog.current;
		if (!el) return;
		if (open && !el.open) el.showModal();
		else if (!open && el.open) el.close();
	}, [open]);
	useEffect(() => {
		if (!open) return;
		const onKey = (e) => {
			if (e.key === "ArrowRight") go(index + 1);
			else if (e.key === "ArrowLeft") go(index - 1);
			else if (e.key === "Home") go(0);
			else if (e.key === "End") go(last);
			else return;
			e.preventDefault();
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [
		open,
		go,
		index,
		last
	]);
	useSwipe(stage, { onSwipe: (d) => d === "left" ? go(index + 1) : d === "right" ? go(index - 1) : void 0 }, [
		go,
		index,
		open
	]);
	useEffect(() => {
		if (!open) return;
		for (const i of [index - 1, index + 1]) {
			const n = items[i];
			if (n) new window.Image().src = n.src;
		}
	}, [
		open,
		index,
		items
	]);
	const atStart = !loop && index <= 0;
	const atEnd = !loop && index >= last;
	return /* @__PURE__ */ jsx("dialog", {
		ref: dialog,
		"aria-label": label,
		className: cx("hm-lightbox", className),
		onClose: () => onOpenChange(false),
		onClick: (e) => {
			if (e.target === e.currentTarget || e.target === stage.current) onOpenChange(false);
		},
		children: open && item ? /* @__PURE__ */ jsxs(Fragment, { children: [
			/* @__PURE__ */ jsxs("header", {
				className: "hm-lightbox-bar",
				children: [/* @__PURE__ */ jsxs("p", {
					className: "hm-lightbox-count",
					"aria-live": "polite",
					"aria-atomic": "true",
					children: [
						index + 1,
						" / ",
						items.length
					]
				}), /* @__PURE__ */ jsx("button", {
					type: "button",
					className: "hm-lightbox-button",
					"aria-label": "Close",
					onClick: () => onOpenChange(false),
					children: /* @__PURE__ */ jsx(CloseIcon, { size: 16 })
				})]
			}),
			/* @__PURE__ */ jsx("div", {
				ref: stage,
				className: "hm-lightbox-stage",
				children: /* @__PURE__ */ jsx("img", {
					"data-direction": direction,
					className: "hm-lightbox-img",
					src: item.src,
					alt: item.alt,
					width: item.width,
					height: item.height,
					draggable: false
				}, item.src)
			}),
			item.caption ? /* @__PURE__ */ jsx("p", {
				className: "hm-lightbox-caption",
				children: item.caption
			}) : null,
			/* @__PURE__ */ jsx("button", {
				type: "button",
				className: "hm-lightbox-button hm-lightbox-prev",
				"aria-label": "Previous photograph",
				"aria-disabled": atStart || void 0,
				onClick: () => go(index - 1),
				children: /* @__PURE__ */ jsx(ChevronLeftIcon, { size: 16 })
			}),
			/* @__PURE__ */ jsx("button", {
				type: "button",
				className: "hm-lightbox-button hm-lightbox-next",
				"aria-label": "Next photograph",
				"aria-disabled": atEnd || void 0,
				onClick: () => go(index + 1),
				children: /* @__PURE__ */ jsx(ChevronRightIcon, { size: 16 })
			})
		] }) : null
	});
}
//#endregion
export { Lightbox };

//# sourceMappingURL=lightbox.js.map