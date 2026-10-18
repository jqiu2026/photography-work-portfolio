import { cx } from "../utils/cx.js";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/components/data-list.tsx
/** Rows separated by hairlines: upcoming appointments, recent activity, needs-attention. */
function DataList({ className, ...rest }) {
	return /* @__PURE__ */ jsx("ul", {
		...rest,
		className: cx("hm-data-list", className)
	});
}
function DataListItem({ description, meta, actions, className, children, ...rest }) {
	return /* @__PURE__ */ jsxs("li", {
		...rest,
		className: cx("hm-data-list-item", className),
		children: [
			/* @__PURE__ */ jsxs("span", {
				className: "hm-data-list-main",
				children: [children, description ? /* @__PURE__ */ jsx("small", {
					className: "hm-data-list-description",
					children: description
				}) : null]
			}),
			meta ? /* @__PURE__ */ jsx("span", {
				className: "hm-data-list-meta",
				children: meta
			}) : null,
			actions ? /* @__PURE__ */ jsx("span", {
				className: "hm-data-list-actions",
				children: actions
			}) : null
		]
	});
}
/** A centered, quiet message for an empty list or section. */
function EmptyState({ className, ...rest }) {
	return /* @__PURE__ */ jsx("p", {
		...rest,
		className: cx("hm-empty", className)
	});
}
//#endregion
export { DataList, DataListItem, EmptyState };

//# sourceMappingURL=data-list.js.map