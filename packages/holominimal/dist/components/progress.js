import { cx } from "../utils/cx.js";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/components/progress.tsx
var pct = (value, max) => max > 0 ? Math.max(0, Math.min(100, value / max * 100)) : 0;
/** A linear progress bar. The fill eases to each new value; the indeterminate state is a slow sweep. */
function Progress({ value, max = 100, tone = "accent", size = "md", showValue, className, style, ...rest }) {
	const determinate = value !== void 0;
	const p = determinate ? pct(value, max) : 0;
	return /* @__PURE__ */ jsxs("div", {
		...rest,
		role: "progressbar",
		"aria-valuemin": 0,
		"aria-valuemax": max,
		"aria-valuenow": determinate ? value : void 0,
		className: cx("hm-progress", className),
		"data-tone": tone,
		"data-size": size,
		"data-indeterminate": determinate ? void 0 : "",
		style: {
			"--_p": p / 100,
			...style
		},
		children: [/* @__PURE__ */ jsx("span", {
			className: "hm-progress-track",
			children: /* @__PURE__ */ jsx("span", { className: "hm-progress-fill" })
		}), showValue && determinate ? /* @__PURE__ */ jsxs("span", {
			className: "hm-progress-value",
			children: [Math.round(p), "%"]
		}) : null]
	});
}
/** A ring. Same semantics as `Progress`; the arc eases to each value. */
function CircularProgress({ value, max = 100, tone = "accent", size = "md", className, style, children, ...rest }) {
	const determinate = value !== void 0;
	const p = determinate ? pct(value, max) : 25;
	return /* @__PURE__ */ jsxs("div", {
		...rest,
		role: "progressbar",
		"aria-valuemin": 0,
		"aria-valuemax": max,
		"aria-valuenow": determinate ? value : void 0,
		className: cx("hm-ring", className),
		"data-tone": tone,
		"data-size": size,
		"data-indeterminate": determinate ? void 0 : "",
		style: {
			"--_p": p / 100,
			...style
		},
		children: [/* @__PURE__ */ jsxs("svg", {
			viewBox: "0 0 36 36",
			"aria-hidden": "true",
			children: [/* @__PURE__ */ jsx("circle", {
				className: "hm-ring-track",
				cx: "18",
				cy: "18",
				r: "15.5"
			}), /* @__PURE__ */ jsx("circle", {
				className: "hm-ring-arc",
				cx: "18",
				cy: "18",
				r: "15.5",
				pathLength: "1"
			})]
		}), children ? /* @__PURE__ */ jsx("span", {
			className: "hm-ring-label",
			"aria-hidden": "true",
			children
		}) : null]
	});
}
//#endregion
export { CircularProgress, Progress };

//# sourceMappingURL=progress.js.map