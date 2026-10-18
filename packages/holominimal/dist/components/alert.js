import { cx } from "../utils/cx.js";
import { jsx } from "react/jsx-runtime";
//#region src/components/alert.tsx
/**
* An inline message that stays in the page flow: a hairline box with a toned edge. Warnings and errors use
* `role="alert"` (announced at once); the rest use `role="status"`. Server-compatible.
*/
function Alert({ tone = "neutral", role, className, ...rest }) {
	return /* @__PURE__ */ jsx("div", {
		...rest,
		role: role ?? (tone === "danger" || tone === "warning" ? "alert" : "status"),
		className: cx("hm-alert", className),
		"data-tone": tone
	});
}
function AlertTitle({ className, ...rest }) {
	return /* @__PURE__ */ jsx("p", {
		...rest,
		className: cx("hm-alert-title", className)
	});
}
function AlertDescription({ className, ...rest }) {
	return /* @__PURE__ */ jsx("p", {
		...rest,
		className: cx("hm-alert-description", className)
	});
}
//#endregion
export { Alert, AlertDescription, AlertTitle };

//# sourceMappingURL=alert.js.map