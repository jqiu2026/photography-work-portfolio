"use client";
import { cx } from "../utils/cx.js";
import { ChevronRightIcon } from "../icons/interface.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
//#region src/components/tree.tsx
function flatten(nodes, open, level = 1, parent = null, out = []) {
	nodes.forEach((node, i) => {
		out.push({
			node,
			level,
			parent,
			pos: i + 1,
			size: nodes.length
		});
		if (node.children?.length && open.has(node.id)) flatten(node.children, open, level + 1, node.id, out);
	});
	return out;
}
/**
* A hierarchy (folders, galleries within clients). ARIA tree with one tab stop: Up and Down move, Right opens or
* steps into a branch, Left closes or steps out, Home and End jump, Enter or Space selects. Branches open with an
* animated height.
*/
function Tree({ nodes, selected: controlledSelected, defaultSelected = null, onSelectedChange, expanded: controlledExpanded, defaultExpanded = [], onExpandedChange, className, onKeyDown, ...rest }) {
	const [innerSel, setInnerSel] = useState(defaultSelected);
	const selected = controlledSelected === void 0 ? innerSel : controlledSelected;
	const [innerOpen, setInnerOpen] = useState(defaultExpanded);
	const openIds = controlledExpanded ?? innerOpen;
	const open = useMemo(() => new Set(openIds), [openIds]);
	const visible = useMemo(() => flatten(nodes, open), [nodes, open]);
	const [focusId, setFocusId] = useState(null);
	const current = focusId && visible.some((v) => v.node.id === focusId) ? focusId : selected ?? visible[0]?.node.id ?? null;
	const setOpen = (id, next) => {
		const ids = next ? [...openIds, id] : openIds.filter((x) => x !== id);
		if (controlledExpanded === void 0) setInnerOpen(ids);
		onExpandedChange?.(ids);
	};
	const choose = (id) => {
		if (id === selected) return;
		if (controlledSelected === void 0) setInnerSel(id);
		onSelectedChange?.(id);
	};
	const focus = (id, root) => {
		if (!id) return;
		setFocusId(id);
		root.querySelector(`[data-tree-id="${CSS.escape(id)}"]`)?.focus();
	};
	const key = (e) => {
		onKeyDown?.(e);
		if (e.defaultPrevented) return;
		const i = visible.findIndex((v) => v.node.id === current);
		const here = visible[i];
		if (!here) return;
		const root = e.currentTarget;
		const hasKids = !!here.node.children?.length;
		const isOpen = open.has(here.node.id);
		const next = (from, dir) => {
			for (let n = from + dir; n >= 0 && n < visible.length; n += dir) if (!visible[n]?.node.disabled) return visible[n]?.node.id;
		};
		if (e.key === "ArrowDown") focus(next(i, 1), root);
		else if (e.key === "ArrowUp") focus(next(i, -1), root);
		else if (e.key === "Home") focus(visible.find((v) => !v.node.disabled)?.node.id, root);
		else if (e.key === "End") focus([...visible].reverse().find((v) => !v.node.disabled)?.node.id, root);
		else if (e.key === "ArrowRight") {
			if (hasKids && !isOpen) setOpen(here.node.id, true);
			else if (hasKids) focus(visible[i + 1]?.node.id, root);
		} else if (e.key === "ArrowLeft") {
			if (hasKids && isOpen) setOpen(here.node.id, false);
			else if (here.parent) focus(here.parent, root);
		} else if (e.key === "Enter" || e.key === " ") {
			if (here.node.disabled) return;
			choose(here.node.id);
			if (hasKids) setOpen(here.node.id, !isOpen);
		} else return;
		e.preventDefault();
	};
	const renderList = (list, level) => list.map((node, idx) => {
		const kids = node.children?.length ? node.children : null;
		const isOpen = !!kids && open.has(node.id);
		return /* @__PURE__ */ jsxs("li", {
			role: "none",
			className: "hm-tree-node",
			children: [/* @__PURE__ */ jsxs("div", {
				role: "treeitem",
				tabIndex: node.id === current ? 0 : -1,
				"data-tree-id": node.id,
				"aria-level": level,
				"aria-posinset": idx + 1,
				"aria-setsize": list.length,
				"aria-expanded": kids ? isOpen : void 0,
				"aria-selected": selected === node.id,
				"aria-disabled": node.disabled || void 0,
				className: "hm-tree-item",
				style: { "--_level": level - 1 },
				onFocus: () => setFocusId(node.id),
				onClick: () => {
					if (node.disabled) return;
					choose(node.id);
					if (kids) setOpen(node.id, !isOpen);
				},
				children: [
					/* @__PURE__ */ jsx(ChevronRightIcon, {
						className: "hm-tree-chevron",
						"data-leaf": kids ? void 0 : "",
						size: 12,
						strokeWidth: 1.6
					}),
					node.icon ? /* @__PURE__ */ jsx("span", {
						className: "hm-tree-icon",
						children: node.icon
					}) : null,
					/* @__PURE__ */ jsx("span", {
						className: "hm-tree-label",
						children: node.label
					})
				]
			}), kids ? /* @__PURE__ */ jsx("div", {
				className: "hm-collapsible-content hm-tree-children",
				"data-state": isOpen ? "open" : "closed",
				inert: isOpen ? void 0 : true,
				children: /* @__PURE__ */ jsx("ul", {
					role: "group",
					className: "hm-collapsible-inner hm-tree-group",
					children: renderList(kids, level + 1)
				})
			}) : null]
		}, node.id);
	});
	return /* @__PURE__ */ jsx("ul", {
		...rest,
		role: "tree",
		className: cx("hm-tree", className),
		onKeyDown: key,
		children: renderList(nodes, 1)
	});
}
//#endregion
export { Tree };

//# sourceMappingURL=tree.js.map