import { cx, flag } from "../utils/cx.js";
import { Slot } from "../utils/slot.js";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/components/button.tsx
/** Server-compatible button. One quiet primary per view; everything else recedes. */
function Button({ variant = "primary", size = "md", shape = "rounded", loading, asChild, className, type, disabled, onClick, children, ...rest }) {
	const cls = cx("hm-button", className);
	const attrs = {
		"data-variant": variant,
		"data-size": size,
		"data-shape": shape,
		"data-loading": flag(loading),
		"aria-busy": loading || void 0
	};
	if (asChild) return /* @__PURE__ */ jsx(Slot, {
		...rest,
		...attrs,
		className: cls,
		children
	});
	return /* @__PURE__ */ jsxs("button", {
		...rest,
		...attrs,
		type: loading ? "button" : type ?? "button",
		className: cls,
		disabled,
		"aria-disabled": loading || void 0,
		onClick: loading ? void 0 : onClick,
		children: [loading ? /* @__PURE__ */ jsx("span", {
			className: "hm-spinner",
			"data-size": "sm",
			"aria-hidden": "true"
		}) : null, children]
	});
}
/** A square button holding a single icon. */
function IconButton({ className, variant = "secondary", ...rest }) {
	return /* @__PURE__ */ jsx(Button, {
		...rest,
		variant,
		className: cx("hm-icon-button", className)
	});
}
//#endregion
export { Button, IconButton };

//# sourceMappingURL=button.js.map