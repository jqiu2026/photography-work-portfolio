import { cx } from "../utils/cx.js";
import { Slot } from "../utils/slot.js";
import { jsx } from "react/jsx-runtime";
//#region src/components/breadcrumb.tsx
/** A trail of ancestors ending at the current page. Separators are drawn by CSS, so they are never read aloud. */
function Breadcrumb({ className, children, ...rest }) {
	return /* @__PURE__ */ jsx("nav", {
		"aria-label": "Breadcrumb",
		...rest,
		className: cx("hm-breadcrumb", className),
		children: /* @__PURE__ */ jsx("ol", {
			className: "hm-breadcrumb-list",
			children
		})
	});
}
function BreadcrumbItem({ className, ...rest }) {
	return /* @__PURE__ */ jsx("li", {
		...rest,
		className: cx("hm-breadcrumb-item", className)
	});
}
function BreadcrumbLink({ asChild, className, ...rest }) {
	return /* @__PURE__ */ jsx(asChild ? Slot : "a", {
		...rest,
		className: cx("hm-breadcrumb-link", className)
	});
}
/** The current page: plain text with `aria-current="page"`. */
function BreadcrumbPage({ className, ...rest }) {
	return /* @__PURE__ */ jsx("span", {
		...rest,
		"aria-current": "page",
		className: cx("hm-breadcrumb-page", className)
	});
}
//#endregion
export { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage };

//# sourceMappingURL=breadcrumb.js.map