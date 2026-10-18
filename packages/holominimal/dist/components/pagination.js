"use client";
import { cx } from "../utils/cx.js";
import { useIndicator } from "../interaction/hooks.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
//#region src/components/pagination.tsx
/** Page numbers to show, with `"gap"` where pages are skipped: always the first, last, current and its siblings. */
function paginationRange(page, pageCount, siblings = 1) {
	const total = Math.max(1, Math.floor(pageCount));
	const current = Math.min(Math.max(1, Math.floor(page)), total);
	if (total <= siblings * 2 + 5) return Array.from({ length: total }, (_, i) => i + 1);
	const cluster = siblings * 2 + 3;
	const range = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => from + i);
	if (current <= siblings + 3) return [
		...range(1, cluster),
		"gap",
		total
	];
	if (current >= total - siblings - 2) return [
		1,
		"gap",
		...range(total - cluster + 1, total)
	];
	return [
		1,
		"gap",
		...range(current - siblings, current + siblings),
		"gap",
		total
	];
}
/** The "…" between page numbers: press it to type the page you want. Enter goes, Escape or leaving the field cancels. */
function PageJump({ total, onJump }) {
	const [editing, setEditing] = useState(false);
	const field = useRef(null);
	const trigger = useRef(null);
	const [text, setText] = useState("");
	useEffect(() => {
		if (editing) field.current?.focus();
	}, [editing]);
	const stop = (refocus) => {
		setEditing(false);
		setText("");
		if (refocus) queueMicrotask(() => trigger.current?.focus());
	};
	const key = (e) => {
		if (e.key === "Escape") {
			e.preventDefault();
			stop(true);
		} else if (e.key === "Enter") {
			e.preventDefault();
			const n = Number.parseInt(text, 10);
			if (Number.isFinite(n)) {
				onJump(Math.min(Math.max(1, n), total));
				stop(true);
			}
		}
	};
	return editing ? /* @__PURE__ */ jsx("input", {
		ref: field,
		className: "hm-page-jump",
		type: "text",
		inputMode: "numeric",
		autoComplete: "off",
		"aria-label": `Go to page, 1 to ${total}`,
		placeholder: `1–${total}`,
		value: text,
		onChange: (e) => setText(e.target.value.replace(/\D/g, "").slice(0, String(total).length)),
		onKeyDown: key,
		onBlur: () => stop(false)
	}) : /* @__PURE__ */ jsx("button", {
		ref: trigger,
		type: "button",
		className: "hm-page-gap-button",
		"aria-label": "Jump to a page",
		onClick: () => setEditing(true),
		children: "…"
	});
}
/** Previous, numbered pages with gaps, and next. Buttons by default, links with `getHref`. The current-page highlight slides between pages. */
function Pagination({ page, pageCount, onPageChange, getHref, siblings = 1, previousLabel = "Previous", nextLabel = "Next", className, ...rest }) {
	const total = Math.max(1, Math.floor(pageCount));
	const current = Math.min(Math.max(1, Math.floor(page)), total);
	const list = useRef(null);
	useIndicator(list, {
		item: ".hm-page-link",
		active: ".hm-page-link[data-current]"
	});
	const item = (target, content, opts = {}) => {
		const common = {
			className: "hm-page-link",
			"aria-label": opts.label,
			"aria-current": opts.current ? "page" : void 0,
			"data-current": opts.current ? "" : void 0
		};
		if (opts.disabled) return /* @__PURE__ */ jsx("span", {
			...common,
			"aria-disabled": "true",
			children: content
		});
		return getHref ? /* @__PURE__ */ jsx("a", {
			...common,
			href: getHref(target),
			children: content
		}) : /* @__PURE__ */ jsx("button", {
			...common,
			type: "button",
			onClick: () => onPageChange?.(target),
			children: content
		});
	};
	return /* @__PURE__ */ jsx("nav", {
		"aria-label": "Pagination",
		...rest,
		className: cx("hm-pagination", className),
		children: /* @__PURE__ */ jsxs("ul", {
			ref: list,
			className: "hm-pagination-list",
			children: [
				/* @__PURE__ */ jsx("li", { children: item(current - 1, previousLabel, {
					label: "Previous page",
					disabled: current <= 1
				}) }),
				paginationRange(current, total, siblings).map((p, i) => p === "gap" ? /* @__PURE__ */ jsx("li", {
					className: "hm-pagination-gap",
					children: /* @__PURE__ */ jsx(PageJump, {
						total,
						onJump: (n) => {
							if (onPageChange) onPageChange(n);
							else if (getHref) window.location.assign(getHref(n));
						}
					})
				}, `gap-${i}`) : /* @__PURE__ */ jsx("li", { children: item(p, p, {
					label: `Page ${p}`,
					current: p === current
				}) }, p)),
				/* @__PURE__ */ jsx("li", { children: item(current + 1, nextLabel, {
					label: "Next page",
					disabled: current >= total
				}) })
			]
		})
	});
}
//#endregion
export { Pagination, paginationRange };

//# sourceMappingURL=pagination.js.map