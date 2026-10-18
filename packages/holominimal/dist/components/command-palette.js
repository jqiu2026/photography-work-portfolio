"use client";
import { cx } from "../utils/cx.js";
import { Dialog, DialogContent, DialogTitle } from "./dialog.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { useEffect, useId, useMemo, useRef, useState } from "react";
//#region src/components/command-palette.tsx
var defaultFilter = (item, query) => `${item.label} ${item.group ?? ""} ${item.keywords ?? ""}`.toLowerCase().includes(query.toLowerCase());
/**
* A searchable list of actions or destinations in a top-positioned dialog. The input is a combobox: focus stays in it
* while Up/Down move the highlighted option (`aria-activedescendant`), Enter chooses it, Escape closes.
*/
function CommandPalette({ open, onOpenChange, items, onSelect, label = "Command palette", placeholder = "Type to search…", emptyMessage = "Nothing matches.", shortcut, filter = defaultFilter, className }) {
	const [query, setQuery] = useState("");
	const [active, setActive] = useState(0);
	const listId = useId();
	const list = useRef(null);
	const shown = useMemo(() => {
		const q = query.trim();
		return q ? items.filter((i) => filter(i, q)) : items;
	}, [
		items,
		query,
		filter
	]);
	useEffect(() => {
		if (!shortcut) return;
		const onKey = (e) => {
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
				e.preventDefault();
				onOpenChange(!open);
			}
		};
		addEventListener("keydown", onKey);
		return () => removeEventListener("keydown", onKey);
	}, [
		shortcut,
		open,
		onOpenChange
	]);
	useEffect(() => {
		if (!open) {
			setQuery("");
			setActive(0);
		}
	}, [open]);
	useEffect(() => {
		list.current?.querySelector("[aria-selected=\"true\"]")?.scrollIntoView?.({ block: "nearest" });
	}, [active, shown]);
	const choose = (item) => {
		if (!item || item.disabled) return;
		onSelect(item);
		onOpenChange(false);
	};
	const optionId = (i) => `${listId}-${i}`;
	const move = (dir) => {
		if (!shown.length) return;
		let i = active;
		for (let n = 0; n < shown.length; n++) {
			i = (i + dir + shown.length) % shown.length;
			if (!shown[i]?.disabled) break;
		}
		setActive(i);
	};
	return /* @__PURE__ */ jsx(Dialog, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ jsxs(DialogContent, {
			position: "top",
			className: cx("hm-palette", className),
			children: [
				/* @__PURE__ */ jsx(DialogTitle, {
					className: "hm-sr-only",
					children: label
				}),
				/* @__PURE__ */ jsx("input", {
					className: "hm-palette-input",
					type: "text",
					role: "combobox",
					"aria-expanded": "true",
					"aria-controls": listId,
					"aria-autocomplete": "list",
					"aria-activedescendant": shown.length ? optionId(active) : void 0,
					"aria-label": label,
					placeholder,
					autoComplete: "off",
					spellCheck: false,
					value: query,
					onChange: (e) => {
						setQuery(e.target.value);
						setActive(0);
					},
					onKeyDown: (e) => {
						if (e.key === "ArrowDown") move(1);
						else if (e.key === "ArrowUp") move(-1);
						else if (e.key === "Home") setActive(0);
						else if (e.key === "End") setActive(Math.max(0, shown.length - 1));
						else if (e.key === "Enter") choose(shown[active]);
						else return;
						e.preventDefault();
					}
				}),
				/* @__PURE__ */ jsx("div", {
					ref: list,
					id: listId,
					role: "listbox",
					"aria-label": label,
					className: "hm-palette-list",
					children: shown.map((item, i) => /* @__PURE__ */ jsxs("div", {
						id: optionId(i),
						role: "option",
						"aria-selected": i === active,
						"aria-disabled": item.disabled || void 0,
						className: "hm-palette-option",
						onClick: () => choose(item),
						onPointerMove: () => i !== active && !item.disabled && setActive(i),
						children: [/* @__PURE__ */ jsx("span", { children: item.label }), item.group ? /* @__PURE__ */ jsx("small", { children: item.group }) : null]
					}, item.id))
				}),
				shown.length ? null : /* @__PURE__ */ jsx("p", {
					className: "hm-palette-empty",
					role: "status",
					children: emptyMessage
				})
			]
		})
	});
}
//#endregion
export { CommandPalette };

//# sourceMappingURL=command-palette.js.map