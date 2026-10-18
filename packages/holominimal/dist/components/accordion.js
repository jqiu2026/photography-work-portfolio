"use client";
import { cx } from "../utils/cx.js";
import { ChevronDownIcon } from "../icons/interface.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { createContext, use, useCallback, useId, useState } from "react";
//#region src/components/accordion.tsx
var AccordionContext = createContext(null);
var ItemContext = createContext(null);
function useAccordion(part) {
	const ctx = use(AccordionContext);
	const item = use(ItemContext);
	if (!ctx || !item) throw new Error(`<${part}> must be inside <AccordionItem> inside <Accordion>`);
	return {
		...ctx,
		...item
	};
}
/**
* Stacked sections that open one at a time (`type="single"`, collapsible by default) or independently
* (`type="multiple"`). Up/Down, Home and End move between the headers. Each panel animates its height.
*/
function Accordion(props) {
	const { type = "single", headingLevel = 3, className, onKeyDown, ...more } = props;
	const { value: _v, defaultValue: _d, onValueChange: _o, collapsible: _c, ...rest } = more;
	const multiple = type === "multiple";
	const collapsible = multiple ? true : props.collapsible !== false;
	const initial = props.defaultValue;
	const [inner, setInner] = useState(() => initial === void 0 ? [] : Array.isArray(initial) ? initial : [initial]);
	const controlled = props.value;
	const open = controlled === void 0 ? inner : Array.isArray(controlled) ? controlled : [controlled];
	const onValueChange = props.onValueChange;
	const base = useId();
	const toggle = useCallback((value) => {
		const isOpen = open.includes(value);
		let next;
		if (multiple) next = isOpen ? open.filter((v) => v !== value) : [...open, value];
		else next = isOpen ? collapsible ? [] : open : [value];
		if (controlled === void 0) setInner(next);
		onValueChange?.(multiple ? next : next[0] ?? "");
	}, [
		open,
		multiple,
		collapsible,
		controlled,
		onValueChange
	]);
	const onKey = (e) => {
		onKeyDown?.(e);
		if (e.defaultPrevented || ![
			"ArrowDown",
			"ArrowUp",
			"Home",
			"End"
		].includes(e.key)) return;
		const triggers = Array.from(e.currentTarget.querySelectorAll("[data-hm-accordion-trigger]:not(:disabled)"));
		const i = triggers.indexOf(document.activeElement);
		if (i < 0) return;
		const to = e.key === "Home" ? 0 : e.key === "End" ? triggers.length - 1 : (i + (e.key === "ArrowDown" ? 1 : -1) + triggers.length) % triggers.length;
		e.preventDefault();
		triggers[to]?.focus();
	};
	return /* @__PURE__ */ jsx(AccordionContext, {
		value: {
			isOpen: (v) => open.includes(v),
			toggle,
			base,
			headingLevel
		},
		children: /* @__PURE__ */ jsx("div", {
			...rest,
			className: cx("hm-accordion", className),
			onKeyDown: onKey
		})
	});
}
function AccordionItem({ value, disabled, className, ...rest }) {
	const ctx = use(AccordionContext);
	if (!ctx) throw new Error("<AccordionItem> must be inside <Accordion>");
	return /* @__PURE__ */ jsx(ItemContext, {
		value: {
			value,
			disabled
		},
		children: /* @__PURE__ */ jsx("div", {
			...rest,
			className: cx("hm-accordion-item", className),
			"data-state": ctx.isOpen(value) ? "open" : "closed"
		})
	});
}
function AccordionTrigger({ className, children, onClick, ...rest }) {
	const { isOpen, toggle, base, headingLevel, value, disabled } = useAccordion("AccordionTrigger");
	const open = isOpen(value);
	const Heading = `h${headingLevel}`;
	return /* @__PURE__ */ jsx(Heading, {
		className: "hm-accordion-heading",
		children: /* @__PURE__ */ jsxs("button", {
			...rest,
			type: "button",
			id: `${base}-trigger-${value}`,
			"aria-expanded": open,
			"aria-controls": `${base}-panel-${value}`,
			disabled,
			"data-hm-accordion-trigger": "",
			"data-state": open ? "open" : "closed",
			className: cx("hm-accordion-trigger", className),
			onClick: (e) => {
				onClick?.(e);
				if (!e.defaultPrevented) toggle(value);
			},
			children: [/* @__PURE__ */ jsx("span", { children }), /* @__PURE__ */ jsx(ChevronDownIcon, {
				className: "hm-accordion-chevron",
				size: 14
			})]
		})
	});
}
function AccordionContent({ className, children, ...rest }) {
	const { isOpen, base, value } = useAccordion("AccordionContent");
	const open = isOpen(value);
	return /* @__PURE__ */ jsx("div", {
		...rest,
		id: `${base}-panel-${value}`,
		role: "region",
		"aria-labelledby": `${base}-trigger-${value}`,
		className: cx("hm-collapsible-content hm-accordion-content", className),
		"data-state": open ? "open" : "closed",
		inert: open ? void 0 : true,
		children: /* @__PURE__ */ jsx("div", {
			className: "hm-collapsible-inner",
			children
		})
	});
}
//#endregion
export { Accordion, AccordionContent, AccordionItem, AccordionTrigger };

//# sourceMappingURL=accordion.js.map