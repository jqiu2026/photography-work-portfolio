import { cx } from "../utils/cx.js";
import { jsx } from "react/jsx-runtime";
//#region src/components/separator.tsx
/** A hairline between groups. Server-compatible. */
function Separator({ orientation = "horizontal", decorative = true, className, ...rest }) {
	return /* @__PURE__ */ jsx("div", {
		...rest,
		role: decorative ? "none" : "separator",
		"aria-orientation": decorative ? void 0 : orientation,
		className: cx("hm-separator", className),
		"data-orientation": orientation
	});
}
//#endregion
export { Separator };

//# sourceMappingURL=separator.js.map