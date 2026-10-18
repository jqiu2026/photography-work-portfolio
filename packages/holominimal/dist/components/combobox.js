"use client";
import { cx } from "../utils/cx.js";
import { CheckIcon, ChevronDownIcon } from "../icons/interface.js";
import { useDismiss, useFloating, usePresence } from "../interaction/use-floating.js";
import { Tag } from "./tag.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
//#region src/components/combobox.tsx
var defaultFilter = (o, q) => `${o.label} ${o.description ?? ""}`.toLowerCase().includes(q.toLowerCase());
/**
* A text field with a filtered list of options (ARIA combobox: focus stays in the input, Up/Down move the highlight
* with `aria-activedescendant`, Enter picks, Escape closes). Single choice shows the label in the field; `multiple`
* shows each choice as a removable tag and Backspace removes the last. Use `Select` for a short list without search.
*/
function Combobox(props) {
	const { options, multiple, placeholder, emptyMessage = "No matches.", disabled, filter = defaultFilter, className, id, onBlur, onKeyDown, ...inputRest } = props;
	const { value: _value, defaultValue: _dv, onValueChange: _ovc, ...input } = inputRest;
	const auto = useId();
	const listId = `${auto}-list`;
	const initial = props.defaultValue;
	const [inner, setInner] = useState(initial === void 0 ? [] : Array.isArray(initial) ? initial : initial ? [initial] : []);
	const controlled = props.value;
	const selected = controlled === void 0 ? inner : Array.isArray(controlled) ? controlled : controlled ? [controlled] : [];
	const onValueChange = props.onValueChange;
	const labelOf = useCallback((v) => options.find((o) => o.value === v)?.label ?? v, [options]);
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [typed, setTyped] = useState(false);
	const [active, setActive] = useState(0);
	const root = useRef(null);
	const field = useRef(null);
	const list = useRef(null);
	const shown = useMemo(() => {
		const q = typed ? query.trim() : "";
		return q ? options.filter((o) => filter(o, q)) : options;
	}, [
		options,
		query,
		typed,
		filter
	]);
	const commit = (next) => {
		if (controlled === void 0) setInner(next);
		onValueChange?.(multiple ? next : next[0] ?? "");
	};
	const pick = (o) => {
		if (!o || o.disabled) return;
		if (multiple) {
			commit(selected.includes(o.value) ? selected.filter((v) => v !== o.value) : [...selected, o.value]);
			setQuery("");
			setTyped(false);
			field.current?.focus();
		} else {
			commit([o.value]);
			setQuery("");
			setTyped(false);
			setOpen(false);
		}
	};
	const { present, state } = usePresence(open, 160);
	useFloating(present, root, list, {
		side: "bottom",
		align: "start",
		offset: 6
	});
	const close = useCallback(() => {
		setOpen(false);
		setTyped(false);
		setQuery("");
	}, []);
	useDismiss(open, root, list, close);
	useEffect(() => {
		list.current?.querySelector("[aria-selected=\"true\"][data-active]")?.scrollIntoView?.({ block: "nearest" });
	}, [active, shown]);
	const move = (dir) => {
		if (!shown.length) return;
		let i = active;
		for (let n = 0; n < shown.length; n++) {
			i = (i + dir + shown.length) % shown.length;
			if (!shown[i]?.disabled) break;
		}
		setActive(i);
	};
	const key = (e) => {
		onKeyDown?.(e);
		if (e.defaultPrevented || disabled) return;
		if (e.key === "ArrowDown" || e.key === "ArrowUp") {
			e.preventDefault();
			if (!open) setOpen(true);
			else move(e.key === "ArrowDown" ? 1 : -1);
		} else if (e.key === "Enter" && open) {
			e.preventDefault();
			pick(shown[active]);
		} else if (e.key === "Escape" && open) {
			e.preventDefault();
			close();
		} else if (e.key === "Home" && open) {
			e.preventDefault();
			setActive(0);
		} else if (e.key === "End" && open) {
			e.preventDefault();
			setActive(Math.max(0, shown.length - 1));
		} else if (e.key === "Backspace" && multiple && !query && selected.length) commit(selected.slice(0, -1));
	};
	const display = multiple ? query : typed ? query : selected[0] ? labelOf(selected[0]) : "";
	const optionId = (i) => `${auto}-opt-${i}`;
	return /* @__PURE__ */ jsxs("div", {
		ref: root,
		className: cx("hm-combobox", className),
		"data-multiple": multiple ? "" : void 0,
		"data-disabled": disabled ? "" : void 0,
		children: [/* @__PURE__ */ jsxs("div", {
			className: "hm-combobox-field hm-control",
			onClick: () => field.current?.focus(),
			children: [
				multiple ? selected.map((v) => /* @__PURE__ */ jsx(Tag, {
					onRemove: (e) => {
						e.stopPropagation();
						commit(selected.filter((x) => x !== v));
						field.current?.focus();
					},
					children: labelOf(v)
				}, v)) : null,
				/* @__PURE__ */ jsx("input", {
					...input,
					ref: field,
					id,
					type: "text",
					role: "combobox",
					"aria-expanded": open,
					"aria-controls": listId,
					"aria-autocomplete": "list",
					"aria-activedescendant": open && shown.length ? optionId(active) : void 0,
					autoComplete: "off",
					spellCheck: false,
					disabled,
					placeholder: multiple && selected.length ? void 0 : placeholder,
					value: display,
					className: "hm-combobox-input",
					onFocus: () => !disabled && setOpen(true),
					onClick: () => !disabled && setOpen(true),
					onChange: (e) => {
						setQuery(e.target.value);
						setTyped(true);
						setActive(0);
						setOpen(true);
					},
					onBlur: (e) => {
						onBlur?.(e);
						if (!list.current?.contains(e.relatedTarget)) close();
					},
					onKeyDown: key
				}),
				/* @__PURE__ */ jsx(ChevronDownIcon, {
					className: "hm-combobox-chevron",
					size: 14
				})
			]
		}), present ? /* @__PURE__ */ jsx("div", {
			ref: list,
			id: listId,
			popover: "manual",
			role: "listbox",
			tabIndex: -1,
			"aria-multiselectable": multiple || void 0,
			"data-state": state,
			inert: state === "closed" || void 0,
			className: "hm-floating hm-menu hm-combobox-list",
			onPointerDown: (e) => e.preventDefault(),
			children: shown.length ? shown.map((o, i) => /* @__PURE__ */ jsxs("div", {
				id: optionId(i),
				role: "option",
				"aria-selected": selected.includes(o.value),
				"aria-disabled": o.disabled || void 0,
				"data-active": i === active ? "" : void 0,
				className: "hm-combobox-option",
				onClick: () => pick(o),
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
			}, o.value)) : /* @__PURE__ */ jsx("p", {
				className: "hm-combobox-empty",
				role: "status",
				children: emptyMessage
			})
		}) : null]
	});
}
//#endregion
export { Combobox };

//# sourceMappingURL=combobox.js.map