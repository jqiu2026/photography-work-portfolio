import { cx } from "../utils/cx.js";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/components/stat.tsx
/** A row of key figures divided by hairlines (stacks on phones). Renders a <dl>. */
function StatGroup({ className, ...rest }) {
	return /* @__PURE__ */ jsx("dl", {
		...rest,
		className: cx("hm-stat-group", className)
	});
}
function Stat({ label, value, detail, trend = "neutral", className, ...rest }) {
	return /* @__PURE__ */ jsxs("div", {
		...rest,
		className: cx("hm-stat", className),
		children: [
			/* @__PURE__ */ jsx("dt", {
				className: "hm-stat-label",
				children: label
			}),
			/* @__PURE__ */ jsx("dd", {
				className: "hm-stat-value",
				children: value
			}),
			detail ? /* @__PURE__ */ jsx("dd", {
				className: "hm-stat-detail",
				"data-trend": trend,
				children: detail
			}) : null
		]
	});
}
//#endregion
export { Stat, StatGroup };

//# sourceMappingURL=stat.js.map