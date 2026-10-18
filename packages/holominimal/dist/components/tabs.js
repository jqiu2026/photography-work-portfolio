"use client";
import { cx } from "../utils/cx.js";
import { useIndicator } from "../interaction/hooks.js";
import { jsx } from "react/jsx-runtime";
import { createContext, use, useCallback, useId, useRef, useState } from "react";
//#region src/components/tabs.tsx
var TabsContext = createContext(null);
function useTabs(part) {
	const ctx = use(TabsContext);
	if (!ctx) throw new Error(`<${part}> must be inside <Tabs>`);
	return ctx;
}
/**
* Tabs that switch panels in place (a gallery workspace: Photos, Design, Share). ARIA tablist with roving focus:
* arrows move and select, Home/End jump. For links between pages use PageTabs.
*/
function Tabs({ value: controlled, defaultValue = "", onValueChange, orientation = "horizontal", className, children, ...rest }) {
	const [uncontrolled, setUncontrolled] = useState(defaultValue);
	const value = controlled ?? uncontrolled;
	const base = useId();
	const select = useCallback((v) => {
		if (controlled === void 0) setUncontrolled(v);
		onValueChange?.(v);
	}, [controlled, onValueChange]);
	const idFor = useCallback((v, part) => `${base}-${part}-${v}`, [base]);
	return /* @__PURE__ */ jsx(TabsContext, {
		value: {
			value,
			select,
			idFor,
			orientation
		},
		children: /* @__PURE__ */ jsx("div", {
			...rest,
			className: cx("hm-tabs", className),
			"data-orientation": orientation,
			children
		})
	});
}
function TabList({ variant = "underline", className, onKeyDown, ...rest }) {
	const { orientation, value } = useTabs("TabList");
	const ref = useRef(null);
	useIndicator(ref, {
		item: "[role=\"tab\"]",
		active: "[role=\"tab\"][aria-selected=\"true\"]"
	});
	const onKey = (e) => {
		onKeyDown?.(e);
		if (e.defaultPrevented) return;
		const next = orientation === "vertical" ? "ArrowDown" : "ArrowRight";
		if (![
			next,
			orientation === "vertical" ? "ArrowUp" : "ArrowLeft",
			"Home",
			"End"
		].includes(e.key)) return;
		const tabs = Array.from(e.currentTarget.querySelectorAll("[role=\"tab\"]:not(:disabled)"));
		const i = tabs.indexOf(document.activeElement);
		const n = tabs.length;
		if (!n) return;
		const to = e.key === "Home" ? 0 : e.key === "End" ? n - 1 : e.key === next ? (i + 1) % n : (i - 1 + n) % n;
		e.preventDefault();
		tabs[to]?.focus();
		tabs[to]?.click();
	};
	return /* @__PURE__ */ jsx("div", {
		...rest,
		ref,
		role: "tablist",
		"aria-orientation": orientation,
		className: cx("hm-tab-list", className),
		"data-variant": variant,
		onKeyDown: onKey
	});
}
function Tab({ value, className, onClick, ...rest }) {
	const ctx = useTabs("Tab");
	const selected = ctx.value === value;
	return /* @__PURE__ */ jsx("button", {
		...rest,
		type: "button",
		role: "tab",
		id: ctx.idFor(value, "tab"),
		"aria-selected": selected,
		"aria-controls": ctx.idFor(value, "panel"),
		tabIndex: selected ? 0 : -1,
		className: cx("hm-tab", className),
		onClick: (e) => {
			onClick?.(e);
			if (!e.defaultPrevented) ctx.select(value);
		}
	});
}
function TabPanel({ value, keepMounted, className, children, ...rest }) {
	const ctx = useTabs("TabPanel");
	const selected = ctx.value === value;
	if (!selected && !keepMounted) return null;
	return /* @__PURE__ */ jsx("div", {
		...rest,
		role: "tabpanel",
		id: ctx.idFor(value, "panel"),
		"aria-labelledby": ctx.idFor(value, "tab"),
		hidden: !selected,
		tabIndex: 0,
		className: cx("hm-tab-panel", className),
		children
	});
}
//#endregion
export { Tab, TabList, TabPanel, Tabs };

//# sourceMappingURL=tabs.js.map