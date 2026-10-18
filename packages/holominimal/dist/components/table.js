import { cx, flag } from "../utils/cx.js";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/components/table.tsx
/**
* A hairline-row table. It sits in a horizontally scrollable, keyboard-focusable container so wide tables never break
* the page layout. Server-compatible: sorting is just a prop on `TableHead`.
*/
function Table({ stickyHeader, containerLabel, containerClassName, className, ...rest }) {
	return /* @__PURE__ */ jsx("div", {
		className: cx("hm-table-wrap", containerClassName),
		role: "region",
		"aria-label": containerLabel ?? rest["aria-label"],
		tabIndex: 0,
		"data-sticky": flag(stickyHeader),
		children: /* @__PURE__ */ jsx("table", {
			...rest,
			className: cx("hm-table", className)
		})
	});
}
function TableCaption({ className, ...rest }) {
	return /* @__PURE__ */ jsx("caption", {
		...rest,
		className: cx("hm-table-caption", className)
	});
}
function TableHeader(props) {
	return /* @__PURE__ */ jsx("thead", { ...props });
}
function TableBody(props) {
	return /* @__PURE__ */ jsx("tbody", { ...props });
}
function TableRow({ selected, className, ...rest }) {
	return /* @__PURE__ */ jsx("tr", {
		...rest,
		className: cx("hm-table-row", className),
		"data-selected": flag(selected),
		"aria-selected": selected || void 0
	});
}
function TableHead({ align = "start", sort, onSort, className, children, ...rest }) {
	return /* @__PURE__ */ jsx("th", {
		scope: "col",
		...rest,
		className: cx("hm-table-head", className),
		"data-align": align,
		"aria-sort": onSort ? sort ?? "none" : void 0,
		children: onSort ? /* @__PURE__ */ jsxs("button", {
			type: "button",
			className: "hm-table-sort",
			onClick: onSort,
			"data-sort": sort ?? "none",
			children: [children, /* @__PURE__ */ jsx("span", {
				className: "hm-table-sort-icon",
				"aria-hidden": "true"
			})]
		}) : children
	});
}
function TableCell({ align, numeric, rowHeader, className, ...rest }) {
	const props = {
		...rest,
		className: cx("hm-table-cell", className),
		"data-align": align ?? (numeric ? "end" : "start"),
		"data-numeric": flag(numeric)
	};
	return rowHeader ? /* @__PURE__ */ jsx("th", {
		scope: "row",
		...props
	}) : /* @__PURE__ */ jsx("td", { ...props });
}
//#endregion
export { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow };

//# sourceMappingURL=table.js.map