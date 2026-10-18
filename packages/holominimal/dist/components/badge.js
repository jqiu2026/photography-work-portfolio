import { cx } from "../utils/cx.js";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/components/badge.tsx
/** A small label: gallery state, plan, count. Server-compatible. */
function Badge({ tone = "neutral", appearance = "soft", className, ...rest }) {
	return /* @__PURE__ */ jsx("span", {
		...rest,
		className: cx("hm-badge", className),
		"data-tone": tone,
		"data-appearance": appearance
	});
}
/** A dot and a label ("Live", "Draft"). The label is always text, so status never depends on color. */
function Status({ tone = "neutral", className, children, ...rest }) {
	return /* @__PURE__ */ jsxs("span", {
		...rest,
		className: cx("hm-status", className),
		"data-tone": tone,
		children: [/* @__PURE__ */ jsx("span", {
			className: "hm-status-dot",
			"aria-hidden": "true"
		}), children]
	});
}
//#endregion
export { Badge, Status };

//# sourceMappingURL=badge.js.map