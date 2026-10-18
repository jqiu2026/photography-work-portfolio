import { cx } from "../utils/cx.js";
import { chartPath, scalePoints } from "../utils/chart.js";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/components/sparkline.tsx
/** A tiny trend line for a stat or a table cell. Server-compatible. */
function Sparkline({ data, tone = "accent", width = 96, height = 28, className, ...rest }) {
	const points = scalePoints(data, width, height, 3, Math.min(...data));
	const last = points[points.length - 1];
	const named = Boolean(rest["aria-label"]);
	return /* @__PURE__ */ jsxs("svg", {
		...rest,
		viewBox: `0 0 ${width} ${height}`,
		width,
		height,
		role: named ? "img" : void 0,
		"aria-hidden": named ? void 0 : true,
		className: cx("hm-sparkline", className),
		"data-tone": tone,
		children: [/* @__PURE__ */ jsx("path", {
			className: "hm-sparkline-line",
			d: chartPath(points, true)
		}), last ? /* @__PURE__ */ jsx("circle", {
			className: "hm-sparkline-dot",
			cx: last[0],
			cy: last[1],
			r: "2"
		}) : null]
	});
}
//#endregion
export { Sparkline };

//# sourceMappingURL=sparkline.js.map