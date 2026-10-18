"use client";
import { cx } from "../utils/cx.js";
import { Slot } from "../utils/slot.js";
import { useProximity } from "../interaction/hooks.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from "react";
//#region src/components/dock.tsx
/**
* The Holominimal sidebar: transparent, integrated with the page, and spatially responsive. The current entry is the
* largest and brightest; entries near a mouse pointer swell and brighten; distant ones recede. Touch devices, keyboard
* users and reduced motion get the same hierarchy without the magnification (focus still lifts the focused entry).
* Below 860px the dock becomes a conventional top strip.
*/
function Dock({ brand, placement = "fixed", side = "left", proximity, className, ref, children, ...rest }) {
	const own = useRef(null);
	useProximity(own, {
		itemSelector: "[data-hm-dock-item]",
		edge: side === "right" ? "end" : "start",
		...proximity
	});
	useEffect(() => {
		const el = own.current;
		if (!el || el.scrollWidth <= el.clientWidth) return;
		const current = el.querySelector("[data-hm-dock-item][aria-current=\"page\"]");
		if (current) el.scrollTo({ left: current.offsetLeft - el.clientWidth / 2 + current.offsetWidth / 2 });
	});
	return /* @__PURE__ */ jsxs("nav", {
		...rest,
		ref: (node) => {
			own.current = node;
			if (typeof ref === "function") return ref(node);
			if (ref) ref.current = node;
		},
		className: cx("hm-dock", className),
		"data-placement": placement,
		"data-side": side === "right" ? "right" : void 0,
		children: [brand ? /* @__PURE__ */ jsx("div", {
			className: "hm-dock-brand",
			children: brand
		}) : null, /* @__PURE__ */ jsx("ul", {
			className: "hm-dock-list",
			children
		})]
	});
}
function DockItem({ current, subnav, asChild, className, children, ...rest }) {
	return /* @__PURE__ */ jsxs("li", {
		className: "hm-dock-entry",
		children: [/* @__PURE__ */ jsx(asChild ? Slot : "a", {
			...rest,
			"data-hm-dock-item": "",
			className: cx("hm-dock-item", className),
			"aria-current": current ? "page" : void 0,
			children
		}), subnav]
	});
}
function DockBrand({ asChild, className, ...rest }) {
	return /* @__PURE__ */ jsx(asChild ? Slot : "a", {
		...rest,
		className: cx("hm-dock-brand-link", className)
	});
}
/** The current section's pages, listed under its entry so nothing is hidden behind a click. */
function DockSubnav({ className, ...rest }) {
	return /* @__PURE__ */ jsx("ul", {
		...rest,
		className: cx("hm-dock-sub", className)
	});
}
function DockSubItem({ current, asChild, className, ...rest }) {
	return /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(asChild ? Slot : "a", {
		...rest,
		className: cx("hm-dock-sub-item", className),
		"aria-current": current ? "page" : void 0
	}) });
}
//#endregion
export { Dock, DockBrand, DockItem, DockSubItem, DockSubnav };

//# sourceMappingURL=dock.js.map