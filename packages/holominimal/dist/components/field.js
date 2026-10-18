import { cx } from "../utils/cx.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { Children, cloneElement, isValidElement, useId } from "react";
//#region src/components/field.tsx
/**
* Label, control, hint and error, wired together (id, aria-describedby, aria-invalid). Server-compatible: it clones
* its one control rather than using context.
*/
function Field({ label, hint, error, hideLabel, id, className, children }) {
	const auto = useId();
	const controlId = id ?? `hm${auto.replace(/:/g, "")}`;
	const hintId = hint ? `${controlId}-hint` : void 0;
	const errorId = error ? `${controlId}-error` : void 0;
	const child = Children.only(children);
	const childProps = isValidElement(child) ? child.props : {};
	const describedBy = cx(childProps["aria-describedby"], hintId, errorId) || void 0;
	return /* @__PURE__ */ jsxs("div", {
		className: cx("hm-field", className),
		"data-invalid": error ? "" : void 0,
		children: [
			/* @__PURE__ */ jsx("label", {
				className: cx("hm-field-label", hideLabel && "hm-sr-only"),
				htmlFor: controlId,
				children: label
			}),
			cloneElement(child, {
				id: controlId,
				"aria-describedby": describedBy,
				"aria-invalid": error ? true : childProps["aria-invalid"]
			}),
			hint ? /* @__PURE__ */ jsx("p", {
				id: hintId,
				className: "hm-field-hint",
				children: hint
			}) : null,
			error ? /* @__PURE__ */ jsx("p", {
				id: errorId,
				className: "hm-field-error",
				role: "alert",
				children: error
			}) : null
		]
	});
}
function Input({ className, ...rest }) {
	return /* @__PURE__ */ jsx("input", {
		...rest,
		className: cx("hm-control hm-input", className)
	});
}
function Textarea({ autoGrow, className, ...rest }) {
	return /* @__PURE__ */ jsx("textarea", {
		...rest,
		className: cx("hm-control hm-textarea", className),
		"data-autogrow": autoGrow ? "" : void 0
	});
}
/** Native checkbox with its label; `appearance="switch"` for immediate settings. */
function Checkbox({ label, appearance = "checkbox", hideLabel, className, ...rest }) {
	return /* @__PURE__ */ jsxs("label", {
		className: cx("hm-check", className),
		"data-appearance": appearance,
		children: [/* @__PURE__ */ jsx("input", {
			...rest,
			type: "checkbox",
			role: appearance === "switch" ? "switch" : void 0,
			className: "hm-check-input"
		}), /* @__PURE__ */ jsx("span", {
			className: cx("hm-check-label", hideLabel && "hm-sr-only"),
			children: label
		})]
	});
}
//#endregion
export { Checkbox, Field, Input, Textarea };

//# sourceMappingURL=field.js.map