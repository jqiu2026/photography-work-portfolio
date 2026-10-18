"use client";
import { cx } from "../utils/cx.js";
import { CheckIcon, ChevronDownIcon } from "../icons/interface.js";
import { useDismiss, useFloating, usePresence } from "../interaction/use-floating.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { Children, Fragment as Fragment$1, isValidElement, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
//#region src/components/select.tsx
/** `<option>` children become options, so migrating from a native select is a rename. */
function optionsFrom(children) {
	const out = [];
	Children.forEach(children, (child) => {
		if (!isValidElement(child)) return;
		if (child.type === Fragment$1) {
			out.push(...optionsFrom(child.props.children));
			return;
		}
		const props = child.props;
		const text = props.label ?? (typeof props.children === "string" ? props.children : Children.toArray(props.children).join(""));
		out.push({
			value: String(props.value ?? text),
			label: text,
			disabled: props.disabled
		});
	});
	return out;
}
/**
* A custom single-choice dropdown (not the browser's native menu): the same look, motion and keyboard behavior as the
* rest of the set. It is the select-only combobox pattern: focus stays on the button while Up and Down move the
* highlight (`aria-activedescendant`), Enter or Space chooses, Escape closes, and typing jumps to a match. Use
* `Combobox` when people need to search.
*/
function Select({ options: given, children, value: controlled, defaultValue, onValueChange, placeholder = "Select…", name, disabled, className, id, onKeyDown, ...rest }) {
	const options = useMemo(() => given ?? optionsFrom(children), [given, children]);
	const [inner, setInner] = useState(defaultValue ?? void 0);
	const value = controlled === void 0 ? inner : controlled;
	const selected = options.find((o) => o.value === value);
	const [open, setOpen] = useState(false);
	const [active, setActive] = useState(0);
	const button = useRef(null);
	const list = useRef(null);
	const typed = useRef({
		text: "",
		at: 0
	});
	const auto = useId();
	const listId = `${auto}-list`;
	const optionId = (i) => `${auto}-opt-${i}`;
	const { present, state } = usePresence(open, 160);
	useFloating(present, button, list, {
		side: "bottom",
		align: "start",
		offset: 6
	});
	const close = useCallback(() => setOpen(false), []);
	const refocus = useCallback(() => button.current?.focus(), []);
	useDismiss(open, button, list, close, refocus);
	const openList = () => {
		const at = options.findIndex((o) => o.value === value && !o.disabled);
		setActive(at >= 0 ? at : Math.max(0, options.findIndex((o) => !o.disabled)));
		setOpen(true);
	};
	const choose = (o) => {
		if (!o || o.disabled) return;
		if (controlled === void 0) setInner(o.value);
		onValueChange?.(o.value);
		setOpen(false);
		button.current?.focus();
	};
	const move = (dir, from = active) => {
		for (let n = 1; n <= options.length; n++) {
			const i = (from + dir * n + options.length * n) % options.length;
			if (!options[i]?.disabled) return setActive(i);
		}
	};
	useEffect(() => {
		list.current?.querySelector("[data-active]")?.scrollIntoView?.({ block: "nearest" });
	}, [active, present]);
	const key = (e) => {
		onKeyDown?.(e);
		if (e.defaultPrevented || disabled) return;
		const printable = e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && e.key !== " ";
		if (!open) {
			if ([
				"ArrowDown",
				"ArrowUp",
				"Enter",
				" "
			].includes(e.key)) {
				e.preventDefault();
				openList();
			} else if (printable) {
				const hit = options.findIndex((o) => !o.disabled && o.label.toLowerCase().startsWith(e.key.toLowerCase()));
				if (hit >= 0) choose(options[hit]);
			}
			return;
		}
		if (e.key === "ArrowDown") move(1);
		else if (e.key === "ArrowUp") move(-1);
		else if (e.key === "Home") setActive(Math.max(0, options.findIndex((o) => !o.disabled)));
		else if (e.key === "End") setActive(options.length - 1 - [...options].reverse().findIndex((o) => !o.disabled));
		else if (e.key === "Enter" || e.key === " ") choose(options[active]);
		else if (e.key === "Escape") close();
		else if (e.key === "Tab") close();
		else if (printable) {
			const now = e.timeStamp;
			const t = typed.current;
			t.text = now - t.at > 700 ? e.key.toLowerCase() : t.text + e.key.toLowerCase();
			t.at = now;
			const start = t.text.length === 1 ? active + 1 : Math.max(active, 0);
			for (let k = 0; k < options.length; k++) {
				const i = (start + k) % options.length;
				if (!options[i]?.disabled && options[i]?.label.toLowerCase().startsWith(t.text)) {
					setActive(i);
					break;
				}
			}
		} else return;
		e.preventDefault();
	};
	return /* @__PURE__ */ jsxs("div", {
		className: cx("hm-select-root", className),
		children: [
			/* @__PURE__ */ jsxs("button", {
				...rest,
				ref: button,
				id,
				type: "button",
				role: "combobox",
				"aria-haspopup": "listbox",
				"aria-expanded": open,
				"aria-controls": listId,
				"aria-activedescendant": open ? optionId(active) : void 0,
				disabled,
				"data-placeholder": selected ? void 0 : "",
				className: "hm-control hm-select",
				onClick: () => open ? close() : openList(),
				onKeyDown: key,
				children: [/* @__PURE__ */ jsx("span", {
					className: "hm-select-value",
					children: selected?.label ?? placeholder
				}), /* @__PURE__ */ jsx(ChevronDownIcon, {
					className: "hm-select-chevron",
					size: 14
				})]
			}),
			name ? /* @__PURE__ */ jsx("input", {
				type: "hidden",
				name,
				value: value ?? ""
			}) : null,
			present ? /* @__PURE__ */ jsx("div", {
				ref: list,
				id: listId,
				popover: "manual",
				role: "listbox",
				"aria-label": typeof rest["aria-label"] === "string" ? rest["aria-label"] : void 0,
				"data-state": state,
				inert: state === "closed" || void 0,
				className: "hm-floating hm-menu hm-select-list",
				onPointerDown: (e) => e.preventDefault(),
				children: options.map((o, i) => /* @__PURE__ */ jsxs("div", {
					id: optionId(i),
					role: "option",
					"aria-selected": o.value === value,
					"aria-disabled": o.disabled || void 0,
					"data-active": i === active ? "" : void 0,
					className: "hm-combobox-option",
					onClick: () => choose(o),
					onPointerMove: () => i !== active && !o.disabled && setActive(i),
					children: [
						/* @__PURE__ */ jsx("span", {
							className: "hm-combobox-label",
							children: o.label
						}),
						o.description ? /* @__PURE__ */ jsx("small", {
							className: "hm-combobox-description",
							children: o.description
						}) : null,
						/* @__PURE__ */ jsx(CheckIcon, {
							className: "hm-combobox-check",
							size: 12,
							strokeWidth: 2
						})
					]
				}, o.value))
			}) : null
		]
	});
}
//#endregion
export { Select };

//# sourceMappingURL=select.js.map