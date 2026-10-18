import { cx, flag } from "../utils/cx.js";
import { Slot } from "../utils/slot.js";
import { jsx } from "react/jsx-runtime";
//#region src/components/surface.tsx
/** Data attributes for a surface, for components that render their own element. */
function surfaceAttrs({ variant = "section", padding, interactive, lit, selected, tilt }) {
	return {
		"data-variant": variant,
		"data-padding": padding ?? "md",
		"data-interactive": flag(interactive),
		"data-lit": flag(lit),
		"data-selected": flag(selected),
		"data-tilt": flag(tilt)
	};
}
/** The base of every panel, card and overlay. Server-compatible. */
function Surface({ variant, padding, interactive, lit, selected, tilt, as: As = "div", asChild, className, ...rest }) {
	return /* @__PURE__ */ jsx(asChild ? Slot : As, {
		...rest,
		...surfaceAttrs({
			variant,
			padding,
			interactive,
			lit,
			selected,
			tilt
		}),
		className: cx("hm-surface", className)
	});
}
//#endregion
export { Surface, surfaceAttrs };

//# sourceMappingURL=surface.js.map