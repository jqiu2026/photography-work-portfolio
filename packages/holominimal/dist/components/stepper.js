import { cx } from "../utils/cx.js";
import { CheckIcon } from "../icons/interface.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { Children, cloneElement, isValidElement } from "react";
//#region src/components/stepper.tsx
/** A sequence of steps. Status is derived from `current`, so children are just `Step`s. Server-compatible. */
function Stepper({ current, orientation = "horizontal", className, children, ...rest }) {
	const steps = Children.toArray(children).filter(isValidElement);
	return /* @__PURE__ */ jsx("ol", {
		...rest,
		className: cx("hm-stepper", className),
		"data-orientation": orientation,
		children: steps.map((step, i) => cloneElement(step, {
			"data-index": i + 1,
			"data-status": i < current ? "complete" : i === current ? "current" : "upcoming",
			"aria-current": i === current ? "step" : void 0
		}))
	});
}
function Step({ title, description, className, ...rest }) {
	const index = rest["data-index"];
	const status = rest["data-status"];
	return /* @__PURE__ */ jsxs("li", {
		...rest,
		className: cx("hm-step", className),
		children: [/* @__PURE__ */ jsx("span", {
			className: "hm-step-marker",
			"aria-hidden": "true",
			children: status === "complete" ? /* @__PURE__ */ jsx(CheckIcon, {
				size: 12,
				strokeWidth: 2
			}) : index
		}), /* @__PURE__ */ jsxs("span", {
			className: "hm-step-text",
			children: [
				/* @__PURE__ */ jsx("span", {
					className: "hm-step-title",
					children: title
				}),
				description ? /* @__PURE__ */ jsx("span", {
					className: "hm-step-description",
					children: description
				}) : null,
				status === "complete" ? /* @__PURE__ */ jsx("span", {
					className: "hm-sr-only",
					children: " (completed)"
				}) : null
			]
		})]
	});
}
//#endregion
export { Step, Stepper };

//# sourceMappingURL=stepper.js.map