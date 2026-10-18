import { cx } from "../utils/cx.js";
import { jsx } from "react/jsx-runtime";
//#region src/components/feedback.tsx
function Spinner({ size = "md", label = "Loading", className, ...rest }) {
	return /* @__PURE__ */ jsx("span", {
		...rest,
		role: "status",
		className: cx("hm-spinner", className),
		"data-size": size,
		children: /* @__PURE__ */ jsx("span", {
			className: "hm-sr-only",
			children: label
		})
	});
}
/** A placeholder while content loads. A slow sheen, still under reduced motion. Hidden from assistive tech. */
function Skeleton({ shape = "text", width, height, className, style, ...rest }) {
	return /* @__PURE__ */ jsx("span", {
		"aria-hidden": "true",
		...rest,
		className: cx("hm-skeleton", className),
		"data-shape": shape,
		style: {
			width,
			height,
			...style
		}
	});
}
//#endregion
export { Skeleton, Spinner };

//# sourceMappingURL=feedback.js.map